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

// tat.js - FIXED VERSION with proper period handling
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

import {
  parseTATDate,
  applyTATFilters,
  initCommonDashboard,
  updateDatesForPeriod,
} from "./filters-tat.js";
import { updateTrend, calculateTrendPercentage, getTrendDirection } from "./trend-utils.js";

Chart.register(ChartDataLabels);

const logoutButton = document.getElementById("logout-button");
if (logoutButton) {
  logoutButton.addEventListener("click", (e) => {
    e.preventDefault();
    clearSession();
    window.location.replace("/index.html");
  });
}

const API_URL = `${window.APP_CONFIG.getBackendUrl()}${window.APP_CONFIG.API_ENDPOINTS.PERFORMANCE_CHARTS}`;

// Global chart instances
let tatPieChart = null;
let tatLineChart = null;
let tatHourlyLineChart = null;
let tatSummaryChart = null;
let tatOnTimeSummaryChart = null;

// Data storage
let allData = [];
let allPreviousData = [];
let currentStartDate = null;
let currentEndDate = null;
let previousStartDate = null;
let previousEndDate = null;

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
 * Fetches data from API
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
      1 // 1 retry for TAT data
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // DIRECTLY PARSE JSON - NO handleResponse NEEDED
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch TAT data:", error);
    // Don't redirect here - let safeFetch handle authentication errors
    return null;
  }
}

/**
 * Calculate previous period dates based on current period
 */
function calculatePreviousPeriod(startDate, endDate) {
  const startMoment = moment(startDate);
  const endMoment = moment(endDate);
  const periodDuration = endMoment.diff(startMoment, "days") + 1;

  return {
    previousStartDate: moment(startDate).subtract(periodDuration, "days").format("YYYY-MM-DD"),
    previousEndDate: moment(endDate).subtract(periodDuration, "days").format("YYYY-MM-DD")
  };
}

/**
 * Parse and prepare TAT data
 */
function parseTATData(data) {
  return data.map((row) => {
    let tatStatus;
    switch (row.request_delay_status) {
      case "Delayed for less than 15 minutes":
        tatStatus = "Delayed <15min";
        break;
      case "Over Delayed":
        tatStatus = "Over Delayed";
        break;
      case "Swift":
      case "On Time":
        tatStatus = "On Time";
        break;
      default:
        tatStatus = "Not Uploaded";
    }

    return {
      ...row,
      parsedDate: parseTATDate(row.date),
      timeInHour: row.time_in
        ? parseInt(row.time_in.split("T")[1]?.split(":")[0]) || null
        : null,
      tat: tatStatus,
    };
  });
}

/**
 * Main function to process data
 */
function processData() {
  console.log("Starting TAT data processing...");

  const startDate = document.getElementById("startDateFilter")?.value;
  const endDate = document.getElementById("endDateFilter")?.value;
  const currentShift = document.getElementById("shiftFilter")?.value || 'all';
  const currentHospitalUnit = document.getElementById("hospitalUnitFilter")?.value || 'all';

  // Only process if we have data for the current period
  if (allData.length === 0 || startDate !== currentStartDate) {
    console.log("No data available for current period, fetching...");
    initDashboard();
    return;
  }

  console.log(`Initial data loaded: ${allData.length} records.`);

  // Apply filters to CURRENT data
  const filteredData = applyTATFilters(allData, {
    startDateStr: startDate,
    endDateStr: endDate,
    shift: currentShift,
    hospitalUnit: currentHospitalUnit
  });

  // For previous data, only filter by date range
  const filteredPreviousData = applyTATFilters(allPreviousData, {
    startDateStr: previousStartDate,
    endDateStr: previousEndDate,
    shift: "all",
    hospitalUnit: "all"
  });

  console.log(`Filtering complete. Current: ${filteredData.length} records, Previous: ${filteredPreviousData.length} records`);

  // Update KPIs and charts
  updateKPIs(filteredData, filteredPreviousData);
  updateAllCharts(filteredData);
}

/**
 * Updates KPIs
 */
