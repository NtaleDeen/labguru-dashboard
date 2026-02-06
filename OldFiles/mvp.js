
// filters-revenue.js
// This file contains all the filtering logic and filter arrays for the revenue dashboard.

// The hospital unit arrays are now shared from here.
export const mainLaboratoryUnits = [
  "APU",
  "GWA",
  "GWB",
  "HDU",
  "ICU",
  "MAT",
  "NICU",
  "THEATRE",
  "2ND FLOOR",
  "A&E",
  "DIALYSIS",
  "DOCTORS PLAZA",
  "ENT",
  "RADIOLOGY",
  "SELF REQUEST",
  "WELLNESS",
  "WELLNESS CENTER",
];
export const annexUnits = ["ANNEX"];

/**
 * Helper function to capitalize the first letter of each word in a string.
 */
function capitalizeWords(str) {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Check if both dates are set for fetching
 */
export function areBothDatesSet() {
  const startDateInput = document.getElementById("startDateFilter");
  const endDateInput = document.getElementById("endDateFilter");
  
  return startDateInput?.value && endDateInput?.value;
}

// The filtering function is also moved here to be reusable.
export function applyRevenueFilters(allData, {
  startDateStr,
  endDateStr,
  period,
  labSection,
  shift,
  hospitalUnit
}) {
  let filteredData = [...allData];

  // Filter by date range - INDEPENDENT DATE FILTERING
  const startDate = startDateStr ? moment.utc(startDateStr).startOf('day') : null;
  const endDate = endDateStr ? moment.utc(endDateStr).endOf('day') : null;

  filteredData = filteredData.filter(row => {
    if (!row.parsedEncounterDate) return false;
    
    // Check start date
    if (startDate && row.parsedEncounterDate.isBefore(startDate)) {
      return false;
    }
    
    // Check end date
    if (endDate && row.parsedEncounterDate.isAfter(endDate)) {
      return false;
    }
    
    return true;
  });

    // Filter by period (keep as is)
    if (period) {
        const now = moment.utc();
        let periodStartDate, periodEndDate;
        switch (period) {
            case "thisMonth":
                periodStartDate = now.clone().startOf("month");
                periodEndDate = now.clone().endOf("month");
                break;
            case "lastMonth":
                periodStartDate = now.clone().subtract(1, "month").startOf("month");
                periodEndDate = now.clone().subtract(1, "month").endOf("month");
                break;
            case "thisQuarter":
                periodStartDate = now.clone().startOf("quarter");
                periodEndDate = now.clone().endOf("quarter");
                break;
            case "lastQuarter":
                periodStartDate = now.clone().subtract(1, "quarter").startOf("quarter");
                periodEndDate = now.clone().subtract(1, "quarter").endOf("quarter");
                break;
            case "thisYear":
                periodStartDate = now.clone().startOf("year");
                periodEndDate = now.clone().endOf("year");
                break;
            case "lastYear":
                periodStartDate = now.clone().subtract(1, "year").startOf("year");
                periodEndDate = now.clone().endOf("year");
                break;
            default:
                break;
        }

        if (periodStartDate && periodEndDate) {
            filteredData = filteredData.filter(row => {
                if (!row.parsedEncounterDate) return false;
                return row.parsedEncounterDate.isBetween(periodStartDate, periodEndDate, null, '[]');
            });
        }
    }

    // Filter by lab section - Convert to uppercase for consistent comparison
    if (labSection && labSection !== 'all') {
        filteredData = filteredData.filter(row =>
            row.LabSection.toUpperCase() === labSection.toUpperCase()
        );
    }

    // Filter by shift - Convert to uppercase for consistent comparison
    if (shift && shift !== 'all') {
        filteredData = filteredData.filter(row =>
            row.Shift.toUpperCase() === shift.toUpperCase()
        );
    }

    // Filter by hospital unit - Convert to uppercase for consistent comparison
    if (hospitalUnit && hospitalUnit !== 'all') {
        const filterUnit = hospitalUnit.toUpperCase();

        if (filterUnit === "MAINLAB") {
            // Check if the hospital unit is in the mainLaboratoryUnits array
            filteredData = filteredData.filter(row => {
                const rowUnit = row.Hospital_Unit ? row.Hospital_Unit.toUpperCase() : '';
                return mainLaboratoryUnits.map(u => u.toUpperCase()).includes(rowUnit);
            });
        } else if (filterUnit === "ANNEX") {
            // Check if the hospital unit is in the annexUnits array
            filteredData = filteredData.filter(row => {
                const rowUnit = row.Hospital_Unit ? row.Hospital_Unit.toUpperCase() : '';
                return annexUnits.map(u => u.toUpperCase()).includes(rowUnit);
            });
        } else {
            // Filter for a specific, single hospital unit
            filteredData = filteredData.filter(row => {
                const rowUnit = row.Hospital_Unit ? row.Hospital_Unit.toUpperCase() : '';
                return rowUnit === filterUnit;
            });
        }
    }

    return filteredData;
}

// Add lab section options as an array
export const labSections = [
    "chemistry",
    "heamatology",
    "microbiology",
    "serology",
    "referral",
];

// Function to populate the lab section dropdown
export function populateLabSectionFilter(elementId) {
    const selectElement = document.getElementById(elementId);
    if (!selectElement) return;

    // Clear existing options
    selectElement.innerHTML = '<option value="all">All</option>';

    labSections.forEach(section => {
        const option = document.createElement("option");
        option.value = section;
        option.textContent = capitalizeWords(section);
        selectElement.appendChild(option);
    });
}

export function populateShiftFilter(allData) {
    const shiftFilter = document.getElementById("shiftFilter");
    if (!shiftFilter || !allData) return;

    // Clear existing options
    shiftFilter.innerHTML = `<option value="all">All Shifts</option>`;

    // Dynamically get unique shifts from data
    const shifts = [...new Set(allData.map(row => row.Shift).filter(Boolean))].sort();

    shifts.forEach(shift => {
        const option = document.createElement("option");
        option.value = shift;
        option.textContent = capitalizeWords(shift);
        shiftFilter.appendChild(option);
    });
}

export function populateHospitalUnitFilter(allData) {
    const hospitalUnitFilter = document.getElementById("hospitalUnitFilter");
    if (!hospitalUnitFilter || !allData) return;

    // Clear existing options for hospitalUnitFilter
    hospitalUnitFilter.innerHTML = `
        <option value="all">All</option>
        <option value="mainLab">Main Laboratory</option>
        <option value="annex">Annex</option>
    `;

    // No need to populate unitSelect here. It's handled by populateChartUnitSelect in revenue.js
}

// Function to attach all event listeners for the filters - UPDATED WITH DELAYED DATE FETCHING
export function attachRevenueFilterListeners(processData) {
    const startDateFilterInput = document.getElementById("startDateFilter");
    const endDateFilterInput = document.getElementById("endDateFilter");
    const periodSelect = document.getElementById("periodSelect");
    const labSectionFilter = document.getElementById("labSectionFilter");
    const shiftFilter = document.getElementById("shiftFilter");
    const hospitalUnitFilter = document.getElementById("hospitalUnitFilter"); // Corrected ID
    const unitSelect = document.getElementById("unitSelect"); // The existing unitSelect for charts

    // Set up date range controls with delayed fetching
    setupDateRangeControls(processData);

    // Period selector - always triggers immediately
    if (periodSelect) {
        periodSelect.addEventListener("change", () => {
            if (periodSelect.value !== "custom") {
                updateDatesForPeriod(periodSelect.value);
            }
            processData(); // Period changes always trigger data processing
        });
    }

    // Other filters (lab section, shift, hospital unit, unit select) - always trigger immediately
    const immediateFilters = [labSectionFilter, shiftFilter, hospitalUnitFilter, unitSelect];
    immediateFilters.forEach(filter => {
        if (filter) {
            filter.addEventListener("change", () => {
                processData();
            });
        }
    });
}

// NEW: Set up date range controls with delayed fetching
function setupDateRangeControls(processData) {
    const startDateFilterInput = document.getElementById("startDateFilter");
    const endDateFilterInput = document.getElementById("endDateFilter");

    if (!startDateFilterInput || !endDateFilterInput) return;

    endDateFilterInput.disabled = true;

    startDateFilterInput.addEventListener("change", () => {
        if (startDateFilterInput.value) {
            endDateFilterInput.disabled = false;
            endDateFilterInput.min = startDateFilterInput.value;
            if (endDateFilterInput.value && endDateFilterInput.value < startDateFilterInput.value) {
                endDateFilterInput.value = "";
            }
            document.getElementById("periodSelect").value = "custom";
            
            // Don't trigger data fetch here - wait for both dates
        } else {
            endDateFilterInput.disabled = true;
            endDateFilterInput.value = "";
        }
    });

    // Only trigger when both dates are set
    endDateFilterInput.addEventListener("change", () => {
        if (startDateFilterInput.value && endDateFilterInput.value) {
            processData();
        }
    });
}

// Function to initialize the common dashboard components and listeners
export function initCommonDashboard(processData) {
  // This function is meant to be called on DOMContentLoaded
  // to set up all the filters and their listeners.
  attachRevenueFilterListeners(processData);
}

// A helper function to update the date inputs based on the period selection.
export function updateDatesForPeriod(period) {
    const startDateFilterInput = document.getElementById("startDateFilter");
    const endDateFilterInput = document.getElementById("endDateFilter");

    if (!startDateFilterInput || !endDateFilterInput) return;

    const now = moment();
    let startDate, endDate;

    switch (period) {
        case "thisMonth":
            startDate = now.clone().startOf("month");
            endDate = now.clone().endOf("month");
            break;
        case "lastMonth":
            startDate = now.clone().subtract(1, "month").startOf("month");
            endDate = now.clone().subtract(1, "month").endOf("month");
            break;
        case "thisQuarter":
            startDate = now.clone().startOf("quarter");
            endDate = now.clone().endOf("quarter");
            break;
        case "lastQuarter":
            startDate = now.clone().subtract(1, "quarter").startOf("quarter");
            endDate = now.clone().subtract(1, "quarter").endOf("quarter");
            break;
        case "thisYear":
            startDate = now.clone().startOf("year");
            endDate = now.clone().endOf("year");
            break;
        case "lastYear":
            startDate = now.clone().subtract(1, "year").startOf("year");
            endDate = now.clone().endOf("year");
            break;
        default:
            // For 'customDate' or no selection, we do nothing and let the user input dates
            return;
    }
    
    startDateFilterInput.value = startDate.format("YYYY-MM-DD");
    endDateFilterInput.value = endDate.format("YYYY-MM-DD");
    
    // Enable end date input when dates are set via period
    endDateFilterInput.disabled = false;
}
// filters-common.js
// filters-common.js - UPDATED with proper date handling and delayed fetching
// filters-common.js - Centralized filtering logic for all table pages
import { updateDatesForPeriod as revenueUpdateDates } from "./filters-revenue.js";
import { updateDatesForPeriod as tatUpdateDates } from "./filters-tat.js";

// Export unit arrays for consistency
export const mainLaboratoryUnits = [
  "APU", "GWA", "GWB", "HDU", "ICU", "MAT", "NICU", "THEATRE",
  "2ND FLOOR", "A&E", "DIALYSIS", "DOCTORS PLAZA", "ENT", "RADIOLOGY", 
  "SELF REQUEST", "WELLNESS", "WELLNESS CENTER"
];
export const annexUnits = ["ANNEX"];
export const inpatientUnits = [
  "APU", "GWA", "GWB", "HDU", "ICU", "MAT", "NICU", "THEATRE"
];
export const outpatientUnits = [
  "2ND FLOOR", "A&E", "DIALYSIS", "DOCTORS PLAZA", "ENT", "RADIOLOGY",
  "SELF REQUEST", "WELLNESS", "WELLNESS CENTER"
];

// Lab sections
export const labSections = [
  "chemistry", "heamatology", "microbiology", "serology", "referral"
];

/**
 * Capitalize words helper function
 */
export function capitalizeWords(str) {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Get current filter values from the page - FIXED DATE HANDLING
 */
export function getCurrentFilterValues() {
  const startDateInput = document.getElementById("startDateFilter");
  const endDateInput = document.getElementById("endDateFilter");
  
  // Handle empty date values properly
  let startDate = startDateInput?.value || "";
  let endDate = endDateInput?.value || "";
  
  // If dates are empty, don't send them to server
  if (startDate === "") startDate = null;
  if (endDate === "") endDate = null;
  
  return {
    startDate: startDate,
    endDate: endDate,
    period: document.getElementById("periodSelect")?.value || "",
    labSection: document.getElementById("labSectionFilter")?.value || "all",
    shift: document.getElementById("shiftFilter")?.value || "all",
    hospitalUnit: document.getElementById("hospitalUnitFilter")?.value || "all"
  };
}

/**
 * Check if both dates are set for fetching
 */
export function areBothDatesSet() {
  const startDateInput = document.getElementById("startDateFilter");
  const endDateInput = document.getElementById("endDateFilter");
  
  return startDateInput?.value && endDateInput?.value;
}

/**
 * Build API parameters from filter values - FIXED CASE SENSITIVITY
 */
export function buildApiParams(filterValues) {
  const params = new URLSearchParams();
  
  if (filterValues.startDate) {
    params.append('startDate', filterValues.startDate);
  }
  if (filterValues.endDate) {
    params.append('endDate', filterValues.endDate);
  }
  
  // FIX: Remove the .toLowerCase() conversion - let backend handle case sensitivity
  if (filterValues.labSection && filterValues.labSection !== 'all') {
    params.append('labSection', filterValues.labSection); // REMOVED .toLowerCase()
  }
  
  // FIX: Remove the .toLowerCase() conversion for shift as well
  if (filterValues.shift && filterValues.shift !== 'all') {
    params.append('shift', filterValues.shift); // REMOVED .toLowerCase()
  }
  
  if (filterValues.hospitalUnit && filterValues.hospitalUnit !== 'all') {
    params.append('hospitalUnit', filterValues.hospitalUnit);
  }
  
  console.log('🔍 Built API Params:', params.toString());
  return params;
}

/**
 * Initialize common filters with callback - FIXED DATE LISTENERS WITH DELAYED FETCHING
 */
export function initCommonFilters(filterCallback, options = {}) {
  const {
    includeDateFilters = true,
    includeLabSectionFilter = true,
    includeShiftFilter = true,
    includeHospitalUnitFilter = true,
    includePeriodSelect = true,
    dataType = 'default',
    delayDateFetching = true // NEW: Option to delay fetching until both dates are set
  } = options;
  
  // Set up period selector
  const periodSelect = document.getElementById('periodSelect');
  if (periodSelect && includePeriodSelect) {
    periodSelect.addEventListener('change', function() {
      // Use appropriate update function based on dataType
      if (dataType === 'revenue') {
        revenueUpdateDates(this.value);
      } else if (dataType === 'tat') {
        tatUpdateDates(this.value);
      } else {
        updateDatesForPeriod(this.value);
      }
      
      // If period changes, always trigger callback (period sets both dates)
      if (filterCallback) filterCallback();
    });
  }
  
  // Set up date filter listeners with proper change detection
  if (includeDateFilters) {
    const startDateFilter = document.getElementById('startDateFilter');
    const endDateFilter = document.getElementById('endDateFilter');
    
    if (startDateFilter) {
      startDateFilter.addEventListener('change', () => {
        // NEW: Only trigger if both dates are set OR if delayDateFetching is false
        if (filterCallback && (!delayDateFetching || areBothDatesSet())) {
          filterCallback();
        }
      });
    }
    
    if (endDateFilter) {
      endDateFilter.addEventListener('change', () => {
        // NEW: Only trigger if both dates are set
        if (filterCallback && areBothDatesSet()) {
          filterCallback();
        }
      });
    }
  }
  
  // Set up other filter listeners (always trigger immediately)
  const filters = [
    includeLabSectionFilter ? document.getElementById('labSectionFilter') : null,
    includeShiftFilter ? document.getElementById('shiftFilter') : null,
    includeHospitalUnitFilter ? document.getElementById('hospitalUnitFilter') : null
  ].filter(Boolean);
  
  filters.forEach(filter => {
    if (filter) {
      filter.addEventListener('change', () => {
        if (filterCallback) filterCallback();
      });
    }
  });
  
  console.log('Common filters initialized for data type:', dataType, 'Delay date fetching:', delayDateFetching);
}

/**
 * Generic date update function for non-revenue/TAT pages - FIXED
 */
function updateDatesForPeriod(period) {
  const startDateInput = document.getElementById("startDateFilter");
  const endDateInput = document.getElementById("endDateFilter");
  
  if (!startDateInput || !endDateInput) return;
  
  const now = moment();
  let startDate, endDate;
  
  switch (period) {
    case "thisMonth":
      startDate = now.clone().startOf("month");
      endDate = now.clone().endOf("month");
      break;
    case "lastMonth":
      startDate = now.clone().subtract(1, "month").startOf("month");
      endDate = now.clone().subtract(1, "month").endOf("month");
      break;
    case "thisQuarter":
      startDate = now.clone().startOf("quarter");
      endDate = now.clone().endOf("quarter");
      break;
    case "lastQuarter":
      startDate = now.clone().subtract(1, "quarter").startOf("quarter");
      endDate = now.clone().subtract(1, "quarter").endOf("quarter");
      break;
    default:
      return;
  }
  
  startDateInput.value = startDate.format("YYYY-MM-DD");
  endDateInput.value = endDate.format("YYYY-MM-DD");
}

/**
 * Set default date filter to last 7 days
 */
export function setDefaultDateFilter() {
  const startDateInput = document.getElementById("startDateFilter");
  const endDateInput = document.getElementById("endDateFilter");
  
  if (!startDateInput || !endDateInput) return;
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  startDateInput.valueAsDate = startDate;
  endDateInput.valueAsDate = endDate;
}
// index.js
// frontend/js/index.js - COMPLETE FIXED VERSION WITH PASSWORD RESET

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Index.js loading...");
  
  const loginForm = document.getElementById("loginForm");
  
  // Check if login form exists on this page
  if (!loginForm) {
    console.log("ℹ️ Login form not found on this page, skipping login initialization");
    return;
  }
  
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  
  // Create message div and add it to the form
  const messageDiv = document.createElement("div");
  messageDiv.style.marginTop = "10px";
  messageDiv.style.padding = "10px";
  messageDiv.style.borderRadius = "4px";
  messageDiv.className = "message-box hidden";
  loginForm.appendChild(messageDiv);

  // Password reset elements
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const passwordResetModal = document.getElementById("passwordResetModal");
  const closeResetModal = document.getElementById("closeResetModal");
  const cancelReset = document.getElementById("cancelReset");
  const passwordResetForm = document.getElementById("passwordResetForm");
  const resetUsername = document.getElementById("resetUsername");
  const resetMessage = document.getElementById("resetMessage");

  let originalButtonText = "";

  // Password visibility toggle
  const togglePasswordBtn = document.getElementById("togglePassword");
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", function () {
      const passwordField = document.getElementById("password");
      const type = passwordField.type === "password" ? "text" : "password";
      passwordField.type = type;

      this.classList.toggle("fa-eye");
      this.classList.toggle("fa-eye-slash");
    });
  }

  // Use centralized configuration
  const BACKEND_URL = window.APP_CONFIG.getBackendUrl();
  const LOGIN_URL = `${BACKEND_URL}${window.APP_CONFIG.API_ENDPOINTS.LOGIN}`;

  console.log("🔧 Login URL:", LOGIN_URL);

  // Password Reset Modal functionality
  if (forgotPasswordLink && passwordResetModal) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      passwordResetModal.classList.remove("hidden");
      if (resetMessage) resetMessage.classList.add("hidden");
      if (passwordResetForm) passwordResetForm.reset();
    });

    if (closeResetModal) {
      closeResetModal.addEventListener("click", () => {
        passwordResetModal.classList.add("hidden");
      });
    }

    if (cancelReset) {
      cancelReset.addEventListener("click", () => {
        passwordResetModal.classList.add("hidden");
      });
    }

    // Close modal when clicking outside
    passwordResetModal.addEventListener("click", (e) => {
      if (e.target === passwordResetModal) {
        passwordResetModal.classList.add("hidden");
      }
    });

    // Password Reset Form submission
    if (passwordResetForm) {
      passwordResetForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const username = resetUsername.value.trim();
        
        if (!username) {
          showResetMessage("Please enter your username", "error");
          return;
        }

        try {
          const response = await fetch(`${BACKEND_URL}/api/request_password_reset`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username }),
          });

          const data = await response.json();

          if (response.ok) {
              showResetMessage("Password reset instructions have been sent. Please check your email.", "success");
              
              // For demo purposes - auto-redirect to reset page
              if (data.reset_token) {
                  console.log("Reset token (for demo):", data.reset_token);
                  setTimeout(() => {
                      window.location.href = `/reset_password.html?token=${data.reset_token}`;
                  }, 2000);
              }
          } else {
              showResetMessage(data.error || "Unable to process reset request. Please try again.", "error");
          }
        } catch (error) {
          console.error("Password reset error:", error);
          showResetMessage("Network error. Please try again.", "error");
        }
      });
    }
  }

  function showResetMessage(message, type) {
    if (!resetMessage) return;
    
    resetMessage.textContent = message;
    resetMessage.className = `message-box ${type}`;
    resetMessage.classList.remove("hidden");
  }

  // Login form submission
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    // Clear previous messages
    messageDiv.textContent = "";
    messageDiv.className = "message-box hidden";
    messageDiv.classList.remove("error", "success", "warning");

    // Basic validation
    if (!username || !password) {
      showMessage("Please enter both username and password", "error");
      return;
    }

    // Get submit button and save original text
    const submitButton = loginForm.querySelector('button[type="submit"]');
    originalButtonText = submitButton.textContent;

    try {
      console.log("🔐 Attempting login for user:", username);
      
      // Show loading state
      submitButton.textContent = "Logging in...";
      submitButton.disabled = true;
      
      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      console.log("📡 Login response status:", response.status);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error(`Server error (${response.status}). Please try again.`);
      }

      const data = await response.json();
      console.log("📦 Login response data:", data);

      if (response.ok) {
        // Clear any existing user data if logging in as different user
        const existingUser = localStorage.getItem("zyntelUser");
        if (existingUser && existingUser !== username) {
          sessionStorage.clear();
          localStorage.removeItem("zyntelUser");
          console.log("🔄 Cleared previous user session");
        }

        // Validate response data structure
        if (!data.token) {
          throw new Error("No authentication token received");
        }

        if (!data.role) {
          console.warn("⚠️ No role received from server, using default");
          data.role = "viewer"; // Default fallback
        }

        // Save session with ALL information including role
        const sessionData = {
          token: data.token,
          username: username,
          role: data.role,
          client_id: data.client_id || null,
          timestamp: Date.now(),
        };

        console.log("💾 Saving session data:", { 
          username: sessionData.username,
          role: sessionData.role,
          client_id: sessionData.client_id,
          token_length: sessionData.token ? sessionData.token.length : 0
        });
        
        sessionStorage.setItem("session", JSON.stringify(sessionData));
        localStorage.setItem("zyntelUser", username);

        // Verify session was saved
        const savedSession = sessionStorage.getItem("session");
        if (!savedSession) {
          throw new Error("Failed to save session data");
        }

        showMessage("Login successful! Redirecting...", "success");
        
        console.log("✅ Login successful, redirecting to dashboard...");
        
        setTimeout(() => {
          window.location.href = "/html/dashboard.html";
        }, 1500);
        
      } else {
        // Handle different error status codes
        handleLoginError(response.status, data);
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      handleNetworkError(error);
    } finally {
      // Restore button state
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }
  });

  function showMessage(message, type = "info") {
    messageDiv.textContent = message;
    messageDiv.className = "message-box";
    messageDiv.classList.add(type);
    messageDiv.classList.remove("hidden");
    
    // Auto-hide success messages
    if (type === "success") {
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    }
  }

  function handleLoginError(statusCode, data) {
    switch (statusCode) {
      case 400:
        showMessage(data.error || "Invalid request format.", "error");
        break;
      case 401:
        showMessage(data.error || "Invalid username or password.", "error");
        break;
      case 403:
        showMessage(data.error || "Account disabled or access denied.", "error");
        break;
      case 404:
        showMessage("Authentication service not available.", "error");
        break;
      case 500:
        showMessage("Server error during login. Please contact administrator.", "error");
        break;
      default:
        showMessage(data.error || `Login failed (Error ${statusCode})`, "error");
    }
  }

  function handleNetworkError(error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      showMessage("Cannot connect to server. Please check your connection.", "error");
    } else {
      showMessage(error.message || "An unexpected error occurred.", "error");
    }
  }
});

