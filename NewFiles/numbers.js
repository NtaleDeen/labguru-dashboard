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