function updateKPIs(filteredData, filteredPreviousData) {
  const total = filteredData.length;
  const prevTotal = filteredPreviousData.length;
  
  const delayed = filteredData.filter(
    (r) => r.tat === "Over Delayed" || r.tat === "Delayed <15min"
  ).length;
  const onTime = filteredData.filter((r) => r.tat === "On Time").length;
  const notUploaded = filteredData.filter((r) => r.tat === "Not Uploaded").length;

  // Calculate daily averages
  const uniqueDates = new Set(
    filteredData.map((row) => row.parsedDate?.format("YYYY-MM-DD")).filter(Boolean)
  );
  const numberOfDays = uniqueDates.size || 1;

  const previousUniqueDates = new Set(
    filteredPreviousData.map((row) => row.parsedDate?.format("YYYY-MM-DD")).filter(Boolean)
  );
  const previousNumberOfDays = previousUniqueDates.size || 1;

  const avgDailyDelayedCurrent = delayed / numberOfDays;
  const avgDailyOnTimeCurrent = onTime / numberOfDays;
  const avgDailyNotUploadedCurrent = notUploaded / numberOfDays;

  const prevDelayed = filteredPreviousData.filter(
    (r) => r.tat === "Over Delayed" || r.tat === "Delayed <15min"
  ).length;
  const prevOnTime = filteredPreviousData.filter((r) => r.tat === "On Time").length;
  const prevNotUploaded = filteredPreviousData.filter((r) => r.tat === "Not Uploaded").length;

  const avgDailyDelayedPrevious = prevDelayed / previousNumberOfDays;
  const avgDailyOnTimePrevious = prevOnTime / previousNumberOfDays;
  const avgDailyNotUploadedPrevious = prevNotUploaded / previousNumberOfDays;

  // Calculate percentages for trend comparison
  const onTimePercentageCurrent = total ? (onTime / total) * 100 : 0;
  const onTimePercentagePrevious = prevTotal ? (prevOnTime / prevTotal) * 100 : 0;

  // Use centralized trend calculations
  const onTimePercentageTrend = calculateTrendPercentage(onTimePercentageCurrent, onTimePercentagePrevious);
  const avgDailyDelayedTrend = calculateTrendPercentage(avgDailyDelayedCurrent, avgDailyDelayedPrevious);
  const avgDailyNotUploadedTrend = calculateTrendPercentage(avgDailyNotUploadedCurrent, avgDailyNotUploadedPrevious);

  // Update DOM elements
  const delayedPercentageValue = document.getElementById("delayedPercentageValue");
  const totalDelayedCount = document.getElementById("totalDelayedCount");
  const totalRequestsCount = document.getElementById("totalRequestsCount");
  const onTimePercentage = document.getElementById("onTimePercentage");
  const avgDailyDelayed = document.getElementById("avgDailyDelayed");
  const avgDailyNotUploaded = document.getElementById("avgDailyNotUploaded");
  const onTimeSummaryValue = document.getElementById("onTimeSummaryValue");
  const totalOnTimeCount = document.getElementById("totalOnTimeCount");
  const totalRequestsCount_2 = document.getElementById("totalRequestsCount_2");

  if (delayedPercentageValue) {
    delayedPercentageValue.textContent = total ? `${((delayed / total) * 100).toFixed(1)}%` : "0%";
    delayedPercentageValue.style.color = "#f44336";
  }
  if (totalDelayedCount) totalDelayedCount.textContent = delayed;
  if (totalRequestsCount) totalRequestsCount.textContent = total;
  if (onTimePercentage) onTimePercentage.textContent = Math.round(avgDailyOnTimeCurrent);
  if (avgDailyDelayed) avgDailyDelayed.textContent = Math.round(avgDailyDelayedCurrent);
  if (avgDailyNotUploaded) avgDailyNotUploaded.textContent = Math.round(avgDailyNotUploadedCurrent);

  if (onTimeSummaryValue) {
    onTimeSummaryValue.textContent = total ? `${onTimePercentageCurrent.toFixed(1)}%` : "0%";
    onTimeSummaryValue.style.color = "#4caf50";
  }
  if (totalOnTimeCount) totalOnTimeCount.textContent = onTime;
  if (totalRequestsCount_2) totalRequestsCount_2.textContent = total;

  // Update trends
  updateTrend("onTimePercentageTrend", onTimePercentageTrend, 
    getTrendDirection('onTime', onTimePercentageCurrent, onTimePercentagePrevious));
  updateTrend("avgDailyDelayedTrend", avgDailyDelayedTrend, 
    getTrendDirection('delays', avgDailyDelayedCurrent, avgDailyDelayedPrevious));
  updateTrend("avgDailyNotUploadedTrend", avgDailyNotUploadedTrend, 
    getTrendDirection('notUploaded', avgDailyNotUploadedCurrent, avgDailyNotUploadedPrevious));

  // Calculate busiest day and hour
  updateBusiestMetrics(filteredData);
}

