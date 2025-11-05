// services/customerProfileChangeService.ts
import { apiClient } from './apiClient';

export interface CustomerProfileChangeData {
  branchId: string;
  changeType: string;
  reason: string;
  otpCode: string;
}

export interface CustomerProfileChangeResponse {
  id: string;
  formReferenceId: string;
  changeType: string;
  status: string;
  submittedAt: string;
}

class CustomerProfileChangeService {
  async submitCustomerProfileChange(data: CustomerProfileChangeData, token?: string) {
    const payload = {
      BranchId: data.branchId,
      ChangeType: data.changeType,
      Reason: data.reason,
      OtpCode: data.otpCode,
    };

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    
    return apiClient.post<CustomerProfileChangeResponse>('/CustomerProfileChangeOrTerminationRequest/submit', payload, headers);
  }

  async getCustomerProfileChangeById(id: string) {
    return apiClient.get<CustomerProfileChangeResponse>(`/CustomerProfileChangeOrTerminationRequest/${id}`);
  }
}

export const customerProfileChangeService = new CustomerProfileChangeService();
export const getCustomerProfileChangeById = customerProfileChangeService.getCustomerProfileChangeById.bind(customerProfileChangeService);
export default customerProfileChangeService;
