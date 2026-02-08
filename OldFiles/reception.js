// reception.js - OPTIMIZED VERSION with server-side filtering
import {
  checkAuthAndRedirect,
  getToken,
  clearSession,
  canAccess,
  safeFetch
} from "./auth.js";

// Immediate auth check at the start
try {
  checkAuthAndRedirect();
} catch (error) {
  console.error("Auth check failed:", error);
  window.location.href = "/index.html";
}

if (!canAccess('reception')) {
  document.body.innerHTML = '<div class="p-8 text-center text-red-500">Access denied. Redirecting...</div>';
  setTimeout(() => {
    window.location.href = "/html/dashboard.html";
  }, 1000);
}

import {
  initCommonFilters,
  getCurrentFilterValues,
  buildApiParams,
  setDefaultDateFilter
} from "./filters-common.js";

const logoutButton = document.getElementById("logout-button");
logoutButton.addEventListener("click", (e) => {
  e.preventDefault();
  clearSession();
  window.location.replace("/index.html");
});

// ----------------------------------------------------
// OPTIMIZED RECEPTION TABLE LOGIC
// ----------------------------------------------------
const API_URL = `${window.APP_CONFIG.getBackendUrl()}${window.APP_CONFIG.API_ENDPOINTS.RECEPTION}`;
const UPDATE_API_URL = `${window.APP_CONFIG.getBackendUrl()}${window.APP_CONFIG.API_ENDPOINTS.RECEPTION_UPDATE}`;

let receptionBody;
let receptionMessage;
let paginationContainer;
let searchInput;
let searchContainer;

let allReceptionData = [];
let currentPage = 1;
const rowsPerPage = 50;
let currentSearchQuery = "";
let selectedRows = {};

// Auto-refresh interval (30 seconds for real-time updates)
const AUTO_REFRESH_INTERVAL = 30 * 1000;
let refreshInterval;

function showSearchMessage(message, type = "info") {
  let messageElement = document.getElementById("search-message");

  if (!messageElement) {
    messageElement = document.createElement("div");
    messageElement.id = "search-message";
    messageElement.className = `message-box ${type}`;
    searchContainer.appendChild(messageElement);
  } else {
    messageElement.className = `message-box ${type}`;
  }

  messageElement.textContent = message;
  messageElement.classList.remove("hidden");

  setTimeout(() => {
    messageElement.classList.add("hidden");
  }, 3000);
}