/**
 * Calculate busiest day and hour
 */
function updateBusiestMetrics(data) {
  const dailyCounts = {};
  const hourlyCounts = Array(24).fill(0);

  data.forEach((r) => {
    // Daily counts
    const day = r.parsedDate?.format("YYYY-MM-DD");
    if (day) {
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    }
    
    // Hourly counts
    if (r.timeInHour !== null && r.timeInHour >= 0 && r.timeInHour < 24) {
      hourlyCounts[r.timeInHour]++;
    }
  });

  // Find busiest day
  let busiestDay = "N/A";
  let maxDayCount = 0;
  Object.entries(dailyCounts).forEach(([date, count]) => {
    if (count > maxDayCount) {
      maxDayCount = count;
      busiestDay = `${moment(date).format("MMM DD")}<br>(${count} requests)`;
    }
  });

  // Find busiest hour
  let busiestHour = "N/A";
  const maxHourCount = Math.max(...hourlyCounts);
  if (maxHourCount > 0) {
    const hourIndex = hourlyCounts.indexOf(maxHourCount);
    busiestHour = `${hourIndex}:00<br>(${maxHourCount} samples)`;
  }

  const mostDelayedDay = document.getElementById("mostDelayedDay");
  const mostDelayedHour = document.getElementById("mostDelayedHour");
  
  if (mostDelayedDay) mostDelayedDay.innerHTML = busiestDay;
  if (mostDelayedHour) mostDelayedHour.innerHTML = busiestHour;
}

// Consolidate chart rendering calls
function updateAllCharts(filteredData) {
  renderPieChart(filteredData);
  renderLineChart(filteredData);
  renderHourlyLineChart(filteredData);
  renderSummaryChart(filteredData);
  renderOnTimeSummaryChart(filteredData);
}

/**
 * Initializes the dashboard - UPDATED to handle period changes
 */
async function initDashboard() {
  try {
    console.log("Initializing TAT dashboard...");
    showLoadingSpinner();

    // Get the current date range from the filters
    const startDate = document.getElementById("startDateFilter").value;
    const endDate = document.getElementById("endDateFilter").value;
    
    // Store current period
    currentStartDate = startDate;
    currentEndDate = endDate;
    
    console.log(`Fetching data for current period: ${startDate} to ${endDate}`);

    // Determine the previous period
    const { previousStartDate: prevStart, previousEndDate: prevEnd } = calculatePreviousPeriod(startDate, endDate);
    previousStartDate = prevStart;
    previousEndDate = prevEnd;

    console.log(`Previous period: ${previousStartDate} to ${previousEndDate}`);

    // Fetch data for both periods concurrently
    const [currentData, previousData] = await Promise.all([
      fetchData(startDate, endDate),
      fetchData(previousStartDate, previousEndDate),
    ]);

    console.log("Current data count:", currentData ? currentData.length : 0);
    console.log("Previous data count:", previousData ? previousData.length : 0);

    if (currentData && previousData) {
      // Parse data for both datasets
      allData = parseTATData(currentData);
      allPreviousData = parseTATData(previousData);

      console.log("Parsed current data count:", allData.length);
      console.log("Parsed previous data count:", allPreviousData.length);

      // Perform the initial render
      processData();
      console.log("TAT Dashboard initialization successful.");
    } else {
      console.error("Failed to fetch data for one or both periods");
    }
  } catch (error) {
    console.error("Failed to initialize dashboard:", error);
  } finally {
    hideLoadingSpinner();
  }
}

