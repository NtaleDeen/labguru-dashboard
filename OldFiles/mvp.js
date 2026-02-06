// auth.js
// auth.js - COMPLETE FIXED VERSION
console.log("🔐 Auth.js loading...");

// Session management with persistence
export function getSession() {
    try {
        const sessionStr = sessionStorage.getItem("session");
        return sessionStr ? JSON.parse(sessionStr) : null;
    } catch (error) {
        console.error("🔐 Error reading session:", error);
        return null;
    }
}

export function saveSession(username, token, role, client_id) {
    // NORMALIZE ROLE TO LOWERCASE
    const normalizedRole = role ? role.toLowerCase() : 'viewer';
    
    const sessionData = { 
        username, 
        token, 
        role: normalizedRole,  // Store normalized role
        client_id,
        timestamp: Date.now(),
        lastRefresh: Date.now()
    };
    
    sessionStorage.setItem("session", JSON.stringify(sessionData));
    localStorage.setItem("zyntelUser", username);
    
    console.log("🔐 Session saved for user:", username, "with role:", normalizedRole);
}

export function clearSession() {
    sessionStorage.removeItem("session");
    localStorage.removeItem("zyntelUser");
    console.log("🔐 Session cleared");
}

export function getToken() {
    const session = getSession();
    return session ? session.token : null;
}

// Enhanced token validation with proper refresh
export function checkAuthAndRedirect() {
    try {
        const session = getSession();
        
        if (!session || !session.token) {
            console.log("🔐 No valid session found");
            redirectToLogin();
            return false;
        }

        // Check if token needs refresh (15 minute threshold)
        const timeSinceLastRefresh = Date.now() - (session.lastRefresh || 0);
        const REFRESH_THRESHOLD = 15 * 60 * 1000; // 15 minutes
        
        if (timeSinceLastRefresh > REFRESH_THRESHOLD) {
            console.log("🔐 Token needs refresh, attempting...");
            // This will be handled by the next API call
            return true;
        }

        console.log("🔐 Auth valid for user:", session.username);
        return true;
        
    } catch (error) {
        console.error("🔐 Auth check error:", error);
        redirectToLogin();
        return false;
    }
}

function redirectToLogin() {
    // Only redirect if we're not already on login page
    if (!window.location.pathname.includes('index.html') && 
        !window.location.pathname.endsWith('/')) {
        console.log("🔐 Redirecting to login...");
        window.location.href = "/index.html";
    }
}

// ACTUAL token refresh that gets a new token
export async function refreshToken() {
    try {
        const session = getSession();
        if (!session) {
            console.log("🔐 No session to refresh");
            return false;
        }

        const VALIDATE_URL = `${window.APP_CONFIG.getBackendUrl()}${window.APP_CONFIG.API_ENDPOINTS.VALIDATE_TOKEN}`;
        
        console.log("🔐 Attempting token refresh...");
        const response = await fetch(VALIDATE_URL, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${session.token}`,
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        if (response.ok) {
            const data = await response.json();
            if (data.valid) {
                // Update session with new timestamp
                session.lastRefresh = Date.now();
                sessionStorage.setItem("session", JSON.stringify(session));
                console.log("🔐 Token refresh successful");
                return true;
            }
        }
        
        console.log("🔐 Token refresh failed - invalid token or server error");
        return false;
        
    } catch (error) {
        console.log("🔐 Token refresh - network error:", error);
        return false;
    }
}

// Enhanced safeFetch with proper retry logic AND Authorization header
export async function safeFetch(url, options = {}, maxRetries = 2) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const token = getToken();
            if (!token) {
                console.log("🔐 No token available, redirecting to login");
                clearSession();
                window.location.href = "/index.html";
                throw new Error("No authentication token available");
            }

            // PROPERLY merge headers - ensure Authorization is included
            const headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                ...options.headers
            };

            console.log(`🔐 Making authenticated request to: ${url}`);
            console.log(`🔐 Authorization header present: ${!!headers.Authorization}`);

            const response = await fetch(url, {
                ...options,
                headers,
                credentials: "include"
            });

            // Handle 401 - token expired
            if (response.status === 401) {
                console.log(`🔐 401 detected (attempt ${attempt + 1}/${maxRetries + 1})`);
                
                if (attempt < maxRetries) {
                    const refreshSuccess = await refreshToken();
                    if (refreshSuccess) {
                        console.log("🔐 Retrying request with refreshed token...");
                        continue; // Retry the request
                    }
                }
                
                // Final attempt failed or max retries reached
                console.log("🔐 Authentication failed, logging out");
                clearSession();
                window.location.href = "/index.html";
                throw new Error("Authentication failed");
            }

            // Handle 404 - endpoint not found
            if (response.status === 404) {
                console.error(`🔐 404 - Endpoint not found: ${url}`);
                throw new Error(`API endpoint not found: ${url}`);
            }

            // Handle other error statuses
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            return response;

        } catch (error) {
            lastError = error;
            
            // Don't retry on these errors
            if (error.message.includes("Authentication failed") || 
                error.message.includes("API endpoint not found") ||
                error.message.includes("No authentication token available")) {
                throw error;
            }
            
            // Network errors or other issues - wait before retry
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                console.log(`🔐 Request failed, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError || new Error("Request failed after retries");
}

// Role-based functions (keep these as they work correctly)
export function getUserRole() {
    try {
        const session = getSession();
        return session ? session.role : null;
    } catch (error) {
        console.error("🔐 Error getting user role:", error);
        return null;
    }
}

export function isAdmin() {
    return getUserRole() === 'developer';
}

export function isManager() {
    return getUserRole() === 'manager';
}

export function isTechnician() {
    return getUserRole() === 'technician';
}

export function isViewer() {
    return getUserRole() === 'viewer';
}

export function canAccess(section) {
    const role = getUserRole();
    
    switch(section) {
        case 'dashboard':
            return ['developer', 'manager', 'technician', 'viewer'].includes(role);
        case 'add_clients':
            return role === 'developer';
        case 'add_users':
            return ['developer', 'manager'].includes(role);
        case 'revenue':
        case 'tests':
        case 'numbers':
        case 'tat':
            return ['developer', 'manager'].includes(role);
        case 'reception':
        case 'performance':
        case 'tracker':
        case 'meta':
            return ['developer', 'manager', 'technician'].includes(role);
        case 'lrids':
        case 'progress_table':
            return ['developer', 'manager', 'technician', 'viewer'].includes(role);
        default:
            return false;
    }
}

export function getClientId() {
    try {
        const session = getSession();
        return session ? session.client_id : null;
    } catch (error) {
        console.error("🔐 Error getting client ID:", error);
        return null;
    }
}

export function requireRole(requiredRoles) {
    const userRole = getUserRole();
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    if (!roles.includes(userRole)) {
        window.location.href = "/html/dashboard.html";
        return false;
    }
    return true;
}

// Initialize auth on load
(function initAuth() {
    console.log("🔐 Initializing auth system...");
    // Don't redirect immediately - let individual pages handle this
})();
// config.js
// config.js - UPDATED to match your Flask endpoints
const CONFIG = {
  // Automatically determine the API base URL based on environment
  getBackendUrl: function () {
    const hostname = window.location.hostname;

    // 1. Render Testing Environment
    if (hostname === "zyntel-frontend.onrender.com") {
      return "https://labguru-dashboard.onrender.com";
    }
    // 2. PRODUCTION SERVER - Your server IP
    else if (hostname === "192.168.10.198" || hostname === "zyntel.local") {
      return "http://192.168.10.198:5000";
    }
    // 3. Local Development
    else if (hostname === "127.0.0.1" || hostname === "localhost") {
      return "http://127.0.0.1:5000";
    }
    // 4. Default fallback (relative URL)
    else {
      return "";
    }
  },

  // API endpoints configuration - UPDATED to match Flask app
  API_ENDPOINTS: {
    LOGIN: "/api/login",
    HEALTH: "/api/health",
    REFRESH_TOKEN: "/api/refresh_token",
    VALIDATE_TOKEN: "/api/validate_token",
    META: "/api/meta",
    REVENUE: "/api/revenue",
    PERFORMANCE_CHARTS: "/api/performance/charts",
    PERFORMANCE: "/api/performance",
    TRACKER: "/api/tracker",
    PROGRESS: "/api/progress",
    RECEPTION: "/api/reception",
    ADD_USER: "/api/add_user",
    RECEPTION_UPDATE: "/api/reception/update",
    LRIDS: "/api/progress", // Using same endpoint as progress
    CLIENTS: "/api/clients", 
    ADD_CLIENT: "/api/add_client", 
    USERS: "/api/users",
    CHANGE_PASSWORD: "/api/change_password",
    ADMIN_CHANGE_PASSWORD: "/api/admin_change_password",
    TOGGLE_USER_STATUS: "/api/toggle_user_status",
    DELETE_USER: "/api/delete_user",
    REQUEST_PASSWORD_RESET: "/api/request_password_reset",
    RESET_PASSWORD: "/api/reset_password",
    UPDATE_PROFILE: "/api/update_profile",
    ADD_CLIENT: "/api/add_client",
    LAB_SECTIONS: "/api/lab-sections",
    META_BULK_UPDATE: "/api/meta/bulk-update"
  },

  // Utility function for standardized API requests
  apiRequest: function (endpoint, options = {}) {
    const url = `${this.getBackendUrl()}${endpoint}`;

    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
    };

    console.log(`API Request: ${url}`);

    return fetch(url, {
      ...defaultOptions,
      ...options,
    });
  },

  // Helper to get full URL for debugging
  getFullUrl: function (endpoint) {
    return `${this.getBackendUrl()}${endpoint}`;
  },

  // Application settings
  APP_SETTINGS: {
    MAX_LOGIN_ATTEMPTS: 5,
    PASSWORD_MIN_LENGTH: 8,
  },

  // Environment detection helper
  getEnvironment: function () {
    const hostname = window.location.hostname;

    if (hostname === "zyntel-frontend.onrender.com") {
      return "render";
    } else if (hostname === "192.168.10.198" || hostname === "zyntel.local") {
      return "production";
    } else if (hostname === "127.0.0.1" || hostname === "localhost") {
      return "development";
    } else {
      return "unknown";
    }
  },
};

// Make configuration globally available
window.APP_CONFIG = CONFIG;

console.log("🚀 Zyntel App Config loaded:", {
  environment: CONFIG.getEnvironment(),
  backendUrl: CONFIG.getBackendUrl(),
  currentHostname: window.location.hostname,
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = CONFIG;
}
// dashboard.js
// dashboard.js - FIXED VERSION - Correct admin panel links
import {
  checkAuthAndRedirect,
  getToken,
  clearSession,
  getUserRole,
  canAccess,
  isAdmin,
  isManager,
  isTechnician,
  isViewer
} from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  // Immediately check authentication and redirect if needed
  try {
    checkAuthAndRedirect();
  } catch (error) {
    console.error("Auth check failed:", error);
    window.location.href = "./index.html";
    return;
  }

  const userRole = getUserRole();
  
  console.log("🔐 Dashboard - User role:", userRole);
  
  if (!userRole) {
    console.error("No user role found, redirecting to login");
    window.location.href = "./index.html";
    return;
  }
  
  // Update page title based on role
  updatePageTitle(userRole);
  
  // IMMEDIATELY hide/show elements based on role - NO FLASHING
  updateRoleBasedVisibility(userRole);

  // Run it again after DOM is fully ready
  setTimeout(() => {
    console.log("Running final role-based visibility check...");
    updateRoleBasedVisibility(userRole);
  }, 500);

  // Logout functionality
  const logoutButtons = document.querySelectorAll("#logout-button, #logout-button-menu");
  logoutButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      clearSession();
      window.location.href = "../index.html";
    });
  });
});