async function fetchReceptionData() {
  const token = getToken();
  if (!token) {
    console.error("No token available");
    window.location.href = "/index.html";
    return;
  }
  
  receptionBody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-gray-500">Loading data...</td></tr>`;
  if (receptionMessage) receptionMessage.classList.add("hidden");

  try {
    const filterValues = getCurrentFilterValues();
    const params = buildApiParams(filterValues);
    
    if (currentSearchQuery) {
      params.append('searchQuery', currentSearchQuery);
    }
    
    params.append('page', currentPage);
    params.append('limit', rowsPerPage);
    
    const url = `${API_URL}?${params.toString()}`;
    
    console.log('🔍 RECEPTION API REQUEST:', url);
    
    // USE ENHANCED safeFetch WITH RETRY LOGIC
    const response = await safeFetch(url, {
      method: "GET"
    }, 1); // 1 retry for reception data

    console.log('🔍 Response Status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    allReceptionData = result.data || result;
    
    if (!Array.isArray(allReceptionData) || allReceptionData.length === 0) {
      receptionBody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-gray-500">No data found with current filters.</td></tr>`;
      if (paginationContainer) paginationContainer.innerHTML = "";
    } else {
      renderReceptionTable(allReceptionData);
      if (result.totalPages) {
        setupPagination(result.totalPages, result.totalRecords);
      } else {
        setupPagination(1, allReceptionData.length);
      }
    }
  } catch (error) {
    console.error("Error fetching reception data:", error);
    
    // Don't show error if it's an auth error (safeFetch handles redirect)
    if (!error.message.includes("Authentication")) {
      showSearchMessage(`Failed to load data: ${error.message}`, "error");
      receptionBody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-red-500">Error loading data. Please try refreshing.</td></tr>`;
    }
  }
}

async function updateRecords(records, updateType) {
  const token = getToken();
  if (!token) {
    showSearchMessage("Authentication required for this action.", "error");
    return;
  }

  try {
    // USE safeFetch FOR UPDATE REQUESTS TOO
    const response = await safeFetch(UPDATE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: records,
        updateType: updateType,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();

    if (updateType !== "result") {
      showSearchMessage(result.message, "success");
    } else {
      showSearchMessage("Result updated successfully.", "success");
    }

    // Refresh data after update
    fetchReceptionData();
    selectedRows = {};
    
  } catch (error) {
    console.error("Error updating record:", error);
    // Only show error if it's not an authentication error
    if (!error.message.includes('Authentication')) {
      showSearchMessage(`Failed to update records: ${error.message}`, "error");
    }
  }
}

function renderReceptionTable(data) {
  receptionBody.innerHTML = "";

  if (data.length === 0) {
    receptionBody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-gray-500">No matching data found.</td></tr>`;
    return;
  }

  data.forEach((row) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-100";

    const rowId = `${row.lab_number}-${row.test_name}`;
    const isSelected = selectedRows[rowId] ? "checked" : "";

    const isReceived = !!row.time_received;
    const isResulted = !!row.test_time_out;
    const isUrgent = row.urgency === "urgent";

    const receiveButtonText = isReceived ? "Received" : "Receive";
    const resultButtonText = isResulted ? "Resulted" : "Result";

    const isResultBtnDisabled = !isReceived || isResulted;

    tr.innerHTML = `
      <td>
        <input type="checkbox" class="row-checkbox h-4 w-4 text-blue-600 cursor-pointer" 
            data-lab-number="${row.lab_number}" 
            data-test-name="${row.test_name}"
            ${isSelected}>
      </td>
      <td>${row.date ? new Date(row.date).toLocaleDateString() : "N/A"}</td>
      <td class="lab-number-cell" data-lab-number="${row.lab_number || ''}">${row.lab_number || "N/A"}</td>
      <td>${row.shift || "N/A"}</td>
      <td>${row.unit || "N/A"}</td>
      <td>${row.lab_section || "N/A"}</td>
      <td>${row.test_name || "N/A"}</td>
      <td class="text-center">
        <div class="button-container">
          <button 
            class="urgent-btn ${isUrgent ? "urgent" : ""}" 
            data-lab-number="${row.lab_number}" 
            data-test-name="${row.test_name}"
            data-action="urgent"
            ${isUrgent ? "disabled" : ""}>
            ${isUrgent ? "Urgent" : "Mark as Urgent"}
          </button>
        </div>
      </td>
      <td class="text-center">
        <div class="button-container">
          <button 
            class="receive-btn ${isReceived ? "received" : ""}" 
            data-lab-number="${row.lab_number}"
            data-test-name="${row.test_name}"
            data-action="receive" 
            ${isReceived ? "disabled" : ""}>
            ${isReceived ? "Received" : "Receive"}
          </button>
        </div>
      </td>
      <td class="text-center">
        <div class="button-container">
          <button 
            class="result-btn ${isResulted ? "resulted" : ""}" 
            data-lab-number="${row.lab_number}" 
            data-test-name="${row.test_name}"
            data-action="result" 
            ${isResultBtnDisabled ? "disabled" : ""}
            style="display: ${isReceived ? "inline-block" : "none"}">
            ${isResulted ? "Resulted" : "Result"}
          </button>
        </div>
      </td>
    `;
    receptionBody.appendChild(tr);
  });

  setupEventDelegation();
  updateMultiSelectButtonVisibility();
  updateSelectAllCheckbox();
  
  // Initialize tooltips immediately after table render
  setTimeout(() => {
      if (window.initializeLabNumberClicks) {
          console.log('🔄 Initializing lab number tooltips for performance table...');
          window.initializeLabNumberClicks();
      }
  }, 100);
}

function setupPagination(totalPages, totalRecords) {
  if (!paginationContainer || totalPages <= 1) {
    if (paginationContainer) paginationContainer.innerHTML = "";
    return;
  }

  paginationContainer.innerHTML = "";

  const prevButton = document.createElement("button");
  prevButton.textContent = "Previous";
  prevButton.className = "pagination-btn";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      fetchReceptionData();
    }
  });
  paginationContainer.appendChild(prevButton);

  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = `pagination-btn ${i === currentPage ? "active" : ""}`;
    btn.addEventListener("click", () => {
      currentPage = i;
      fetchReceptionData();
    });
    paginationContainer.appendChild(btn);
  }

  const nextButton = document.createElement("button");
  nextButton.textContent = "Next";
  nextButton.className = "pagination-btn";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchReceptionData();
    }
  });
  paginationContainer.appendChild(nextButton);

  const countElement = document.createElement("span");
  countElement.className = "pagination-count";
  countElement.textContent = `Total: ${totalRecords}`;
  paginationContainer.appendChild(countElement);
}

function handleFilterChange() {
  currentPage = 1;
  fetchReceptionData();
}

function setupAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  refreshInterval = setInterval(() => {
    console.log('Auto-refreshing reception data...');
    fetchReceptionData();
  }, AUTO_REFRESH_INTERVAL);
}

function updateMultiSelectButtonVisibility() {
  const multiSelectActions = document.getElementById("multi-select-actions");
  const selectedCount = Object.keys(selectedRows).length;

  if (selectedCount > 0) {
    multiSelectActions.classList.remove("hidden");
  } else {
    multiSelectActions.classList.add("hidden");
  }
}

function updateSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById("selectAll");
  const rowCheckboxes = document.querySelectorAll(".row-checkbox");
  const allChecked = Array.from(rowCheckboxes).every((cb) => cb.checked);

  if (selectAllCheckbox) {
    selectAllCheckbox.checked = allChecked && rowCheckboxes.length > 0;
  }
}

function setupMultiSelectActionButtons() {
  const multiUrgentBtn = document.getElementById("multi-urgent-btn");
  const multiReceiveBtn = document.getElementById("multi-receive-btn");
  const multiResultBtn = document.getElementById("multi-result-btn");

  if (multiUrgentBtn) {
    multiUrgentBtn.addEventListener("click", () => {
      const recordsToUpdate = Object.values(selectedRows);
      if (recordsToUpdate.length > 0) {
        updateRecords(recordsToUpdate, "urgent");
      } else {
        showSearchMessage("No records selected to update.", "warning");
      }
    });
  }

  if (multiReceiveBtn) {
    multiReceiveBtn.addEventListener("click", () => {
      const recordsToUpdate = Object.values(selectedRows);
      if (recordsToUpdate.length > 0) {
        updateRecords(recordsToUpdate, "receive");
      } else {
        showSearchMessage("No records selected to update.", "warning");
      }
    });
  }

  if (multiResultBtn) {
    multiResultBtn.addEventListener("click", () => {
      const recordsToUpdate = Object.values(selectedRows);
      if (recordsToUpdate.length > 0) {
        updateRecords(recordsToUpdate, "result");
      } else {
        showSearchMessage("No records selected to update.", "warning");
      }
    });
  }
}

function setupEventDelegation() {
  let isProcessing = false;
  
  receptionBody.addEventListener("click", (e) => {
    if (e.target.matches(".urgent-btn, .receive-btn, .result-btn")) {
      const button = e.target;

      if (isProcessing) {
        return;
      }

      if (!button.disabled) {
        const labNumber = button.dataset.labNumber;
        const testName = button.dataset.testName;
        const action = button.dataset.action;

        isProcessing = true;
        button.disabled = true;
        button.style.opacity = "0.6";
        button.textContent = "Processing...";

        updateRecords([{ lab_number: labNumber, test_name: testName }], action)
          .finally(() => {
            setTimeout(() => {
              isProcessing = false;
            }, 1000);
          });
      }
    }
  });

  receptionBody.addEventListener("change", (e) => {
    if (e.target.matches(".row-checkbox")) {
      const checkbox = e.target;
      const labNumber = checkbox.dataset.labNumber;
      const testName = checkbox.dataset.testName;
      const rowId = `${labNumber}-${testName}`;

      if (checkbox.checked) {
        selectedRows[rowId] = { lab_number: labNumber, test_name: testName };
      } else {
        delete selectedRows[rowId];
      }

      updateMultiSelectButtonVisibility();
      updateSelectAllCheckbox();
    }
  });
}

// Enhanced tooltip initialization for reception
function initializeReceptionTooltips() {
  if (window.reinitializeLabNumberTooltips) {
    console.log('🔄 Initializing reception-specific tooltips...');
    window.reinitializeLabNumberTooltips();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  receptionBody = document.getElementById("receptionBody");
  receptionMessage = document.getElementById("receptionMessage");
  paginationContainer = document.getElementById("pagination-container");
  searchInput = document.getElementById("searchInput");
  searchContainer = document.querySelector(".main-search-container");

  setDefaultDateFilter();
  fetchReceptionData();
  setupAutoRefresh();
  setupMultiSelectActionButtons();

  const config = {
    includeDateFilters: true,
    includePeriodSelect: true,
    includeLabSectionFilter: true,
    includeShiftFilter: true,
    includeHospitalUnitFilter: true,
    dataType: "default",
  };

  initCommonFilters(handleFilterChange, {
  ...config,
  delayDateFetching: true  // Add this line
});

  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      clearTimeout(searchTimeout);
      currentSearchQuery = event.target.value.trim();
      currentPage = 1;
      
      searchTimeout = setTimeout(() => {
        fetchReceptionData();
      }, 300);
    });
  }

  const selectAllCheckbox = document.getElementById("selectAll");
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", (e) => {
      const isChecked = e.target.checked;

      document.querySelectorAll(".row-checkbox").forEach((checkbox) => {
        checkbox.checked = isChecked;
        const labNumber = checkbox.dataset.labNumber;
        const testName = checkbox.dataset.testName;
        const rowId = `${labNumber}-${testName}`;

        if (isChecked) {
          selectedRows[rowId] = { lab_number: labNumber, test_name: testName };
        } else {
          delete selectedRows[rowId];
        }
      });

      updateMultiSelectButtonVisibility();
    });
  }

  // Initialize tooltips after everything is loaded
  setTimeout(() => {
      if (window.initializeLabNumberClicks) {
          window.initializeLabNumberClicks();
      }
  }, 1500);
});

window.addEventListener('beforeunload', () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});