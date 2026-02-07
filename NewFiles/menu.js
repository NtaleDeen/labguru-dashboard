// menu.js - NO BLUE COLOR + CLICK TOOLTIP VERSION

import { getToken as getAuthToken, safeFetch } from "./auth.js";

// Global variables
let currentLabNumber = null;
let fetchController = null;
const labNumberCache = new Map();

// Dialog elements
let dialog = null;
let dialogContent = null;
let clickTooltip = null;

/**
 * Creates and initializes the dialog box
 */
function initializeDialog() {
    console.log('🔧 Initializing dialog box...');
    
    // Create dialog element
    dialog = document.createElement('div');
    dialog.className = 'lab-number-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 2px solid #21336a;
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 10001;
        font-size: 14px;
        max-width: 500px;
        max-height: 600px;
        overflow-y: auto;
        color: #21336a;
        display: none;
    `;

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 15px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #21336a;
        font-weight: bold;
    `;
    closeButton.addEventListener('click', closeDialog);

    // Create content area
    dialogContent = document.createElement('div');
    dialogContent.style.cssText = `
        margin-top: 10px;
    `;

    dialog.appendChild(closeButton);
    dialog.appendChild(dialogContent);
    document.body.appendChild(dialog);

    // Add overlay
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
        display: none;
    `;
    overlay.addEventListener('click', closeDialog);
    document.body.appendChild(overlay);
}

/**
 * Creates and initializes the click tooltip
 */
function initializeClickTooltip() {
    console.log('🔧 Initializing click tooltip...');
    
    // Create tooltip element
    clickTooltip = document.createElement('div');
    clickTooltip.className = 'click-tooltip';
    clickTooltip.style.cssText = `
        position: fixed;
        background: #333;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10002;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        display: none;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(clickTooltip);
}

/**
 * Shows the click tooltip
 */
function showClickTooltip(element, message) {
    if (!clickTooltip) {
        initializeClickTooltip();
    }

    const rect = element.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Position tooltip above the element
    clickTooltip.textContent = message;
    clickTooltip.style.display = 'block';
    
    // Calculate position
    const tooltipHeight = 40; // Approximate height
    let left = rect.left + (rect.width / 2);
    let top = rect.top - tooltipHeight;

    // Adjust to stay within viewport
    const viewportPadding = 10;
    
    // Check top edge
    if (top < viewportPadding) {
        top = rect.bottom + 5;
    }
    
    // Check left/right edges
    const tooltipWidth = clickTooltip.offsetWidth;
    if (left + tooltipWidth > window.innerWidth - viewportPadding) {
        left = window.innerWidth - tooltipWidth - viewportPadding;
    }
    if (left < viewportPadding) {
        left = viewportPadding;
    }

    clickTooltip.style.left = Math.max(viewportPadding, left + scrollX) + 'px';
    clickTooltip.style.top = Math.max(viewportPadding, top + scrollY) + 'px';
    clickTooltip.style.opacity = '1';
}

/**
 * Hides the click tooltip
 */
function hideClickTooltip() {
    if (clickTooltip) {
        clickTooltip.style.opacity = '0';
        setTimeout(() => {
            if (clickTooltip) {
                clickTooltip.style.display = 'none';
            }
        }, 200);
    }
}

/**
 * Shows the dialog box
 */
function showDialog() {
    if (dialog) {
        const overlay = document.querySelector('.dialog-overlay');
        if (overlay) overlay.style.display = 'block';
        dialog.style.display = 'block';
        
        // Add escape key listener
        document.addEventListener('keydown', handleEscapeKey);
    }
}

/**
 * Closes the dialog box
 */
function closeDialog() {
    if (dialog) {
        dialog.style.display = 'none';
        const overlay = document.querySelector('.dialog-overlay');
        if (overlay) overlay.style.display = 'none';
        
        // Remove escape key listener
        document.removeEventListener('keydown', handleEscapeKey);
        
        currentLabNumber = null;
    }
}

/**
 * Handles escape key press
 */
function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        closeDialog();
    }
}

