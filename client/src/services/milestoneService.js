import { apiClient } from './apiClient';

const API = apiClient;

export const milestoneService = {
  getProjectMilestones: async (projectId, params) => {
    return API.get(`/projects/${projectId}/milestones`, { params });
  },
  createMilestone: async (projectId, milestoneData) => {
    return API.post(`/projects/${projectId}/milestones`, milestoneData);
  },
  getMilestoneById: async (milestoneId) => {
    return API.get(`/milestones/${milestoneId}`);
  },
  updateMilestone: async (milestoneId, milestoneData) => {
    return API.patch(`/milestones/${milestoneId}`, milestoneData);
  },
  updateMilestoneStatus: async (milestoneId, status) => {
    return API.patch(`/milestones/${milestoneId}/status`, { status });
  },
  deleteMilestone: async (milestoneId) => {
    return API.delete(`/milestones/${milestoneId}`);
  },
  getMilestoneTasks: async (milestoneId) => {
    return API.get(`/milestones/${milestoneId}/tasks`);
  },
};

export default milestoneService;
