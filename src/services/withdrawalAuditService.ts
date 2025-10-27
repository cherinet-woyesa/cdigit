// src/services/withdrawalAuditService.ts
import { apiClient } from './apiClient';

export interface AuditActionDto {
  voucherId: string;
  userId: string;
}

export interface RejectActionDto {
  voucherId: string;
  userId: string;
  remarks: string;
}

class WithdrawalAuditService {
  async auditWithdrawal(voucherId: string, userId: string) {
    try {
      const response = await apiClient.put('/Withdrawal/audit', { voucherId, userId });
      return response;
    } catch (error) {
      console.error('Error auditing withdrawal:', error);
      throw error;
    }
  }

  async rejectWithdrawal(voucherId: string, userId: string, remarks: string) {
    try {
      const response = await apiClient.put('/Withdrawal/reject', { voucherId, userId, remarks });
      return response;
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      throw error;
    }
  }
}

export const withdrawalAuditService = new WithdrawalAuditService();
export default withdrawalAuditService;