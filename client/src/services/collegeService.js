import { apiClient } from './apiClient';

export const collegeService = {
  /**
   * Search worldwide colleges & universities with filters and pagination
   */
  search: async ({
    query = '',
    country = '',
    state = '',
    city = '',
    institutionType = '',
    page = 1,
    limit = 20,
  } = {}) => {
    return apiClient.get('/colleges/search', {
      params: {
        q: query,
        country: country && country !== 'all' ? country : undefined,
        state: state || undefined,
        city: city || undefined,
        institutionType: institutionType && institutionType !== 'all' ? institutionType : undefined,
        page,
        limit,
      },
    });
  },

  /**
   * Retrieve distinct list of countries with college counts and cities
   */
  getCountries: async () => {
    return apiClient.get('/colleges/countries');
  },

  /**
   * Retrieve single college by MongoDB ObjectId
   */
  getById: async (id) => {
    return apiClient.get(`/colleges/${id}`);
  },

  /**
   * Look up institution by ROR ID or Domain
   */
  lookup: async ({ rorId, domain } = {}) => {
    return apiClient.get('/colleges/lookup', {
      params: { rorId, domain },
    });
  },

  /**
   * Submit a missing college manually (authenticated)
   */
  createManual: async (payload) => {
    return apiClient.post('/colleges', payload);
  },

  /**
   * Administrator verification / rejection workflow
   */
  verify: async (id, status = 'verified') => {
    return apiClient.post(`/colleges/${id}/verify`, { status });
  },
};

export default collegeService;

