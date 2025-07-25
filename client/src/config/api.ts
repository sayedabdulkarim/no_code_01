// API Configuration
const getApiUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, the API runs on the same domain
    return window.location.origin;
  }
  // In development, use localhost
  return 'http://localhost:5001';
};

export const API_URL = getApiUrl();
export const SOCKET_URL = API_URL;