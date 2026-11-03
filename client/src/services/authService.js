import { apiClient } from './apiClient';

const API = apiClient;

export const authService = {
  login: async (credentials) => {
    return API.post('/auth/login', credentials);
  },
  register: async (userData) => {
    return API.post('/auth/register', userData);
  },
  logout: async () => {
    return API.post('/auth/logout');
  },
  getMe: async () => {
    return API.get('/auth/me');
  },
  changePassword: async (passwordData) => {
    return API.patch('/auth/change-password', passwordData);
  },
  forgotPassword: async (email) => {
    return API.post('/auth/forgot-password', { email });
  },
  resetPassword: async (data) => {
    return API.post('/auth/reset-password', data);
  },
  googleLogin: async (data) => {
    return API.post('/auth/google', { ...data, intent: 'login' });
  },
  googleRegister: async (data) => {
    return API.post('/auth/google', { ...data, intent: 'register' });
  },
  googleCheck: async (data) => {
    return API.post('/auth/google', { ...data, intent: 'check' });
  },
};

export default authService;