// Session check (moved to bottom to avoid blocking)
console.log("🔄 Checking for existing session...");
const existingSession = sessionStorage.getItem("session");
if (existingSession) {
  console.log("📝 Existing session found");
  
  // If we're on the login page but already logged in, redirect to dashboard
  if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
    console.log("🔄 Already logged in, redirecting to dashboard...");
    setTimeout(() => {
      window.location.href = "/html/dashboard.html";
    }, 1000);
  }
} else {
  console.log("🔐 No existing session found");
}
// lrids.js
// lrids.js - Laboratory Report Information Display System
import {
  checkAuthAndRedirect,
  getToken,
  safeFetch  // ADD THIS IMPORT
} from "./auth.js";

// Immediate auth check at the start
try {
  checkAuthAndRedirect();
} catch (error) {
  console.error("Auth check failed:", error);
  window.location.href = "/index.html";
}

const API_URL = `${window.APP_CONFIG.getBackendUrl()}${window.APP_CONFIG.API_ENDPOINTS.PROGRESS}`;
const lridsBody = document.getElementById("lridsBody");

// Auto-refresh interval (30 seconds for real-time display)
const AUTO_REFRESH_INTERVAL = 30 * 1000;
let refreshInterval;

function updateDateTime() {
  const now = new Date();
  const currentDate = document.getElementById("currentDate");
  const currentTime = document.getElementById("currentTime");
  
  currentDate.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  currentTime.textContent = now.toLocaleTimeString('en-US', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

async function fetchLRIDSData() {
  const token = getToken();
  if (!token) {
    console.error("No token available");
    return;
  }

  lridsBody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-gray-500">Loading data...</td></tr>`;

  try {
    const params = new URLSearchParams();
    params.append('limit', 100); // Show more records for display
    
    const url = `${API_URL}?${params.toString()}`;
    
    // USE ENHANCED safeFetch WITH RETRY LOGIC
    const response = await safeFetch(url, {
      method: "GET"
    }, 1); // 1 retry for LRIDS data

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const lridsData = data.data || data;
    
    if (!Array.isArray(lridsData) || lridsData.length === 0) {
      lridsBody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-gray-500">No data available</td></tr>`;
    } else {
      renderLRIDSTable(lridsData);
    }
  } catch (error) {
    console.error("Error fetching LRIDS data:", error);
    
    // Don't show error if it's an auth error (safeFetch handles redirect)
    if (!error.message.includes("Authentication")) {
      lridsBody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-red-500">Error loading data. Please try refreshing.</td></tr>`;
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
        text: "Time Up", 
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

function renderLRIDSTable(data) {
  lridsBody.innerHTML = "";

  if (data.length === 0) {
    lridsBody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-gray-500">No data available</td></tr>`;
    return;
  }

  // Sort by most recent first
  const sortedData = data.sort((a, b) => {
    const dateA = new Date(a.date + ' ' + a.time_in);
    const dateB = new Date(b.date + ' ' + b.time_in);
    return dateB - dateA;
  });

  sortedData.forEach((row) => {
    const progress = calculateProgress(row.request_time_expected, row.request_time_out);
    
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-100";
    tr.innerHTML = `
      <td>${row.lab_number || "N/A"}</td>
      <td>${row.time_in ? new Date(row.time_in).toLocaleString() : "N/A"}</td>
      <td class="${progress.cssClass}">${progress.text}</td>
    `;
    lridsBody.appendChild(tr);
  });
}

function setupAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  // Update date/time every second
  setInterval(updateDateTime, 1000);
  
  // Refresh data every 30 seconds
  refreshInterval = setInterval(() => {
    console.log('Auto-refreshing LRIDS data...');
    fetchLRIDSData();
  }, AUTO_REFRESH_INTERVAL);
}

document.addEventListener("DOMContentLoaded", () => {
  // Initial setup
  updateDateTime();
  fetchLRIDSData();
  setupAutoRefresh();
});
// meta.js
// meta.js - OPTIMIZED VERSION without loading spinner
import {
  checkAuthAndRedirect,
  getToken,
  clearSession,
  canAccess,
  safeFetch
} from "./auth.js";

checkAuthAndRedirect();

if (!canAccess('meta')) {
  window.location.href = "/html/dashboard.html";
}

import {
  initCommonFilters,
  getCurrentFilterValues,
  buildApiParams,
  setDefaultDateFilter
} from "./filters-common.js";

// Select the logout button and add an event listener
const logoutButton = document.getElementById("logout-button");
logoutButton.addEventListener("click", (e) => {
  e.preventDefault();
  clearSession();
  window.location.replace("/index.html");
});

// ----------------------------------------------------
// OPTIMIZED META TABLE LOGIC
// ----------------------------------------------------
const API_URL = `${window.APP_CONFIG.getBackendUrl()}${window.APP_CONFIG.API_ENDPOINTS.META}`;
const metaBody = document.getElementById("metaBody");
const metaMessage = document.getElementById("metaMessage");
const paginationContainer = document.getElementById("pagination-container");
const searchInput = document.getElementById("searchInput");

let allMetaData = [];
let currentPage = 1;
const rowsPerPage = 50;
let currentSearchQuery = "";

// Auto-refresh interval (5 minutes)
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;
let refreshInterval;

function showMessage(element, message, type = "info") {
  element.textContent = message;
  element.className = `message-box ${type}`;
  element.classList.remove("hidden");
}

/**
 * Fetches meta data from the API WITH FILTERS - OPTIMIZED
 */
async function fetchMetaData() {
  const token = getToken();
  if (!token) {
    window.location.href = "/index.html";
    return;
  }
  
  // Simple loading state without spinner
  metaBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">Loading data...</td></tr>`;
  metaMessage.classList.add("hidden");

  try {
    const filterValues = getCurrentFilterValues();
    const params = buildApiParams(filterValues);
    
    // Add search query if exists
    if (currentSearchQuery) {
      params.append('searchQuery', currentSearchQuery);
    }
    
    // Add pagination
    params.append('page', currentPage);
    params.append('limit', rowsPerPage);
    
    const url = `${API_URL}?${params.toString()}`;
    
    console.log('🔍 META API REQUEST:', url);
    
    // USE THE NEW safeFetch WITH RETRY LOGIC
    const response = await safeFetch(url, {
      method: "GET"
    }, 1); // 1 retry for meta data

    console.log('🔍 Response Status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    allMetaData = data.data || data;
    
    if (!Array.isArray(allMetaData) || allMetaData.length === 0) {
      metaBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">No data found.</td></tr>`;
      if (paginationContainer) paginationContainer.innerHTML = "";
    } else {
      renderMetaTable(allMetaData);
      if (data.totalPages) {
        setupPagination(data.totalPages, data.totalRecords);
      } else {
        setupPagination(1, allMetaData.length);
      }
    }
  } catch (error) {
    console.error("Error fetching meta data:", error);
    
    // Don't show error if it's an auth error (safeFetch handles redirect)
    if (!error.message.includes("Authentication")) {
      showMessage(
        metaMessage,
        `Failed to load data: ${error.message}`,
        "error"
      );
      metaBody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-red-500">Error loading data. Please try refreshing.</td></tr>`;
    }
  }
}

/**
 * Renders the meta data table - SIMPLIFIED
 */
function renderMetaTable(data) {
  metaBody.innerHTML = "";

  if (data.length === 0) {
    metaBody.innerHTML = `<tr><td colspan="4">No matching data found.</td></tr>`;
    return;
  }

  data.forEach((row) => {
    const tr = document.createElement("tr");
    tr.className = "table-row";
    tr.innerHTML = `
      <td>${row.test_name || "N/A"}</td>
      <td>${row.lab_section || "N/A"}</td>
      <td>${row.tat || "N/A"}</td>
      <td>UGX ${parseFloat(row.price || 0).toLocaleString()}</td>
    `;
    metaBody.appendChild(tr);
  });
}

/**
 * Optimized pagination with server-side info
 */
function setupPagination(totalPages, totalRecords) {
  if (!paginationContainer || totalPages <= 1) {
    if (paginationContainer) paginationContainer.innerHTML = "";
    return;
  }

  paginationContainer.innerHTML = "";

  // Previous button
  const prevButton = document.createElement("button");
  prevButton.textContent = "Previous";
  prevButton.className = "pagination-btn";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      fetchMetaData();
    }
  });
  paginationContainer.appendChild(prevButton);

  // Page buttons
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
      fetchMetaData();
    });
    paginationContainer.appendChild(btn);
  }

  // Next button
  const nextButton = document.createElement("button");
  nextButton.textContent = "Next";
  nextButton.className = "pagination-btn";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchMetaData();
    }
  });
  paginationContainer.appendChild(nextButton);

  // Records count
  const countElement = document.createElement("span");
  countElement.className = "pagination-count";
  countElement.textContent = `Total: ${totalRecords}`;
  paginationContainer.appendChild(countElement);
}

