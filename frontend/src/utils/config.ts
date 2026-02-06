export const getBackendUrl = (): string => {
  const hostname = window.location.hostname;

  // Production server
  if (hostname === "192.168.10.198" || hostname === "zyntel.local") {
    return "http://192.168.10.198:5000";
  } 
  // Local development
  else if (hostname === "127.0.0.1" || hostname === "localhost") {
    return "http://127.0.0.1:5000";
  } 
  // Default fallback
  else {
    return "";
  }
};

export const API_BASE_URL = getBackendUrl();