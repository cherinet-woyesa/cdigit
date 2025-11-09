// services/checkWithdrawalService.ts
import { apiClient } from '@services/http';

export interface CheckWithdrawalData {
  phoneNumber: string;
  branchId: string;
  accountNumber: string;
  amount: number;
  chequeNo: string;
  checkType: string;
  otpCode: string;
  signature: string;
}

export interface CheckWithdrawalResponse {
  id: string;
  formReferenceId: string;
  accountNumber: string;
  amount: number;
  chequeNo: string;
  status: string;
  submittedAt: string;
}

export interface SignatureData {
  SignatoryName: string | null;
  SignatureData: string | null;
}

class CheckWithdrawalService {
  async submitCheckWithdrawal(data: CheckWithdrawalData, token?: string) {
    const payload = {
      PhoneNumber: data.phoneNumber,
      BranchId: data.branchId,
      AccountNumber: data.accountNumber,
      Amount: data.amount,
      ChequeNo: data.chequeNo,
      CheckType: data.checkType,
      OtpCode: data.otpCode,
      Signatures: [
        {
          SignatoryName: "Customer", // Provide a default signatory name
          SignatureData: data.signature || "" // Ensure we have valid signature data
        }
      ],
    };

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    
    return apiClient.post<CheckWithdrawalResponse>('/CheckWithdrawal/submit', payload, headers);
  }

  async getCheckWithdrawalById(id: string) {
    return apiClient.get<CheckWithdrawalResponse>(`/CheckWithdrawal/${id}`);
  }
}

export const checkWithdrawalService = new CheckWithdrawalService();
export const getCheckWithdrawalById = checkWithdrawalService.getCheckWithdrawalById.bind(checkWithdrawalService);
export default checkWithdrawalService;