function updatePageTitle(role) {
  const pageTitle = document.querySelector('.page span');
  if (pageTitle && role) {
    // Show "Developer" instead of "Admin" for developer role
    const displayRole = role === 'developer' ? 'Developer' : role.charAt(0).toUpperCase() + role.slice(1);
    pageTitle.textContent = `${displayRole} Dashboard`;
  }
}

function updateRoleBasedVisibility(role) {
  console.log("🔄 Updating role-based visibility for:", role);
  
  if (!role) {
    console.error("No role provided for visibility update");
    return;
  }
  
  // Handle chart tiles visibility - COMPLETELY HIDDEN for tech/viewer
  const chartTiles = document.querySelectorAll('.dice-tile[data-type="chart"]');
  
  if (isTechnician() || isViewer()) {
    // COMPLETELY HIDE chart tiles for technicians and viewers - NO FLASHING
    chartTiles.forEach(tile => {
      tile.style.display = 'none';
      tile.classList.add('hidden'); // Add hidden class for CSS control
    });
    console.log("📊 COMPLETELY HIDING chart tiles for technician/viewer");
    
    // Also hide any chart containers or sections
    const chartContainers = document.querySelectorAll('.chart-container, .charts-section, [class*="chart"]');
    chartContainers.forEach(container => {
      if (container.closest('.dice-tile[data-type="chart"]')) {
        return; // Skip if already inside a chart tile
      }
      container.style.display = 'none';
      container.classList.add('hidden');
    });
  } else {
    // Show chart tiles for developer and manager
    chartTiles.forEach(tile => {
      tile.style.display = 'flex';
      tile.classList.remove('hidden');
    });
    console.log("📊 Showing chart tiles for developer/manager");
  }
  
  // Handle three-dot menu items - FIXED: All point to admin_panel.html with correct visibility
  const dropdownMenu = document.querySelector('.dropdown-menu');
  if (dropdownMenu) {
    // Clear and rebuild menu based on role
    dropdownMenu.innerHTML = '';
    
    // Admin Panel link - ONLY for developer
    if (isAdmin()) {
      const adminItem = document.createElement('li');
      adminItem.innerHTML = `<a href="admin_panel.html">Admin Panel</a>`;
      dropdownMenu.appendChild(adminItem);
      console.log("🔧 Showing Admin Panel link for developer");
    }
    
    // Add User link - for developer and manager
    if (isAdmin() || isManager()) {
      const addUserItem = document.createElement('li');
      addUserItem.innerHTML = `<a href="admin_panel.html">Add User</a>`;
      dropdownMenu.appendChild(addUserItem);
      console.log("👥 Showing Add User link for developer/manager");
    }
    
    // Always add logout
    const logoutItem = document.createElement('li');
    logoutItem.innerHTML = `<a href="#" id="logout-button-menu">Logout</a>`;
    dropdownMenu.appendChild(logoutItem);
    
    // Re-attach logout listener
    const logoutMenuBtn = document.getElementById('logout-button-menu');
    if (logoutMenuBtn) {
      logoutMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        clearSession();
        window.location.href = "../index.html";
      });
    }
  }
  
  // Special case: if viewer, hide all table tiles except progress
  if (isViewer()) {
    const tableTiles = document.querySelectorAll('.dice-tile[data-type="table"]');
    tableTiles.forEach(tile => {
      if (!tile.href || !tile.href.includes('progress.html')) {
        tile.style.display = 'none';
        tile.classList.add('hidden');
      }
    });
    console.log("📋 Hiding all tables except progress for viewer");
  }
  
  // Hide navigation items based on role
  updateNavigationVisibility(role);
  
  console.log("✅ Role-based visibility update complete");
}

