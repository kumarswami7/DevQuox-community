import { apiClient } from './apiClient';

const API = apiClient;

export const projectService = {
  getProjects: async (params) => {
    return API.get('/projects', { params });
  },
  getAllProjects: async (params) => {
    return API.get('/projects', { params });
  },
  getProjectById: async (id) => {
    return API.get(`/projects/${id}`);
  },
  getMyProjects: async () => {
    return API.get('/projects/my-projects');
  },
  createProject: async (projectData) => {
    return API.post('/projects', projectData);
  },
  updateProject: async (id, projectData) => {
    return API.patch(`/projects/${id}`, projectData);
  },
  deleteProject: async (id) => {
    return API.delete(`/projects/${id}`);
  },
  applyToProject: async (id, applicationData) => {
    return API.post(`/projects/${id}/applications`, applicationData || {});
  },
  getMyApplications: async () => {
    return API.get('/projects/my-applications');
  },
  getMyApplicationForProject: async (projectId) => {
    return API.get(`/projects/${projectId}/applications/me`);
  },
  withdrawMyApplication: async (projectId) => {
    return API.delete(`/projects/${projectId}/applications/me`);
  },
  withdrawApplicationById: async (applicationId) => {
    return API.delete(`/applications/${applicationId}`);
  },
  getProjectApplications: async (projectId) => {
    return API.get(`/projects/${projectId}/applications`);
  },
  getApplicationById: async (applicationId) => {
    return API.get(`/applications/${applicationId}`);
  },
  updateApplicationStatus: async (applicationId, { status, decisionReason }) => {
    return API.patch(`/applications/${applicationId}/status`, { status, decisionReason });
  },
  shortlistApplication: async (applicationId) => {
    return API.post(`/applications/${applicationId}/shortlist`);
  },
  acceptApplication: async (applicationId) => {
    return API.post(`/applications/${applicationId}/accept`);
  },
  rejectApplication: async (applicationId, decisionReason = '') => {
    return API.post(`/applications/${applicationId}/reject`, { decisionReason });
  },
  publishProject: async (id) => {
    return API.post(`/projects/${id}/publish`);
  },
  pauseProject: async (id) => {
    return API.post(`/projects/${id}/pause`);
  },
  resumeProject: async (id) => {
    return API.post(`/projects/${id}/resume`);
  },
  updateProjectApplicationStatus: async (projectId, applicationStatus) => {
    return API.patch(`/projects/${projectId}/application-status`, { applicationStatus });
  },
  toggleProjectApplicationStatus: async (projectId, applicationStatus) => {
    return API.patch(`/projects/${projectId}/application-status`, { applicationStatus });
  },
  // Phase 4: Workspace & Membership
  getProjectWorkspace: async (projectId) => {
    return API.get(`/projects/${projectId}/workspace`);
  },
  getProjectMembers: async (projectId) => {
    return API.get(`/projects/${projectId}/members`);
  },
  getMyMembership: async (projectId) => {
    return API.get(`/projects/${projectId}/members/me`);
  },
  leaveProject: async (projectId) => {
    return API.delete(`/projects/${projectId}/members/me`);
  },
  removeMember: async (projectId, userId, reason) => {
    return API.delete(`/projects/${projectId}/members/${userId}`, { data: { reason } });
  },
  updateMemberRole: async (projectId, userId, role) => {
    return API.patch(`/projects/${projectId}/members/${userId}/role`, { role });
  },
  getProjectActivities: async (projectId) => {
    return API.get(`/projects/${projectId}/activities`);
  },
  // Phase 5: Tasks, Milestones & Progress
  getProjectProgress: async (projectId) => {
    return API.get(`/projects/${projectId}/progress`);
  },
  getProjectTasks: async (projectId, params) => {
    return API.get(`/projects/${projectId}/tasks`, { params });
  },
  createTask: async (projectId, taskData) => {
    return API.post(`/projects/${projectId}/tasks`, taskData);
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
  getProjectMilestones: async (projectId, params) => {
    return API.get(`/projects/${projectId}/milestones`, { params });
  },
  createMilestone: async (projectId, milestoneData) => {
    return API.post(`/projects/${projectId}/milestones`, milestoneData);
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
  // Phase 7: Professional Project Feed & Social Engagement
  reactToProject: async (id, reactionType = 'like') => {
    return API.post(`/projects/${id}/reactions`, { reactionType });
  },
  removeReaction: async (id) => {
    return API.delete(`/projects/${id}/reactions/me`);
  },
  getProjectReactions: async (id) => {
    return API.get(`/projects/${id}/reactions`);
  },
  getProjectComments: async (id, params) => {
    return API.get(`/projects/${id}/comments`, { params });
  },
  addProjectComment: async (id, commentData) => {
    return API.post(`/projects/${id}/comments`, commentData);
  },
  editComment: async (projectId, commentId, data) => {
    return API.patch(`/projects/${projectId}/comments/${commentId}`, data);
  },
  deleteComment: async (projectId, commentId) => {
    return API.delete(`/projects/${projectId}/comments/${commentId}`);
  },
  repostProject: async (id, repostData = {}) => {
    return API.post(`/projects/${id}/reposts`, repostData);
  },
  undoRepost: async (id) => {
    return API.delete(`/projects/${id}/reposts/me`);
  },
  trackProjectView: async (id, viewData = {}) => {
    return API.post(`/projects/${id}/views`, viewData);
  },
  bookmarkProject: async (id) => {
    return API.post(`/projects/${id}/bookmark`);
  },
  unbookmarkProject: async (id) => {
    return API.delete(`/projects/${id}/bookmark`);
  },
  getSavedProjects: async (params) => {
    return API.get('/projects/saved', { params });
  },
  getProjectStats: async () => {
    return API.get('/projects/stats');
  },
  getProjectAnalytics: async (id) => {
    return API.get(`/projects/${id}/analytics`);
  },
};

export default projectService;
