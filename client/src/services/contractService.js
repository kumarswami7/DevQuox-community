import apiClient from './apiClient.js';

export const contractService = {
  // Create a draft contract
  async createContract(contractData) {
    const response = await apiClient.post('/contracts', contractData);
    return response.data;
  },

  // Get all contracts for a project
  async getProjectContracts(projectId) {
    const response = await apiClient.get(`/contracts/project/${projectId}`);
    return response.data;
  },

  // Get single contract details
  async getContract(contractId) {
    const response = await apiClient.get(`/contracts/${contractId}`);
    return response.data;
  },

  // Update a contract
  async updateContract(contractId, updateData) {
    const response = await apiClient.put(`/contracts/${contractId}`, updateData);
    return response.data;
  },

  // Send draft contract to counterparty for acceptance
  async sendContract(contractId) {
    const response = await apiClient.post(`/contracts/${contractId}/send`);
    return response.data;
  },

  // Accept pending contract
  async acceptContract(contractId) {
    const response = await apiClient.post(`/contracts/${contractId}/accept`);
    return response.data;
  },

  // Reject pending contract
  async rejectContract(contractId, reason) {
    const response = await apiClient.post(`/contracts/${contractId}/reject`, { reason });
    return response.data;
  },

  // Cancel contract
  async cancelContract(contractId, reason) {
    const response = await apiClient.post(`/contracts/${contractId}/cancel`, { reason });
    return response.data;
  },
};

export default contractService;