function updateNavigationVisibility(role) {
  // Hide nav items that user cannot access
  const navLinks = document.querySelectorAll('nav a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes('.html')) {
      const pageName = href.split('/').pop().replace('.html', '');
      
      if (!canAccess(pageName)) {
        link.style.display = 'none';
        console.log(`🚫 Hiding nav link: ${pageName}`);
      } else {
        link.style.display = 'flex';
        console.log(`✅ Showing nav link: ${pageName}`);
      }
    }
  });
}

// Add CSS to prevent flashing - inject this into the page
function injectPreventionCSS() {
  const style = document.createElement('style');
  style.textContent = `
    /* Prevent flashing by initially hiding restricted content */
    .dice-tile[data-type="chart"] {
      transition: opacity 0.3s ease;
    }
    
    .hidden {
      display: none !important;
    }
    
    /* Quick hide for unauthorized users */
    body.technician .dice-tile[data-type="chart"],
    body.viewer .dice-tile[data-type="chart"] {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

// Call this immediately
injectPreventionCSS();

// Add body class for role-based CSS control
document.addEventListener('DOMContentLoaded', () => {
  const role = getUserRole();
  if (role) {
    document.body.classList.add(role.toLowerCase());
  }
});
// menu.js
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
// filters-revenue.js
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
// shared_management.js
// shared_management_enhanced.js - Enhanced with pagination and modern features
import { getToken } from "./auth.js";

// GLOBAL STATE FOR PAGINATION
let currentPage = 1;
let pageSize = 20;
let totalPages = 1;
let totalRecords = 0;

// GLOBAL HELPER FUNCTIONS
export function showMessage(element, message, type) {
  const messageElement = typeof element === "string" ? document.getElementById(element) : element;
  if (!messageElement) return;

  // Clear and set content
  messageElement.innerHTML = `
    <div class="message-content">
      <span>${message}</span>
    </div>
  `;
  messageElement.className = `message-box ${type} fade-in`;
  messageElement.classList.remove("hidden");

  // Auto-hide success messages after 5 seconds
  if (type === "success") {
    setTimeout(() => {
      messageElement.classList.add("hidden");
    }, 5000);
  }
}

export function validatePassword(password) {
  const errors = [];
  const hasCapital = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);

  if (password.length < 8) {
    errors.push("at least 8 characters");
  }
  if (!hasCapital) {
    errors.push("at least one capital letter");
  }
  if (!hasNumber) {
    errors.push("at least one number");
  }
  if (!hasSpecial) {
    errors.push("at least one special character");
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      message: "Password must contain " + errors.join(", ") + ".",
    };
  }

  return {
    isValid: true,
    message: "Password is valid.",
  };
}

// PAGINATION FUNCTIONS
export function setupPagination(tableType, loadFunctionName, currentPage, totalPages, totalRecords) {
  const paginationContainer = document.getElementById(`${tableType}Pagination`);
  if (!paginationContainer || totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  paginationContainer.innerHTML = `
    <div class="pagination">
      <button class="pagination-button" onclick="changePage('${tableType}', 1, '${loadFunctionName}')" 
              ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-angle-double-left"></i>
      </button>
      <button class="pagination-button" onclick="changePage('${tableType}', ${currentPage - 1}, '${loadFunctionName}')" 
              ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-angle-left"></i>
      </button>
      
      ${generatePageNumbers(currentPage, totalPages).map(page => 
        page === '...' ? 
          '<span class="pagination-ellipsis">...</span>' :
          `<button class="pagination-button ${page === currentPage ? 'active' : ''}" 
                  onclick="changePage('${tableType}', ${page}, '${loadFunctionName}')">
            ${page}
          </button>`
      ).join('')}
      
      <button class="pagination-button" onclick="changePage('${tableType}', ${currentPage + 1}, '${loadFunctionName}')" 
              ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-angle-right"></i>
      </button>
      <button class="pagination-button" onclick="changePage('${tableType}', ${totalPages}, '${loadFunctionName}')" 
              ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-angle-double-right"></i>
      </button>
      
      <div class="pagination-info">
        Page ${currentPage} of ${totalPages} • ${totalRecords} items
      </div>
      
      <select class="pagination-select" onchange="changePageSize('${tableType}', this.value, '${loadFunctionName}')" style="margin-left: 1rem;">
        <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
        <option value="20" ${pageSize === 20 ? 'selected' : ''}>20</option>
        <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
        <option value="100" ${pageSize === 100 ? 'selected' : ''}>100</option>
      </select>
    </div>
  `;
}

function generatePageNumbers(current, total) {
  const pages = [];
  const maxVisible = 5;
  
  if (total <= maxVisible) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, '...', total);
    } else if (current >= total - 2) {
      pages.push(1, '...', total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
  }
  
  return pages;
}

// Make pagination functions available globally
window.changePage = function(tableType, page, loadFunctionName) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  if (window[loadFunctionName]) {
    window[loadFunctionName]();
  }
};

window.changePageSize = function(tableType, size, loadFunctionName) {
  pageSize = parseInt(size);
  currentPage = 1;
  if (window[loadFunctionName]) {
    window[loadFunctionName]();
  }
};

// Get current pagination state
export function getPaginationState() {
  return { currentPage, pageSize, totalPages, totalRecords };
}

// Set pagination state
export function setPaginationState(state) {
  currentPage = state.currentPage || currentPage;
  pageSize = state.pageSize || pageSize;
  totalPages = state.totalPages || totalPages;
  totalRecords = state.totalRecords || totalRecords;
}

// META DATA FUNCTIONS
export async function loadMetaData() {
  try {
    const token = getToken();
    const response = await fetch(
      `${window.APP_CONFIG.getBackendUrl()}/api/meta?page=${currentPage}&limit=${pageSize}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const result = await response.json();
      
      // Update pagination state
      totalRecords = result.totalRecords || 0;
      totalPages = result.totalPages || 1;
      currentPage = result.currentPage || currentPage;
      
      return { 
        success: true, 
        data: result.data || result || [],
        pagination: {
          currentPage,
          totalPages,
          totalRecords,
          pageSize
        }
      };
    } else {
      const errorText = await response.text();
      console.error(`API Error ${response.status}: ${errorText}`);
      throw new Error(`Failed to load metadata (${response.status})`);
    }
  } catch (error) {
    console.error("Error loading metadata:", error);
    return { success: false, error: error.message };
  }
}

