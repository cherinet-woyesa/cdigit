// services/posDeliveryFormService.ts
import { apiClient } from '@services/http';
import authService from '@services/auth/authService';

export interface POSDeliveryFormData {
  branchId: string;
  accountNumber: string;
  phoneNumber: string;
  otpCode: string;
  registeredName: string;
  tradeName: string;
  tinNumber?: string;
  merchantId?: string;
  address?: string;
  typeOfPOSTerminal?: string;
  equipmentType?: string;
  serialNumber?: string;
  posId?: string;
  posAccessories?: string;
  deliveredBy?: string;
  deliveredTo?: string;
  deliveredByDate?: string;
  deliveredToDate?: string;
}

export interface POSDeliveryFormResponse {
  id: string;
  formReferenceId: string;
  tokenNumber: string;
  orderNumber: string;
  queueNumber: string;
  status: string;
  submittedAt: string;
}

class POSDeliveryFormService {
  async submitPOSDeliveryForm(data: POSDeliveryFormData, token?: string) {
    const payload = {
      BranchId: data.branchId,
      AccountNumber: data.accountNumber,
      PhoneNumber: data.phoneNumber,
      OtpCode: data.otpCode,
      RegisteredName: data.registeredName,
      TradeName: data.tradeName,
      TINNumber: data.tinNumber,
      MerchantId: data.merchantId,
      Address: data.address,
      TypeOfPOSTerminal: data.typeOfPOSTerminal,
      EquipmentType: data.equipmentType,
      SerialNumber: data.serialNumber,
      POSId: data.posId,
      POSAccessories: data.posAccessories,
      DeliveredBy: data.deliveredBy,
      DeliveredTo: data.deliveredTo,
      DeliveredByDate: data.deliveredByDate,
      DeliveredToDate: data.deliveredToDate,
    };

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    
    return apiClient.post<POSDeliveryFormResponse>('/POSDeliveryForm/submit', payload, headers);
  }

  async requestOTP(phoneNumber: string) {
    return authService.requestOTP(phoneNumber);
  }

  async getPOSDeliveryFormById(id: string) {
    return apiClient.get<POSDeliveryFormResponse>(`/POSDeliveryForm/${id}`);
  }
}

export const posDeliveryFormService = new POSDeliveryFormService();
export const getPOSDeliveryFormById = posDeliveryFormService.getPOSDeliveryFormById.bind(posDeliveryFormService);
export default posDeliveryFormService;