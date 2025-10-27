// services/withdrawalService.ts
import { apiClient } from './apiClient';
import { authService } from './authService';

export interface WithdrawalData {
  phoneNumber: string;
  branchId: string;
  accountNumber: string;
  accountHolderName: string;
  withdrawal_Amount: number;
  remark?: string;
  otpCode: string;
  signature?: string;
  status?: string;
}

export interface WithdrawalResponse {
  phoneNumber: any;
  id: string;
  formReferenceId: string;
  accountNumber: string;
  accountHolderName: string;
  withdrawal_Amount: number;
  tokenNumber: string;
  queueNumber?: number;
  status: string;
  submittedAt: string;
  telephoneNumber: string;
}

class WithdrawalService {
  async submitWithdrawal(data: WithdrawalData, token?: string) {
    const payload = {
      PhoneNumber: data.phoneNumber,
      BranchId: data.branchId,
      AccountNumber: data.accountNumber,
      AccountHolderName: data.accountHolderName,
      Withdrawal_Amount: data.withdrawal_Amount,
      Remark: data.remark || '',
      OtpCode: data.otpCode,
      Signature: data.signature || null // Add signature to payload
    };

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    
    return apiClient.post<WithdrawalResponse>('/Withdrawal/Submit', payload, headers);
  }

  async getWithdrawalById(id: string) {
    return apiClient.get<WithdrawalResponse>(`/Withdrawal/${id}`);
  }

  async updateWithdrawal(id: string, data: Partial<WithdrawalData>) {
    const payload = {
      Withdrawal_Amount: data.withdrawal_Amount,
      Remark: data.remark,
      Status: data.status,
      Signature: data.signature || null // Add signature to update payload
    };

    return apiClient.put<WithdrawalResponse>(`/Withdrawal/${id}`, payload);
  }

  async cancelWithdrawal(id: string) {
    return apiClient.put(`/Withdrawal/cancel-by-customer/${id}`);
  }

  // Add the missing method that the component expects
  async cancelWithdrawalByCustomer(id: string) {
    return this.cancelWithdrawal(id);
  }
}

export const withdrawalService = new WithdrawalService();
export default withdrawalService;

// Named exports for backward compatibility - ADD THE MISSING EXPORT
export const submitWithdrawal = withdrawalService.submitWithdrawal.bind(withdrawalService);
export const getWithdrawalById = withdrawalService.getWithdrawalById.bind(withdrawalService);
export const cancelWithdrawal = withdrawalService.cancelWithdrawal.bind(withdrawalService);
export const cancelWithdrawalByCustomer = withdrawalService.cancelWithdrawalByCustomer.bind(withdrawalService); // ADD THIS
export const requestWithdrawalOtp = authService.requestWithdrawalOTP.bind(authService);