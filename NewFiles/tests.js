// tests.js - Database-Powered Version (with same functionality)

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
let topTestsChart = null;
let testCountChart = null;

let previousStartDate = null;
let previousEndDate = null;

let allTestData = [];
let allPreviousTestData = [];

// Aggregated data for charts
let aggregatedTestCountByUnit = {};
let aggregatedCountByTest = {};

// Define the units for the "Select Hospital Unit" chart dropdown
const chartHospitalUnits = [
  "APU",
  "GW A",
  "GW B",
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
  "WELLNESS CENTER",
  "ANNEX",
];

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
      1 // 1 retry for tests data
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // DIRECTLY PARSE JSON - NO handleResponse NEEDED
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch tests data:", error);
    // Don't redirect here - let safeFetch handle authentication errors
    return null;
  }
}

/**
 * Main function to process the data, calculate KPIs, and render charts.
 */
function processData() {
  console.log("Starting data processing. Applying filters...");

  const initialTestCount = allTestData.length;
  console.log(`Initial data loaded: ${initialTestCount} records.`);

  // Apply all filters from the dashboard to CURRENT data only
  const filteredData = applyRevenueFilters(allTestData, {
    startDateStr: document.getElementById("startDateFilter")?.value,
    endDateStr: document.getElementById("endDateFilter")?.value,
    period: document.getElementById("periodSelect")?.value,
    labSection: document.getElementById("labSectionFilter")?.value,
    shift: document.getElementById("shiftFilter")?.value,
    hospitalUnit: document.getElementById("hospitalUnitFilter")?.value,
  });

  // For previous data, only filter by date range, not by other filters
  const filteredPreviousData = applyRevenueFilters(allPreviousTestData, {
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
  aggregatedTestCountByUnit = {};
  aggregatedCountByTest = {};

  filteredData.forEach((row) => {
    // Aggregation for Top Tests Chart
    const unit = row.Hospital_Unit || "Unknown";
    const testName = row.test_name || row.Test_Name || "Unknown Test";

    if (!aggregatedTestCountByUnit[unit]) {
      aggregatedTestCountByUnit[unit] = {};
    }
    aggregatedTestCountByUnit[unit][testName] =
      (aggregatedTestCountByUnit[unit][testName] || 0) + 1;

    // Aggregation for Test Volume Chart
    aggregatedCountByTest[testName] =
      (aggregatedCountByTest[testName] || 0) + 1;
  });

  console.log("Data aggregation complete.");
}

/**
 * Updates the Key Performance Indicators (KPIs) displayed on the dashboard.
 * @param {Array} filteredData The filtered data for the current period.
 * @param {Array} filteredPreviousData The filtered data for the previous period.
 */
function updateKPIs(filteredData, filteredPreviousData) {
  console.log("Current period data count:", filteredData.length);
  console.log("Previous period data count:", filteredPreviousData.length);

  const totalTests = filteredData.length;
  const previousTotalTests = filteredPreviousData.length;

  // Calculate average daily tests for the current period
  const uniqueDates = new Set(
    filteredData
      .map((row) => row.parsedEncounterDate?.format("YYYY-MM-DD"))
      .filter(Boolean)
  );
  const numberOfDays = uniqueDates.size || 1;
  const avgDailyTests = totalTests / numberOfDays;

  // Calculate average daily tests for the previous period
  const previousUniqueDates = new Set(
    filteredPreviousData
      .map((row) => row.parsedEncounterDate?.format("YYYY-MM-DD"))
      .filter(Boolean)
  );
  const previousNumberOfDays = previousUniqueDates.size || 1;
  const previousAvgDailyTests = previousTotalTests / previousNumberOfDays;

  // Use centralized trend calculations
  const totalTestsTrend = calculateTrendPercentage(totalTests, previousTotalTests);
  const avgDailyTestsTrend = calculateTrendPercentage(avgDailyTests, previousAvgDailyTests);

  // Update main KPI displays
  document.getElementById("avgDailyTestsPerformed").textContent =
    avgDailyTests.toFixed(0);
  document.getElementById("totalTestsPerformed").textContent =
    totalTests.toLocaleString();

  // Update trend indicators using centralized function
  updateTrend("avgDailyTestsPerformedTrend", avgDailyTestsTrend, getTrendDirection('tests'));
  updateTrend("totalTestsPerformedTrend", totalTestsTrend, getTrendDirection('tests'));
}

// Consolidate chart rendering calls
function updateAllCharts() {
  const selectedUnit = document.getElementById("unitSelect")?.value || "A&E";
  renderTopTestsChart(selectedUnit);
  renderTestCountChart();
}

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
    console.log(`Days in period: ${periodDuration}`);

    // Fetch data for both periods concurrently
    const [currentData, previousData] = await Promise.all([
      fetchData(startDate, endDate),
      fetchData(previousStartDate, previousEndDate),
    ]);

    console.log("Current data count:", currentData ? currentData.length : 0);
    console.log("Previous data count:", previousData ? previousData.length : 0);

    if (currentData && previousData) {
      // Parse dates for both datasets and store them globally
      allTestData = currentData.map((row) => ({
        ...row,
        parsedEncounterDate: moment.utc(row.EncounterDate, "YYYY-MM-DD"),
      }));

      allPreviousTestData = previousData.map((row) => ({
        ...row,
        parsedEncounterDate: moment.utc(row.EncounterDate, "YYYY-MM-DD"),
      }));

      console.log("Parsed current data count:", allTestData.length);
      console.log("Parsed previous data count:", allPreviousTestData.length);

      // Only populate filters if they haven't been populated yet
      if (document.getElementById("labSectionFilter").options.length <= 1) {
        populateLabSectionFilter("labSectionFilter");
        populateShiftFilter(allTestData);
        populateHospitalUnitFilter(allTestData);
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

/**
 * Renders or updates the Top Tests chart for a specific hospital unit.
 * @param {string} unit The hospital unit to filter by.
 */
function renderTopTestsChart(unit = "A&E") {
  console.log(`Rendering Top Tests Chart for unit: ${unit}`);
  const canvas = document.getElementById("topTestsChart");
  if (!canvas) {
    console.warn("topTestsChart canvas not found. Cannot render chart.");
    return;
  }
  const ctx = canvas.getContext("2d");

  // Use the aggregatedTestCountByUnit that stores counts per unit
  const testCountForUnit = aggregatedTestCountByUnit[unit] || {};

  const sorted = Object.entries(testCountForUnit)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const labels = sorted.map(([test]) => test);
  const data = sorted.map(([, count]) => count);

  const total = data.reduce((a, b) => a + b, 0);
  const percentageLabels = data.map((val) =>
    total > 0 ? `${((val / total) * 100).toFixed(0)}%` : "0%"
  );

  if (topTestsChart) {
    topTestsChart.data.labels = labels;
    topTestsChart.data.datasets[0].data = data;
    topTestsChart.data.datasets[0].label = `Top Tests in ${unit}`;
    topTestsChart.data.datasets[0].datalabels.formatter = (value, context) => {
      return percentageLabels[context.dataIndex];
    };
    topTestsChart.update();
  } else {
    topTestsChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: `Top Tests in ${unit}`,
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
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.x.toLocaleString()} tests`,
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
  console.log(`Top Tests Chart for unit ${unit} updated/rendered.`);
}

/**
 * Renders or updates the Test Volume chart.
 */
function renderTestCountChart() {
  console.log("Rendering Test Count Chart.");
  const canvas = document.getElementById("testCountChart");
  if (!canvas) {
    console.warn("testCountChart canvas not found. Cannot render chart.");
    return;
  }
  const ctx = canvas.getContext("2d");

  const sorted = Object.entries(aggregatedCountByTest)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const labels = sorted.map(([test]) => test);
  const data = sorted.map(([, count]) => count);

  if (testCountChart) {
    testCountChart.data.labels = labels;
    testCountChart.data.datasets[0].data = data;
    testCountChart.data.datasets[0].datalabels.formatter = (value) => {
      return value.toLocaleString();
    };
    testCountChart.update();
  } else {
    testCountChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Test Count",
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
              formatter: (value) => value.toLocaleString(),
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
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.x.toLocaleString()} tests`,
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
  console.log("Test Count Chart updated/rendered.");
}

/**
 * Populates the hospital unit dropdown for the charts.
 */
function populateChartUnitSelect() {
  const unitSelect = document.getElementById("unitSelect");
  if (!unitSelect) return;

  unitSelect.innerHTML = ""; // Clear existing options

  chartHospitalUnits.forEach((unit) => {
    const option = document.createElement("option");
    option.value = unit;
    option.textContent = unit;
    unitSelect.appendChild(option);
  });

  // Set the selected index to 'A&E'
  const aAndEOption = unitSelect.querySelector('option[value="A&E"]');
  if (aAndEOption) {
    aAndEOption.selected = true;
  }
}

// DOM Content Loaded - Initialize everything
document.addEventListener("DOMContentLoaded", () => {
  console.log("Tests Dashboard initializing...");

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

  // Populate the hospital unit select for the charts
  populateChartUnitSelect();

  // Add event listener for unit select change
  const unitSelect = document.getElementById("unitSelect");
  if (unitSelect) {
    unitSelect.addEventListener("change", () => {
      const selectedUnit = unitSelect.value;
      renderTopTestsChart(selectedUnit);
    });
  }
});