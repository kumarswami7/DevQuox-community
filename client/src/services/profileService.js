import { apiClient } from './apiClient';

const API = apiClient;

export const profileService = {
  getCurrentProfile: async () => {
    return API.get('/profiles/me');
  },
  getMyUser: async () => {
    return API.get('/users/me');
  },
  getPrelaunchPass: async () => {
    return API.get('/users/prelaunch-pass');
  },
  getPrelaunchStats: async () => {
    return API.get('/users/prelaunch-stats');
  },
  updateMyUser: async (data) => {
    return API.patch('/users/me', data);
  },
  deactivateAccount: async () => {
    return API.post('/users/me/deactivate');
  },
  deleteAccount: async (data) => {
    return API.delete('/users/me', { data });
  },
  getProfileById: async (id) => {
    return API.get(`/profiles/${id}`);
  },
  getUserByUsername: async (username) => {
    return API.get(`/users/${username}`);
  },
  updateProfile: async (data) => {
    return API.put('/profiles', data);
  },
  getDevelopers: async () => {
    return API.get('/users/developers');
  },

  // Sub-resource endpoints
  addExperience: async (data) => {
    return API.post('/profiles/experience', data);
  },
  editExperience: async (id, data) => {
    return API.put(`/profiles/experience/${id}`, data);
  },
  deleteExperience: async (id) => {
    return API.delete(`/profiles/experience/${id}`);
  },

  addEducation: async (data) => {
    return API.post('/profiles/education', data);
  },
  editEducation: async (id, data) => {
    return API.put(`/profiles/education/${id}`, data);
  },
  deleteEducation: async (id) => {
    return API.delete(`/profiles/education/${id}`);
  },

  addPortfolioProject: async (data) => {
    return API.post('/profiles/portfolio', data);
  },
  deletePortfolioProject: async (id) => {
    return API.delete(`/profiles/portfolio/${id}`);
  },

  addOpenSource: async (data) => {
    return API.post('/profiles/opensource', data);
  },
  deleteOpenSource: async (id) => {
    return API.delete(`/profiles/opensource/${id}`);
  },

  addReview: async (profileId, data) => {
    return API.post(`/profiles/${profileId}/reviews`, data);
  },

  addCertification: async (data) => {
    return API.post('/profiles/certifications', data);
  },
  editCertification: async (id, data) => {
    return API.put(`/profiles/certifications/${id}`, data);
  },
  deleteCertification: async (id) => {
    return API.delete(`/profiles/certifications/${id}`);
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await API.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export default profileService;