/**
 * Initializes click-based lab number functionality
 */
function initializeLabNumberClicks() {
    console.log('🔧 Initializing click-based lab number functionality...');
    
    // Remove any existing event listeners
    document.removeEventListener('click', handleLabNumberClick);
    document.removeEventListener('mouseover', handleLabNumberHover);
    document.removeEventListener('mouseout', handleLabNumberOut);
    
    // Add event listeners
    document.addEventListener('click', handleLabNumberClick);
    document.addEventListener('mouseover', handleLabNumberHover, { passive: true });
    document.addEventListener('mouseout', handleLabNumberOut, { passive: true });
}

/**
 * Handles lab number hover
 */
function handleLabNumberHover(e) {
    const labElement = findLabNumberElement(e.target);
    if (!labElement) {
        hideClickTooltip();
        return;
    }

    const labNumber = getLabNumberFromElement(labElement);
    if (!labNumber) {
        hideClickTooltip();
        return;
    }

    showClickTooltip(labElement, 'Click to see tests');
}

/**
 * Handles lab number mouse out
 */
function handleLabNumberOut(e) {
    const relatedLabElement = findLabNumberElement(e.relatedTarget);
    if (!relatedLabElement) {
        hideClickTooltip();
    }
}

/**
 * Handles lab number clicks
 */
