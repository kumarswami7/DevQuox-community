import apiClient from "./apiClient";

export const dashboardService = {
  /**
   * Fetch aggregated summary tailored to user's role
   */
  getDashboardSummary: async () => {
    const response = await apiClient.get("/dashboard/summary");
    return response.data;
  },

  /**
   * Fetch analytics & chart distributions
   */
  getDashboardAnalytics: async () => {
    const response = await apiClient.get("/dashboard/analytics");
    return response.data;
  },

  /**
   * Fetch recent activity stream
   */
  getDashboardActivities: async (params = {}) => {
    const response = await apiClient.get("/dashboard/activities", { params });
    return response.data;
  },

  /**
   * Fetch user's tasks
   */
  getMyTasks: async (params = {}) => {
    const response = await apiClient.get("/dashboard/tasks", { params });
    return response.data;
  },

  /**
   * Rapid quick actions directly from the dashboard
   */
  updateQuickAction: async (actionType, targetId, value) => {
    const response = await apiClient.patch("/dashboard/quick-action", {
      actionType,
      targetId,
      value,
    });
    return response.data;
  },

  /**
   * Populate MongoDB Atlas with real test data
   */
  seedDatabase: async () => {
    const response = await apiClient.post("/dashboard/seed");
    return response.data;
  },
};

export default dashboardService;
