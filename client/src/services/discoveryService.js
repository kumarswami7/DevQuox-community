import apiClient from "./apiClient";

export const discoveryService = {
  // ── Portfolios ─────────────────────────────────────────────────────────────
  getMyPortfolio: async () => {
    const res = await apiClient.get("/portfolios/me");
    return res.data.data || res.data.profile || res.data;
  },

  updateMyPortfolio: async (data) => {
    const res = await apiClient.patch("/portfolios/me", data);
    return res.data.data || res.data.profile || res.data;
  },

  getPublicPortfolio: async (usernameOrId) => {
    const res = await apiClient.get(`/portfolios/${encodeURIComponent(usernameOrId)}`);
    return res.data.data || res.data.profile || res.data;
  },

  // ── Portfolio Projects ─────────────────────────────────────────────────────
  addShowcaseProject: async (projectData) => {
    const res = await apiClient.post("/portfolios/me/projects", projectData);
    return res.data.data || res.data.project || res.data;
  },

  updateShowcaseProject: async (projectId, projectData) => {
    const res = await apiClient.patch(`/portfolios/me/projects/${projectId}`, projectData);
    return res.data.data || res.data.project || res.data;
  },

  deleteShowcaseProject: async (projectId) => {
    const res = await apiClient.delete(`/portfolios/me/projects/${projectId}`);
    return res.data;
  },

  // ── Skills & Taxonomy ──────────────────────────────────────────────────────
  getSkillCategories: async () => {
    const res = await apiClient.get("/skills/categories");
    return res.data.data || [];
  },

  getSkillRegistry: async () => {
    try {
      const res = await apiClient.get("/skills/registry");
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  getSkills: async (category, q) => {
    const res = await apiClient.get("/skills", { params: { category, q } });
    return res.data.data || [];
  },

  suggestSkills: async (query) => {
    const res = await apiClient.get("/skills/suggest", { params: { q: query } });
    return res.data.data || [];
  },

  suggestNewSkill: async (name, category, aliases) => {
    const res = await apiClient.post("/skills/suggestions", { name, category, aliases });
    return res.data.data || res.data;
  },

  addProfileSkill: async (skillData) => {
    const res = await apiClient.post("/portfolios/me/skills", skillData);
    return res.data;
  },

  removeProfileSkill: async (skillName) => {
    const res = await apiClient.delete(`/portfolios/me/skills/${encodeURIComponent(skillName)}`);
    return res.data;
  },

  // ── Experience & Education ─────────────────────────────────────────────────
  addExperience: async (expData) => {
    const res = await apiClient.post("/portfolios/me/experience", expData);
    return res.data.data || res.data;
  },

  removeExperience: async (id) => {
    const res = await apiClient.delete(`/portfolios/me/experience/${id}`);
    return res.data;
  },

  addEducation: async (eduData) => {
    const res = await apiClient.post("/portfolios/me/education", eduData);
    return res.data.data || res.data;
  },

  removeEducation: async (id) => {
    const res = await apiClient.delete(`/portfolios/me/education/${id}`);
    return res.data;
  },

  // ── Developer Discovery ───────────────────────────────────────────────────
  searchDevelopers: async (params = {}) => {
    const res = await apiClient.get("/discovery/developers", { params });
    return {
      developers: res.data.data || res.data.developers || [],
      pagination: res.data.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 },
    };
  },

  getDeveloperById: async (id) => {
    const res = await apiClient.get(`/discovery/developers/${id}`);
    return res.data.data || res.data;
  },

  getDeveloperRecommendations: async () => {
    const res = await apiClient.get("/discovery/recommendations/developers");
    return res.data.data || [];
  },

  // ── Project Discovery ──────────────────────────────────────────────────────
  searchProjectsWithMatch: async (params = {}) => {
    const res = await apiClient.get("/discovery/projects", { params });
    return {
      projects: res.data.data || res.data.projects || [],
      pagination: res.data.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 },
    };
  },

  getProjectRecommendations: async () => {
    const res = await apiClient.get("/discovery/recommendations/projects");
    return res.data.data || [];
  },

  // ── Bookmarks / Saved Developers ──────────────────────────────────────────
  bookmarkDeveloper: async (developerId) => {
    const res = await apiClient.post(`/bookmarks/developers/${developerId}`);
    return res.data.data || res.data;
  },

  unbookmarkDeveloper: async (developerId) => {
    const res = await apiClient.delete(`/bookmarks/developers/${developerId}`);
    return res.data;
  },

  getBookmarks: async (page = 1, limit = 20) => {
    const res = await apiClient.get("/bookmarks", { params: { page, limit } });
    return {
      developers: res.data.data || res.data.developers || [],
      pagination: res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },

  checkIsBookmarked: async (developerId) => {
    const res = await apiClient.get(`/bookmarks/check/${developerId}`);
    return res.data.isSaved;
  },

  // ── Saved Searches ────────────────────────────────────────────────────────
  saveSearch: async (name, type, filters) => {
    const res = await apiClient.post("/saved-searches", { name, type, filters });
    return res.data.data || res.data;
  },

  getSavedSearches: async (type) => {
    const res = await apiClient.get("/saved-searches", { params: { type } });
    return res.data.data || [];
  },

  updateSavedSearch: async (searchId, data) => {
    const res = await apiClient.patch(`/saved-searches/${searchId}`, data);
    return res.data.data || res.data;
  },

  deleteSavedSearch: async (searchId) => {
    const res = await apiClient.delete(`/saved-searches/${searchId}`);
    return res.data;
  },

  // ── Following ─────────────────────────────────────────────────────────────
  followUser: async (userId) => {
    const res = await apiClient.post(`/follow/${userId}/follow`);
    return res.data;
  },

  unfollowUser: async (userId) => {
    const res = await apiClient.delete(`/follow/${userId}/follow`);
    return res.data;
  },

  getFollowers: async (userId, page = 1) => {
    const res = await apiClient.get(`/follow/${userId}/followers`, { params: { page } });
    return res.data;
  },

  getFollowing: async (userId, page = 1) => {
    const res = await apiClient.get(`/follow/${userId}/following`, { params: { page } });
    return res.data;
  },
};

export default discoveryService;
