// services/depositService.ts
import { apiClient } from './apiClient';

export interface DepositData {
  branchId: string;
  accountHolderName: string;
  accountNumber: string;
  amount: number;
  telephoneNumber: string;
  transactionType?: string;
  status?: string;
  formReferenceId?: string;
  currency?: string;
  signature?: string; // Add signature field
}

export interface DepositResponse {
  id: string;
  formReferenceId: string;
  queueNumber?: number;
  accountHolderName: string;
  accountNumber: string;
  amount: number;
  telephoneNumber: string;
  tokenNumber: string;
  transactionType: string;
  status: string;
  branchId?: string;
  signature?: string; // Add signature field
}

export interface CancelResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface AccountValidationResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    accountNumber: string;
    accountHolderName: string;
    typeOfAccount?: string;
    phoneNumber?: string;
    isDiaspora?: boolean;
  };
}

class DepositService {
  async submitDeposit(data: DepositData) {
    const requestData = {
      AccountNumber: data.accountNumber,
      AccountHolderName: data.accountHolderName,
      Amount: data.amount,
      BranchId: data.branchId,
      PhoneNumber: data.telephoneNumber,
      AmountInWords: 'N/A',
      SourceOfProceeds: 'N/A',
      TypeOfAccount: 'N/A',
      DepositedBy: 'N/A',
      TransactionType: data.transactionType || 'Cash Deposit',
      Status: data.status || 'Pending',
      TokenNumber: '',
      FormReferenceId: data.formReferenceId || `dep-${Date.now()}`,
      QueueNumber: 0,
      Signature: data.signature || null // Add signature to request data
    };

    return apiClient.post<DepositResponse>('/Deposits', requestData);
  }

  // FIXED: Properly handle the ApiResponse structure
  async validateAccount(accountNumber: string): Promise<AccountValidationResponse> {
    try {
      const response = await apiClient.get<AccountValidationResponse>(
        `/Accounts/AccountNumExist/${accountNumber}`
      );
      
      // Your apiClient returns ApiResponse<T> which has a data property
      // So we need to return response.data which contains AccountValidationResponse
      if (response && response.data) {
        return response.data;
      } else {
        return {
          success: false,
          message: 'No response data received'
        };
      }
    } catch (error: any) {
      // Handle different error scenarios
      if (error.response?.data) {
        return error.response.data;
      } else {
        return {
          success: false,
          message: error.message || 'Failed to validate account'
        };
      }
    }
  }

  async getDepositById(id: string) {
    const response = await apiClient.get<DepositResponse>(`/Deposits/${id}`);
    return response;
  }

  async getAllDeposits() {
    const response = await apiClient.get<DepositResponse[]>('/Deposits');
    return response;
  }

  async updateDeposit(id: string, data: DepositData) {
    const requestData = {
      Id: id,
      AccountNumber: data.accountNumber,
      AccountHolderName: data.accountHolderName,
      Amount: data.amount,
      BranchId: data.branchId,
      PhoneNumber: data.telephoneNumber,
      AmountInWords: 'N/A',
      SourceOfProceeds: 'N/A',
      DepositedBy: 'N/A',
      TypeOfAccount: 'N/A',
      TransactionType: data.transactionType || 'Cash Deposit',
      Status: data.status || 'Pending',
      TokenNumber: '',
      FormReferenceId: data.formReferenceId || id,
      QueueNumber: 0,
      Signature: data.signature || null // Add signature to update data
    };

    const response = await apiClient.put<DepositResponse>(`/Deposits/update-By-Customer/${id}`, requestData);
    return response;
  }

  async cancelDepositByCustomer(id: string) {
    const response = await apiClient.put<CancelResponse>(`/Deposits/cancel-by-customer/${id}`);
    return response;
  }

  async cancelDeposit(id: string) {
    return this.cancelDepositByCustomer(id);
  }

  async getCompletedTodayByBranch(branchId: string) {
    const response = await apiClient.get<DepositResponse[]>(`/Deposits/completed/today?branchId=${branchId}`);
    return response;
  }

  async authorize(depositId: string, userId: string) {
    const response = await apiClient.put(`/Deposits/authorize`, { depositId, userId });
    return response;
  }

  async audit(depositId: string, userId: string) {
    const response = await apiClient.put(`/Deposits/audit`, { depositId, userId });
    return response;
  }
}

export const depositService = new DepositService();
export default depositService;