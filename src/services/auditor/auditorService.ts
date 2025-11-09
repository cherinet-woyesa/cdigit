// services/auditor/auditorService.ts
import { apiClient } from "@services/http";

export interface AuditableItem {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  amount: number;
  isAuthorized: boolean;
  isAudited: boolean;
  isRejected: boolean;
  remark: string;
  submittedAt: string;
  authorizerId?: string;
  auditerId?: string;
  formReferenceId?: string;
  status?: string;
  branchName?: string;
  makerName?: string;
  makerId?: string;
  customerId?: string;
  signatureUrl?: string;
}

export interface AuditRequest {
  depositId?: string;
  withdrawalId?: string;
  fundTransferId?: string;
  userId: string;
}

export interface DiscrepancyRequest {
  id: string; // depositId
  reportedById: string;
  remark: string;
  fields: any[];
}

export interface AuditResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface GetByBranchResponse {
  success: boolean;
  message: string;
  data: AuditableItem[];
}

class AuditorService {
  // Deposit audit methods
  async getDepositsByBranch(branchId: string) {
    // TODO: Backend needs to add this endpoint: /Deposits/branch/{branchId}/pending-audit
    // For now, get all deposits and filter on frontend
    return apiClient.get<GetByBranchResponse>(`/Deposits`);
  }

  async auditDeposit(depositId: string, userId: string) {
    return apiClient.put<AuditResponse>("/Deposits/audit", {
      depositId,
      userId,
    });
  }

  async rejectDeposit(depositId: string, userId: string, remark: string) {
    // Use the discrepancy reporting endpoint for rejection
    return apiClient.post<AuditResponse>(`/Deposits/${depositId}/auditor-discrepancy`, {
      id: depositId,
      reportedById: userId,
      remark: remark,
      fields: []
    });
  }

  // Withdrawal audit methods (for future use)
  async getWithdrawalsByBranch(branchId: string) {
    return apiClient.get<GetByBranchResponse>(
      `/Withdrawals/branch/${branchId}/pending-audit`,
    );
  }

  async auditWithdrawal(withdrawalId: string, userId: string) {
    return apiClient.put<AuditResponse>("/Withdrawals/audit", {
      withdrawalId,
      userId,
    });
  }

  // Fund Transfer audit methods (for future use)
  async getFundTransfersByBranch(branchId: string) {
    return apiClient.get<GetByBranchResponse>(
      `/FundTransfers/branch/${branchId}/pending-audit`,
    );
  }

  async auditFundTransfer(fundTransferId: string, userId: string) {
    return apiClient.put<AuditResponse>("/FundTransfers/audit", {
      fundTransferId,
      userId,
    });
  }

  // Generic method to get all pending items for a branch
  async getAllPendingByBranch(branchId: string) {
    const [deposits, withdrawals, fundTransfers] = await Promise.allSettled([
      this.getDepositsByBranch(branchId),
      this.getWithdrawalsByBranch(branchId),
      this.getFundTransfersByBranch(branchId),
    ]);

    return {
      deposits: deposits.status === "fulfilled" ? deposits.value.data : null,
      withdrawals:
        withdrawals.status === "fulfilled" ? withdrawals.value.data : null,
      fundTransfers:
        fundTransfers.status === "fulfilled" ? fundTransfers.value.data : null,
    };
  }
}

export const auditorService = new AuditorService();
export default auditorService;