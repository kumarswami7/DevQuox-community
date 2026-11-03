import { apiClient } from './apiClient';

const API = apiClient;

export const taskService = {
  getProjectTasks: async (projectId, params) => {
    return API.get(`/projects/${projectId}/tasks`, { params });
  },
  createTask: async (projectId, taskData) => {
    return API.post(`/projects/${projectId}/tasks`, taskData);
  },
  getTaskById: async (taskId) => {
    return API.get(`/tasks/${taskId}`);
  },
  updateTask: async (taskId, taskData) => {
    return API.patch(`/tasks/${taskId}`, taskData);
  },
  updateTaskStatus: async (taskId, status, note) => {
    return API.patch(`/tasks/${taskId}/status`, { status, note });
  },
  deleteTask: async (taskId) => {
    return API.delete(`/tasks/${taskId}`);
  },
  getMyTasks: async (params) => {
    return API.get('/tasks/my-tasks', { params });
  },
};

export default taskService;
