import { apiClient } from './apiClient';

export const universityService = {
  /**
   * Search worldwide universities with optional country filtering and pagination
   */
  search: async ({ query = '', country = '', page = 1, limit = 20 } = {}) => {
    return apiClient.get('/universities/search', {
      params: {
        q: query,
        country: country && country !== 'all' ? country : undefined,
        page,
        limit,
      },
    });
  },

  /**
   * Retrieve distinct list of countries with university counts
   */
  getCountries: async () => {
    return apiClient.get('/universities/countries');
  },

  /**
   * Retrieve specific university by ID
   */
  getById: async (id) => {
    return apiClient.get(`/universities/${id}`);
  },

  /**
   * Register a custom / manual university if not found in database
   */
  createManual: async (payload) => {
    return apiClient.post('/universities/manual', payload);
  },

  /**
   * Admin-only: Trigger synchronization from Hipo API
   */
  sync: async (payload) => {
    return apiClient.post('/universities/sync', payload);
  },
};

export default universityService;

