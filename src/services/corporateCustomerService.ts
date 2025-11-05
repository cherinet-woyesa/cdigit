// services/corporateCustomerService.ts
import { apiClient } from './apiClient';

export interface CorporateCustomerData {
  branchId: string;
  businessName: string;
  businessRegistrationNumber: string;
  taxIdentificationNumber: string;
  businessType: string;
  address: string;
  city: string;
  postalCode?: string;
  fullName: string;
  phoneNumber: string;
  email: string;
}

export interface CorporateCustomerResponse {
  id: string;
  formReferenceId: string;
  businessName: string;
  status: string;
  submittedAt: string;
}

class CorporateCustomerService {
  async submitCorporateCustomer(data: CorporateCustomerData, token?: string) {
    const payload = {
      BranchId: data.branchId,
      BusinessName: data.businessName,
      BusinessRegistrationNumber: data.businessRegistrationNumber,
      TaxIdentificationNumber: data.taxIdentificationNumber,
      BusinessType: data.businessType,
      Address: data.address,
      City: data.city,
      PostalCode: data.postalCode,
      FullName: data.fullName,
      PhoneNumber: data.phoneNumber,
      Email: data.email,
    };

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    
    return apiClient.post<CorporateCustomerResponse>('/CorporateCustomer/submit', payload, headers);
  }

  async getCorporateCustomerById(id: string) {
    return apiClient.get<CorporateCustomerResponse>(`/CorporateCustomer/${id}`);
  }
}

export const corporateCustomerService = new CorporateCustomerService();
export const getCorporateCustomerById = corporateCustomerService.getCorporateCustomerById.bind(corporateCustomerService);
export default corporateCustomerService;
