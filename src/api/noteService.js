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
    const response = await apiClient.post(`/concepts/${conceptId}/review`, { rating });
    return response.data;
  },

  async updateExtractedTopics(topics) {
    const response = await apiClient.post('/save/extracted-topic', { topics });
    return response.data;
  },

  async upsertConcept(userConceptRequest) {
    const response = await apiClient.post('/concepts/upsert', userConceptRequest);
    return response.data;
  },

  async deleteConcept(conceptId) {
    const response = await apiClient.delete(`/concept/${conceptId}`);
    return response.data;
  },

  async regenerateConcept(conceptId, modelName) {
    const response = await apiClient.post('/concept/regenerate/', null, {
      params: {
        conceptId: conceptId,
        modelName: modelName
      }
    });
    return response.data;
  }
};