function handleLabNumberClick(e) {
    const labElement = findLabNumberElement(e.target);
    if (!labElement) {
        return;
    }

    const labNumber = getLabNumberFromElement(labElement);
    if (!labNumber) return;

    // Prevent multiple clicks on same lab number
    if (currentLabNumber === labNumber && dialog?.style.display === 'block') {
        return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Hide the click tooltip when dialog opens
    hideClickTooltip();

    showLabNumberDialog(labElement, labNumber);
}

/**
 * Shows dialog with lab number tests
 */
function showLabNumberDialog(element, labNumber) {
    if (!dialog) {
        initializeDialog();
    }

    currentLabNumber = labNumber;

    // Show loading state
    dialogContent.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 15px; font-size: 16px; color: #21336a; border-bottom: 2px solid #21336a; padding-bottom: 10px;">
            Tests for Lab Number: ${labNumber}
        </div>
        <div style="color: #666; font-style: italic; text-align: center; padding: 20px;">
            Loading tests...
        </div>
    `;

    showDialog();
    updateDialogWithData(labNumber);
}

/**
 * Updates dialog with fetched data
 */
async function updateDialogWithData(labNumber) {
    let tests;
    
    // Check cache first
    if (labNumberCache.has(labNumber)) {
        tests = labNumberCache.get(labNumber);
    } else {
        tests = await fetchTestsForLabNumber(labNumber);
        if (tests) {
            // Cache with expiration (5 minutes)
            labNumberCache.set(labNumber, tests);
            setTimeout(() => {
                labNumberCache.delete(labNumber);
            }, 5 * 60 * 1000);
        }
    }
    
    // Only update if still showing the same lab number and dialog exists
    if (currentLabNumber === labNumber && dialog && dialogContent) {
        let content = `
            <div style="font-weight: bold; margin-bottom: 15px; font-size: 16px; color: #21336a; border-bottom: 2px solid #21336a; padding-bottom: 10px;">
                Tests for Lab Number: ${labNumber}
            </div>
        `;
        
        if (tests && tests.length > 0) {
            content += `<div style="max-height: 400px; overflow-y: auto;">`;
            
            const testList = tests.map((test, index) => `
                <div style="padding: 12px 8px; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center;">
                    <span style="color: #21336a; margin-right: 12px; font-weight: bold; min-width: 25px;">${index + 1}.</span>
                    <span style="color: #333; flex: 1;">${test}</span>
                </div>
            `).join('');
            
            content += testList;
            content += `</div>`;
            
            // Add summary
            content += `
                <div style="margin-top: 15px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #21336a;">
                    <strong>Total Tests:</strong> ${tests.length}
                </div>
            `;
        } else {
            content += `
                <div style="color: #666; font-style: italic; text-align: center; padding: 40px 20px; background: #f8f9fa; border-radius: 6px;">
                    No tests found for this lab number
                </div>
            `;
        }
        
        // Add instructions
        content += `
            <div style="margin-top: 15px; font-size: 12px; color: #666; text-align: center; padding-top: 10px; border-top: 1px solid #e0e0e0;">
                Press ESC or click outside to close
            </div>
        `;
        
        dialogContent.innerHTML = content;
    }
}

function reinitializeLabNumberTooltips() {
    console.log('🔄 Reinitializing lab number tooltips...');
    reinitializeLabNumberClicks();
}

/**
 * Fetches tests for a lab number
 */
async function fetchTestsForLabNumber(labNumber) {
    // Cancel previous request
    if (fetchController) {
        fetchController.abort();
    }
    
    fetchController = new AbortController();
    
    try {
        const token = getAuthToken();
        if (!token) return null;
        
        const API_URL = `${window.APP_CONFIG.getBackendUrl()}${window.APP_CONFIG.API_ENDPOINTS.TRACKER}`;
        const params = new URLSearchParams({
            searchQuery: labNumber,
            limit: 100
        });
        
        const response = await safeFetch(`${API_URL}?${params.toString()}`, {
            method: "GET",
            signal: fetchController.signal
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        const tests = data.data || data;
        
        if (!Array.isArray(tests)) return null;
        
        const uniqueTests = [...new Set(tests
            .filter(test => test.Lab_Number === labNumber || test.lab_number === labNumber)
            .map(test => test.Test_Name || test.test_name)
            .filter(Boolean)
        )];
        
        return uniqueTests;
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Error fetching tests:', error);
        }
        return null;
    }
}

// Helper functions
function findLabNumberElement(element) {
    if (!element) return null;
    
    // Only target TD elements with lab-number-cell class (data cells, not headers)
    if (element.tagName === 'TD' && element.classList?.contains('lab-number-cell')) {
        return element;
    }
    
    // Limit DOM traversal depth for performance
    let parent = element.parentElement;
    let depth = 0;
    const maxDepth = 3;
    
    while (parent && parent !== document.body && depth < maxDepth) {
        if (parent.tagName === 'TD' && parent.classList?.contains('lab-number-cell')) {
            return parent;
        }
        parent = parent.parentElement;
        depth++;
    }
    
    return null;
}

function getLabNumberFromElement(element) {
    if (!element) return null;
    
    // Only get lab number from TD elements with the specific class
    if (element.tagName !== 'TD' || !element.classList?.contains('lab-number-cell')) {
        return null;
    }
    
    // Priority 1: data attribute
    if (element.dataset?.labNumber) {
        const labNumber = element.dataset.labNumber.trim();
        return labNumber && labNumber !== 'N/A' ? labNumber : null;
    }
    
    // Priority 2: text content
    const text = element.textContent?.trim();
    if (text && text !== 'N/A' && !text.includes('Loading') && !text.includes('Error')) {
        // Additional validation for lab numbers
        if (text.length > 3 && text.length < 20) {
            return text;
        }
    }
    
    return null;
}

function reinitializeLabNumberClicks() {
    console.log('🔄 Reinitializing lab number click functionality...');
    closeDialog();
    hideClickTooltip();
    labNumberCache.clear();
    initializeLabNumberClicks();
}

// Make functions available globally
window.initializeLabNumberClicks = initializeLabNumberClicks;
window.reinitializeLabNumberClicks = reinitializeLabNumberClicks;
window.closeLabNumberDialog = closeDialog;

// Add CSS for better visual feedback
function addClickStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .lab-number-cell {
            cursor: pointer;
            position: relative;
        }
        
        .lab-number-dialog {
            animation: dialogFadeIn 0.2s ease-out;
        }
        
        .click-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: #333 transparent transparent transparent;
        }
        
        .search-clear-btn {
            z-index: 10 !important;
            background: #f0f0f0 !important;
            border-radius: 50% !important;
            width: 20px !important;
            height: 20px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 14px !important;
            font-weight: bold !important;
            color: #666 !important;
        }
        
        .search-clear-btn:hover {
            background: #e0e0e0 !important;
            color: #333 !important;
        }
        
        @keyframes dialogFadeIn {
            from {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.9);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
        }
    `;
    document.head.appendChild(style);
}

// DOM Content Loaded
document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM loaded - initializing menu functionality');
    
    // Add click styles
    addClickStyles();
    
    // Initialize search clear buttons - ADD THIS
    initializeSearchClearButtons();
    
    // Three-dot menu functionality
    const menuButtons = document.querySelectorAll(".three-dots-button");
    menuButtons.forEach((button) => {
        const menu = button.nextElementSibling;
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            menu.classList.toggle("visible");
        });
    });

    window.addEventListener("click", () => {
        document.querySelectorAll(".three-dots-menu-container .dropdown-menu.visible")
            .forEach(menu => menu.classList.remove("visible"));
    });

    // Initialize click functionality after a short delay
    setTimeout(() => {
        console.log('🔄 Initializing click-based lab number functionality...');
        initializeLabNumberClicks();
    }, 1000);

    // Export functionality
    const exportPdfLinks = document.querySelectorAll("#export-pdf-link");
    exportPdfLinks.forEach((link) => {
        link.addEventListener("click", async (e) => {
            e.preventDefault();
            await exportChartsAsPdf();
        });
    });

    const resetFiltersButton = document.getElementById("reset-filters-button");
    if (resetFiltersButton) {
        resetFiltersButton.addEventListener("click", (e) => {
            e.preventDefault();
            resetAllFilters();
        });
    }

    const exportPdfLink = document.getElementById("export-pdf-link");
    const exportCsvLink = document.getElementById("export-csv-link");

    if (exportCsvLink) {
        exportCsvLink.addEventListener("click", (e) => {
            e.preventDefault();
            exportCurrentTableAsCsv(); // This was calling the undefined function
        });
    }

    if (exportPdfLink) {
        exportPdfLink.addEventListener("click", async (e) => {
            e.preventDefault();
            const isTablePage = window.location.pathname.includes("meta.html") || 
                             window.location.pathname.includes("performance.html");
            
            if (isTablePage) {
                await exportCurrentTableAsPdf();
            } else {
                await exportChartsAsPdf();
            }
        });
    }
    
    updateExportButtonVisibility();
});

