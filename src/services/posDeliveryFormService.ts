// services/posDeliveryFormService.ts
import { apiClient } from './apiClient';

export interface POSDeliveryFormData {
  branchId: string;
  address: string;
  city: string;
  postalCode?: string;
  contactName: string;
  contactPhone: string;
  deliveryDate: string;
  specialInstructions?: string;
}

export interface POSDeliveryFormResponse {
  id: string;
  formReferenceId: string;
  address: string;
  status: string;
  submittedAt: string;
}

class POSDeliveryFormService {
  async submitPOSDeliveryForm(data: POSDeliveryFormData, token?: string) {
    const payload = {
      BranchId: data.branchId,
      Address: data.address,
      City: data.city,
      PostalCode: data.postalCode,
      ContactName: data.contactName,
      ContactPhone: data.contactPhone,
      DeliveryDate: data.deliveryDate,
      SpecialInstructions: data.specialInstructions,
    };

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    
    return apiClient.post<POSDeliveryFormResponse>('/POSDeliveryForm/submit', payload, headers);
  }

  async getPOSDeliveryFormById(id: string) {
    return apiClient.get<POSDeliveryFormResponse>(`/POSDeliveryForm/${id}`);
  }
}

export const posDeliveryFormService = new POSDeliveryFormService();
export const getPOSDeliveryFormById = posDeliveryFormService.getPOSDeliveryFormById.bind(posDeliveryFormService);
export default posDeliveryFormService;
