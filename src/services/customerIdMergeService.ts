// services/customerIdMergeService.ts
import { apiClient } from './apiClient';

export interface CustomerIdMergeData {
  branchId: string;
  sourceCustomerId: string;
  targetCustomerId: string;
  reason: string;
  otpCode: string;
}

export interface CustomerIdMergeResponse {
  id: string;
  formReferenceId: string;
  sourceCustomerId: string;
  targetCustomerId: string;
  status: string;
  submittedAt: string;
}

class CustomerIdMergeService {
  async submitCustomerIdMerge(data: CustomerIdMergeData, token?: string) {
    const payload = {
      BranchId: data.branchId,
      SourceCustomerId: data.sourceCustomerId,
      TargetCustomerId: data.targetCustomerId,
      Reason: data.reason,
      OtpCode: data.otpCode,
    };

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    
    return apiClient.post<CustomerIdMergeResponse>('/CustomerIdMerge/submit', payload, headers);
  }

  async getCustomerIdMergeById(id: string) {
    return apiClient.get<CustomerIdMergeResponse>(`/CustomerIdMerge/${id}`);
  }
}

export const customerIdMergeService = new CustomerIdMergeService();
export const getCustomerIdMergeById = customerIdMergeService.getCustomerIdMergeById.bind(customerIdMergeService);
export default customerIdMergeService;
