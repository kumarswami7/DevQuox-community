import apiClient from './apiClient.js';

export const paymentService = {
  // Financial Milestones
  async getContractMilestones(contractId) {
    const response = await apiClient.get(`/financial-milestones/contract/${contractId}`);
    return response.data;
  },

  async createMilestone(milestoneData) {
    const response = await apiClient.post('/financial-milestones', milestoneData);
    return response.data;
  },

  async updateMilestone(milestoneId, updateData) {
    const response = await apiClient.patch(`/financial-milestones/${milestoneId}`, updateData);
    return response.data;
  },

  async submitMilestoneWork(milestoneId, submissionData) {
    const response = await apiClient.post(`/financial-milestones/${milestoneId}/submit`, submissionData);
    return response.data;
  },

  async reviewMilestoneWork(milestoneId, reviewData) {
    const response = await apiClient.post(`/financial-milestones/${milestoneId}/review`, reviewData);
    return response.data;
  },

  // Checkout and Payments
  async createCheckoutSession(checkoutData) {
    const response = await apiClient.post('/payments/create-checkout-session', checkoutData);
    return response.data;
  },

  async verifyPayment(verificationData) {
    const response = await apiClient.post('/payments/verify', verificationData);
    return response.data;
  },

  async getProjectPayments(projectId) {
    const response = await apiClient.get(`/payments/project/${projectId}`);
    return response.data;
  },

  async getMyTransactions(params = {}) {
    const response = await apiClient.get('/payments/my-transactions', { params });
    return response.data;
  },

  async getInvoice(paymentId) {
    const response = await apiClient.get(`/payments/${paymentId}/invoice`);
    return response.data;
  },

  async requestRefund(refundData) {
    const response = await apiClient.post('/payments/refund', refundData);
    return response.data;
  },

  async raiseDispute(disputeData) {
    const response = await apiClient.post('/payments/dispute', disputeData);
    return response.data;
  },

  async getDisputes(params = {}) {
    const response = await apiClient.get('/payments/disputes', { params });
    return response.data;
  },
};

export default paymentService;