function handleFilterChange() {
  currentPage = 1;
  debugLabSectionFilter();
  fetchMetaData();
}

/**
 * Setup auto-refresh
 */
function setupAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  refreshInterval = setInterval(() => {
    console.log('Auto-refreshing meta data...');
    fetchMetaData();
  }, AUTO_REFRESH_INTERVAL);
}

// ADD THE MISSING FUNCTION:
function debugLabSectionFilter() {
  const filterValues = getCurrentFilterValues();
  const params = buildApiParams(filterValues);
  
  console.log('🔍 META LAB SECTION FILTER DEBUG:');
  console.log('Current Filter Values:', filterValues);
  console.log('Lab Section Filter Value:', filterValues.labSection);
  console.log('API Parameters:', params.toString());
  console.log('Full API URL:', `${API_URL}?${params.toString()}`);
  console.log('Current Page:', window.location.pathname);
  
  if (allMetaData && Array.isArray(allMetaData) && allMetaData.length > 0) {
    const labSectionsInData = [...new Set(allMetaData.map(row => 
      row.lab_section || row.Lab_Section || row.labSection || 'N/A'
    ))].filter(section => section !== 'N/A');
    console.log('Available Lab Sections in Current Data:', labSectionsInData);
  } else {
    console.log('No meta data loaded yet');
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Set default date filter
  setDefaultDateFilter();
  
  // Initial data fetch
  fetchMetaData();
  
  // Setup auto-refresh
  setupAutoRefresh();

  // Configure filters
  const config = {
    includeDateFilters: false,
    includePeriodSelect: false,
    includeLabSectionFilter: true,
    includeShiftFilter: false,
    includeHospitalUnitFilter: false,
  };

  initCommonFilters(handleFilterChange, {
  ...config,
  delayDateFetching: true  // Add this line
});

  // Search functionality with debounce
  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      clearTimeout(searchTimeout);
      currentSearchQuery = event.target.value.trim();
      currentPage = 1;
      
      searchTimeout = setTimeout(() => {
        fetchMetaData();
      }, 300);
    });
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
// trend-utils.js
// trend-utils.js - Updated to match revenue.js arrow style exactly

