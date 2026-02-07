// tracker.js - OPTIMIZED VERSION with server-side filtering
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

if (!canAccess('tracker')) {
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
// OPTIMIZED TRACKER TABLE LOGIC
// ----------------------------------------------------
const API_URL = `${window.APP_CONFIG.getBackendUrl()}${window.APP_CONFIG.API_ENDPOINTS.TRACKER}`;
const trackerBody = document.getElementById("trackerBody");
const trackerMessage = document.getElementById("trackerMessage");
const paginationContainer = document.getElementById("pagination-container");
const searchInput = document.getElementById("searchInput");

let allTrackerData = [];
let currentPage = 1;
const rowsPerPage = 50;
let currentSearchQuery = "";

// Auto-refresh interval (1 minute for real-time tracking)
const AUTO_REFRESH_INTERVAL = 60 * 1000;
let refreshInterval;

function showMessage(element, message, type = "info") {
  element.textContent = message;
  element.className = `message-box ${type}`;
  element.classList.remove("hidden");
}

function calculateTestProgress(testTimeExpected, testTimeOut) {
  const now = new Date();
  
  // Check if test has actually been completed (test_time_out exists and is valid)
  const isActuallyCompleted = testTimeOut && !isNaN(new Date(testTimeOut).getTime()) && new Date(testTimeOut) <= now;
  
  // Check if expected time has passed (but not actually completed)
  const isOverdue = testTimeExpected && !isNaN(new Date(testTimeExpected).getTime()) && 
                   new Date(testTimeExpected) <= now && !isActuallyCompleted;

  if (isActuallyCompleted) {
    return { 
      text: "Completed", 
      isComplete: true, 
      isActuallyCompleted: true,
      cssClass: "progress-complete-actual" 
    };
  } else if (isOverdue) {
    return { 
      text: "Delayed",
      isComplete: false, 
      isActuallyCompleted: false,
      cssClass: "progress-overdue" 
    };
  } else if (testTimeExpected && !isNaN(new Date(testTimeExpected).getTime())) {
    const expectedTime = new Date(testTimeExpected);
    const timeLeft = expectedTime.getTime() - now.getTime();
    const timeLeftInMinutes = Math.floor(timeLeft / (1000 * 60));
    const timeLeftInHours = Math.floor(timeLeft / (1000 * 60 * 60));
    const timeLeftInDays = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

    // Orange only for <= 10 minutes remaining
    if (timeLeftInMinutes <= 10 && timeLeftInMinutes > 0) {
      return { 
        text: `${timeLeftInMinutes} min(s) remaining`, 
        isComplete: false, 
        isActuallyCompleted: false,
        cssClass: "progress-urgent" 
      };
    } else if (timeLeftInDays > 0) {
      return { 
        text: `${timeLeftInDays} day(s) remaining`, 
        isComplete: false, 
        isActuallyCompleted: false,
        cssClass: "progress-pending" 
      };
    } else if (timeLeftInHours > 0) {
      return { 
        text: `${timeLeftInHours} hr(s) remaining`, 
        isComplete: false, 
        isActuallyCompleted: false,
        cssClass: "progress-pending" 
      };
    } else if (timeLeftInMinutes > 0) {
      return { 
        text: `${timeLeftInMinutes} min(s) remaining`, 
        isComplete: false, 
        isActuallyCompleted: false,
        cssClass: "progress-pending" 
      };
    } else {
      return { 
        text: "Due now", 
        isComplete: false, 
        isActuallyCompleted: false,
        cssClass: "progress-pending" 
      };
    }
  } else {
    // No expected time provided
    return { 
      text: "No ETA", 
      isComplete: false, 
      isActuallyCompleted: false,
      cssClass: "progress-pending" 
    };
  }
}

function formatSASTTime(dateString) {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return "N/A";
    }
    
    return date.toLocaleString('en-US', {
      timeZone: 'Africa/Johannesburg',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (error) {
    return "N/A";
  }
}

async function fetchTrackerData() {
  const token = getToken();
  if (!token) {
    console.error("No token available");
    window.location.href = "/index.html";
    return;
  }
  
  trackerBody.innerHTML = `<tr><td colspan="15" class="text-center py-4 text-gray-500">Loading data...</td></tr>`;
  trackerMessage.classList.add("hidden");

  try {
    const filterValues = getCurrentFilterValues();
    const params = buildApiParams(filterValues);
    
    if (currentSearchQuery) {
      params.append('searchQuery', currentSearchQuery);
    }
    
    params.append('page', currentPage);
    params.append('limit', rowsPerPage);
    
    const url = `${API_URL}?${params.toString()}`;
    
    console.log('🔍 TRACKER API REQUEST:', url);
    
    // USE ENHANCED safeFetch WITH RETRY LOGIC
    const response = await safeFetch(url, {
      method: "GET"
    }, 1); // 1 retry for tracker data

    console.log('🔍 Response Status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    allTrackerData = data.data || data;
    
    if (!Array.isArray(allTrackerData) || allTrackerData.length === 0) {
      trackerBody.innerHTML = `<tr><td colspan="15" class="text-center py-4 text-gray-500">No data found with current filters.</td></tr>`;
      if (paginationContainer) paginationContainer.innerHTML = "";
    } else {
      renderTrackerTable(allTrackerData);
      if (data.totalPages) {
        setupPagination(data.totalPages, data.totalRecords);
      } else {
        setupPagination(1, allTrackerData.length);
      }
    }
  } catch (error) {
    console.error("Error fetching tracker data:", error);
    
    // Don't show error if it's an auth error (safeFetch handles redirect)
    if (!error.message.includes("Authentication")) {
      showMessage(trackerMessage, `Failed to load data: ${error.message}`, "error");
      trackerBody.innerHTML = `<tr><td colspan="15" class="text-center py-4 text-red-500">Error loading data. Please try refreshing.</td></tr>`;
    }
  }
}

function renderTrackerTable(data) {
  trackerBody.innerHTML = "";

  if (data.length === 0) {
    trackerBody.innerHTML = `<tr><td colspan="15" class="text-center py-4 text-gray-500">No matching data found.</td></tr>`;
    return;
  }

  data.forEach((row) => {
    const progress = calculateTestProgress(row.Test_Time_Expected, row.Test_Time_Out);
    
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-100";
    tr.innerHTML = `
      <td>${row.Date ? new Date(row.Date).toLocaleDateString() : "N/A"}</td>
      <td>${row.Shift || "N/A"}</td>
      <td class="lab-number-cell" data-lab-number="${row.Lab_Number || ''}">${row.Lab_Number || "N/A"}</td>
      <td>${row.Unit || "N/A"}</td>
      <td>${row.Lab_Section || "N/A"}</td>
      <td>${row.Test_Name || "N/A"}</td>
      <td>${formatSASTTime(row.Test_Time_In)}</td>
      <td>${row.Urgency || "N/A"}</td>
      <td>${formatSASTTime(row.Time_Received)}</td>
      <td>${row.TAT || "N/A"}</td>
      <td>${formatSASTTime(row.Test_Time_Expected)}</td>
      <td class="${progress.cssClass}">${progress.text}</td>
      <td>${formatSASTTime(row.Test_Time_Out)}</td>
    `;
    trackerBody.appendChild(tr);
  });
  
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
      fetchTrackerData();
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
      fetchTrackerData();
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
      fetchTrackerData();
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
  fetchTrackerData();
}

function setupAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  refreshInterval = setInterval(() => {
    console.log('Auto-refreshing tracker data...');
    fetchTrackerData();
  }, AUTO_REFRESH_INTERVAL);
}

// Enhanced tooltip initialization for tracker
function initializeTrackerTooltips() {
  if (window.reinitializeLabNumberTooltips) {
    console.log('🔄 Initializing tracker-specific tooltips...');
    window.reinitializeLabNumberTooltips();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setDefaultDateFilter();
  fetchTrackerData();
  setupAutoRefresh();

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
        fetchTrackerData();
      }, 300);
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