function renderSummaryChart(data) {
  const ctx = document.getElementById("tatSummaryChart")?.getContext("2d");
  if (!ctx) return;

  const delayed = data.filter(
    (r) => r.tat === "Over Delayed" || r.tat === "Delayed <15min"
  ).length;
  const total = data.length;
  const notDelayed = total - delayed;

  if (tatSummaryChart) tatSummaryChart.destroy();

  tatSummaryChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Samples"],
      datasets: [
        {
          label: "Delayed",
          data: [delayed],
          backgroundColor: "#f44336",
          borderWidth: 0,
          stack: "overall-samples",
        },
        {
          label: "Not Delayed",
          data: [notDelayed],
          backgroundColor: "#e0e0e0",
          borderWidth: 0,
          stack: "overall-samples",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      layout: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
      plugins: {
        legend: { display: false },
        datalabels: { display: false },
      },
      scales: {
        x: {
          beginAtZero: true,
          display: false,
          stack: "overall-samples",
          max: total > 0 ? total : 1,
          grid: { display: false },
        },
        y: { display: false, grid: { display: false } },
      },
    },
    plugins: [ChartDataLabels],
  });
}

function renderOnTimeSummaryChart(data) {
  const ctx = document
    .getElementById("tatOnTimeSummaryChart")
    ?.getContext("2d");
  if (!ctx) return;

  const onTime = data.filter((r) => r.tat === "On Time").length;
  const total = data.length;
  const notOnTime = total - onTime;

  if (tatOnTimeSummaryChart) tatOnTimeSummaryChart.destroy();

  tatOnTimeSummaryChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Samples"],
      datasets: [
        {
          label: "On Time",
          data: [onTime],
          backgroundColor: "#4caf50",
          borderWidth: 0,
          stack: "overall-samples",
        },
        {
          label: "Not On Time",
          data: [notOnTime],
          backgroundColor: "#e0e0e0",
          borderWidth: 0,
          stack: "overall-samples",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      layout: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
      plugins: {
        legend: { display: false },
        datalabels: { display: false },
      },
      scales: {
        x: {
          beginAtZero: true,
          display: false,
          stack: "overall-samples",
          max: total > 0 ? total : 1,
          grid: { display: false },
        },
        y: { display: false, grid: { display: false } },
      },
    },
    plugins: [ChartDataLabels],
  });
}

function renderPieChart(data) {
  const ctx = document.getElementById("tatPieChart")?.getContext("2d");
  if (!ctx) return;

  if (tatPieChart) tatPieChart.destroy();

  const statusCounts = {};
  data.forEach((item) => {
    const status = item.tat;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const labels = Object.keys(statusCounts);
  const dataValues = Object.values(statusCounts);

  const backgroundColors = labels.map((label) => {
    switch (label) {
      case "On Time":
        return "#4CAF50";
      case "Delayed <15min":
        return "#FFC107";
      case "Over Delayed":
        return "#F44336";
      case "Not Uploaded":
        return "#9E9E9E";
      default:
        return "#CCCCCC";
    }
  });

  tatPieChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: dataValues,
          backgroundColor: backgroundColors,
          borderColor: "#fff",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { boxWidth: 20, padding: 10, font: { size: 12 } },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.label || "";
              if (label) label += ": ";
              if (context.parsed !== null) {
                label += new Intl.NumberFormat("en-US").format(context.parsed);
              }
              const total = context.dataset.data.reduce(
                (sum, val) => sum + val,
                0
              );
              const percentage = ((context.parsed / total) * 100).toFixed(2);
              return label + ` (${percentage}%)`;
            },
          },
        },
        datalabels: {
          formatter: (value, context) => {
            const total = context.dataset.data.reduce(
              (sum, val) => sum + val,
              0
            );
            return ((value / total) * 100).toFixed(1) + "%";
          },
          color: "#fff",
          font: { weight: "bold", size: 12 },
        },
      },
      cutout: "60%",
    },
    plugins: [ChartDataLabels],
  });
}