export function renderMetaTable(metaData, tableBodyId, includeClientColumn = false) {
  const tableBody = document.getElementById(tableBodyId);

  if (!metaData || metaData.length === 0) {
    const colSpan = includeClientColumn ? 8 : 7;
    tableBody.innerHTML = `
      <tr>
        <td colspan="${colSpan}" class="text-center empty-state">
          <i class="fas fa-inbox"></i>
          <h3>No test metadata found</h3>
          <p>Click "Add New Test" to get started</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = metaData
    .map(
      (test, index) => `
        <tr class="fade-in" style="animation-delay: ${index * 50}ms">
            <td>
                <input type="checkbox" class="row-selector" data-test-name="${test.test_name || test.TestName}" 
                       data-client-id="${test.client_id || test.ClientID || ''}">
            </td>
            <td>
                <strong>${test.test_name || test.TestName || 'N/A'}</strong>
            </td>
            <td>
                <div class="editable-cell">
                    <input type="number" value="${test.tat || test.TAT || 0}" 
                           onfocus="this.classList.add('editing')"
                           onblur="this.classList.remove('editing'); updateTestField('${test.test_name || test.TestName}', 'tat', this.value, '${test.client_id || test.ClientID || ''}')"
                           class="inline-edit" placeholder="TAT" min="0" step="1" title="Click to edit, blur to save">
                    <span class="unit">min</span>
                    <span class="edit-indicator"><i class="fas fa-pencil-alt"></i> Click to edit</span>
                </div>
            </td>
            <td>
                <div class="editable-cell">
                    <input type="text" value="${test.lab_section || test.LabSection || 'N/A'}" 
                           onfocus="this.classList.add('editing')"
                           onblur="this.classList.remove('editing'); updateTestField('${test.test_name || test.TestName}', 'lab_section', this.value, '${test.client_id || test.ClientID || ''}')"
                           class="inline-edit" placeholder="Lab Section" title="Click to edit, blur to save">
                    <span class="edit-indicator"><i class="fas fa-pencil-alt"></i> Click to edit</span>
                </div>
            </td>
            <td>
                <div class="editable-cell">
                    <input type="number" value="${test.price || test.Price || 0}" 
                           onfocus="this.classList.add('editing')"
                           onblur="this.classList.remove('editing'); updateTestField('${test.test_name || test.TestName}', 'price', this.value, '${test.client_id || test.ClientID || ''}')"
                           class="inline-edit" placeholder="Price" min="0" step="0.01" title="Click to edit, blur to save">
                    <span class="unit">UGX</span>
                    <span class="edit-indicator"><i class="fas fa-pencil-alt"></i> Click to edit</span>
                </div>
            </td>
            ${includeClientColumn ? `
            <td>
                <span class="badge">${test.client_name || test.ClientName || 'Global'}</span>
            </td>
            ` : ''}
            <td>
                <span class="date-badge" title="Last modified">
                    ${test.last_updated ? new Date(test.last_updated).toLocaleDateString() : 'N/A'}
                </span>
            </td>
            <td>
                <button onclick="deleteTest('${test.test_name || test.TestName}', '${test.client_id || test.ClientID || ''}')" 
                        class="btn btn-danger btn-sm" title="Delete test">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
      `
    )
    .join("");
}

// Update test field
export async function updateTestField(testName, field, value, clientId = null) {
  try {
    const token = getToken();
    const payload = {
      test_name: testName,
      [field]: field === 'test_name' ? value : (field === 'tat' || field === 'price' ? parseFloat(value) : value)
    };
    
    if (clientId) {
      payload.client_id = clientId;
    }
    
    const response = await fetch(
      `${window.APP_CONFIG.getBackendUrl()}/api/meta`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.ok) {
      showNotification(`${field.toUpperCase()} updated successfully`, "success", 2000);
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error(`API Error ${response.status}: ${errorText}`);
      showNotification(`Failed to update ${field}`, "error");
      return { success: false };
    }
  } catch (error) {
    console.error("Error updating test field:", error);
    showNotification("Network error updating test", "error");
    return { success: false };
  }
}

// Delete test
export async function deleteTest(testName, clientId = null) {
  if (!confirm(`Delete test "${testName}"?`)) {
    return { success: false };
  }

  try {
    const token = getToken();
    let url = `${window.APP_CONFIG.getBackendUrl()}/api/meta?test_name=${encodeURIComponent(testName)}`;
    
    if (clientId) {
      url += `&client_id=${encodeURIComponent(clientId)}`;
    }
    
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      showNotification("Test deleted successfully", "success");
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error(`API Error ${response.status}: ${errorText}`);
      showNotification("Failed to delete test", "error");
      return { success: false };
    }
  } catch (error) {
    console.error("Error deleting test:", error);
    showNotification("Network error deleting test", "error");
    return { success: false };
  }
}

// Show/Hide Add Test Form
export function showAddTestForm() {
  const form = document.getElementById("addTestForm");
  if (form) {
    form.classList.remove("hidden");
    // Focus first input
    const firstInput = form.querySelector('input');
    if (firstInput) firstInput.focus();
  }
}

export function hideAddTestForm() {
  const form = document.getElementById("addTestForm");
  if (form) {
    form.classList.add("hidden");
    form.reset();
  }
}

// Add new test
export async function addNewTest(testData) {
  try {
    const token = getToken();
    const response = await fetch(
      `${window.APP_CONFIG.getBackendUrl()}/api/meta`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(testData),
      }
    );

    if (response.ok) {
      showNotification("Test added successfully", "success");
      return { success: true };
    } else {
      const errorData = await response.json();
      showNotification(errorData.error || "Failed to add test", "error");
      return { success: false };
    }
  } catch (error) {
    console.error("Error adding test:", error);
    showNotification("Network error adding test", "error");
    return { success: false };
  }
}

// Load data quality
export async function loadDataQuality() {
  try {
    const token = getToken();
    const response = await fetch(
      `${window.APP_CONFIG.getBackendUrl()}/api/meta/quality`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.error(`API Error ${response.status}: ${errorText}`);
      throw new Error(`Failed to load data quality (${response.status})`);
    }
  } catch (error) {
    console.error("Error loading data quality:", error);
    return { success: false, error: error.message };
  }
}

// Render data quality
export function renderDataQuality(qualityData) {
  const container = document.getElementById("dataQualityContainer");
  if (!container) return;

  if (!qualityData) {
    container.innerHTML = '<p>No quality data available</p>';
    return;
  }

  container.innerHTML = `
    <div class="quality-stats">
      <div class="stat-card">
        <h4>Total Tests</h4>
        <p class="stat-value">${qualityData.total_tests || 0}</p>
      </div>
      <div class="stat-card">
        <h4>Missing TAT</h4>
        <p class="stat-value ${qualityData.missing_tat > 0 ? 'warning' : 'success'}">${qualityData.missing_tat || 0}</p>
      </div>
      <div class="stat-card">
        <h4>Missing Price</h4>
        <p class="stat-value ${qualityData.missing_price > 0 ? 'warning' : 'success'}">${qualityData.missing_price || 0}</p>
      </div>
      <div class="stat-card">
        <h4>Duplicates</h4>
        <p class="stat-value ${qualityData.duplicates > 0 ? 'error' : 'success'}">${qualityData.duplicates || 0}</p>
      </div>
    </div>
  `;
}

// Load clients for select dropdown
export async function loadClientsForSelect(selectElementId) {
  try {
    const token = getToken();
    const response = await fetch(
      `${window.APP_CONFIG.getBackendUrl()}/api/clients`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const clients = await response.json();
      const selectElement = document.getElementById(selectElementId);
      
      if (selectElement) {
        // Keep the first option
        const firstOption = selectElement.options[0];
        selectElement.innerHTML = '';
        if (firstOption) selectElement.appendChild(firstOption);
        
        // Add client options
        clients.forEach(client => {
          const option = document.createElement("option");
          option.value = client.client_id || client.ClientID;
          option.textContent = client.client_name || client.ClientName;
          selectElement.appendChild(option);
        });
      }
      
      return { success: true, data: clients };
    } else {
      throw new Error("Failed to load clients");
    }
  } catch (error) {
    console.error("Error loading clients:", error);
    return { success: false, error: error.message };
  }
}

// Initialize password toggles
export function initializePasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', function() {
      const input = this.previousElementSibling;
      const icon = this.querySelector('i');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });
}

// Show notification
export function showNotification(message, type = 'info', duration = 4000) {
  // Create notification container if it doesn't exist
  let container = document.getElementById('notificationContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationContainer';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
    `;
    document.body.appendChild(container);
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    background: ${type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 
                 type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 
                 type === 'warning' ? 'rgba(245, 158, 11, 0.9)' : 
                 'rgba(59, 130, 246, 0.9)'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    animation: slideIn 0.3s ease-out;
    transition: all 0.3s ease;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <i class="fas fa-${type === 'success' ? 'check-circle' : 
                      type === 'error' ? 'times-circle' : 
                      type === 'warning' ? 'exclamation-triangle' : 
                      'info-circle'}"></i>
      <span>${message}</span>
    </div>
    <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; padding: 4px;">
      <i class="fas fa-times"></i>
    </button>
  `;

  container.appendChild(notification);

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
  }
}

// MODAL MANAGEMENT
export function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

export function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// BULK ACTIONS
export function setupBulkActions(tableId, actions) {
  const table = document.querySelector(`#${tableId}`);
  if (!table) return;

  // Add select all functionality
  const selectAll = document.querySelector(`#selectAll${tableId.replace('TableBody', '')}`);
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      const checkboxes = table.querySelectorAll('.row-selector');
      checkboxes.forEach(cb => cb.checked = e.target.checked);
    });
  }

  // Update selected count
  table.addEventListener('change', () => {
    const selected = table.querySelectorAll('.row-selector:checked');
    const countElement = document.getElementById(`${tableId.replace('TableBody', '')}SelectedCount`);
    if (countElement) {
      countElement.textContent = selected.length;
    }
  });
}

