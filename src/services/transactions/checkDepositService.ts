// services/checkDepositService.ts
import { apiClient } from '@services/http';

export interface CheckDepositData {
  phoneNumber: string;
  branchId: string;
  accountNumber: string;
  amount: number;
  chequeNumber: string;
  drawerAccountNumber: string;
  checkType: string;
  checkValueDate: string;
  otpCode: string;
  signature: string;
}

export interface CheckDepositResponse {
  id: string;
  formReferenceId: string;
  accountNumber: string;
  amount: number;
  chequeNumber: string;
  status: string;
  submittedAt: string;
}

class CheckDepositService {
  async submitCheckDeposit(data: CheckDepositData, token?: string) {
    const payload = {
      PhoneNumber: data.phoneNumber,
      BranchId: data.branchId,
      AccountNumber: data.accountNumber,
      Amount: data.amount,
      ChequeNo: data.chequeNumber,
      DrawerAccNum: data.drawerAccountNumber,
      CheckType: data.checkType,
      CheckValueDate: data.checkValueDate,
      OtpCode: data.otpCode,
      DigitalSignature: data.signature,
    };

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    
    return apiClient.post<CheckDepositResponse>('/CheckDeposit/submit', payload, headers);
  }

  async getCheckDepositById(id: string) {
    return apiClient.get<CheckDepositResponse>(`/CheckDeposit/${id}`);
  }
}

export const checkDepositService = new CheckDepositService();
export const getCheckDepositById = checkDepositService.getCheckDepositById.bind(checkDepositService);
export default checkDepositService;
