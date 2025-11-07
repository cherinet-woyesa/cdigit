
// services/fixedTimeDepositAccountRequestService.ts
import { apiClient } from '@services/http';

export interface FixedTimeDepositAccountRequestData {
  branchId: string;
  phoneNumber: string;
  customerId: string;
  accountNumber: string;
  accountName: string;
  customerFullName: string;
  depositAmount: number;
  contractDate: Date;
  maturityDate: Date;
  clause?: string;
  interestCreditAccountNo?: string;
  isRolloverAgreed: boolean;
  otpCode: string;
  signatures?: { signature: string }[];
}

export interface FixedTimeDepositAccountRequestResponse {
  id: string;
  // Add other response fields as needed
}

class FixedTimeDepositAccountRequestService {
  async submit(data: FixedTimeDepositAccountRequestData) {
    const payload = {
        BranchId: data.branchId,
        PhoneNumber: data.phoneNumber,
        CustomerId: data.customerId,
        AccountNumber: data.accountNumber,
        AccountName: data.accountName,
        CustomerFullName: data.customerFullName,
        DepositAmount: data.depositAmount,
        ContractDate: data.contractDate,
        MaturityDate: data.maturityDate,
        Clause: data.clause,
        InterestCreditAccountNo: data.interestCreditAccountNo,
        IsRolloverAgreed: data.isRolloverAgreed,
        OtpCode: data.otpCode,
        Signatures: data.signatures,
    };
    return apiClient.post<FixedTimeDepositAccountRequestResponse>('/FixedTimeDepositAccountRequest/submit', payload);
  }
}

export const fixedTimeDepositAccountRequestService = new FixedTimeDepositAccountRequestService();
export default fixedTimeDepositAccountRequestService;