// Make functions available globally for inline HTML event handlers
window.updateTestField = async function(testName, field, value, clientId = null) {
  const result = await updateTestField(testName, field, value, clientId);
  if (!result.success) {
    // Reload to reset values
    if (window.loadMetaData) {
      window.loadMetaData();
    }
  }
};

window.deleteTest = async function(testName, clientId = null) {
  const result = await deleteTest(testName, clientId);
  if (result.success) {
    // Refresh the metadata table
    if (window.loadMetaData) {
      window.loadMetaData();
    }
  }
};

window.quickAddTest = function(testName) {
  if (!testName) return;
  
  const tat = prompt(`Enter TAT (minutes) for "${testName}":`, "120");
  const labSection = prompt(`Enter Lab Section for "${testName}":`, "GENERAL");
  const price = prompt(`Enter price for "${testName}":`, "0");

  if (tat && labSection && price) {
    // For developers, they might need to select client
    const clientSelect = document.getElementById("newTestClient");
    const clientId = clientSelect ? clientSelect.value : null;
    
    const testData = {
      test_name: testName.toUpperCase(),
      tat: parseFloat(tat),
      lab_section: labSection.toUpperCase(),
      price: parseFloat(price)
    };
    
    if (clientId) {
      testData.client_id = clientId;
    }
    
    // Use the existing addNewTest function
    addNewTest(testData).then(result => {
      if (result.success) {
        if (window.loadMetaData) {
          window.loadMetaData();
        }
        hideAddTestForm();
      }
    });
  }
};

// LAB SECTION MANAGEMENT FUNCTIONS
export async function loadLabSections() {
  try {
    const token = getToken();
    const response = await fetch(
      `${window.APP_CONFIG.getBackendUrl()}/api/meta/lab-sections`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const sections = await response.json();
      return { success: true, data: sections };
    } else if (response.status === 404) {
      // If endpoint doesn't exist, use hardcoded list
      const defaultSections = [
        "HEMATOLOGY", "BIOCHEMISTRY", "MICROBIOLOGY", 
        "SEROLOGY", "GENERAL", "IMMUNOLOGY", 
        "HISTOPATHOLOGY", "MOLECULAR"
      ];
      return { success: true, data: defaultSections };
    } else {
      const errorText = await response.text();
      throw new Error(`Failed to load lab sections (${response.status})`);
    }
  } catch (error) {
    console.error("Error loading lab sections:", error);
    return { success: false, error: error.message };
  }
}

export function showLabSectionManager() {
  const manager = document.getElementById("labSectionManager");
  if (manager) {
    manager.classList.remove("hidden");
    // Load lab sections
    loadLabSections().then(result => {
      if (result.success) {
        renderLabSections(result.data);
        updateLabSectionSelect(result.data);
      }
    });
  }
}

export function hideLabSectionManager() {
  const manager = document.getElementById("labSectionManager");
  if (manager) {
    manager.classList.add("hidden");
  }
}

