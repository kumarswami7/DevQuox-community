import { apiClient } from './apiClient';

const API = apiClient;

export const chatService = {
  // Conversations
  getConversations: async () => API.get('/chats/conversations'),
  getUnreadCount: async () => API.get('/chats/unread-count'),
  getProjectConversation: async (projectId) => API.get(`/chats/project/${projectId}`),
  getDirectConversation: async (recipientId) => API.post('/chats/direct', { recipientId }),

  // Messages
  getConversationMessages: async (conversationId, params = {}) =>
    API.get(`/chats/conversations/${conversationId}/messages`, { params }),

  sendMessageToConversation: async (conversationId, data) =>
    API.post(`/chats/conversations/${conversationId}/messages`, data),

  editMessage: async (messageId, data) =>
    API.patch(`/chats/messages/${messageId}`, data),

  deleteMessage: async (messageId, data = {}) =>
    API.delete(`/chats/messages/${messageId}`, { data }),

  markConversationRead: async (conversationId) =>
    API.post(`/chats/conversations/${conversationId}/read`),

  // Backwards compatibility for previous phases
  getMessages: async (targetId, params) => {
    // If targetId is used with conversations endpoint or recipient
    return API.get(`/chats/messages/${targetId}`, { params });
  },
  sendMessage: async (data) => {
    if (data.conversationId) {
      return API.post(`/chats/conversations/${data.conversationId}/messages`, data);
    }
    return API.post('/chats/messages', data);
  },
};

export default chatService;