export function getTrendDirection(metricType, currentValue, previousValue) {
    // For debugging
    console.log(`Trend direction - Type: ${metricType}, Current: ${currentValue}, Previous: ${previousValue}`);
    
    // Handle cases where we can't determine trend
    if (previousValue === 0 || currentValue === null || previousValue === null) {
        return 'neutral';
    }
    
    const isImprovement = currentValue > previousValue;
    
    switch (metricType) {
        case 'revenue':
        case 'onTime':
        case 'tests':
            // Higher values are better - green up arrow
            return isImprovement ? 'positive' : 'negative';
            
        case 'delays':
        case 'notUploaded':
        case 'errors':
            // Lower values are better - green down arrow  
            return isImprovement ? 'negative' : 'positive';
            
        default:
            // Default: higher is better
            return isImprovement ? 'positive' : 'negative';
    }
}

export function calculateTrendPercentage(currentValue, previousValue) {
    if (previousValue === 0 || currentValue === null || previousValue === null) {
        return 0;
    }
    
    const change = currentValue - previousValue;
    const percentage = (change / Math.abs(previousValue)) * 100;
    
    // Handle very small numbers and rounding
    return Math.abs(percentage) < 0.01 ? 0 : Number(percentage.toFixed(1));
}

export function updateTrend(elementId, percentage, direction) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`Trend element not found: ${elementId}`);
        return;
    }

    // Clear loading state
    element.classList.remove('loading');
    
    if (percentage === 0 || isNaN(percentage)) {
        element.textContent = "→ 0%";
        element.className = "kpi-trend trend-neutral";
        return;
    }

    // MATCH REVENUE.JS STYLE EXACTLY
    const arrow = direction === 'positive' ? '↑' : '↓';
    const absPercentage = Math.abs(percentage);
    
    element.textContent = `${arrow} ${absPercentage.toFixed(1)}%`;
    element.className = `kpi-trend trend-${direction}`;
}

