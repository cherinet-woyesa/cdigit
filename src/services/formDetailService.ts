// src/services/formDetailService.ts
import { apiClient } from './apiClient';

export interface FormDetail {
  id: string;
  formReferenceId: string;
  customerName: string;
  amount?: number;
  signature?: string;
  branchName?: string;
  frontMakerName?: string;
  frontMakerId?: string;
  submittedAt: string;
  serviceType: string;
  serviceName: string;
  // Add other common fields as needed
}

class FormDetailService {
  async getDepositDetails(id: string) {
    try {
      const response = await apiClient.get<FormDetail>(`/Deposits/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching deposit details:', error);
      throw error;
    }
  }

  async getFundTransferDetails(id: string) {
    try {
      const response = await apiClient.get<FormDetail>(`/FundTransfer/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching fund transfer details:', error);
      throw error;
    }
  }

  async getWithdrawalDetails(id: string) {
    try {
      const response = await apiClient.get<FormDetail>(`/Withdrawal/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching withdrawal details:', error);
      throw error;
    }
  }
}

export const formDetailService = new FormDetailService();
export default formDetailService;