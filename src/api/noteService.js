import apiClient from './apiClient';


export const noteService = {
  async saveDailyEntry(text) {
    const response = await apiClient.post('/entry', { text });
    return response.data;
  },

  async getPendingConcepts() {
    const response = await apiClient.get('/pending');
    return response.data || [];
  },

  async getPendingCount() {
    const response = await apiClient.get('/pending/count');

    if (typeof response.data === 'object' && response.data !== null) {
      return response.data.count ?? 0;
    }

    return response.data ?? 0;
  },

  async submitReviewFeedback(conceptId, rating) {
    const response = await apiClient.post(
      `/concepts/${conceptId}/review`,
      { rating }
    );

    return response.data;
  }
};