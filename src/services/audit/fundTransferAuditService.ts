// src/services/fundTransferAuditService.ts
import { apiClient } from '@services/http';

export interface AuditActionDto {
  voucherId: string;
  userId: string;
}

export interface RejectActionDto {
  voucherId: string;
  userId: string;
  remarks: string;
}

class FundTransferAuditService {
  async auditFundTransfer(voucherId: string, userId: string) {
    try {
      const response = await apiClient.put('/FundTransfer/audit', { voucherId, userId });
      return response;
    } catch (error) {
      console.error('Error auditing fund transfer:', error);
      throw error;
    }
  }

  async rejectFundTransfer(voucherId: string, userId: string, remarks: string) {
    try {
      const response = await apiClient.put('/FundTransfer/reject', { voucherId, userId, remarks });
      return response;
    } catch (error) {
      console.error('Error rejecting fund transfer:', error);
      throw error;
    }
  }
}

export const fundTransferAuditService = new FundTransferAuditService();
export default fundTransferAuditService;