export function setTrendLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = "Loading...";
        element.className = "kpi-trend loading";
    }
}
// revenue.js
// revenue.js - Database-Powered Revenue Dashboard

// Refactored to use a centralized authentication module (`auth.js`)
// and to remove redundant code.

// 1. Import the centralized authentication functions.
import {
  checkAuthAndRedirect,
  getToken,
  clearSession,
  canAccess,
  safeFetch  // ADD THIS IMPORT
} from "./auth.js";

// Immediately check authentication on page load.
checkAuthAndRedirect();

// Only Admin and Manager can access chart pages
if (!canAccess('revenue')) { // Change 'revenue' to appropriate page name
  window.location.href = "/html/dashboard.html";
}

// Import filtering functions specific to the revenue dashboard
import {
  applyRevenueFilters,
  initCommonDashboard,
  updateDatesForPeriod,
  populateLabSectionFilter,
  populateShiftFilter,
  populateHospitalUnitFilter,
} from "./filters-revenue.js";

import { updateTrend, calculateTrendPercentage, getTrendDirection } from "./trend-utils.js";

// Ensure the plugin is registered before any chart is created
Chart.register(ChartDataLabels);

// Select the logout button and add an event listener
const logoutButton = document.getElementById("logout-button");
if (logoutButton) {
  logoutButton.addEventListener("click", (e) => {
    e.preventDefault();
    // Clear the user's session data
    clearSession();
    // Redirect to the login page, replacing the current history entry
    window.location.replace("/index.html");
  });
}