// Add the missing updateExportButtonVisibility function
function updateExportButtonVisibility() {
    const exportCsvLink = document.getElementById("export-csv-link");
    const exportPdfLink = document.getElementById("export-pdf-link");
    
    const canExport = canExportData();
    
    if (exportCsvLink) {
        exportCsvLink.style.display = canExport ? 'block' : 'none';
    }
    
    if (exportPdfLink) {
        exportPdfLink.style.display = canExport ? 'block' : 'none';
    }
}

function canExportData() {
    const userRole = getUserRole();
    return userRole === 'developer' || userRole === 'manager';
}

function getUserRole() {
    try {
        const session = JSON.parse(sessionStorage.getItem("session"));
        return session ? session.role : null;
    } catch (error) {
        console.error("Error getting user role:", error);
        return null;
    }
}

function convertJsonToCsv(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    
    let csvContent = headers.map(header => `"${header}"`).join(',') + '\r\n';
    
    data.forEach(row => {
        const rowData = headers.map(header => {
            const value = row[header];
            const text = String(value || '').replace(/"/g, '""').replace(/\n/g, ' ');
            return `"${text}"`;
        });
        csvContent += rowData.join(',') + '\r\n';
    });
    
    return csvContent;
}

function downloadCsvFile(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Universal table export function that automatically detects the current table for CSV
 * Only available to Manager and Developer roles
 */
function exportCurrentTableAsCsv() {
    // Check authorization first - Only Manager and Developer can export
    if (!canExportData()) {
        alert("Export functionality is only available to Managers and Administrators.");
        return;
    }
    
    // Try to find the main table on the page
    const tables = document.querySelectorAll('table.neon-table, table[id]');
    
    if (tables.length === 0) {
        console.error("No exportable table found on this page");
        alert("No table found to export");
        return;
    }
    
    // Use the first table found
    const table = tables[0];
    const tableId = table.id;
    
    console.log("Found table with ID:", tableId);
    
    // Generate filename based on ACTUAL table ID or page context
    let filename;
    if (tableId && tableId !== "") {
        // Use the actual table ID (performance, meta, etc.)
        filename = `${tableId}_data`;
    } else {
        // Fallback to page-based naming if no ID
        if (window.location.pathname.includes("meta.html")) {
            filename = "meta_data";
        } else if (window.location.pathname.includes("performance.html")) {
            filename = "performance_data";
        } else if (window.location.pathname.includes("progress.html")) {
            filename = "progress_data";
        } else if (window.location.pathname.includes("reception.html")) {
            filename = "reception_data";
        } else if (window.location.pathname.includes("tracker.html")) {
            filename = "tracker_data";
        } else {
            filename = "table_data";
        }
    }
    
    // Add timestamp to filename for uniqueness
    const timestamp = new Date().toISOString().slice(0, 10);
    filename = `${filename}_${timestamp}`;
    
    console.log("Exporting CSV with filename:", filename);
    exportTableAsCsv(tableId, filename);
}

/**
 * Universal table export function that automatically detects the current table for PDF
 * Only available to Manager and Developer roles
 */
async function exportCurrentTableAsPdf() {
    // Check authorization first - Only Manager and Developer can export
    if (!canExportData()) {
        alert("Export functionality is only available to Managers and Administrators.");
        return;
    }
    
    // Try to find the main table on the page
    const tables = document.querySelectorAll('table.neon-table, table[id]');
    
    if (tables.length === 0) {
        console.error("No exportable table found on this page");
        alert("No table found to export");
        return;
    }
    
    // Use the first table found
    const table = tables[0];
    const tableId = table.id;
    
    console.log("Found table with ID:", tableId); // Debug log
    
    // Generate filename based on ACTUAL table ID or page context
    let filename;
    if (tableId && tableId !== "") {
        // Use the actual table ID (performance, meta, etc.)
        filename = `${tableId}_data`;
    } else {
        // Fallback to page-based naming if no ID
        if (window.location.pathname.includes("meta.html")) {
            filename = "meta_data";
        } else if (window.location.pathname.includes("performance.html")) {
            filename = "performance_data";
        } else {
            filename = "table_data";
        }
    }
    
    // Add timestamp to filename for uniqueness
    const timestamp = new Date().toISOString().slice(0, 10);
    filename = `${filename}_${timestamp}`;
    
    console.log("Exporting PDF with filename:", filename); // Debug log
    await exportTableAsPdf(tableId, filename);
}

// ------------------------------------------------------------------
// Optimized Reset Filters Functionality
// ------------------------------------------------------------------

/**
 * Resets all filter inputs to their default values (working version)
 */
function resetAllFilters() {
    console.time("resetAllFilters");

    // Get current page to handle different reset behaviors
    const currentPage = window.location.pathname;
    const isDashboardPage = currentPage.includes('dashboard') || 
                           currentPage.includes('revenue') || 
                           currentPage.includes('numbers') || 
                           currentPage.includes('tests') || 
                           currentPage.includes('tat');

    if (isDashboardPage) {
        // FOR DASHBOARD PAGES: Simply set period to "thisMonth"
        const periodSelect = document.getElementById("periodSelect");
        if (periodSelect) {
            console.log("🔄 Resetting dashboard to 'thisMonth' period");
            periodSelect.value = "thisMonth";
            
            // Let the existing period change handler do its job
            // It will automatically update dates and fetch data
        }
        
        // Reset other dashboard filters without triggering events
        const labSectionFilter = document.getElementById("labSectionFilter");
        if (labSectionFilter) labSectionFilter.value = "all";

        const shiftFilter = document.getElementById("shiftFilter");
        if (shiftFilter) shiftFilter.value = "all";

        const hospitalUnitFilter = document.getElementById("hospitalUnitFilter");
        if (hospitalUnitFilter) hospitalUnitFilter.value = "all";

        const unitSelect = document.getElementById("unitSelect");
        if (unitSelect) unitSelect.value = "all";
        
    } else {
        // FOR TABLE PAGES: Reset individual filters
        const startDateFilter = document.getElementById("startDateFilter");
        const endDateFilter = document.getElementById("endDateFilter");

        if (startDateFilter) startDateFilter.value = "";
        if (endDateFilter) {
            endDateFilter.value = "";
            endDateFilter.disabled = false;
        }

        const periodSelect = document.getElementById("periodSelect");
        if (periodSelect) periodSelect.value = "custom";

        const labSectionFilter = document.getElementById("labSectionFilter");
        if (labSectionFilter) labSectionFilter.value = "all";

        const shiftFilter = document.getElementById("shiftFilter");
        if (shiftFilter) shiftFilter.value = "all";

        const hospitalUnitFilter = document.getElementById("hospitalUnitFilter");
        if (hospitalUnitFilter) hospitalUnitFilter.value = "all";
    }

    // Reset search inputs (common for both)
    const searchInputs = document.querySelectorAll('input[type="search"]');
    searchInputs.forEach((input) => {
        input.value = "";
    });

    // Show all table rows if hidden by search
    const hiddenRows = document.querySelectorAll(".hidden-row");
    hiddenRows.forEach((row) => {
        row.classList.remove("hidden-row");
    });

    console.timeEnd("resetAllFilters");
    console.log("All filters have been reset");
    
    // If on dashboard, manually trigger the period change after a brief delay
    if (isDashboardPage) {
        setTimeout(() => {
            const periodSelect = document.getElementById("periodSelect");
            if (periodSelect) {
                console.log("🔄 Manually triggering period change");
                periodSelect.dispatchEvent(new Event("change", { bubbles: true }));
            }
        }, 50);
    }
}

// ------------------------------------------------------------------
// Reusable Table Functions: Search & Export
// ------------------------------------------------------------------

/**
 * Initializes a search bar to filter a specific HTML table.
 * @param {string} searchInputId - The ID of the search input element (e.g., 'searchInput').
 * @param {string} tableId - The ID of the table to filter (e.g., 'performanceTable').
 */
function initializeTableSearch(searchInputId, tableId) {
    const searchInput = document.getElementById(searchInputId);
    const table = document.getElementById(tableId);

    if (!searchInput || !table) {
        console.error(
            `Could not find search input '${searchInputId}' or table '${tableId}'.`
        );
        return;
    }

    // Get all the rows in the table body, excluding the header row.
    const rows = Array.from(table.querySelectorAll("tbody tr"));

    // Add an event listener to the search input.
    searchInput.addEventListener("input", (event) => {
        const query = event.target.value.toLowerCase().trim();

        rows.forEach((row) => {
            const rowText = row.textContent.toLowerCase();

            if (rowText.includes(query)) {
                row.classList.remove("hidden-row");
            } else {
                row.classList.add("hidden-row");
            }
        });
    });
}

/**
 * Adds clear button to search inputs - FIXED VERSION
 */
function initializeSearchClearButtons() {
    const searchInputs = document.querySelectorAll('input[type="search"], #searchInput');
    
    searchInputs.forEach(input => {
        // Skip if already initialized
        if (input.parentElement.querySelector('.search-clear-btn')) {
            return;
        }

        // Create clear button
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.innerHTML = '×';
        clearBtn.className = 'search-clear-btn';
        
        // Find or create search icon
        let searchIcon = input.parentElement.querySelector('.search-icon');
        if (!searchIcon) {
            searchIcon = document.createElement('span');
            searchIcon.className = 'search-icon';
            searchIcon.innerHTML = '🔍'; // Or use font awesome icon
        }
        
        // Wrap input and buttons in container if not already wrapped
        let container = input.parentElement;
        if (!container.classList.contains('search-input-container')) {
            container = document.createElement('div');
            container.className = 'search-input-container';
            input.parentNode.insertBefore(container, input);
            container.appendChild(input);
        }
        
        // Add both buttons to container
        container.appendChild(searchIcon);
        container.appendChild(clearBtn);
        
        // Show/hide buttons based on input value
        function toggleButtons() {
            if (input.value) {
                container.classList.add('has-text');
            } else {
                container.classList.remove('has-text');
            }
        }
        
        // Clear input function
        function clearInput() {
            input.value = '';
            input.focus();
            toggleButtons();
            
            // Trigger input event to update search
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        // Event listeners
        input.addEventListener('input', toggleButtons);
        input.addEventListener('keyup', toggleButtons);
        clearBtn.addEventListener('click', clearInput);
        
        // Also check on focus in case value was pre-filled
        input.addEventListener('focus', toggleButtons);
        
        // Initial state
        toggleButtons();
    });
}

/**
 * Exports an HTML table to a CSV file.
 * @param {string} tableId - The ID of the table to export.
 * @param {string} filename - The name of the CSV file.
 */
function exportTableAsCsv(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`Table with ID "${tableId}" not found.`);
        return;
    }

    // Get all rows (including header) from both thead and tbody
    const headerRows = Array.from(table.querySelectorAll("thead tr"));
    const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
    const allRows = [...headerRows, ...bodyRows];
    
    let csvContent = "";
    
    // Include all rows (not just visible ones) to export filtered data
    allRows.forEach((row) => {
        const cols = row.querySelectorAll("td, th");
        const rowData = Array.from(cols)
            .map((col) => {
                // Handle special characters and line breaks in content
                const text = col.innerText.replace(/"/g, '""').replace(/\n/g, ' ');
                return `"${text}"`;
            })
            .join(",");
        csvContent += rowData + "\r\n";
    });

    // Use Blob and Object URL instead of data URL to avoid security warnings
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the Object URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Exports an HTML table to a PDF file.
 * This function requires the 'jsPDF' and 'jspdf-autotable' libraries.
 * @param {string} tableId - The ID of the table to export.
 * @param {string} filename - The name of the PDF file.
 */
async function exportTableAsPdf(tableId, filename) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "pt", "a4");

    doc.setFont("helvetica");

    // Get the table element
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`Table with ID "${tableId}" not found.`);
        return;
    }

    // Prepare table headers and data
    const headers = Array.from(table.querySelectorAll("thead th")).map((th) =>
        th.innerText.trim()
    );
    const data = Array.from(table.querySelectorAll("tbody tr")).map((tr) => {
        return Array.from(tr.querySelectorAll("td")).map((td) =>
            td.innerText.trim()
        );
    });

    // Check if there is data to export
    if (data.length === 0 || headers.length === 0) {
        console.warn("No data or headers found in the table. PDF will be empty.");
    }

    // AutoTable plugin options
    doc.autoTable({
        head: [headers],
        body: data,
        startY: 50,
        styles: {
            fontSize: 10,
            cellPadding: 5,
        },
        headStyles: {
            fillColor: "#21336a",
            textColor: "#fff",
            fontStyle: "bold",
        },
    });

    // Add footer with Zyntel logo to table PDFs
    await addPdfFooter(doc);

    // Save the PDF
    doc.save(`${filename}.pdf`);
}