export function renderLabSections(sections) {
  const container = document.getElementById("labSectionList");
  if (!container) return;

  if (!sections || sections.length === 0) {
    container.innerHTML = '<p>No lab sections found.</p>';
    return;
  }

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
      ${sections.map(section => `
        <div style="padding: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
          <span>${section}</span>
          <button onclick="updateLabSection('${section}')" 
                  style="background: #ffc107; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">
            <i class="fas fa-edit"></i>
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

export function updateLabSectionSelect(sections) {
  const select = document.getElementById("newTestSection");
  if (!select) return;

  // Keep the first option (Select Lab Section)
  const firstOption = select.options[0];
  select.innerHTML = '';
  if (firstOption) select.appendChild(firstOption);
  
  // Add all sections
  sections.forEach(section => {
    const option = document.createElement("option");
    option.value = section;
    option.textContent = section;
    select.appendChild(option);
  });
}

// Make lab section functions available globally
window.showLabSectionManager = showLabSectionManager;
window.hideLabSectionManager = hideLabSectionManager;
// admin_panel.js
// admin_panel.js - COMPLETELY FIXED - All bugs resolved
import {
  checkAuthAndRedirect,
  getToken,
  clearSession,
  getUserRole,
  isAdmin,
  isManager
} from "./auth.js";
import {
  showMessage,
  validatePassword,
  initializePasswordToggles,
  showNotification,
  showModal,
  hideModal
} from "./shared_management.js";

// Global state
let allMetaData = [];
let filteredMetaData = [];
let allUsers = [];
let filteredUsers = [];
let labSections = [];
let currentTab = 'users';

// Pagination state
let metaPage = 1;
let metaPageSize = 50;
let usersPage = 1;
let usersPageSize = 50;

// Client ID - NULL for most operations (no foreign key constraint)
let CLIENT_ID = null;

document.addEventListener("DOMContentLoaded", async () => {
  checkAuthAndRedirect();
  
  const userRole = getUserRole();
  if (!isAdmin() && !isManager()) {
    window.location.href = "./dashboard.html";
    return;
  }

  // Get user's client_id from token/session if available
  try {
    const token = getToken();
    const response = await fetch(`${window.APP_CONFIG.getBackendUrl()}/api/validate_token`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) {
      const userData = await response.json();
      if (userData.client_id) {
        CLIENT_ID = parseInt(userData.client_id);
      }
    }
  } catch (error) {
    console.log("Could not fetch user client_id, using null:", CLIENT_ID);
  }

  await initializeAdminPanel();
});

async function initializeAdminPanel() {
  initializeTabs();
  initializeEventListeners();
  setupPasswordToggles(); // FIX: Proper password toggle setup
  await loadInitialData();
  setupKeyboardShortcuts();
  
  // Hide client ID field for non-developers
  if (!isAdmin()) {
    const clientIdGroup = document.getElementById("newClientId")?.closest('.form-group');
    if (clientIdGroup) clientIdGroup.style.display = 'none';
  }
}

function setupPasswordToggles() {
  // Setup all password toggle buttons
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const inputId = this.getAttribute('data-target');
      const input = document.getElementById(inputId);
      const icon = this.querySelector('i');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });
}

function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      button.classList.add('active');
      document.getElementById(tabId).classList.add('active');
      
      currentTab = tabId;
      
      if (tabId === 'metadata' && allMetaData.length === 0) {
        loadMetaData();
      } else if (tabId === 'sections' && labSections.length === 0) {
        loadLabSections();
      }
    });
  });
  
  if (tabButtons.length > 0) {
    tabButtons[0].click();
  }
}

async function loadInitialData() {
  try {
    await loadUsers();
  } catch (error) {
    console.error("Error loading initial data:", error);
    showNotification("Error loading data", "error");
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      const searchInput = document.querySelector('.search-input');
      if (searchInput) searchInput.focus();
    }
    
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal.active');
      if (activeModal) {
        hideModal(activeModal.id);
      }
    }
  });
}

function initializeEventListeners() {
  // Add User Form
  const addUserForm = document.getElementById("addUserForm");
  if (addUserForm) {
    addUserForm.addEventListener("submit", handleAddUser);
  }

  // Add Test Form
  const addTestForm = document.getElementById("addTestForm");
  if (addTestForm) {
    addTestForm.addEventListener("submit", handleAddTest);
  }

  // Add Section Form
  const addSectionForm = document.getElementById("addSectionForm");
  if (addSectionForm) {
    addSectionForm.addEventListener("submit", handleAddSection);
  }

  // Search inputs
  const userSearchInput = document.getElementById("userSearch");
  if (userSearchInput) {
    userSearchInput.addEventListener("input", (e) => {
      searchUsers(e.target.value);
    });
  }

  const metaSearchInput = document.getElementById("metaSearch");
  if (metaSearchInput) {
    metaSearchInput.addEventListener("input", (e) => {
      searchMetaData(e.target.value);
    });
  }

  const sectionFilter = document.getElementById("sectionFilter");
  if (sectionFilter) {
    sectionFilter.addEventListener("change", (e) => {
      filterBySection(e.target.value);
    });
  }

  // Logout
  const logoutButtons = document.querySelectorAll("#logout-button, #logout-button-menu");
  logoutButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      clearSession();
      window.location.href = "../index.html";
    });
  });

  initializePasswordModals();
}

function initializePasswordModals() {
  const ownPasswordForm = document.getElementById("ownPasswordForm");
  if (ownPasswordForm) {
    ownPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById("ownCurrentPassword").value;
      const newPassword = document.getElementById("ownNewPassword").value;
      const confirmPassword = document.getElementById("ownConfirmPassword").value;

      if (newPassword !== confirmPassword) {
        showNotification("Passwords do not match", "error");
        return;
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        showNotification(passwordValidation.message, "error");
        return;
      }

      try {
        const token = getToken();
        const response = await fetch(
          `${window.APP_CONFIG.getBackendUrl()}/api/update_profile`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              current_password: currentPassword,
              new_password: newPassword,
            }),
          }
        );

        const result = await response.json();

        if (response.ok) {
          showNotification("Password changed successfully!", "success");
          hideModal("ownPasswordModal");
          ownPasswordForm.reset();
        } else {
          showNotification(result.error || "Failed to change password.", "error");
        }
      } catch (error) {
        console.error("Error changing password:", error);
        showNotification("Network error or server unreachable.", "error");
      }
    });
  }

  const adminPasswordForm = document.getElementById("adminPasswordForm");
  if (adminPasswordForm) {
    adminPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userId = document.getElementById("adminPwUserId").value;
      const newPassword = document.getElementById("adminNewPassword").value;
      const confirmPassword = document.getElementById("adminConfirmPassword").value;

      if (newPassword !== confirmPassword) {
        showNotification("Passwords do not match", "error");
        return;
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        showNotification(passwordValidation.message, "error");
        return;
      }

      try {
        const token = getToken();
        const response = await fetch(
          `${window.APP_CONFIG.getBackendUrl()}/api/admin_change_password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              user_id: parseInt(userId),
              new_password: newPassword,
            }),
          }
        );

        const result = await response.json();

        if (response.ok) {
          showNotification("Password changed successfully!", "success");
          hideModal("adminPasswordModal");
          adminPasswordForm.reset();
        } else {
          showNotification(result.error || "Failed to change password.", "error");
        }
      } catch (error) {
        console.error("Error changing password:", error);
        showNotification("Network error or server unreachable.", "error");
      }
    });
  }
}

// ========== USER MANAGEMENT ==========

async function loadUsers() {
  try {
    const token = getToken();
    const response = await fetch(
      `${window.APP_CONFIG.getBackendUrl()}/api/users`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      allUsers = await response.json();
      filteredUsers = [...allUsers];
      renderUsers();
    } else {
      showNotification("Failed to load users", "error");
    }
  } catch (error) {
    console.error("Error loading users:", error);
    showNotification("Network error loading users", "error");
  }
}

function searchUsers(query) {
  if (!query.trim()) {
    filteredUsers = [...allUsers];
  } else {
    const lowerQuery = query.toLowerCase();
    filteredUsers = allUsers.filter(user =>
      user.username.toLowerCase().includes(lowerQuery) ||
      user.role.toLowerCase().includes(lowerQuery) ||
      (user.client_id && user.client_id.toString().toLowerCase().includes(lowerQuery))
    );
  }
  usersPage = 1;
  renderUsers();
}

