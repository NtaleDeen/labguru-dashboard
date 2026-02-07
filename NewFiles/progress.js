// progress.js - FIXED VERSION with proper function order
import {
  checkAuthAndRedirect,
  getToken,
  clearSession,
  canAccess,
  safeFetch
} from "./auth.js";

checkAuthAndRedirect();

if (!canAccess('progress_table')) {
  window.location.href = "/html/dashboard.html";
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
// OPTIMIZED PROGRESS TABLE LOGIC
// ----------------------------------------------------
const API_URL = `${window.APP_CONFIG.getBackendUrl()}${window.APP_CONFIG.API_ENDPOINTS.PROGRESS}`;
const progressBody = document.getElementById("progressBody");
const progressMessage = document.getElementById("progressMessage");
const paginationContainer = document.getElementById("pagination-container");
const searchInput = document.getElementById("searchInput");

let allProgressData = [];
let currentPage = 1;
const rowsPerPage = 50;
let currentSearchQuery = "";

// Auto-refresh interval (1 minute for real-time progress)
const AUTO_REFRESH_INTERVAL = 60 * 1000;
let refreshInterval;

function showMessage(element, message, type = "info") {
  element.textContent = message;
  element.className = `message-box ${type}`;
  element.classList.remove("hidden");
}

async function fetchProgressData() {
  const token = getToken();
  if (!token) {
    window.location.href = "/index.html";
    return;
  }
  
  progressBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-gray-500">Loading data...</td></tr>`;
  progressMessage.classList.add("hidden");

  try {
    const filterValues = getCurrentFilterValues();
    const params = buildApiParams(filterValues);
    
    if (currentSearchQuery) {
      params.append('searchQuery', currentSearchQuery);
    }
    
    params.append('page', currentPage);
    params.append('limit', rowsPerPage);
    
    const url = `${API_URL}?${params.toString()}`;
    
    console.log('🔍 PROGRESS API REQUEST:', url);
    
    // USE ENHANCED safeFetch WITH RETRY LOGIC
    const response = await safeFetch(url, {
      method: "GET"
    }, 1); // 1 retry for progress data

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    allProgressData = data.data || data;
    
    if (!Array.isArray(allProgressData) || allProgressData.length === 0) {
      progressBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-gray-500">No data found with current filters.</td></tr>`;
      if (paginationContainer) paginationContainer.innerHTML = "";
    } else {
      renderProgressTable(allProgressData);
      if (data.totalPages) {
        setupPagination(data.totalPages, data.totalRecords);
      } else {
        setupPagination(1, allProgressData.length);
      }
    }
  } catch (error) {
    console.error("Error fetching progress data:", error);
    
    // Don't show error if it's an auth error (safeFetch handles redirect)
    if (!error.message.includes("Authentication")) {
      showMessage(
        progressMessage,
        `Failed to load data: ${error.message}`,
        "error"
      );
      progressBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-red-500">Error loading data. Please try refreshing.</td></tr>`;
    }
  }
}

function calculateProgress(timeExpected, timeOut) {
  const now = new Date();
  
  // Check if timeOut exists and is valid (actual completion in database)
  const hasTimeOut = timeOut && timeOut !== 'N/A' && timeOut !== null && timeOut !== undefined && timeOut !== 'undefined';
  const timeOutDate = hasTimeOut ? new Date(timeOut) : null;
  const isTimeOutValid = timeOutDate && !isNaN(timeOutDate.getTime());
  const isTimeOutInPast = isTimeOutValid && timeOutDate <= now;

  // Check if timeExpected exists and is valid
  const hasTimeExpected = timeExpected && timeExpected !== 'N/A' && timeExpected !== null && timeExpected !== undefined;
  const timeExpectedDate = hasTimeExpected ? new Date(timeExpected) : null;
  const isTimeExpectedValid = timeExpectedDate && !isNaN(timeExpectedDate.getTime());
  const isTimeExpectedInPast = isTimeExpectedValid && timeExpectedDate <= now;

  // ACTUALLY COMPLETED: Database has a valid time_out that is in the past
  if (isTimeOutValid && isTimeOutInPast) {
    return { 
      text: "Completed", 
      cssClass: "progress-complete-actual" 
    };
  }
  
  // DELAYED: Expected time has passed but no completion in database
  if (isTimeExpectedValid && isTimeExpectedInPast && !isTimeOutValid) {
    return { 
      text: "Delayed", 
      cssClass: "progress-overdue" 
    };
  }
  
  // PENDING: Has valid time_expected in future
  if (isTimeExpectedValid && !isTimeExpectedInPast) {
    const timeLeft = timeExpectedDate.getTime() - now.getTime();
    const timeLeftInMinutes = Math.floor(timeLeft / (1000 * 60));
    const timeLeftInHours = Math.floor(timeLeft / (1000 * 60 * 60));
    const timeLeftInDays = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    
    // Orange only for <= 10 minutes remaining
    if (timeLeftInMinutes <= 10 && timeLeftInMinutes > 0) {
      return { 
        text: `${timeLeftInMinutes} min(s) remaining`, 
        cssClass: "progress-urgent" 
      };
    } else if (timeLeftInDays > 0) {
      return { 
        text: `${timeLeftInDays} day(s) remaining`, 
        cssClass: "progress-pending" 
      };
    } else if (timeLeftInHours > 0) {
      return { 
        text: `${timeLeftInHours} hr(s) remaining`, 
        cssClass: "progress-pending" 
      };
    } else if (timeLeftInMinutes > 0) {
      return { 
        text: `${timeLeftInMinutes} min(s) remaining`, 
        cssClass: "progress-pending" 
      };
    } else {
      return { 
        text: "Due now", 
        cssClass: "progress-pending" 
      };
    }
  }
  
  // DEFAULT: No valid expected time
  return { 
    text: "No ETA", 
    cssClass: "progress-pending" 
  };
}

function renderProgressTable(data) {
  progressBody.innerHTML = "";

  if (data.length === 0) {
    progressBody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-gray-500">No matching data found.</td></tr>`;
    return;
  }

  data.forEach((row) => {
    // Now checking both expected time AND actual completion time from database
    const progress = calculateProgress(row.request_time_expected, row.request_time_out);
    
    const dateIn = new Date(row.date);
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const formattedDate = dateIn.toLocaleDateString("en-US", options);

    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-100";
    tr.innerHTML = `
      <td>${formattedDate || "N/A"}</td>
      <td>${row.shift || "N/A"}</td>
      <td class="lab-number-cell" data-lab-number="${row.lab_number || ''}">${row.lab_number || "N/A"}</td>
      <td>${row.Hospital_Unit || "N/A"}</td>
      <td>${row.time_in ? new Date(row.time_in).toLocaleString() : "N/A"}</td>
      <td>${row.daily_tat || "N/A"}</td>
      <td>${row.request_time_expected ? new Date(row.request_time_expected).toLocaleString() : "N/A"}</td>
      <td class="${progress.cssClass}">${progress.text}</td>
    `;
    progressBody.appendChild(tr);
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
      fetchProgressData();
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
      fetchProgressData();
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
      fetchProgressData();
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
  fetchProgressData();
}

function setupAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  refreshInterval = setInterval(() => {
    console.log('Auto-refreshing progress data...');
    fetchProgressData();
  }, AUTO_REFRESH_INTERVAL);
}

// Enhanced tooltip initialization for progress
function initializeProgressTooltips() {
  if (window.reinitializeLabNumberTooltips) {
    console.log('🔄 Initializing progress-specific tooltips...');
    window.reinitializeLabNumberTooltips();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setDefaultDateFilter();
  fetchProgressData();
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
        fetchProgressData();
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