function renderLineChart(data) {
  const ctx = document.getElementById("tatLineChart")?.getContext("2d");
  if (!ctx) return;

  const dailyCounts = {};
  data.forEach((r) => {
    const day = r.parsedDate?.format("YYYY-MM-DD");
    if (!day) return;
    if (!dailyCounts[day])
      dailyCounts[day] = { delayed: 0, onTime: 0, notUploaded: 0 };
    if (r.tat === "Over Delayed" || r.tat === "Delayed <15min")
      dailyCounts[day].delayed++;
    if (r.tat === "On Time") dailyCounts[day].onTime++;
    if (r.tat === "Not Uploaded") dailyCounts[day].notUploaded++;
  });

  const labels = Object.keys(dailyCounts).sort();
  const delayedData = labels.map((d) => dailyCounts[d].delayed);
  const onTimeData = labels.map((d) => dailyCounts[d].onTime);
  const notUploadedData = labels.map((d) => dailyCounts[d].notUploaded);

  if (tatLineChart) tatLineChart.destroy();

  tatLineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Delayed",
          data: delayedData,
          borderColor: "#f44336",
          backgroundColor: "#f44336",
          fill: false,
          tension: 0,
          borderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 0,
        },
        {
          label: "On Time",
          data: onTimeData,
          borderColor: "#4caf50",
          backgroundColor: "#4caf50",
          fill: false,
          tension: 0,
          borderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 0,
        },
        {
          label: "Not Uploaded",
          data: notUploadedData,
          borderColor: "#9E9E9E",
          backgroundColor: "#9E9E9E",
          fill: false,
          tension: 0,
          borderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 10 },
      plugins: {
        legend: { position: "bottom" },
        datalabels: { display: false },
      },
      scales: {
        x: {
          title: { display: true, text: "Date" },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Number of Requests" },
          grid: { color: "#e0e0e0" },
        },
      },
    },
  });
}

function renderHourlyLineChart(data) {
  const ctx = document.getElementById("tatHourlyLineChart")?.getContext("2d");
  if (!ctx) return;

  const hourlyCounts = Array(24)
    .fill()
    .map(() => ({ delayed: 0, onTime: 0, notUploaded: 0 }));

  data.forEach((r) => {
    if (r.timeInHour !== null && r.timeInHour >= 0 && r.timeInHour < 24) {
      const currentHourData = hourlyCounts[r.timeInHour];
      if (r.tat === "Over Delayed" || r.tat === "Delayed <15min") {
        currentHourData.delayed++;
      } else if (r.tat === "On Time") {
        currentHourData.onTime++;
      } else if (r.tat === "Not Uploaded") {
        currentHourData.notUploaded++;
      }
    }
  });

  const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const delayedData = hourlyCounts.map((h) => h.delayed);
  const onTimeData = hourlyCounts.map((h) => h.onTime);
  const notUploadedData = hourlyCounts.map((h) => h.notUploaded);

  if (tatHourlyLineChart) tatHourlyLineChart.destroy();

  tatHourlyLineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Delayed",
          data: delayedData,
          borderColor: "#f44336",
          backgroundColor: "#f44336",
          fill: false,
          tension: 0,
          borderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 0,
        },
        {
          label: "On Time",
          data: onTimeData,
          borderColor: "#4caf50",
          backgroundColor: "#4caf50",
          fill: false,
          tension: 0,
          borderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 0,
        },
        {
          label: "Not Uploaded",
          data: notUploadedData,
          borderColor: "#9E9E9E",
          backgroundColor: "#9E9E9E",
          fill: false,
          tension: 0,
          borderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 10 },
      plugins: {
        legend: { display: true, position: "bottom" },
        datalabels: { display: false },
      },
      scales: {
        x: {
          title: { display: true, text: "Hour of Day" },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Number of Requests" },
          grid: { color: "#e0e0e0" },
        },
      },
    },
  });
}

// DOM Content Loaded - UPDATED with period change detection
document.addEventListener("DOMContentLoaded", () => {
  console.log("TAT Dashboard initializing...");

  // Set default period to 'thisMonth' and update date inputs
  const periodSelect = document.getElementById("periodSelect");
  if (periodSelect) {
    periodSelect.value = "thisMonth";
    updateDatesForPeriod("thisMonth");
  }

  // Initialize filters with period change detection
  initCommonDashboard((changeType) => {
    const newStartDate = document.getElementById("startDateFilter").value;
    const newEndDate = document.getElementById("endDateFilter").value;
    
    // If period changed, re-fetch data
    if (newStartDate !== currentStartDate || newEndDate !== currentEndDate) {
      console.log(`Period changed to: ${newStartDate} to ${newEndDate}`);
      initDashboard();
    } else {
      // Just filter changes, use existing data
      processData();
    }
  });

  // Initial load
  initDashboard();
});

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