/**
 * Loads an image from a URL and returns a promise that resolves with the image data
 * @param {string} url - The image URL
 * @returns {Promise<string>} - Promise that resolves with base64 image data
 */
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = url;
    });
}

/**
 * Adds footer with Zyntel logo and copyright text to PDF documents
 * @param {object} doc - The jsPDF document instance
 */
async function addPdfFooter(doc) {
    const pageCount = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    try {
        // Load the Zyntel logo from your website
        const zyntelLogoUrl = "../images/zyntel_no_background.png";
        const logoData = await loadImage(zyntelLogoUrl);

        // Logo dimensions and positioning (similar to your CSS)
        const logoWidth = 800; // 120px width from your CSS
        const logoHeight = 500; // 50px height from your CSS
        const logoX = 40; // Left margin similar to your CSS margin-left: 20px
        const logoY = pageHeight - 60; // Position near bottom

        // Scale factor to match your CSS transform: scale(0.14)
        const scaleFactor = 0.14;
        const scaledLogoWidth = logoWidth * scaleFactor;
        const scaledLogoHeight = logoHeight * scaleFactor;

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            // Add Zyntel logo
            doc.addImage(
                logoData,
                "PNG",
                logoX,
                logoY,
                scaledLogoWidth,
                scaledLogoHeight
            );

            // Add copyright text (positioned to the right of the logo)
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(
                `© ${new Date().getFullYear()} Zyntel`,
                logoX + scaledLogoWidth + 10,
                logoY + scaledLogoHeight / 2 + 3
            );
        }
    } catch (error) {
        console.error("Failed to load Zyntel logo:", error);

        // Fallback: use text if image loading fails
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            // Add footer text
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`© ${new Date().getFullYear()} Zyntel`, 40, pageHeight - 30);

            // Add Zyntel text as fallback
            doc.setFontSize(8);
            doc.setTextColor(33, 51, 106);
            doc.text("Zyntel", 40, pageHeight - 15);
        }
    }
}

