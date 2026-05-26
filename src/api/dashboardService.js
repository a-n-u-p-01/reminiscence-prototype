import apiClient from './apiClient';

export const dashboardService = {
  async getHeatmap() {
    const response = await apiClient.get('/dashboard/heatmap');
    // Returns a Key-Value dictionary map: { "2026-05-26": 5, "2026-05-25": 2 }
    return response.data || {};
  },

  async getMetrics() {
    const response = await apiClient.get('/dashboard/metrics');
    return response.data;
  },

  async getActivityDetails(dateStr) {
    const response = await apiClient.get(`/dashboard/activity?date=${dateStr}`);
    return response.data;
  }
};