// services/kyc/kycService.ts
import { apiClient } from '@services/http';

export interface KycableItem {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  amount: number;
  isAuthorized: boolean;
  isAudited: boolean;
  isKycApproved: boolean;
  isRejected: boolean;
  remark: string;
  submittedAt: string;
  authorizerId?: string;
  auditerId?: string;
  kycOfficerId?: string;
  formReferenceId?: string;
  status?: string;
  branchName?: string;
  makerName?: string;
  makerId?: string;
  customerId?: string;
  signatureUrl?: string;
}

export interface KycApproveDto {
  serviceName: string;
  voucherId: string;
  kycOfficerId: string;
}

export interface KycGetTodayDto {
  serviceName: string;
  branchId: string;
}

export interface KycGetByIdDto {
  serviceName: string;
  voucherId: string;
  branchId: string;
}

export interface KycGetByFormReferenceDto {
  serviceName: string;
  formReferenceId: string;
  branchId: string;
}

export interface KycGetByAccountDto {
  serviceName: string;
  accountNumber: string;
  branchId: string;
}

export interface KycGetByPhoneDto {
  serviceName: string;
  phoneNumber: string;
  branchId: string;
}

export interface KycGetByMakerDto {
  serviceName: string;
  makerId: string;
  branchId: string;
}

export interface KycGetByDateRangeDto {
  serviceName: string;
  from: string;
  to: string;
  branchId: string;
}

export interface KycResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface GetByBranchResponse {
  success: boolean;
  message: string;
  data: KycableItem[];
}

class KycService {
  // Generic KYC approval method that matches backend
  async kycApprove(dto: KycApproveDto) {
    return apiClient.post<KycResponse>('/Kyc/KycApprove', dto);
  }

  // Generic retrieval methods that match backend endpoints
  async getToday(dto: KycGetTodayDto) {
    return apiClient.post<GetByBranchResponse>('/Kyc/today', dto);
  }

  async getById(dto: KycGetByIdDto) {
    return apiClient.post<GetByBranchResponse>('/Kyc/id', dto);
  }

  async getByFormReference(dto: KycGetByFormReferenceDto) {
    return apiClient.post<GetByBranchResponse>('/Kyc/formReference', dto);
  }

  async getByAccount(dto: KycGetByAccountDto) {
    return apiClient.post<GetByBranchResponse>('/Kyc/account', dto);
  }

  async getByPhone(dto: KycGetByPhoneDto) {
    return apiClient.post<GetByBranchResponse>('/Kyc/phone', dto);
  }

  async getByMaker(dto: KycGetByMakerDto) {
    return apiClient.post<GetByBranchResponse>('/Kyc/maker', dto);
  }

  async getByDateRange(dto: KycGetByDateRangeDto) {
    return apiClient.post<GetByBranchResponse>('/Kyc/range', dto);
  }
}

export const kycService = new KycService();
export default kycService;