// Use centralized configuration
const API_URL = `${window.APP_CONFIG.getBackendUrl()}${window.APP_CONFIG.API_ENDPOINTS.REVENUE}`;

// Global chart instances and data
let revenueBarChart = null;
let revenueChart = null;
let sectionRevenueChart = null;
let hospitalUnitRevenueChart = null;
let testRevenueChart = null;

let allData = [];
let allPreviousData = [];

// Aggregated data for charts
let aggregatedRevenueByDate = {};
let aggregatedRevenueBySection = {};
let aggregatedRevenueByUnit = {};
let aggregatedRevenueByTest = {};
let aggregatedCountByTest = {};

// Monthly targets
const DEFAULT_MONTHLY_TARGET = 1_500_000_000;
const monthlyTargets = {
  "2025-01": 1_550_000_000,
  "2025-02": 1_400_000_000,
  "2025-03": 1_650_000_000,
  "2025-04": 1_500_000_000,
  "2025-05": 1_600_000_000,
  "2025-06": 1_750_000_000,
  "2025-07": 1_600_000_000,
  "2025-08": 1_500_000_000,
  "2025-09": 1_500_000_000,
  "2025-10": 1_500_000_000,
  "2025-11": 1_500_000_000,
  "2025-12": 1_500_000_000,
};

