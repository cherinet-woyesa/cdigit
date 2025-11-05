// services/chequeBookRequestService.ts
import { apiClient } from './apiClient';

export interface ChequeBookRequestData {
  phoneNumber: string;
  branchId: string;
  accountNumber: string;
  numberOfChequeBooks: number;
  leavesPerChequeBook: number;
  otpCode: string;
  digitalSignature: string;
}

export interface ChequeBookRequestResponse {
  id: string;
  formReferenceId: string;
  accountNumber: string;
  numberOfChequeBooks: number;
  leavesPerChequeBook: number;
  status: string;
  submittedAt: string;
}

class ChequeBookRequestService {
  async submitChequeBookRequest(data: ChequeBookRequestData, token?: string) {
    const payload = {
      PhoneNumber: data.phoneNumber,
      BranchId: data.branchId,
      AccountNumber: data.accountNumber,
      NumberOfChequeBooks: data.numberOfChequeBooks,
      LeavesPerChequeBook: data.leavesPerChequeBook,
      OtpCode: data.otpCode,
      DigitalSignature: data.digitalSignature,
    };

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    
    return apiClient.post<ChequeBookRequestResponse>('/ChequeBookRequest/submit', payload, headers);
  }

  async getChequeBookRequestById(id: string) {
    return apiClient.get<ChequeBookRequestResponse>(`/ChequeBookRequest/${id}`);
  }
}

export const chequeBookRequestService = new ChequeBookRequestService();
export const getChequeBookRequestById = chequeBookRequestService.getChequeBookRequestById.bind(chequeBookRequestService);
export default chequeBookRequestService;
