import { apiClient } from '@services/http';

export interface AdditionalPOSRequestData {
  branchId: string;
  phoneNumber: string;
  otpCode: string;
  companyName: string;
  addressesRequestDto: {
    region: string;
    zone: string;
    woreda: string;
    kebele?: string;
    city?: string;
    houseNumber?: string;
    poBox?: string;
  };
  contractNumber: string;
  reasonForAdditionalPOS: string;
  desktopPOSCount: number;
  mobilePOSCount: number;
  placeOfDeployment: string;
  linkedAccountNumber: string;
  linkedAccountBranchId: string;
  repFullName: string;
  repEmail: string;
  repTelNumber: string;
  repSignature: { signatureData: string };
  secRepFullName?: string;
  secRepEmail?: string;
  secRepTelNumber?: string;
  secRepSignature?: { signatureData?: string };
  recommendation?: string;
}

class AdditionalPOSRequestService {
  async requestOTP(phoneNumber: string) {
    return apiClient.post('/AdditionalPOSRequest/request-otp', { phoneNumber });
  }
  
  async submitRequest(data: AdditionalPOSRequestData) {
    return apiClient.post('/AdditionalPOSRequest/submit', data);
  }
}

export const additionalPOSRequestService = new AdditionalPOSRequestService();
export default additionalPOSRequestService;