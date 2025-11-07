// services/authorizer/authorizerService.ts
import { apiClient } from '@services/http';

export interface AuthorizableItem {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  amount: number;
  isAuthorized: boolean;
  isAudited: boolean;
  submittedAt: string;
  authorizerId?: string;
  auditerId?: string;
  formReferenceId?: string;
  status?: string;
}

export interface AuthorizeRequest {
  depositId?: string;
  withdrawalId?: string;
  fundTransferId?: string;
  userId: string;
}

export interface AuthorizeResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface GetByBranchResponse {
  success: boolean;
  message: string;
  data: AuthorizableItem[];
}

class AuthorizerService {
  // Deposit authorization methods
  async getDepositsByBranch(branchId: string) {
    return apiClient.get<GetByBranchResponse>(`/Deposits/branch/${branchId}/pending-authorization`);
  }

  async authorizeDeposit(depositId: string, userId: string) {
    return apiClient.put<AuthorizeResponse>('/Deposits/authorize', { 
      depositId, 
      userId 
    });
  }

  // Withdrawal authorization methods (for future use)
  async getWithdrawalsByBranch(branchId: string) {
    return apiClient.get<GetByBranchResponse>(`/Withdrawals/branch/${branchId}/pending-authorization`);
  }

  async authorizeWithdrawal(withdrawalId: string, userId: string) {
    return apiClient.put<AuthorizeResponse>('/Withdrawals/authorize', { 
      withdrawalId, 
      userId 
    });
  }

  // Fund Transfer authorization methods (for future use)
  async getFundTransfersByBranch(branchId: string) {
    return apiClient.get<GetByBranchResponse>(`/FundTransfers/branch/${branchId}/pending-authorization`);
  }

  async authorizeFundTransfer(fundTransferId: string, userId: string) {
    return apiClient.put<AuthorizeResponse>('/FundTransfers/authorize', { 
      fundTransferId, 
      userId 
    });
  }

  // Generic method to get all pending items for a branch
  async getAllPendingByBranch(branchId: string) {
    const [deposits, withdrawals, fundTransfers] = await Promise.allSettled([
      this.getDepositsByBranch(branchId),
      this.getWithdrawalsByBranch(branchId),
      this.getFundTransfersByBranch(branchId)
    ]);

    return {
      deposits: deposits.status === 'fulfilled' ? deposits.value.data : null,
      withdrawals: withdrawals.status === 'fulfilled' ? withdrawals.value.data : null,
      fundTransfers: fundTransfers.status === 'fulfilled' ? fundTransfers.value.data : null
    };
  }
}

export const authorizerService = new AuthorizerService();
export default authorizerService;