// numbers.js - FIXED VERSION with proper period handling
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

import {
  parseTATDate,
  applyTATFilters,
  initCommonDashboard,
  updateDatesForPeriod,
} from "./filters-tat.js";
import { updateTrend, calculateTrendPercentage, getTrendDirection } from "./trend-utils.js";

Chart.register(ChartDataLabels);

const logoutButton = document.getElementById("logout-button");
if (logoutButton) {
  logoutButton.addEventListener("click", (e) => {
    e.preventDefault();
    clearSession();
    window.location.replace("/index.html");
  });
}

const API_URL = `${window.APP_CONFIG.getBackendUrl()}${window.APP_CONFIG.API_ENDPOINTS.PERFORMANCE_CHARTS}`;

// Global chart instances
let dailyNumbersBarChart = null;
let hourlyNumbersLineChart = null;

// Data storage
let allData = [];
let allPreviousData = [];
let currentStartDate = null;
let currentEndDate = null;
let previousStartDate = null;
let previousEndDate = null;

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
 * Fetches data from API
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
      1 // 1 retry for numbers data
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // DIRECTLY PARSE JSON - NO handleResponse NEEDED
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch numbers data:", error);
    // Don't redirect here - let safeFetch handle authentication errors
    return null;
  }
}

/**
 * Calculate previous period dates based on current period
 */
function calculatePreviousPeriod(startDate, endDate) {
  const startMoment = moment(startDate);
  const endMoment = moment(endDate);
  const periodDuration = endMoment.diff(startMoment, "days") + 1;

  return {
    previousStartDate: moment(startDate).subtract(periodDuration, "days").format("YYYY-MM-DD"),
    previousEndDate: moment(endDate).subtract(periodDuration, "days").format("YYYY-MM-DD")
  };
}

/**
 * Parse and prepare numbers data
 */
function parseNumbersData(data) {
  return data.map((row) => ({
    ...row,
    parsedDate: parseTATDate(row.date),
    timeInHour: row.time_in
      ? parseInt(row.time_in.split("T")[1]?.split(":")[0]) || null
      : null,
  }));
}

/**
 * Main function to process data
 */
function processData() {
  console.log("Starting Numbers data processing...");

  const startDate = document.getElementById("startDateFilter")?.value;
  const endDate = document.getElementById("endDateFilter")?.value;
  const currentShift = document.getElementById("shiftFilter")?.value || 'all';
  const currentHospitalUnit = document.getElementById("hospitalUnitFilter")?.value || 'all';

  // Only process if we have data for the current period
  if (allData.length === 0 || startDate !== currentStartDate) {
    console.log("No data available for current period, fetching...");
    initDashboard();
    return;
  }

  console.log(`Initial data loaded: ${allData.length} records.`);

  // Apply filters to CURRENT data
  const filteredData = applyTATFilters(allData, {
    startDateStr: startDate,
    endDateStr: endDate,
    shift: currentShift,
    hospitalUnit: currentHospitalUnit
  });

  // For previous data, only filter by date range
  const filteredPreviousData = applyTATFilters(allPreviousData, {
    startDateStr: previousStartDate,
    endDateStr: previousEndDate,
    shift: "all",
    hospitalUnit: "all"
  });

  console.log(`Filtering complete. Current: ${filteredData.length} records, Previous: ${filteredPreviousData.length} records`);

  // Update KPIs and charts
  updateKPIs(filteredData, filteredPreviousData);
  updateAllCharts(filteredData);
}

/**
 * Updates KPIs
 */
