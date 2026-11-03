import apiClient from './apiClient';

/**
 * Creator Analytics API Service
 *
 * Interfaces with DevConnect backend analytics, performance trends, and telemetry endpoints.
 */
export const analyticsService = {
  /**
   * Fetch 12 main KPI metrics with comparative previous-period changes.
   * @param {string} range - '7d' | '30d' | '90d' | '6m' | '12m' | 'all'
   */
  getOverview: (range = '30d') => {
    return apiClient.get('/analytics/creator/overview', { params: { range } });
  },

  /**
   * Fetch normalized creator content stream across ideas, projects, discussions, etc.
   * @param {Object} params - { category, search, sort, page, limit }
   */
  getContent: (params = {}) => {
    return apiClient.get('/analytics/creator/content', { params });
  },

  /**
   * Fetch day-by-day time-series telemetry for interactive performance charts.
   * @param {string} range - '7d' | '30d' | '90d' | '6m' | '12m' | 'all'
   */
  getTrends: (range = '30d') => {
    return apiClient.get('/analytics/creator/trends', { params: { range } });
  },

  /**
   * Fetch audience engineering profile insights and skills distribution.
   */
  getAudience: () => {
    return apiClient.get('/analytics/creator/audience');
  },

  /**
   * Fetch granular single-item telemetry deep dive.
   * @param {string} id - Content ID
   */
  getContentDetail: (id) => {
    return apiClient.get(`/analytics/content/${id}`);
  },

  /**
   * Fetch feedback reviews and community comments for content inspector.
   * @param {string} id - Content ID
   */
  getComments: (id) => {
    return apiClient.get(`/analytics/content/${id}/comments`);
  },

  /**
   * Batch ingest client telemetry events.
   * @param {Array} events - Array of telemetry event objects
   */
  recordEventsBatch: (events) => {
    return apiClient.post('/analytics/events/batch', { events });
  },

  /**
   * Convert an idea pitch to a full milestone project.
   * @param {string} ideaId
   * @param {string} projectId
   */
  convertIdea: (ideaId, projectId) => {
    return apiClient.post('/analytics/convert-idea', { ideaId, projectId });
  },
};

export default analyticsService;