function renderUsers() {
  const tableBody = document.getElementById("usersTableBody");
  if (!tableBody) return;

  const start = (usersPage - 1) * usersPageSize;
  const end = start + usersPageSize;
  const paginatedUsers = filteredUsers.slice(start, end);

  if (paginatedUsers.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center empty-state">
          <i class="fas fa-users"></i>
          <h3>No users found</h3>
          <p>Try adjusting your search</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = paginatedUsers.map((user, index) => `
    <tr class="fade-in" style="animation-delay: ${index * 30}ms">
      <td>${user.id}</td>
      <td><strong>${escapeHtml(user.username)}</strong></td>
      <td>
        <span class="badge badge-${getRoleBadgeClass(user.role)}">
          ${user.role}
        </span>
      </td>
      <td>${user.client_id || 'N/A'}</td>
      <td>
        ${user.is_active 
          ? '<span class="status-indicator status-active">Active</span>'
          : '<span class="status-indicator status-inactive">Inactive</span>'
        }
      </td>
      <td>
        <div style="display: flex; gap: 0.5rem;">
          <button onclick="openChangePasswordModal(${user.id}, '${escapeHtml(user.username)}')" 
                  class="btn btn-info btn-sm" title="Change Password">
            <i class="fas fa-key"></i>
          </button>
          <button onclick="toggleUserStatus(${user.id}, ${user.is_active})" 
                  class="btn ${user.is_active ? 'btn-warning' : 'btn-success'} btn-sm" 
                  title="${user.is_active ? 'Deactivate' : 'Activate'}">
            <i class="fas fa-${user.is_active ? 'ban' : 'check'}"></i>
          </button>
          <button onclick="deleteUser(${user.id})" 
                  class="btn btn-danger btn-sm" title="Delete User">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  renderUsersPagination();
}

function renderUsersPagination() {
  const totalPages = Math.ceil(filteredUsers.length / usersPageSize);
  const container = document.getElementById("usersPagination");
  if (!container) return;

  container.innerHTML = `
    <div class="pagination">
      <button class="pagination-button" ${usersPage === 1 ? 'disabled' : ''} 
              onclick="changeUsersPage(${usersPage - 1})">
        <i class="fas fa-chevron-left"></i>
      </button>
      <span class="pagination-info">
        Page ${usersPage} of ${totalPages} (${filteredUsers.length} users)
      </span>
      <button class="pagination-button" ${usersPage === totalPages ? 'disabled' : ''} 
              onclick="changeUsersPage(${usersPage + 1})">
        <i class="fas fa-chevron-right"></i>
      </button>
      <select class="pagination-select" onchange="changeUsersPageSize(this.value)">
        <option value="10" ${usersPageSize === 10 ? 'selected' : ''}>10 per page</option>
        <option value="25" ${usersPageSize === 25 ? 'selected' : ''}>25 per page</option>
        <option value="50" ${usersPageSize === 50 ? 'selected' : ''}>50 per page</option>
        <option value="100" ${usersPageSize === 100 ? 'selected' : ''}>100 per page</option>
      </select>
    </div>
  `;
}

window.changeUsersPage = function(page) {
  usersPage = Math.max(1, Math.min(page, Math.ceil(filteredUsers.length / usersPageSize)));
  renderUsers();
};

window.changeUsersPageSize = function(size) {
  usersPageSize = parseInt(size);
  usersPage = 1;
  renderUsers();
};

async function handleAddUser(e) {
  e.preventDefault();

  const username = document.getElementById("newUsername").value.trim();
  const password = document.getElementById("newPassword").value;
  const role = document.getElementById("newRole").value;
  const clientIdInput = document.getElementById("newClientId");
  
  // FIXED: client_id is always NULL unless user is developer AND specifies it
  let clientId = null;

  if (!username || !password || !role) {
    showNotification("Please fill in all required fields", "error");
    return;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    showNotification(passwordValidation.message, "error");
    return;
  }

  // Only allow developers to set client_id, and only if field is visible and has value
  if (isAdmin() && clientIdInput && clientIdInput.value.trim()) {
    const parsed = parseInt(clientIdInput.value);
    if (!isNaN(parsed)) {
      clientId = parsed;
    }
  }

  try {
    const token = getToken();
    const response = await fetch(
      `${window.APP_CONFIG.getBackendUrl()}/api/add_user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          password,
          role,
          client_id: clientId // Will be null for most cases
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      showNotification(`User "${username}" added successfully!`, "success");
      document.getElementById("addUserForm").reset();
      hideModal("addUserModal");
      await loadUsers();
    } else {
      showNotification(result.error || "Failed to add user", "error");
    }
  } catch (error) {
    console.error("Error adding user:", error);
    showNotification("Network error adding user", "error");
  }
}

window.openChangePasswordModal = function(userId, username) {
  document.getElementById("adminPwUserId").value = userId;
  document.getElementById("adminPwUsername").textContent = username;
  showModal("adminPasswordModal");
};

window.toggleUserStatus = async function(userId, currentStatus) {
  try {
    const token = getToken();
    const response = await fetch(
      `${window.APP_CONFIG.getBackendUrl()}/api/toggle_user_status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      }
    );

    if (response.ok) {
      showNotification(
        `User ${currentStatus ? 'deactivated' : 'activated'} successfully`,
        "success"
      );
      await loadUsers();
    } else {
      showNotification("Failed to toggle user status", "error");
    }
  } catch (error) {
    console.error("Error toggling user status:", error);
    showNotification("Network error", "error");
  }
};

window.deleteUser = async function(userId) {
  if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
    return;
  }

  try {
    const token = getToken();
    const response = await fetch(
      `${window.APP_CONFIG.getBackendUrl()}/api/delete_user`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      }
    );

    if (response.ok) {
      showNotification("User deleted successfully", "success");
      await loadUsers();
    } else {
      showNotification("Failed to delete user", "error");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    showNotification("Network error", "error");
  }
};

// ========== METADATA MANAGEMENT ==========

async function loadMetaData() {
  try {
    const token = getToken();
    // FIXED: Don't send client_id parameter, let backend handle it
    const response = await fetch(
      `${window.APP_CONFIG.getBackendUrl()}/api/meta`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      allMetaData = await response.json();
      filteredMetaData = [...allMetaData];
      populateSectionFilter();
      renderMetaData();
    } else {
      showNotification("Failed to load metadata", "error");
    }
  } catch (error) {
    console.error("Error loading metadata:", error);
    showNotification("Network error loading metadata", "error");
  }
}

window.loadMetaData = loadMetaData;

function populateSectionFilter() {
  const sectionFilter = document.getElementById("sectionFilter");
  if (!sectionFilter) return;

  const uniqueSections = [...new Set(allMetaData.map(item => item.section).filter(Boolean))];
  uniqueSections.sort();

  sectionFilter.innerHTML = `
    <option value="">All Sections</option>
    ${uniqueSections.map(section => `<option value="${section}">${section}</option>`).join('')}
  `;
}

function searchMetaData(query) {
  if (!query.trim()) {
    filteredMetaData = [...allMetaData];
  } else {
    const lowerQuery = query.toLowerCase();
    filteredMetaData = allMetaData.filter(item =>
      (item.test_name && item.test_name.toLowerCase().includes(lowerQuery)) ||
      (item.section && item.section.toLowerCase().includes(lowerQuery)) ||
      (item.tat && item.tat.toString().includes(lowerQuery)) ||
      (item.price && item.price.toString().includes(lowerQuery))
    );
  }
  metaPage = 1;
  renderMetaData();
}

function filterBySection(section) {
  if (!section) {
    filteredMetaData = [...allMetaData];
  } else {
    filteredMetaData = allMetaData.filter(item => item.section === section);
  }
  metaPage = 1;
  renderMetaData();
}

function renderMetaData() {
  const tableBody = document.getElementById("metaTableBody");
  if (!tableBody) return;

  const start = (metaPage - 1) * metaPageSize;
  const end = start + metaPageSize;
  const paginatedData = filteredMetaData.slice(start, end);

  if (paginatedData.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center empty-state">
          <i class="fas fa-flask"></i>
          <h3>No tests found</h3>
          <p>Try adjusting your search or add a new test</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = paginatedData.map((item, index) => `
    <tr class="fade-in" style="animation-delay: ${index * 30}ms">
      <td>${item.id}</td>
      <td>
        <strong>${escapeHtml(item.test_name)}</strong>
      </td>
      <td>
        <span class="badge badge-secondary">${item.section || 'N/A'}</span>
      </td>
      <td>
        <div class="editable-cell">
          <input type="number" value="${item.tat || 0}" 
                 class="inline-edit" min="0"
                 onchange="updateTestField('${escapeHtml(item.test_name)}', 'tat', this.value)">
          <span class="unit">min</span>
        </div>
      </td>
      <td>
        <div class="editable-cell">
          <input type="number" value="${item.price || 0}" 
                 class="inline-edit" min="0" step="0.01"
                 onchange="updateTestField('${escapeHtml(item.test_name)}', 'price', this.value)">
          <span class="unit">UGX</span>
        </div>
      </td>
      <td>
        <button onclick="deleteTest('${escapeHtml(item.test_name)}')" 
                class="btn btn-danger btn-sm" title="Delete Test">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join("");

  renderMetaPagination();
}

function renderMetaPagination() {
  const totalPages = Math.ceil(filteredMetaData.length / metaPageSize);
  const container = document.getElementById("metaPagination");
  if (!container) return;

  container.innerHTML = `
    <div class="pagination">
      <button class="pagination-button" ${metaPage === 1 ? 'disabled' : ''} 
              onclick="changeMetaPage(${metaPage - 1})">
        <i class="fas fa-chevron-left"></i>
      </button>
      <span class="pagination-info">
        Page ${metaPage} of ${totalPages} (${filteredMetaData.length} tests)
      </span>
      <button class="pagination-button" ${metaPage === totalPages ? 'disabled' : ''} 
              onclick="changeMetaPage(${metaPage + 1})">
        <i class="fas fa-chevron-right"></i>
      </button>
      <select class="pagination-select" onchange="changeMetaPageSize(this.value)">
        <option value="25" ${metaPageSize === 25 ? 'selected' : ''}>25 per page</option>
        <option value="50" ${metaPageSize === 50 ? 'selected' : ''}>50 per page</option>
        <option value="100" ${metaPageSize === 100 ? 'selected' : ''}>100 per page</option>
        <option value="200" ${metaPageSize === 200 ? 'selected' : ''}>200 per page</option>
      </select>
    </div>
  `;
}

window.changeMetaPage = function(page) {
  metaPage = Math.max(1, Math.min(page, Math.ceil(filteredMetaData.length / metaPageSize)));
  renderMetaData();
};

window.changeMetaPageSize = function(size) {
  metaPageSize = parseInt(size);
  metaPage = 1;
  renderMetaData();
};

window.updateTestField = async function(testName, field, value) {
  try {
    const token = getToken();
    const response = await fetch(
      `${window.APP_CONFIG.getBackendUrl()}/api/meta`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          test_name: testName,
          [field]: parseFloat(value)
        }),
      }
    );

    if (response.ok) {
      showNotification(`${field.toUpperCase()} updated successfully`, "success");
      await loadMetaData();
    } else {
      showNotification(`Failed to update ${field}`, "error");
    }
  } catch (error) {
    console.error(`Error updating ${field}:`, error);
    showNotification("Network error", "error");
  }
};

