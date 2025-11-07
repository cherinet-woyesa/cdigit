
// services/lostPassbookReplacementService.ts
import { apiClient } from '@services/http';

export interface LostPassbookReplacementData {
  branchId: string;
  phoneNumber: string;
  accountNumber: string;
  customerName: string;
  optionSelected: string;
  remark?: string;
  otpCode: string;
  signatures?: { signature: string }[];
}

export interface LostPassbookReplacementResponse {
  id: string;
  // Add other response fields as needed
}

class LostPassbookReplacementService {
  async submit(data: LostPassbookReplacementData) {
    const payload = {
      BranchId: data.branchId,
      PhoneNumber: data.phoneNumber,
      AccountNumber: data.accountNumber,
      CustomerName: data.customerName,
      OptionSelected: data.optionSelected,
      Remark: data.remark,
      OtpCode: data.otpCode,
      Signatures: data.signatures,
    };
    return apiClient.post<LostPassbookReplacementResponse>('/LostPassbookReplacement/submit', payload);
  }
}

export const lostPassbookReplacementService = new LostPassbookReplacementService();
export default lostPassbookReplacementService;
