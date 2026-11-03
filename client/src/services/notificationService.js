import { apiClient } from './apiClient';

const API = apiClient;

export const notificationService = {
  getNotifications: async (params = {}) => API.get('/notifications', { params }),
  getUnreadCount: async () => API.get('/notifications/unread-count'),
  markRead: async (id) => API.patch(`/notifications/${id}/read`),
  markAllRead: async () => API.patch('/notifications/read-all'),
};

export default notificationService;
