/**
 * Audit Service
 * Handles communication with the backend audit endpoints
 */

import api from './http';

export interface AuditTransaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  status: string;
  description: string;
  isAudited?: boolean;
  formReferenceId: string;
  accountHolderName: string;
  accountNumber: string;
}

export interface AuditUpdateRequest {
  auditerId: string;
}

class AuditService {
  /**
   * Fetch all completed transactions that need auditing
   */
  async getCompletedTransactions(): Promise<AuditTransaction[]> {
    try {
      const response = await api.get('/Audit/completed-transactions');
      const data = response.data.Data || { Deposits: [], Withdrawals: [] };
      
      // Transform the API response to match the expected type
      const deposits: AuditTransaction[] = (data.Deposits || []).map((deposit: any) => ({
        id: deposit.id || deposit.Id,
        type: 'Deposit',
        amount: deposit.amount || deposit.Amount || 0,
        date: deposit.date || deposit.Date || deposit.submittedAt || deposit.SubmittedAt || new Date().toISOString(),
        status: deposit.status || 'Completed',
        description: deposit.description || `Deposit - ${deposit.accountHolderName || deposit.AccountHolderName || 'Unknown'}`,
        formReferenceId: deposit.formReferenceId || deposit.FormReferenceId || deposit.id || deposit.Id,
        isAudited: deposit.isAudited || false,
        accountHolderName: deposit.accountHolderName || deposit.AccountHolderName || 'Unknown',
        accountNumber: deposit.accountNumber || deposit.AccountNumber || 'Unknown'
      }));
      
      const withdrawals: AuditTransaction[] = (data.Withdrawals || []).map((withdrawal: any) => ({
        id: withdrawal.id || withdrawal.Id,
        type: 'Withdrawal',
        amount: withdrawal.amount || withdrawal.Amount || 0,
        date: withdrawal.date || withdrawal.Date || withdrawal.submittedAt || withdrawal.SubmittedAt || new Date().toISOString(),
        status: withdrawal.status || 'Completed',
        description: withdrawal.description || `Withdrawal - ${withdrawal.accountHolderName || withdrawal.AccountHolderName || 'Unknown'}`,
        formReferenceId: withdrawal.formReferenceId || withdrawal.FormReferenceId || withdrawal.id || withdrawal.Id,
        isAudited: withdrawal.isAudited || false,
        accountHolderName: withdrawal.accountHolderName || withdrawal.AccountHolderName || 'Unknown',
        accountNumber: withdrawal.accountNumber || withdrawal.AccountNumber || 'Unknown'
      }));
      
      return [...deposits, ...withdrawals];
    } catch (error) {
      console.error('Error fetching completed transactions for audit:', error);
      throw error;
    }
  }

  /**
   * Mark a deposit as audited
   */
  async markDepositAsAudited(formReferenceId: string, auditerId: string): Promise<any> {
    try {
      const request: AuditUpdateRequest = { auditerId };
      const response = await api.put(`/Audit/mark-deposit-audited/${formReferenceId}`, request);
      return response.data;
    } catch (error) {
      console.error('Error marking deposit as audited:', error);
      throw error;
    }
  }

  /**
   * Mark a withdrawal as audited
   */
  async markWithdrawalAsAudited(formReferenceId: string, auditerId: string): Promise<any> {
    try {
      const request: AuditUpdateRequest = { auditerId };
      const response = await api.put(`/Audit/mark-withdrawal-audited/${formReferenceId}`, request);
      return response.data;
    } catch (error) {
      console.error('Error marking withdrawal as audited:', error);
      throw error;
    }
  }
}

const auditService = new AuditService();
export default auditService;