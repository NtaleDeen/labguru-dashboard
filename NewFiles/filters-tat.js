// filters-tat.js - Updated with delayed date fetching

// Unit definitions
export const inpatientUnits = [
  "APU", "GWA", "GWB", "HDU", "ICU", "MAT", "NICU", "THEATRE",
];
export const outpatientUnits = [
  "2ND FLOOR", "A&E", "DIALYSIS", "DOCTORS PLAZA", "ENT", "RADIOLOGY",
  "SELF REQUEST", "WELLNESS", "WELLNESS CENTER",
];
export const annexUnits = ["ANNEX"];

export function parseTATDate(dateStr) {
  if (!dateStr) return null;
  const formats = [
    "M/D/YY", "M/DD/YYYY", "YYYY-MM-DD", "DD-MM-YYYY",
    "M/D/YYYY h:mm A", "M/D/YY h:mm A", "M/D/YYYY H:mm", "M/D/YY H:mm",
    "YYYY-MM-DD HH:mm:ss.SSS", "ddd, DD MMM YYYY HH:mm:ss [GMT]",
  ];
  return window.moment(dateStr, formats, true);
}

/**
 * Check if both dates are set for fetching
 */
export function areBothDatesSet() {
  const startDateInput = document.getElementById("startDateFilter");
  const endDateInput = document.getElementById("endDateFilter");
  
  return startDateInput?.value && endDateInput?.value;
}

// UPDATED: Now accepts custom filter parameters like revenue filters
export function applyTATFilters(allData, customFilters = null) {
  // Use custom filters if provided, otherwise get from DOM
  const filters = customFilters || getCurrentFilters();
  
  const selectedShift = filters.shift || "all";
  const selectedHospitalUnit = filters.hospitalUnit || "all";
  const startDateStr = filters.startDateStr;
  const endDateStr = filters.endDateStr;
  
  const startDate = startDateStr ? window.moment(startDateStr) : null;
  const endDate = endDateStr ? window.moment(endDateStr).endOf('day') : null;

  const filteredData = allData.filter((row) => {
    // Check if the date is within the selected range
    const rowDate = parseTATDate(row.date);
    
    if (startDate && rowDate && rowDate.isBefore(startDate)) {
        return false;
    }
    if (endDate && rowDate && rowDate.isAfter(endDate)) {
        return false;
    }
    
    // Existing shift and unit filters
    if (selectedShift !== "all" && row.Shift?.toLowerCase() !== selectedShift) {
      return false;
    }

    if (selectedHospitalUnit !== "all") {
      const unit = row.Hospital_Unit?.toUpperCase();
      const isMainLab = [...inpatientUnits, ...outpatientUnits].includes(unit);
      const isAnnex = annexUnits.includes(unit);

      if (selectedHospitalUnit === "mainLab" && !isMainLab) {
        return false;
      }
      if (selectedHospitalUnit === "annex" && !isAnnex) {
        return false;
      }
      if (selectedHospitalUnit !== "mainLab" && selectedHospitalUnit !== "annex" && unit !== selectedHospitalUnit) {
          return false;
      }
    }
    return true;
  });

  console.log(`[filters-tat.js] Final Filtered Data Length: ${filteredData.length}`);
  return filteredData;
}

// Helper function to get current filter values from DOM
function getCurrentFilters() {
  const shiftFilter = document.getElementById("shiftFilter");
  const hospitalUnitFilter = document.getElementById("hospitalUnitFilter");
  const startDateInput = document.getElementById("startDateFilter");
  const endDateInput = document.getElementById("endDateFilter");

  return {
    shift: shiftFilter?.value || "all",
    hospitalUnit: hospitalUnitFilter?.value || "all",
    startDateStr: startDateInput?.value || null,
    endDateStr: endDateInput?.value || null
  };
}

// UPDATED: Initialize dashboard with delayed date fetching
export function initCommonDashboard(callback) {
  setupDateRangeControls(callback);
  initializeFilterListeners(callback);
  if (callback) callback();
}

// UPDATED: Setup date range controls with delayed fetching
function setupDateRangeControls(callback) {
  const startDateInput = document.getElementById("startDateFilter");
  const endDateInput = document.getElementById("endDateFilter");

  if (!startDateInput || !endDateInput) {
    console.warn("Date filter inputs not found.");
    return;
  }

  endDateInput.disabled = true;

  startDateInput.addEventListener("change", () => {
    if (startDateInput.value) {
      endDateInput.disabled = false;
      endDateInput.min = startDateInput.value;
      if (endDateInput.value && endDateInput.value < startDateInput.value) {
        endDateInput.value = "";
      }
      document.getElementById("periodSelect").value = "custom";
      
      // Don't trigger data fetch here - wait for both dates
    } else {
      endDateInput.disabled = true;
      endDateInput.value = "";
    }
  });

  // Only trigger when both dates are set
  endDateInput.addEventListener("change", () => {
    if (startDateInput.value && endDateInput.value && callback) {
      console.log("📅 Both dates set, triggering data fetch");
      callback();
    }
  });
}

// UPDATED: Initialize filter listeners with delayed date fetching
function initializeFilterListeners(callback) {
  const debounceDelay = 300;
  let debounceTimer;

  const handleFilterChange = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (callback) callback();
    }, debounceDelay);
  };

  const periodSelect = document.getElementById("periodSelect");
  if (periodSelect) {
    periodSelect.addEventListener("change", (e) => {
      if (e.target.value !== "custom") {
        updateDatesForPeriod(e.target.value);
      }
      // Period changes always trigger immediately (they set both dates)
      handleFilterChange();
    });
  }

  // Other filters (shift, hospital unit) - always trigger immediately
  const immediateFilters = [
    "shiftFilter",
    "hospitalUnitFilter",
  ];

  immediateFilters.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("change", handleFilterChange);
    }
  });

  // Date filters are handled separately in setupDateRangeControls
}

// UPDATED: Update dates for period with proper end date enabling
export function updateDatesForPeriod(period) {
  const now = window.moment();
  let startDate, endDate;

  console.log(`🔄 updateDatesForPeriod called with: ${period}`);
  
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

  const startDateInput = document.getElementById("startDateFilter");
  const endDateInput = document.getElementById("endDateFilter");

  if (startDateInput) {
    startDateInput.value = startDate.format("YYYY-MM-DD");
  }
  if (endDateInput) {
    endDateInput.value = endDate.format("YYYY-MM-DD");
    endDateInput.disabled = false; // Enable end date when period sets both dates
  }

  console.log(`📅 Date range set to: ${startDateInput.value} to ${endDateInput.value}`);
}

// NEW: Function to manually trigger data processing (for reset functionality)
export function triggerDataProcessing() {
  const startDateInput = document.getElementById("startDateFilter");
  const endDateInput = document.getElementById("endDateFilter");
  
  // Only trigger if both dates are set
  if (startDateInput?.value && endDateInput?.value) {
    const event = new Event("change", { bubbles: true });
    endDateInput.dispatchEvent(event);
  }
}