/**
 * Environment detection utilities
 */

/**
 * Check if the app is running in production mode
 * @returns {boolean} True if in production
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Check if the app is running in development mode
 * @returns {boolean} True if in development
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Check if user API key is required
 * In production, we always require user to provide their own key
 * In development, it's optional (falls back to server env var)
 * @returns {boolean} True if user must provide API key
 */
export const requiresUserApiKey = (): boolean => {
  return isProduction();
};

/**
 * Get the current environment name
 * @returns {string} Environment name
 */
export const getEnvironment = (): string => {
  return process.env.NODE_ENV || 'development';
};

/**
 * Check if we're running on localhost
 * @returns {boolean} True if on localhost
 */
export const isLocalhost = (): boolean => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname === '';
};

/**
 * Get the backend URL based on environment
 * @returns {string} Backend base URL
 */
export const getBackendUrl = (): string => {
  if (isDevelopment() || isLocalhost()) {
    return 'http://localhost:5001';
  }
  
  // In production, assume backend is on same domain
  return window.location.origin;
};

/**
 * Check if API key modal should be shown
 * @returns {boolean} True if modal should be displayed
 */
export const shouldShowApiKeyModal = (): boolean => {
  // Only show in production
  if (!requiresUserApiKey()) {
    return false;
  }
  
  // Check if user already has a valid key in sessionStorage
  const storedKey = sessionStorage.getItem('anthropic_api_key');
  if (storedKey && storedKey.startsWith('sk-ant-api')) {
    return false;
  }
  
  return true;
};