// Helper function
function capitalizeWords(str) {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

// Loading Spinner Functions
function showLoadingSpinner() {
  const loadingOverlay = document.getElementById("loadingOverlay");
  if (loadingOverlay) loadingOverlay.style.display = "flex";
}

function hideLoadingSpinner() {
  const loadingOverlay = document.getElementById("loadingOverlay");
  if (loadingOverlay) loadingOverlay.style.display = "none";
}

/**
 * Fetches and processes data from the API based on the date range.
 * @param {string} startDate The start date for the data query.
 * @param {string} endDate The end date for the data query.
 */
async function fetchData(startDate, endDate) {
  try {
    const token = getToken();
    if (!token) {
      console.error("No token found. Redirecting to login.");
      return null;
    }

    // USE ENHANCED safeFetch WITH RETRY LOGIC
    const response = await safeFetch(
      `${API_URL}?start_date=${startDate}&end_date=${endDate}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      1 // 1 retry for revenue data
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // DIRECTLY PARSE JSON - NO handleResponse NEEDED
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch revenue data:", error);
    // Don't redirect here - let safeFetch handle authentication errors
    return null;
  }
}

/**
 * Main function to process the data, calculate KPIs, and render charts.
 */
function processData() {
  console.log("Starting data processing. Applying filters...");

  const initialDataCount = allData.length;
  console.log(`Initial data loaded: ${initialDataCount} records.`);

  // Apply all filters from the dashboard to CURRENT data only
  const filteredData = applyRevenueFilters(allData, {
    startDateStr: document.getElementById("startDateFilter")?.value,
    endDateStr: document.getElementById("endDateFilter")?.value,
    period: document.getElementById("periodSelect")?.value,
    labSection: document.getElementById("labSectionFilter")?.value,
    shift: document.getElementById("shiftFilter")?.value,
    hospitalUnit: document.getElementById("hospitalUnitFilter")?.value,
  });

  // For previous data, only filter by date range, not by other filters
  const filteredPreviousData = applyRevenueFilters(allPreviousData, {
    startDateStr: previousStartDate,
    endDateStr: previousEndDate,
    period: null, // Don't apply period filter
    labSection: "all", // Don't apply lab section filter
    shift: "all", // Don't apply shift filter
    hospitalUnit: "all", // Don't apply hospital unit filter
  });

  console.log(
    `Filtering complete. Current data: ${filteredData.length} records, Previous data: ${filteredPreviousData.length} records.`
  );

  // Perform all data aggregations
  getAggregatedData(filteredData);

  // Update KPIs and charts
  updateTotalRevenue(filteredData);
  updateKPIs(filteredData, filteredPreviousData);
  updateAllCharts();
}

/**
 * Performs all necessary data aggregations on filteredData once.
 * Stores results in global aggregated variables.
 */
function getAggregatedData(filteredData) {
  console.log("Starting data aggregation...");

  // Reset aggregated data
  aggregatedRevenueByDate = {};
  aggregatedRevenueBySection = {};
  aggregatedRevenueByUnit = {};
  aggregatedRevenueByTest = {};
  aggregatedCountByTest = {};

  filteredData.forEach((row) => {
    // Daily Revenue aggregation - use parsedEncounterDate
    const dateToUse = row.parsedEncounterDate;
    if (dateToUse && moment.isMoment(dateToUse) && dateToUse.isValid()) {
      const dateLabel = dateToUse.format("YYYY-MM-DD");
      aggregatedRevenueByDate[dateLabel] =
        (aggregatedRevenueByDate[dateLabel] || 0) + row.parsedPrice;
    }

    // Revenue by Lab Section aggregation - use 'LabSection'
    const section = row.LabSection || "Unknown";
    aggregatedRevenueBySection[section] =
      (aggregatedRevenueBySection[section] || 0) + row.parsedPrice;

    // Revenue by Hospital Unit aggregation - use 'Hospital_Unit'
    const unit = row.Hospital_Unit || "UNKNOWN";
    aggregatedRevenueByUnit[unit] =
      (aggregatedRevenueByUnit[unit] || 0) + row.parsedPrice;

    // Revenue by Test aggregation - FIXED: Use row.test_name or appropriate field
    const test_name = row.test_name || row.Test_Name || "Unknown Test"; // Choose the correct field name
    aggregatedRevenueByTest[test_name] =
      (aggregatedRevenueByTest[test_name] || 0) + row.parsedPrice;

    // Test Volume aggregation
    aggregatedCountByTest[test_name] =
      (aggregatedCountByTest[test_name] || 0) + 1;
  });

  console.log("Data aggregation complete.");
}

/**
 * Updates the total revenue display and the small progress bar chart.
 */
function updateTotalRevenue(filteredData) {
  const total = filteredData.reduce((sum, row) => sum + row.parsedPrice, 0);

  const startDateInput = document.getElementById("startDateFilter")?.value;
  const endDateInput = document.getElementById("endDateFilter")?.value;
  const periodSelect = document.getElementById("periodSelect")?.value;

  const getMonthlyTarget = (year, month) => {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    return monthlyTargets[key] || DEFAULT_MONTHLY_TARGET;
  };

  // Determine dynamic target based on selected period or date range
  let dynamicTarget = DEFAULT_MONTHLY_TARGET;
  let targetCalculationSuccessful = false;

  if (startDateInput && endDateInput) {
    const startMoment = moment(startDateInput);
    const endMoment = moment(endDateInput);

    if (startMoment.isValid() && endMoment.isValid()) {
      const daysDiff = endMoment.diff(startMoment, "days") + 1;
      if (daysDiff > 0) {
        // Calculate target based on the number of days in the selected range
        let totalTargetForRange = 0;
        let currentDay = startMoment.clone();
        while (currentDay.isSameOrBefore(endMoment, "day")) {
          const monthTarget = getMonthlyTarget(
            currentDay.year(),
            currentDay.month() + 1
          );
          const daysInMonth = currentDay.daysInMonth();
          totalTargetForRange += monthTarget / daysInMonth;
          currentDay.add(1, "day");
        }
        dynamicTarget = totalTargetForRange;
        targetCalculationSuccessful = true;
      }
    }
  } else if (periodSelect) {
    const now = moment();
    switch (periodSelect) {
      case "thisMonth":
        dynamicTarget = getMonthlyTarget(now.year(), now.month() + 1);
        targetCalculationSuccessful = true;
        break;
      case "lastMonth":
        const lastMonthMoment = now.clone().subtract(1, "month");
        dynamicTarget = getMonthlyTarget(
          lastMonthMoment.year(),
          lastMonthMoment.month() + 1
        );
        targetCalculationSuccessful = true;
        break;
      case "thisQuarter":
        dynamicTarget = 0;
        for (let i = 0; i < 3; i++) {
          const monthInQuarter = now
            .clone()
            .startOf("quarter")
            .add(i, "months");
          dynamicTarget += getMonthlyTarget(
            monthInQuarter.year(),
            monthInQuarter.month() + 1
          );
        }
        targetCalculationSuccessful = true;
        break;
      case "lastQuarter":
        dynamicTarget = 0;
        const lastQuarterMoment = now.clone().subtract(1, "quarter");
        for (let i = 0; i < 3; i++) {
          const monthInLastQuarter = lastQuarterMoment
            .clone()
            .startOf("quarter")
            .add(i, "months");
          dynamicTarget += getMonthlyTarget(
            monthInLastQuarter.year(),
            monthInLastQuarter.month() + 1
          );
        }
        targetCalculationSuccessful = true;
        break;
    }
  }

  // If no specific date range or period target could be calculated, use a default monthly target
  if (!targetCalculationSuccessful) {
    dynamicTarget = DEFAULT_MONTHLY_TARGET;
    console.warn(
      "Could not determine specific target for selected period/dates, using default monthly target."
    );
  }

  const percentage = (total / dynamicTarget) * 100;

  const percentageValueElement = document.getElementById("percentageValue");
  const currentAmountElement = document.getElementById("currentAmount");
  const targetElement = document.querySelector(".target");

  if (percentageValueElement) {
    percentageValueElement.textContent = `${percentage.toFixed(2)}%`;
  }
  if (currentAmountElement) {
    currentAmountElement.textContent = `UGX ${total.toLocaleString()}`;
  }
  if (targetElement) {
    targetElement.textContent = `of UGX ${dynamicTarget.toLocaleString()}`;
  }

  // Update the revenue bar chart
  if (revenueBarChart) {
    revenueBarChart.data.datasets[0].data = [percentage];
    revenueBarChart.update();
  } else {
    const ctx = document.getElementById("revenueBarChart").getContext("2d");
    revenueBarChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [""],
        datasets: [
          {
            label: "Revenue",
            data: [percentage],
            backgroundColor: "#deab5f",
            borderRadius: 5,
            barPercentage: 1.0,
            categoryPercentage: 1.0,
            borderColor: "#6b7280",
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "y",
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          datalabels: {
            display: false,
          },
        },
        scales: {
          x: {
            display: false,
            max: 100,
          },
          y: {
            display: false,
          },
        },
      },
    });
  }
}

/**
 * Updates the Key Performance Indicators (KPIs) displayed on the dashboard.
 * @param {Array} filteredData The filtered data for the current period.
 * @param {Array} filteredPreviousData The filtered data for the previous period.
 */
function updateKPIs(filteredData, filteredPreviousData) {
  console.log("Current period data count:", filteredData.length);
  console.log("Previous period data count:", filteredPreviousData.length);

  const totalRevenue = filteredData.reduce(
    (sum, row) => sum + row.parsedPrice,
    0
  );
  const totalTests = filteredData.length;
  console.log("Current total revenue:", totalRevenue);

  const previousTotalRevenue = filteredPreviousData.reduce(
    (sum, row) => sum + row.parsedPrice,
    0
  );
  console.log("Previous total revenue:", previousTotalRevenue);

  const uniqueDates = new Set(
    filteredData
      .map((row) => row.parsedEncounterDate?.format("YYYY-MM-DD"))
      .filter(Boolean)
  );
  const numberOfDays = uniqueDates.size || 1;

  const avgDailyRevenue = totalRevenue / numberOfDays;
  const avgDailyTests = totalTests / numberOfDays;

  // Previous period calculations
  const previousTotalTests = filteredPreviousData.length;

  const previousUniqueDates = new Set(
    filteredPreviousData
      .map((row) => row.parsedEncounterDate?.format("YYYY-MM-DD"))
      .filter(Boolean)
  );
  const previousNumberOfDays = previousUniqueDates.size || 1;
  const previousAvgDailyRevenue = previousTotalRevenue / previousNumberOfDays;
  const previousAvgDailyTests = previousTotalTests / previousNumberOfDays;

  // Use centralized trend calculations
  const revenueGrowthRatePercentage = calculateTrendPercentage(totalRevenue, previousTotalRevenue);
  const avgDailyRevenuePercentageChange = calculateTrendPercentage(avgDailyRevenue, previousAvgDailyRevenue);
  const totalTestsPercentageChange = calculateTrendPercentage(totalTests, previousTotalTests);
  const avgDailyTestsPercentageChange = calculateTrendPercentage(avgDailyTests, previousAvgDailyTests);

  // Money value for revenue growth rate
  const revenueGrowthRateMoneyValue = totalRevenue - previousTotalRevenue;

  // Update main KPI displays
  document.getElementById(
    "avgDailyRevenue"
  ).textContent = `UGX ${avgDailyRevenue.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

  document.getElementById(
    "revenueGrowthRate"
  ).textContent = `${revenueGrowthRatePercentage.toFixed(2)}%`;

  // Update trend indicators using centralized function
  updateTrend("avgDailyRevenueTrend", avgDailyRevenuePercentageChange, getTrendDirection('revenue'));
  updateTrend("revenueGrowthRateTrend", revenueGrowthRatePercentage, getTrendDirection('revenue'));
}

// Consolidate chart rendering calls
function updateAllCharts() {
  renderChart();
  renderSectionRevenueChart();
  renderHospitalUnitRevenueChart();
  renderTestRevenueChart(); // ADD THIS LINE
}

/**
 * Renders the Revenue by Lab Section Chart (Doughnut Chart).
 */
function renderSectionRevenueChart() {
  console.log("Attempting to render Revenue by Lab Section Chart...");
  const ctx = document.getElementById("sectionRevenueChart");
  if (!ctx) {
    console.warn("Canvas for sectionRevenueChart not found.");
    return;
  }

  const sections = Object.keys(aggregatedRevenueBySection);
  const revenues = sections.map(
    (section) => aggregatedRevenueBySection[section]
  );

  const totalRevenueAllSections = revenues.reduce(
    (sum, current) => sum + current,
    0
  );

  // Labels should be capitalized
  const chartLabels = sections.map((section) => capitalizeWords(section));
  const chartData = revenues;

  const data = {
    labels: chartLabels,
    datasets: [
      {
        data: chartData,
        backgroundColor: [
          "#21336a",
          "#4CAF50",
          "#795548",
          "#9C27B0",
          "rgb(250, 39, 11)",
          "#00BCD4",
          "#607D8B",
          "#deab5f",
          "#E91E63",
          "#FFC107",
        ],
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          boxWidth: 20,
          padding: 10,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed !== null) {
              const value = context.parsed;
              const percentage =
                totalRevenueAllSections > 0
                  ? (value / totalRevenueAllSections) * 100
                  : 0;
              label += `UGX ${value.toLocaleString()} (${percentage.toFixed(
                2
              )}%)`;
            }
            return label;
          },
        },
      },
      datalabels: {
        formatter: (value, context) => {
          const percentage =
            totalRevenueAllSections > 0
              ? (value / totalRevenueAllSections) * 100
              : 0;
          return percentage > 0 ? `${percentage.toFixed(1)}%` : "";
        },
        color: "#fff",
        font: {
          weight: "bold",
          size: 12,
        },
        display: "auto",
      },
    },
    cutout: "60%",
  };

  if (sectionRevenueChart) {
    sectionRevenueChart.data = data;
    sectionRevenueChart.options = options;
    sectionRevenueChart.update();
  } else {
    sectionRevenueChart = new Chart(ctx, {
      type: "doughnut",
      data: data,
      options: options,
    });
  }
  console.log("Revenue by Lab Section Chart rendered.");
}

/**
 * Renders or updates the Daily Revenue chart.
 */
function renderChart() {
  const canvas = document.getElementById("revenueChart");
  if (!canvas) {
    console.warn("revenueChart canvas not found. Cannot render chart.");
    return;
  }
  const ctx = canvas.getContext("2d");

  let labels = Object.keys(aggregatedRevenueByDate).sort();
  // Limit to max 31 columns (last 31 days) for daily chart visibility
  if (labels.length > 31) {
    labels = labels.slice(-31);
  }
  const data = labels.map((date) => aggregatedRevenueByDate[date]);

  if (revenueChart) {
    revenueChart.data.labels = labels;
    revenueChart.data.datasets[0].data = data;
    revenueChart.update();
  } else {
    revenueChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Revenue (UGX)",
            data,
            backgroundColor: "#21336a",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.parsed.y;
                return `UGX ${value.toLocaleString()}`;
              },
            },
          },
          legend: { display: false },
          datalabels: {
            display: false,
          },
        },
        scales: {
          y: {
            ticks: {
              callback: function (value) {
                return `UGX ${value.toLocaleString()}`;
              },
            },
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45,
            },
          },
        },
      },
    });
  }
  console.log("Daily Revenue Chart updated/rendered.");
}

