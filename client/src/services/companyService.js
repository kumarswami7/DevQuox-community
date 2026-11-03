import { apiClient } from './apiClient';

export const companyService = {
  /**
   * Search companies with filtering and pagination
   */
  search: async ({
    q = '',
    country = '',
    industry = '',
    city = '',
    status = '',
    hiring = false,
    page = 1,
    limit = 20,
  } = {}) => {
    return apiClient.get('/companies/search', {
      params: {
        q: q || undefined,
        country: country && country !== 'all' ? country : undefined,
        industry: industry && industry !== 'all' ? industry : undefined,
        city: city || undefined,
        status: status && status !== 'all' ? status : undefined,
        hiring: hiring ? true : undefined,
        page,
        limit,
      },
    });
  },

  /**
   * Lookup single company by domain, name, registration, or Jobiwork ID
   */
  lookup: async ({ domain, name, registration, id } = {}) => {
    return apiClient.get('/companies/lookup', {
      params: { domain, name, registration, id },
    });
  },

  /**
   * Get company details by ObjectId or Jobiwork ID
   */
  getById: async (id) => {
    return apiClient.get(`/companies/${id}`);
  },

  /**
   * Enrich / refresh company metadata directly from Jobiwork API
   */
  enrich: async (id) => {
    return apiClient.post(`/companies/${id}/enrich`);
  },

  /**
   * Get distinct industries with company counts
   */
  getIndustries: async () => {
    return apiClient.get('/companies/industries');
  },

  /**
   * Get distinct countries with company counts
   */
  getCountries: async () => {
    return apiClient.get('/companies/countries');
  },

  /**
   * Submit missing company manually
   */
  create: async (payload) => {
    return apiClient.post('/companies', payload);
  },
};

export default companyService;

