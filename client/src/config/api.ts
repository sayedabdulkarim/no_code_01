/**
 * API configuration for backend endpoints
 */

// Determine the backend URL based on environment
const getBackendUrl = (): string => {
  // In production, use the same origin (Railway deployment)
  if (process.env.NODE_ENV === 'production') {
    return '';  // Empty string for relative URLs
  }
  
  // In development, use localhost
  return 'http://localhost:5001';
};

// Export the base URL
export const API_BASE_URL = getBackendUrl();

// API endpoint helper
export const apiUrl = (path: string): string => {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

// Export specific endpoints for easy access
export const API_ENDPOINTS = {
  // Project management
  LIST_PROJECTS: apiUrl('/api/list-projects'),
  RUN_PROJECT: apiUrl('/api/run-project'),
  STOP_PROJECT: apiUrl('/api/stop-project'),
  RUNNING_PROJECTS: apiUrl('/api/running-projects'),
  INITIALIZE_PROJECT: apiUrl('/api/initialize-project'),
  UPDATE_PROJECT: apiUrl('/api/update-project'),
  UPDATE_PROJECT_V2: apiUrl('/api/update-project-v2'),
  CLEAR_PROJECT_HISTORY: (projectName: string) => apiUrl(`/api/clear-project-history/${projectName}`),
  PROJECT_PROGRESS: (projectName: string) => apiUrl(`/api/project-progress/${projectName}`),
  PROJECT_FILES: (projectName: string) => apiUrl(`/api/project-files/${projectName}`),
  PROJECT_FILE: (projectName: string, filePath: string) => apiUrl(`/api/project-file/${projectName}/${filePath}`),
  DOWNLOAD_PROJECT: (projectName: string) => apiUrl(`/api/download-project/${projectName}`),
  
  // Generation
  GENERATE_PRD: apiUrl('/generate-prd'),
  APPROVE_PRD: apiUrl('/approve-prd'),
  
  // Utilities
  FIX_COMMAND: apiUrl('/api/fix-command'),
  FIX_PAGE_INTEGRATION: apiUrl('/api/fix-page-integration'),
  
  // API Key validation
  VALIDATE_API_KEY: apiUrl('/api/validate-api-key'),
  
  // Proxy
  OPENROUTER_PROXY: apiUrl('/api/proxy/openrouter'),
};