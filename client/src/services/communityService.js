import { apiClient } from "./apiClient";
export const communityService = {
  // Legacy community hubs
  getCommunities: async () => {
    return apiClient.get("/communities");
  },
  createCommunity: async (data) => {
    return apiClient.post("/communities", data);
  },
  joinCommunity: async (id) => {
    return apiClient.post(`/communities/${id}/join`);
  },
  // ── Phase 8: Feed & Posts ───────────────────────────────────────────────────
  getFeed: async (params) => {
    return apiClient.get("/community/posts", { params });
  },
  getPostById: async (postId) => {
    return apiClient.get(`/community/posts/${postId}`);
  },
  createPost: async (payload) => {
    return apiClient.post("/community/posts", payload);
  },
  updatePost: async (postId, payload) => {
    return apiClient.patch(
      `/community/posts/${postId}`,
      payload
    );
  },
  deletePost: async (postId) => {
    return apiClient.delete(`/community/posts/${postId}`);
  },
  toggleSavePost: async (postId) => {
    return apiClient.post(
      `/community/posts/${postId}/bookmark`
    );
  },
  getSavedPosts: async (params) => {
    return apiClient.get('/community/posts/saved', { params });
  },
  pinPost: async (postId, isPinned) => {
    return apiClient.post(
      `/community/posts/${postId}/pin`,
      { isPinned }
    );
  },
  repostPost: async (postId) => {
    return apiClient.post(`/community/posts/${postId}/repost`);
  },
  // ── Comments & Threading ───────────────────────────────────────────────────
  getComments: async (postId, params) => {
    return apiClient.get(`/community/posts/${postId}/comments`, { params });
  },
  addComment: async (postId, payload) => {
    return apiClient.post(
      `/community/posts/${postId}/comments`,
      payload
    );
  },
  updateComment: async (commentId, payload) => {
    return apiClient.patch(
      `/community/comments/${commentId}`,
      payload
    );
  },
  deleteComment: async (commentId) => {
    return apiClient.delete(
      `/community/comments/${commentId}`
    );
  },
  // ── Reactions ──────────────────────────────────────────────────────────────
  togglePostReaction: async (postId, reactionType = "like") => {
    return apiClient.post(`/community/posts/${postId}/reactions`, { reactionType });
  },
  toggleCommentReaction: async (commentId, reactionType = "like") => {
    return apiClient.post(`/community/comments/${commentId}/reactions`, { reactionType });
  },
  // ── Tags ───────────────────────────────────────────────────────────────────
  getPopularTags: async () => {
    return apiClient.get(
      "/community/tags"
    );
  },
  // ── Reports & Moderation ───────────────────────────────────────────────────
  submitReport: async (payload) => {
    return apiClient.post("/community/reports", payload);
  },
  getReports: async (params) => {
    return apiClient.get("/moderation/reports", { params });
  },
  reviewReport: async (reportId, payload) => {
    return apiClient.patch(
      `/moderation/reports/${reportId}`,
      payload
    );
  },
  toggleHidePost: async (postId, hide, reason) => {
    return apiClient.post(
      `/moderation/posts/${postId}/hide`,
      { hide, reason }
    );
  },
  convertIdeaToProject: async (postId, projectId) => {
    return apiClient.post(
      `/community/posts/${postId}/convert-to-project`,
      { projectId }
    );
  },
  // ── LinkedIn-Style Telemetry & History ─────────────────────────────────────
  trackImpression: async (postId) => {
    return apiClient.post(`/community/posts/${postId}/impression`);
  },
  trackClick: async (postId) => {
    return apiClient.post(`/community/posts/${postId}/click`);
  },
  getMyHistory: async () => {
    return apiClient.get('/community/posts/my-history');
  }
};
export default communityService;
