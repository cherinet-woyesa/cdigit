// services/specialChequeClearanceService.ts
import { apiClient } from '@services/http';

export interface SpecialChequeClearanceData {
  branchId: string;
  chequeNumber: string;
  chequeAmount: number;
  urgencyLevel: string;
  clearanceReason: string;
  documentReference?: string;
}

export interface SpecialChequeClearanceResponse {
  id: string;
  formReferenceId: string;
  chequeNumber: string;
  status: string;
  submittedAt: string;
}

class SpecialChequeClearanceService {
  async submitSpecialChequeClearance(data: SpecialChequeClearanceData, token?: string) {
    const payload = {
      BranchId: data.branchId,
      ChequeNumber: data.chequeNumber,
      ChequeAmount: data.chequeAmount,
      UrgencyLevel: data.urgencyLevel,
      ClearanceReason: data.clearanceReason,
      DocumentReference: data.documentReference,
    };

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    
    return apiClient.post<SpecialChequeClearanceResponse>('/SpecialChequeClearance/submit', payload, headers);
  }

  async getSpecialChequeClearanceById(id: string) {
    return apiClient.get<SpecialChequeClearanceResponse>(`/SpecialChequeClearance/${id}`);
  }
}

export const specialChequeClearanceService = new SpecialChequeClearanceService();
export const getSpecialChequeClearanceById = specialChequeClearanceService.getSpecialChequeClearanceById.bind(specialChequeClearanceService);
export default specialChequeClearanceService;
