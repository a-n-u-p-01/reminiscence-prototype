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
  },

  
  async verifyOtp(email, otp) {
    // Make sure this matches your backend @RequestBody expected structure
    const response = await apiClient.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  async getVersion() {
    // Make sure this matches your backend @RequestBody expected structure
    const response = await apiClient.get('/auth/version');
    return response.data;
  }
};