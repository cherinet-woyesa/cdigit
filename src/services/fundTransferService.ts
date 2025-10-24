// services/fundTransferService.ts
import { apiClient } from './apiClient';

export interface FundTransferData {
  phoneNumber: string;
  branchId: string;
  debitAccountNumber: string;
  creditAccountNumber: string;
  amount: number;
  remark?: string;
  otp: string;
  signatures?: { signatoryName: string; signatureData: string }[];
}

export interface FundTransferResponse {
  id: string;
  formReferenceId: string;
  debitAccountNumber: string;
  debitAccountName: string;
  beneficiaryAccountNumber: string;
  beneficiaryName: string;
  transferAmount: number;
  tokenNumber: string;
  queueNumber?: number;
  reason?: string;
  status: string;
  submittedAt: string;
  calledAt?: string;
  depositedToCBSAt?: string;
}

export interface AccountValidationResponse {
  success: boolean;
  data?: {
    accountHolderName: string;
    name: string;
  };
  message?: string;
}

class FundTransferService {
  async submitTransfer(data: FundTransferData) {
    const signatures = data.signatures?.map(sig => ({
      SignatoryName: sig.signatoryName,
      SignatureData: sig.signatureData
    })) || [];

    const payload = {
      PhoneNumber: data.phoneNumber,
      BranchId: data.branchId,
      DebitAccountNumber: data.debitAccountNumber,
      BeneficiaryAccountNumber: data.creditAccountNumber,
      TransferAmount: data.amount,
      Reason: data.remark || '',
      OtpCode: data.otp,
      Signatures: signatures.length > 0 ? signatures : undefined
    };

    return apiClient.post<FundTransferResponse>('/FundTransfer/submit', payload);
  }

  async sendFundTransferOTP(phoneNumber: string) {
    return apiClient.post('/FundTransfer/request-otp', { PhoneNumber: phoneNumber });
  }

  async updateTransfer(id: string, data: FundTransferData) {
    const signatures = data.signatures?.map(sig => ({
      SignatoryName: sig.signatoryName,
      SignatureData: sig.signatureData
    })) || [];

    const payload = {
      PhoneNumber: data.phoneNumber,
      BranchId: data.branchId,
      DebitAccountNumber: data.debitAccountNumber,
      BeneficiaryAccountNumber: data.creditAccountNumber,
      TransferAmount: data.amount,
      Reason: data.remark || '',
      OtpCode: data.otp,
      Signatures: signatures.length > 0 ? signatures : undefined
    };

    return apiClient.put<FundTransferResponse>(`/FundTransfer/${id}`, payload);
  }

  async getTransferById(id: string) {
    return apiClient.get<FundTransferResponse>(`/FundTransfer/${id}`);
  }

  async cancelTransfer(id: string) {
    return apiClient.put(`/FundTransfer/cancel-by-customer/${id}`);
  }

  // Add the missing method that the component expects
  async cancelFundTransferByCustomer(id: string) {
    return this.cancelTransfer(id);
  }

  async getTransferHistory(phoneNumber: string) {
    return apiClient.get<FundTransferResponse[]>(`/FundTransfer/history/${phoneNumber}`);
  }

  async getTransferByToken(tokenNumber: string) {
    return apiClient.get<FundTransferResponse>(`/FundTransfer/token/${tokenNumber}`);
  }

  async validateAccount(accountNumber: string) {
    return apiClient.get<AccountValidationResponse>(`/Accounts/AccountNumExist/${accountNumber}`);
  }
}

export const fundTransferService = new FundTransferService();
export default fundTransferService;

// Named exports for backward compatibility - ADD THE MISSING EXPORTS
export const submitTransfer = fundTransferService.submitTransfer.bind(fundTransferService);
export const getTransferById = fundTransferService.getTransferById.bind(fundTransferService);
export const cancelTransfer = fundTransferService.cancelTransfer.bind(fundTransferService);
export const cancelFundTransferByCustomer = fundTransferService.cancelFundTransferByCustomer.bind(fundTransferService); // ADD THIS
export const sendFundTransferOTP = fundTransferService.sendFundTransferOTP.bind(fundTransferService);
export const updateTransfer = fundTransferService.updateTransfer.bind(fundTransferService);
export const getTransferHistory = fundTransferService.getTransferHistory.bind(fundTransferService);
export const getTransferByToken = fundTransferService.getTransferByToken.bind(fundTransferService);
export const getFundTransferById = fundTransferService.getTransferByToken.bind(fundTransferService);
export const validateAccount = fundTransferService.validateAccount.bind(fundTransferService);