function updateKPIs(filteredData, filteredPreviousData) {
  const totalRequestsCurrent = filteredData.length;
  const totalRequestsPrevious = filteredPreviousData.length;

  // Update main KPI displays
  const totalRequestsValue = document.getElementById("totalRequestsValue");
  const avgDailyRequests = document.getElementById("avgDailyRequests");
  const busiestHour = document.getElementById("busiestHour");
  const busiestDay = document.getElementById("busiestDay");

  if (totalRequestsValue) {
    totalRequestsValue.textContent = totalRequestsCurrent.toLocaleString();
  }

  // Calculate current period metrics
  const uniqueDates = new Set(
    filteredData.map((row) => row.parsedDate?.format("YYYY-MM-DD")).filter(Boolean)
  );
  const numberOfDays = uniqueDates.size || 1;
  const avgDailyRequestsCurrent = totalRequestsCurrent / numberOfDays;
  
  if (avgDailyRequests) {
    avgDailyRequests.textContent = Math.round(avgDailyRequestsCurrent).toLocaleString();
  }

  // Calculate previous period metrics
  const previousUniqueDates = new Set(
    filteredPreviousData.map((row) => row.parsedDate?.format("YYYY-MM-DD")).filter(Boolean)
  );
  const previousNumberOfDays = previousUniqueDates.size || 1;
  const avgDailyRequestsPrevious = previousNumberOfDays > 0 ? totalRequestsPrevious / previousNumberOfDays : 0;

  // Calculate trends
  const totalRequestsTrendValue = calculateTrendPercentage(totalRequestsCurrent, totalRequestsPrevious);
  const avgDailyRequestsTrendValue = calculateTrendPercentage(avgDailyRequestsCurrent, avgDailyRequestsPrevious);

  // Update trends
  updateTrend("totalRequestsTrend", totalRequestsTrendValue, 
    getTrendDirection('tests', totalRequestsCurrent, totalRequestsPrevious));
  updateTrend("avgDailyRequestsTrend", avgDailyRequestsTrendValue, 
    getTrendDirection('tests', avgDailyRequestsCurrent, avgDailyRequestsPrevious));

  // Calculate busiest metrics
  updateBusiestMetrics(filteredData, busiestHour, busiestDay);

  console.log(`Current: ${totalRequestsCurrent} requests over ${numberOfDays} days (avg: ${avgDailyRequestsCurrent.toFixed(1)}/day)`);
  console.log(`Previous: ${totalRequestsPrevious} requests over ${previousNumberOfDays} days (avg: ${avgDailyRequestsPrevious.toFixed(1)}/day)`);
}

/**
 * Calculate busiest hour and day
 */
function updateBusiestMetrics(data, busiestHourElement, busiestDayElement) {
  const hourlyCounts = Array(24).fill(0);
  const dailyCounts = {};

  data.forEach((row) => {
    // Hourly counts
    if (row.timeInHour !== null && row.timeInHour >= 0 && row.timeInHour < 24) {
      hourlyCounts[row.timeInHour]++;
    }
    
    // Daily counts
    const day = row.parsedDate?.format("YYYY-MM-DD");
    if (day) {
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    }
  });

  // Find busiest hour
  const peakHour = hourlyCounts.indexOf(Math.max(...hourlyCounts));
  if (busiestHourElement) {
    busiestHourElement.textContent = peakHour >= 0 ? `${peakHour}:00 - ${peakHour + 1}:00` : "N/A";
  }

  // Find busiest day
  let busiestDay = "N/A";
  let maxCount = 0;
  Object.entries(dailyCounts).forEach(([date, count]) => {
    if (count > maxCount) {
      maxCount = count;
      busiestDay = `${moment(date).format("MMM D, YYYY")} (${count} Requests)`;
    }
  });

  if (busiestDayElement) {
    busiestDayElement.textContent = busiestDay;
  }
}

// Consolidate chart rendering calls
function updateAllCharts(filteredData) {
  renderDailyNumbersBarChart(filteredData);
  renderHourlyNumbersLineChart(filteredData);
}

/**
 * Initializes the dashboard - UPDATED to handle period changes
 */
