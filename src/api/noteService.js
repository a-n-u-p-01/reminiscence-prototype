import apiClient from './apiClient';

export const noteService = {
 async saveDailyEntry(requestBody) {
    const response = await apiClient.post('/entry', requestBody);
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
  },

  /**
   * Synchronizes the customized topic array to the backend data pipeline.
   * Maps precisely onto the @PostMapping("/save/extracted-topic") endpoint.
   * 
   * @param {string[]} topics - The modified list of extracted topic strings.
   */
  async updateExtractedTopics(topics) {
    const response = await apiClient.post('/save/extracted-topic', { topics });
    return response.data;
  }
};