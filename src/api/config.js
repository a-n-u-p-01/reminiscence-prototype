// Centralized environment configuration
export const API_BASE_URL = 'http://localhost:8080/api/v1';

export const ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  STUDY_NOTES: `${API_BASE_URL}/notes`,      // Placeholder for next steps
  REVISIONS: `${API_BASE_URL}/revisions`,    // Placeholder for next steps
};