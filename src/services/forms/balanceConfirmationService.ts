// services/balanceConfirmationService.ts
import { apiClient } from '@services/http';

export interface BalanceConfirmationData {
  phoneNumber: string;
  branchId: string;
  accountNumber: string;
  customerName: string;
  accountOpenedDate: string;
  balanceAsOfDate: string;
  creditBalance: number;
  embassyOrConcernedOrgan?: string;
  location?: string;
  otpCode: string;
  status?: string;
}

export interface BalanceConfirmationResponse {
  id: string;
  formReferenceId: string;
  accountNumber: string;
  customerName: string;
  accountOpenedDate: string;
  balanceAsOfDate: string;
  creditBalance: number;
  embassyOrConcernedOrgan?: string;
  location?: string;
  status: string;
  submittedAt: string;
  telephoneNumber: string;
  branchManagerName?: string;
}

class BalanceConfirmationService {
  async submitBalanceConfirmation(data: BalanceConfirmationData, token?: string) {
    const payload = {
      PhoneNumber: data.phoneNumber,
      BranchId: data.branchId,
      AccountNumber: data.accountNumber,
      CustomerName: data.customerName,
      AccountOpenedDate: data.accountOpenedDate,
      BalanceAsOfDate: data.balanceAsOfDate,
      CreditBalance: data.creditBalance,
      EmbassyOrConcernedOrgan: data.embassyOrConcernedOrgan || null,
      Location: data.location || null,
      OtpCode: data.otpCode,
    };

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    
    return apiClient.post<BalanceConfirmationResponse>('/BalanceConfirmation/submit', payload, headers);
  }

  async getBalanceConfirmationById(id: string) {
    return apiClient.get<BalanceConfirmationResponse>(`/BalanceConfirmation/${id}`);
  }

  async updateBalanceConfirmation(id: string, data: Partial<BalanceConfirmationData>) {
    const payload = {
      CustomerName: data.customerName,
      AccountOpenedDate: data.accountOpenedDate,
      BalanceAsOfDate: data.balanceAsOfDate,
      CreditBalance: data.creditBalance,
      EmbassyOrConcernedOrgan: data.embassyOrConcernedOrgan || null,
      Location: data.location || null,
      Status: data.status,
    };

    return apiClient.put<BalanceConfirmationResponse>(`/BalanceConfirmation/${id}`, payload);
  }

  async cancelBalanceConfirmation(id: string) {
    return apiClient.put(`/BalanceConfirmation/cancel-by-customer/${id}`);
  }

  // Add the method that the component expects
  async cancelBalanceConfirmationByCustomer(id: string) {
    return this.cancelBalanceConfirmation(id);
  }
}

export const balanceConfirmationService = new BalanceConfirmationService();
export default balanceConfirmationService;

// Named exports for backward compatibility
export const submitBalanceConfirmation = balanceConfirmationService.submitBalanceConfirmation.bind(balanceConfirmationService);
export const getBalanceConfirmationById = balanceConfirmationService.getBalanceConfirmationById.bind(balanceConfirmationService);
export const cancelBalanceConfirmation = balanceConfirmationService.cancelBalanceConfirmation.bind(balanceConfirmationService);
export const cancelBalanceConfirmationByCustomer = balanceConfirmationService.cancelBalanceConfirmationByCustomer.bind(balanceConfirmationService);