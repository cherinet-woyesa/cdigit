import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api';

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export interface ServiceRequest {
  id: string;
  [key: string]: any; // Allow for different fields based on service type
}

export interface ServiceResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

const makerServices = {
  // Generic method to fetch service requests
  getServiceRequests: async <T extends ServiceRequest>(
    endpoint: string,
    token: string,
    branchId?: string
  ): Promise<ServiceResponse<T[]>> => {
    try {
      // Use path parameter for branchId instead of query parameter
      let url = `${API_BASE_URL}/${endpoint}`;
      
      // Add branchId as PATH parameter if provided (required for EBankingApplication)
      if (branchId) {
        url += `/${branchId}`;
      }
      
      const response = await axios.get<ServiceResponse<T[]>>(url, authHeader(token));
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch ${endpoint}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || `Failed to fetch ${endpoint}`,
        data: []
      };
    }
  },

  // Generic method to get a specific service request by ID
  getServiceRequestById: async <T extends ServiceRequest>(
    endpoint: string,
    id: string,
    token: string
  ): Promise<ServiceResponse<T>> => {
    try {
      const url = `${API_BASE_URL}/${endpoint}/${id}`;
      const response = await axios.get<ServiceResponse<T>>(url, authHeader(token));
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch ${endpoint} with ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || `Failed to fetch ${endpoint} with ID ${id}`
      };
    }
  },

  // Generic method to update a service request
  updateServiceRequest: async <T extends ServiceRequest>(
    endpoint: string,
    id: string,
    data: Partial<T>,
    token: string
  ): Promise<ServiceResponse<T>> => {
    try {
      const url = `${API_BASE_URL}/${endpoint}/${id}`;
      const response = await axios.put<ServiceResponse<T>>(url, data, authHeader(token));
      return response.data;
    } catch (error: any) {
      console.error(`Failed to update ${endpoint} with ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || `Failed to update ${endpoint} with ID ${id}`
      };
    }
  },

  // Generic method to delete/cancel a service request
  cancelServiceRequest: async (
    endpoint: string,
    id: string,
    token: string
  ): Promise<ServiceResponse<boolean>> => {
    try {
      const url = `${API_BASE_URL}/${endpoint}/${id}`;
      const response = await axios.delete<ServiceResponse<boolean>>(url, authHeader(token));
      return response.data;
    } catch (error: any) {
      console.error(`Failed to cancel ${endpoint} with ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || `Failed to cancel ${endpoint} with ID ${id}`
      };
    }
  },

  // Specific methods for each service type
  getAccountOpeningRequests: (token: string, branchId?: string) => 
    makerServices.getServiceRequests<any>('AccountOpening', token, branchId),

  getAccountOpeningRequestById: (id: string, token: string) => 
    makerServices.getServiceRequestById<any>('AccountOpening', id, token),

  getCbeBirrRegistrationRequests: (token: string, branchId?: string) => 
    makerServices.getServiceRequests<any>('CbeBirrRegistrations', token, branchId),

  getCbeBirrRegistrationRequestById: (id: string, token: string) => 
    makerServices.getServiceRequestById<any>('CbeBirrRegistrations', id, token),

  getEBankingApplicationRequests: (token: string, branchId?: string) => 
    makerServices.getServiceRequests<any>('EBankingApplication', token, branchId),

  getEBankingApplicationRequestById: (id: string, token: string) => 
    makerServices.getServiceRequestById<any>('EBankingApplication', id, token),

  getPosRequestRequests: (token: string, branchId?: string) => 
    makerServices.getServiceRequests<any>('PosRequest', token, branchId),

  getPosRequestRequestById: (id: string, token: string) => 
    makerServices.getServiceRequestById<any>('PosRequest', id, token),

  getStatementRequestRequests: (token: string, branchId?: string) => 
    makerServices.getServiceRequests<any>('StatementRequest', token, branchId),

  getStatementRequestRequestById: (id: string, token: string) => 
    makerServices.getServiceRequestById<any>('StatementRequest', id, token),

  getStopPaymentRequests: (token: string, branchId?: string) => 
    makerServices.getServiceRequests<any>('StopPaymentOrder', token, branchId),

  getStopPaymentRequestById: (id: string, token: string) => 
    makerServices.getServiceRequestById<any>('StopPaymentOrder', id, token),

  getCbeBirrLinkRequests: (token: string, branchId?: string) => 
    makerServices.getServiceRequests<any>('CbeBirrLink', token, branchId),

  getCbeBirrLinkRequestById: (id: string, token: string) => 
    makerServices.getServiceRequestById<any>('CbeBirrLink', id, token),

  getRtgsTransferRequests: (token: string, branchId?: string) => 
    makerServices.getServiceRequests<any>('RtgsTransfer', token, branchId),

  getRtgsTransferRequestById: (id: string, token: string) => 
    makerServices.getServiceRequestById<any>('RtgsTransfer', id, token),
};

export default makerServices;