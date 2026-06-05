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
  },
  async getConceptsExplorer(page = 1, search = '', sortNewest = true) {
    const response = await apiClient.get('/dashboard/concepts', {
      params: {
        page,
        search: search.trim() || undefined, // Send undefined if empty to skip empty string params
        sortNewest
      }
    });
    return response.data; // Structure: { data: [...], currentPage: 1, totalPages: 1, totalItems: 0 }
  }
};