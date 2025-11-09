// Types
export interface CustomerAccount {
  accountNumber: string;
  accountType: string;
  currency: string;
  balance: number;
  status: 'active' | 'inactive' | 'dormant';
}

export interface CustomerInfo {
  customerId: string;
  fullName: string;
  phoneNumber: string;
  idNumber: string;
  idType: string;
  idIssueDate: string;
  idExpiryDate?: string;
  accounts: CustomerAccount[];
  cbeBirrLinked: boolean;
  cbeBirrPhone?: string;
  linkedAccounts: string[];
}

export interface CbeBirrLinkRequest {
  formRefId: string;
  branchName: string;
  date: string;
  customerId: string;
  fullName: string;
  idNumber: string;
  idType: string;
  idIssueDate: string;
  idExpiryDate?: string;
  actionType: 'link' | 'unlink' | 'change_phone' | 'modify_end_date';
  accounts: string[];
  currentPhoneNumber?: string;
  newPhoneNumber?: string;
  newEndDate?: string;
  termsAccepted: boolean;
  status: 'pending' | 'approved' | 'rejected';
  makerId: string;
  makerName: string;
  makerDate: string;
  checkerId?: string;
  checkerName?: string;
  checkerDate?: string;
  controllerId?: string;
  controllerName?: string;
  controllerDate?: string;
}

// Import the API client
import { apiClient } from './http';

// Helper function to generate form reference ID
const generateFormRefId = (): string => {
  const prefix = 'CBL';
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `${prefix}${timestamp}${random}`;
};

export const cbeBirrService = {
  // Get customer information by ID, phone number, or account number
  async getCustomerInfo(identifier: string): Promise<CustomerInfo | null> {
    try {
      // Try to search accounts by the identifier (could be phone number, account number, or ID)
      const searchResponse = await apiClient.get<any>(`/Accounts/Search?query=${encodeURIComponent(identifier)}`);
      
      if (searchResponse.success && searchResponse.data && searchResponse.data.length > 0) {
        // Use the first account found to construct customer info
        const account = searchResponse.data[0];
        
        // Construct customer info from account data
        const customerInfo: CustomerInfo = {
          customerId: account.customerId || 'N/A',
          fullName: account.accountHolderName || 'Unknown Customer',
          phoneNumber: account.phoneNumber || '',
          idNumber: account.idNumber || 'N/A',
          idType: account.idType || 'NID',
          idIssueDate: account.idIssueDate || new Date().toISOString(),
          idExpiryDate: account.idExpiryDate || undefined,
          cbeBirrLinked: false, // This would need to be determined from CBE Birr registration data
          linkedAccounts: [], // This would need to be populated from CBE Birr link data
          accounts: searchResponse.data.map((acc: any) => ({
            accountNumber: acc.accountNumber,
            accountType: acc.accountType || 'Savings',
            currency: acc.currency || 'ETB',
            balance: acc.balance || 0,
            status: acc.status?.toLowerCase() === 'active' ? 'active' : 'inactive'
          }))
        };
        
        return customerInfo;
      }
      
      // If no accounts found, try to get customer by account number specifically
      try {
        const customerResponse = await apiClient.get<any>(`/CorporateCustomer/by-account/${identifier}`);
        if (customerResponse.success && customerResponse.data) {
          const customer = customerResponse.data;
          return {
            customerId: customer.id,
            fullName: customer.companyName || customer.accountHolderName || 'Unknown Customer',
            phoneNumber: customer.phoneNumber || '',
            idNumber: customer.taxPayerIdNumber || 'N/A',
            idType: 'NID',
            idIssueDate: new Date().toISOString(),
            cbeBirrLinked: false,
            linkedAccounts: [],
            accounts: [{
              accountNumber: identifier,
              accountType: 'Corporate',
              currency: 'ETB',
              balance: 0,
              status: 'active'
            }]
          };
        }
      } catch (error) {
        // Continue to return null if both searches fail
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching customer info:', error);
      throw error;
    }
  },
  
  // Submit CBE-Birr link request
  async submitLinkRequest(data: Omit<CbeBirrLinkRequest, 'formRefId' | 'date' | 'status'>) {
    try {
      const requestData = {
        AccountNumber: data.accounts[0] || '', // Use first selected account
        CbeBirrPhoneNumber: data.newPhoneNumber || data.currentPhoneNumber || '',
        FullName: data.fullName,
        CustomerId: data.customerId,
        IdNumber: data.idNumber,
        IdIssuer: data.idType,
        IssueDate: data.idIssueDate,
        ExpiryDate: data.idExpiryDate,
        ServiceNeeded: data.actionType === 'link' ? 'New Account Link' : 
                      data.actionType === 'unlink' ? 'Unlink Account' :
                      data.actionType === 'change_phone' ? 'Phone Change' : 'Modify End Date',
        BranchId: '00000000-0000-0000-0000-000000000000', // This should come from the branch context
        OtpCode: '123456' // This should be provided by the user
      };
      
      const response = await apiClient.post<any>('/CbeBirrLink', requestData);
      
      if (response.success) {
        return {
          success: true,
          message: 'CBE-Birr link request submitted successfully',
          data: {
            ...data,
            formRefId: response.data.formReferenceId || generateFormRefId(),
            date: new Date().toISOString(),
            status: 'pending' as const
          }
        };
      } else {
        throw new Error(response.message || 'Failed to submit request');
      }
    } catch (error: any) {
      console.error('Error submitting CBE-Birr link request:', error);
      throw error;
    }
  },
  
  // Get CBE-Birr link requests (for future use)
  async getLinkRequests() {
    try {
      const response = await apiClient.get<any>('/CbeBirrLink');
      return {
        success: response.success,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error fetching CBE-Birr link requests:', error);
      throw error;
    }
  },
  
  // Get a single request by ID (for future use)
  async getLinkRequestById(id: string) {
    try {
      const response = await apiClient.get<any>(`/CbeBirrLink/${id}`);
      return {
        success: response.success,
        data: response.data || null
      };
    } catch (error) {
      console.error('Error fetching CBE-Birr link request:', error);
      throw error;
    }
  },
  
  // Check if phone number is available (not linked to another customer)
  async isPhoneNumberAvailable(phoneNumber: string): Promise<boolean> {
    try {
      // This would need to check against CBE Birr registration data
      // For now, we'll assume it's available
      return true;
    } catch (error) {
      console.error('Error checking phone number availability:', error);
      return true; // Assume available if check fails
    }
  }
};

export default cbeBirrService;