window.deleteTest = async function(testName) {
  if (!confirm("Delete this test? This action cannot be undone.")) return;

  try {
    const token = getToken();
    const response = await fetch(
      `${window.APP_CONFIG.getBackendUrl()}/api/meta?test_name=${encodeURIComponent(testName)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      showNotification("Test deleted successfully", "success");
      await loadMetaData();
    } else {
      showNotification("Failed to delete test", "error");
    }
  } catch (error) {
    console.error("Error deleting test:", error);
    showNotification("Network error", "error");
  }
};

async function handleAddTest(e) {
  e.preventDefault();

  const testName = document.getElementById("newTestName").value.trim();
  const tat = parseInt(document.getElementById("newTestTAT").value);
  const section = document.getElementById("newTestSection").value.trim();
  const price = parseFloat(document.getElementById("newTestPrice").value);

  if (!testName || !tat || !section || price === undefined) {
    showNotification("Please fill in all fields", "error");
    return;
  }

  try {
    const token = getToken();
    const response = await fetch(
      `${window.APP_CONFIG.getBackendUrl()}/api/meta`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          test_name: testName,
          tat,
          section,
          price
        }),
      }
    );

    if (response.ok) {
      showNotification("Test added successfully!", "success");
      document.getElementById("addTestForm").reset();
      hideModal("addTestModal");
      await loadMetaData();
      await loadLabSections();
    } else {
      const result = await response.json();
      showNotification(result.error || "Failed to add test", "error");
    }
  } catch (error) {
    console.error("Error adding test:", error);
    showNotification("Network error", "error");
  }
}

// ========== LAB SECTIONS MANAGEMENT ==========

async function loadLabSections() {
  try {
    const token = getToken();
    const response = await fetch(
      `${window.APP_CONFIG.getBackendUrl()}/api/lab-sections`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      labSections = await response.json();
      renderLabSections();
    } else {
      showNotification("Failed to load lab sections", "error");
    }
  } catch (error) {
    console.error("Error loading lab sections:", error);
    showNotification("Network error loading sections", "error");
  }
}

function renderLabSections() {
  const tableBody = document.getElementById("labSectionsTableBody");
  if (!tableBody) return;

  if (labSections.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center empty-state">
          <i class="fas fa-flask"></i>
          <h3>No lab sections found</h3>
          <p>Add your first lab section</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = labSections.map((section, index) => `
    <tr class="fade-in" style="animation-delay: ${index * 30}ms">
      <td>${section.id || index + 1}</td>
      <td>
        <div class="editable-cell">
          <input type="text" value="${escapeHtml(section.name)}" 
                 class="inline-edit"
                 onchange="updateLabSection('${escapeHtml(section.name)}', 'name', this.value)">
        </div>
      </td>
      <td>
        <div class="editable-cell">
          <input type="text" value="${escapeHtml(section.description || '')}" 
                 class="inline-edit"
                 onchange="updateLabSection('${escapeHtml(section.name)}', 'description', this.value)">
        </div>
      </td>
      <td>
        <span class="badge">${section.test_count || 0} tests</span>
      </td>
      <td>
        <button onclick="deleteLabSection('${escapeHtml(section.name)}')" 
                class="btn btn-danger btn-sm" title="Delete Section">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join("");
}

async function handleAddSection(e) {
  e.preventDefault();

  const name = document.getElementById("newSectionName").value.trim().toUpperCase();
  const description = document.getElementById("newSectionDescription").value.trim();

  if (!name) {
    showNotification("Section name is required", "error");
    return;
  }

  try {
    const token = getToken();
    const response = await fetch(
      `${window.APP_CONFIG.getBackendUrl()}/api/lab-sections`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description
        }),
      }
    );

    if (response.ok) {
      showNotification("Lab section added successfully!", "success");
      document.getElementById("addSectionForm").reset();
      hideModal("addSectionModal");
      await loadLabSections();
      populateSectionFilter();
    } else {
      const result = await response.json();
      showNotification(result.error || "Failed to add section", "error");
    }
  } catch (error) {
    console.error("Error adding section:", error);
    showNotification("Network error", "error");
  }
}

window.updateLabSection = async function(oldName, field, value) {
  try {
    const token = getToken();
    const response = await fetch(
      `${window.APP_CONFIG.getBackendUrl()}/api/lab-sections`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_name: oldName,
          [field]: value
        }),
      }
    );

    if (response.ok) {
      showNotification("Section updated successfully", "success");
      await loadLabSections();
      populateSectionFilter();
    } else {
      showNotification("Failed to update section", "error");
    }
  } catch (error) {
    console.error("Error updating section:", error);
    showNotification("Network error", "error");
  }
};

window.deleteLabSection = async function(name) {
  if (!confirm("Delete this lab section? Tests in this section will not be deleted.")) return;

  try {
    const token = getToken();
    const response = await fetch(
      `${window.APP_CONFIG.getBackendUrl()}/api/lab-sections?name=${encodeURIComponent(name)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      showNotification("Section deleted successfully", "success");
      await loadLabSections();
      populateSectionFilter();
    } else {
      showNotification("Failed to delete section", "error");
    }
  } catch (error) {
    console.error("Error deleting section:", error);
    showNotification("Network error", "error");
  }
};

// ========== UTILITY FUNCTIONS ==========

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getRoleBadgeClass(role) {
  const classes = {
    'developer': 'primary',
    'manager': 'info',
    'technician': 'secondary',
    'viewer': 'secondary'
  };
  return classes[role] || 'secondary';
}

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