/**
 * Exports all charts on the current page as a PDF file.
 * Only available to Manager and Developer roles
 */
async function exportChartsAsPdf() {
    // Check authorization first - Only Manager and Developer can export
    if (!canExportData()) {
        alert("Export functionality is only available to Managers and Administrators.");
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "pt", "a4");

    // Get all chart canvases
    const chartCanvases = document.querySelectorAll("canvas");

    if (chartCanvases.length === 0) {
        alert("No charts found to export.");
        return;
    }

    let currentY = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const chartWidth = pageWidth - margin * 2;

    // Add title - NHL Laboratory Dashboard
    doc.setFontSize(20);
    doc.setTextColor(33, 51, 106);
    doc.text("NHL Laboratory Dashboard", margin, currentY);
    currentY += 30;

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, currentY);
    currentY += 40;

    // Process each chart
    chartCanvases.forEach((canvas, index) => {
        // Get chart title (from parent element with class 'chart-title')
        const chartContainer = canvas.closest(".chart-container");
        let chartTitle = "Chart " + (index + 1);
        if (chartContainer) {
            const titleElement = chartContainer.previousElementSibling;
            if (titleElement && titleElement.classList.contains("chart-title")) {
                chartTitle = titleElement.textContent;
            }
        }

        // Convert canvas to image
        const chartImage = canvas.toDataURL("image/png");

        // Calculate chart height maintaining aspect ratio
        const aspectRatio = canvas.height / canvas.width;
        const chartHeight = chartWidth * aspectRatio;

        // Check if we need a new page
        if (currentY + chartHeight + 50 > doc.internal.pageSize.getHeight()) {
            doc.addPage();
            currentY = 40;
        }

        // Add chart title
        doc.setFontSize(14);
        doc.setTextColor(33, 51, 106);
        doc.text(chartTitle, margin, currentY);
        currentY += 20;

        // Add chart image
        doc.addImage(chartImage, "PNG", margin, currentY, chartWidth, chartHeight);
        currentY += chartHeight + 40;
    });

    // Add footer with Zyntel logo to all pages
    await addPdfFooter(doc);

    // Save the PDF
    const pageName =
        document.querySelector(".page span")?.textContent || "dashboard";
    doc.save(`${pageName.toLowerCase()}-charts-export.pdf`);
}

// Make functions available globally if needed
window.resetAllFilters = resetAllFilters;
window.initializeTableSearch = initializeTableSearch;
window.exportTableAsCsv = exportTableAsCsv;
window.exportTableAsPdf = exportTableAsPdf;
window.exportChartsAsPdf = exportChartsAsPdf;
window.exportCurrentTableAsCsv = exportCurrentTableAsCsv;
window.exportCurrentTableAsPdf = exportCurrentTableAsPdf;
window.reinitializeLabNumberTooltips = reinitializeLabNumberClicks;
window.exportCurrentTableAsCsv = exportCurrentTableAsCsv;