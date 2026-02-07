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