async function initDashboard() {
  try {
    console.log("Initializing Numbers dashboard...");
    showLoadingSpinner();

    // Get the current date range from the filters
    const startDate = document.getElementById("startDateFilter").value;
    const endDate = document.getElementById("endDateFilter").value;
    
    // Store current period
    currentStartDate = startDate;
    currentEndDate = endDate;
    
    console.log(`Fetching data for current period: ${startDate} to ${endDate}`);

    // Determine the previous period
    const { previousStartDate: prevStart, previousEndDate: prevEnd } = calculatePreviousPeriod(startDate, endDate);
    previousStartDate = prevStart;
    previousEndDate = prevEnd;

    console.log(`Previous period: ${previousStartDate} to ${previousEndDate}`);

    // Fetch data for both periods concurrently
    const [currentData, previousData] = await Promise.all([
      fetchData(startDate, endDate),
      fetchData(previousStartDate, previousEndDate),
    ]);

    console.log("Current data count:", currentData ? currentData.length : 0);
    console.log("Previous data count:", previousData ? previousData.length : 0);

    if (currentData && previousData) {
      // Parse data for both datasets
      allData = parseNumbersData(currentData);
      allPreviousData = parseNumbersData(previousData);

      console.log("Parsed current data count:", allData.length);
      console.log("Parsed previous data count:", allPreviousData.length);

      // Perform the initial render
      processData();
      console.log("Numbers Dashboard initialization successful.");
    } else {
      console.error("Failed to fetch data for one or both periods");
    }
  } catch (error) {
    console.error("Failed to initialize dashboard:", error);
  } finally {
    hideLoadingSpinner();
  }
}

// CHART FUNCTIONS (keep your existing chart rendering functions)
function renderDailyNumbersBarChart(data = []) {
  const ctx = document.getElementById("dailyNumbersBarChart");
  if (!ctx) return;

  const dailyCounts = {};
  data.forEach((row) => {
    if (row.parsedDate?.isValid()) {
      const dateKey = row.parsedDate.format("YYYY-MM-DD");
      dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
    }
  });

  const sortedDates = Object.keys(dailyCounts).sort();
  const chartData = sortedDates.map((date) => dailyCounts[date]);

  if (dailyNumbersBarChart) dailyNumbersBarChart.destroy();

  if (sortedDates.length > 0) {
    dailyNumbersBarChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: sortedDates,
        datasets: [
          {
            label: "Daily Request Volume",
            data: chartData,
            backgroundColor: "#21336a",
            borderColor: "#21336a",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y} requests`,
            },
          },
          datalabels: { display: false },
        },
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day",
              tooltipFormat: "MMM D, YYYY",
              displayFormats: { day: "MMM D" },
            },
            grid: { display: false },
            title: { display: true, text: "Date" },
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: "Number of Requests" },
          },
        },
      },
    });
  }
}

function renderHourlyNumbersLineChart(data = []) {
  const ctx = document.getElementById("hourlyNumbersLineChart");
  if (!ctx) return;

  const hourlyCounts = Array(24).fill(0);
  data.forEach((row) => {
    if (row.timeInHour !== null && row.timeInHour >= 0 && row.timeInHour < 24) {
      hourlyCounts[row.timeInHour]++;
    }
  });

  if (hourlyNumbersLineChart) hourlyNumbersLineChart.destroy();

  hourlyNumbersLineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: "Hourly Request Volume",
          data: hourlyCounts,
          borderColor: "#21336a",
          backgroundColor: "rgba(33, 51, 106, 0.2)",
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: "#21336a",
          pointBorderColor: "#fff",
          pointBorderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.y} requests`,
          },
        },
        datalabels: { display: false },
      },
      scales: {
        x: {
          title: { display: true, text: "Hour of Day" },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Number of Requests" },
          grid: { color: "#e0e0e0" },
        },
      },
    },
  });
}

// DOM Content Loaded - UPDATED with period change detection
document.addEventListener("DOMContentLoaded", () => {
  console.log("Numbers Dashboard initializing...");

  // Set default period to 'thisMonth' and update date inputs
  const periodSelect = document.getElementById("periodSelect");
  if (periodSelect) {
    periodSelect.value = "thisMonth";
    updateDatesForPeriod("thisMonth");
  }

  // Initialize filters with period change detection
  initCommonDashboard((changeType) => {
    const newStartDate = document.getElementById("startDateFilter").value;
    const newEndDate = document.getElementById("endDateFilter").value;
    
    // If period changed, re-fetch data
    if (newStartDate !== currentStartDate || newEndDate !== currentEndDate) {
      console.log(`Period changed to: ${newStartDate} to ${newEndDate}`);
      initDashboard();
    } else {
      // Just filter changes, use existing data
      processData();
    }
  });

  // Initial load
  initDashboard();
});

