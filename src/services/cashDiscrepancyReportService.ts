// services/cashDiscrepancyReportService.ts
import { apiClient } from './apiClient';

export interface CashDiscrepancyReportData {
  branchId: string;
  discrepancyAmount: number;
  description: string;
  reason: string;
  documentReference?: string;
}

export interface CashDiscrepancyReportResponse {
  id: string;
  formReferenceId: string;
  discrepancyAmount: number;
  description: string;
  status: string;
  submittedAt: string;
}

class CashDiscrepancyReportService {
  async submitCashDiscrepancyReport(data: CashDiscrepancyReportData, token?: string) {
    const payload = {
      BranchId: data.branchId,
      DiscrepancyAmount: data.discrepancyAmount,
      Description: data.description,
      Reason: data.reason,
      DocumentReference: data.documentReference,
    };

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    
    return apiClient.post<CashDiscrepancyReportResponse>('/CashDiscrepancyReport/submit', payload, headers);
  }

  async getCashDiscrepancyReportById(id: string) {
    return apiClient.get<CashDiscrepancyReportResponse>(`/CashDiscrepancyReport/${id}`);
  }
}

export const cashDiscrepancyReportService = new CashDiscrepancyReportService();
export const getCashDiscrepancyReportById = cashDiscrepancyReportService.getCashDiscrepancyReportById.bind(cashDiscrepancyReportService);
export default cashDiscrepancyReportService;
