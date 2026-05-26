import apiClient from './apiClient';

export const authService = {
  /**
   * Login Request
   */
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data; // Axios stores parsing results directly in .data
  },

  /**
   * Registration Request (Matches your exact backend keys)
   */
  async register(fullName, email, password) {
    const response = await apiClient.post('/auth/register', { fullName, email, password });
    return response.data;
  }
};