/**
 * Renders or updates the Revenue by Hospital Unit chart.
 */
function renderHospitalUnitRevenueChart() {
  const canvas = document.getElementById("hospitalUnitRevenueChart");
  if (!canvas) {
    console.warn(
      "hospitalUnitRevenueChart canvas not found. Cannot render chart."
    );
    return;
  }
  const ctx = canvas.getContext("2d");

  const sorted = Object.entries(aggregatedRevenueByUnit).sort(
    (a, b) => b[1] - a[1]
  );

  const labels = sorted.map(([unit]) => unit);
  const data = sorted.map(([_, val]) => val);

  if (hospitalUnitRevenueChart) {
    hospitalUnitRevenueChart.data.labels = labels;
    hospitalUnitRevenueChart.data.datasets[0].data = data;
    hospitalUnitRevenueChart.update();
  } else {
    hospitalUnitRevenueChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Revenue by Hospital Unit (UGX)",
            data,
            fill: true,
            borderColor: "#21336a",
            backgroundColor: "rgba(33, 51, 106, 0.2)",
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: "#21336a",
            pointBorderColor: "#fff",
            pointBorderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            ticks: {
              callback: (value) => `UGX ${value.toLocaleString()}`,
            },
          },
        },
        plugins: {
          datalabels: {
            display: false,
          },
        },
      },
    });
  }
  console.log("Hospital Unit Revenue Chart updated/rendered.");
}

/**
 * Renders or updates the Revenue by Test chart.
 */
function renderTestRevenueChart() {
  const canvas = document.getElementById("testRevenueChart");
  if (!canvas) {
    console.warn("testRevenueChart canvas not found. Cannot render chart.");
    return;
  }
  const ctx = canvas.getContext("2d");

  const sorted = Object.entries(aggregatedRevenueByTest)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const labels = sorted.map(([test]) => test);
  const data = sorted.map(([_, value]) => value);

  const total = data.reduce((a, b) => a + b, 0);
  const percentageLabels = data.map((val) =>
    total > 0 ? `${((val / total) * 100).toFixed(0)}%` : "0%"
  );

  if (testRevenueChart) {
    testRevenueChart.data.labels = labels;
    testRevenueChart.data.datasets[0].data = data;
    testRevenueChart.data.datasets[0].datalabels.formatter = (
      value,
      context
    ) => {
      return percentageLabels[context.dataIndex];
    };
    testRevenueChart.update();
  } else {
    testRevenueChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Revenue by Test (UGX)",
            data,
            backgroundColor: "#21336a",
            datalabels: {
              anchor: "start",
              align: "end",
              color: "#4CAF50",
              font: {
                weight: "bold",
                size: 10,
              },
              formatter: (value, context) =>
                percentageLabels[context.dataIndex],
            },
          },
        ],
      },
      options: {
        responsive: true,
        indexAxis: "y",
        maintainAspectRatio: true,
        scales: {
          x: {
            position: "top",
            beginAtZero: true,
            ticks: {
              callback: (value) => `UGX ${value.toLocaleString()}`,
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `UGX ${context.parsed.x.toLocaleString()}`,
            },
          },
          datalabels: {
            display: true,
          },
        },
      },
      plugins: [ChartDataLabels],
    });
  }
  console.log("Test Revenue Chart updated/rendered.");
}

let previousStartDate = null;
let previousEndDate = null;

/**
 * Initializes the dashboard by fetching data for the current and previous periods.
 */
async function initDashboard() {
  try {
    console.log("Initializing dashboard...");
    showLoadingSpinner();

    // Get the current date range from the filters
    const startDate = document.getElementById("startDateFilter").value;
    const endDate = document.getElementById("endDateFilter").value;
    console.log(`Fetching data for current period: ${startDate} to ${endDate}`);

    // Determine the previous period
    const startMoment = moment(startDate);
    const endMoment = moment(endDate);
    const periodDuration = endMoment.diff(startMoment, "days") + 1;

    // Calculate previous period by moving the entire range back by the period duration
    previousStartDate = moment(startDate)
      .subtract(periodDuration, "days")
      .format("YYYY-MM-DD");
    previousEndDate = moment(endDate)
      .subtract(periodDuration, "days")
      .format("YYYY-MM-DD");

    console.log(`Previous period: ${previousStartDate} to ${previousEndDate}`);
    console.log(`Days in period: ${periodDuration}`); // FIXED: Changed daysInPeriod to periodDuration

    // Fetch data for both periods concurrently
    const [currentData, previousData] = await Promise.all([
      fetchData(startDate, endDate),
      fetchData(previousStartDate, previousEndDate),
    ]);

    console.log("Current data count:", currentData ? currentData.length : 0);
    console.log("Previous data count:", previousData ? previousData.length : 0);

    if (currentData && previousData) {
      // Parse dates and prices for both datasets and store them globally
      allData = currentData.map((row) => ({
        ...row,
        parsedEncounterDate: moment.utc(row.EncounterDate, "YYYY-MM-DD"),
        parsedPrice: parseFloat(row.Price) || 0,
      }));

      allPreviousData = previousData.map((row) => ({
        ...row,
        parsedEncounterDate: moment.utc(row.EncounterDate, "YYYY-MM-DD"),
        parsedPrice: parseFloat(row.Price) || 0,
      }));

      console.log("Parsed current data count:", allData.length);
      console.log("Parsed previous data count:", allPreviousData.length);

      // Only populate filters if they haven't been populated yet
      if (document.getElementById("labSectionFilter").options.length <= 1) {
        populateLabSectionFilter("labSectionFilter");
        populateShiftFilter(allData);
        populateHospitalUnitFilter(allData);
      }

      // Perform the initial render
      processData();
      console.log("Dashboard initialization successful.");
    } else {
      console.error("Failed to fetch data for one or both periods");
      if (!currentData) console.error("Current data fetch failed");
      if (!previousData) console.error("Previous data fetch failed");
    }
  } catch (error) {
    console.error("Failed to initialize dashboard:", error);
  } finally {
    hideLoadingSpinner();
  }
}

// DOM Content Loaded - Initialize everything
document.addEventListener("DOMContentLoaded", () => {
  console.log("Revenue Dashboard initializing...");

  // Set default period to 'thisMonth' and update date inputs
  const periodSelect = document.getElementById("periodSelect");
  if (periodSelect) {
    periodSelect.value = "thisMonth";
    updateDatesForPeriod("thisMonth");
  }

  // Pass initDashboard as the callback
  initCommonDashboard(initDashboard);

  // Also call the function directly to kick off the first load
  initDashboard();
});

// reception.js
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