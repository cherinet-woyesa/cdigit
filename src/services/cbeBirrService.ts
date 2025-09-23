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

// Mock data storage
let cbeBirrRequests: CbeBirrLinkRequest[] = [];

// Helper function to generate form reference ID
const generateFormRefId = (): string => {
  const prefix = 'CBL';
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `${prefix}${timestamp}${random}`;
};

// Simulate API delay
const simulateApiCall = <T>(data: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), 1000);
  });
};

// Mock customer data (in a real app, this would come from an API)
const mockCustomerData: Record<string, CustomerInfo> = {
  '1234567890': {
    customerId: 'CUST1001',
    fullName: 'John Doe',
    phoneNumber: '+251911223344',
    idNumber: 'ET-1234567',
    idType: 'NID',
    idIssueDate: '2020-01-15',
    idExpiryDate: '2030-01-15',
    cbeBirrLinked: true,
    cbeBirrPhone: '+251911223344',
    linkedAccounts: ['1000000001'],
    accounts: [
      {
        accountNumber: '1000000001',
        accountType: 'Savings',
        currency: 'ETB',
        balance: 50000,
        status: 'active'
      },
      {
        accountNumber: '1000000002',
        accountType: 'Current',
        currency: 'USD',
        balance: 5000,
        status: 'active'
      }
    ]
  }
};

export const cbeBirrService = {
  // Get customer information by ID or phone number
  async getCustomerInfo(identifier: string): Promise<CustomerInfo | null> {
    try {
      // In a real app, this would be an API call to CBS
      const customer = Object.values(mockCustomerData).find(
        c => c.customerId === identifier || 
             c.phoneNumber === identifier ||
             c.accounts.some(acc => acc.accountNumber === identifier)
      );
      
      return await simulateApiCall(customer || null);
    } catch (error) {
      console.error('Error fetching customer info:', error);
      throw error;
    }
  },
  
  // Submit CBE-Birr link request
  async submitLinkRequest(data: Omit<CbeBirrLinkRequest, 'formRefId' | 'date' | 'status'>) {
    try {
      const newRequest: CbeBirrLinkRequest = {
        ...data,
        formRefId: generateFormRefId(),
        date: new Date().toISOString(),
        status: 'pending'
      };
      
      cbeBirrRequests.push(newRequest);
      
      return await simulateApiCall({
        success: true,
        message: 'CBE-Birr link request submitted successfully',
        data: newRequest
      });
    } catch (error) {
      console.error('Error submitting CBE-Birr link request:', error);
      throw error;
    }
  },
  
  // Get CBE-Birr link requests (for future use)
  async getLinkRequests() {
    return await simulateApiCall({
      success: true,
      data: cbeBirrRequests
    });
  },
  
  // Get a single request by ID (for future use)
  async getLinkRequestById(id: string) {
    const request = cbeBirrRequests.find(req => req.formRefId === id);
    return await simulateApiCall({
      success: !!request,
      data: request || null
    });
  },
  
  // Check if phone number is available (not linked to another customer)
  async isPhoneNumberAvailable(phoneNumber: string): Promise<boolean> {
    // In a real app, this would check against the CBS
    const isTaken = Object.values(mockCustomerData).some(
      customer => customer.phoneNumber === phoneNumber
    );
    return await simulateApiCall(!isTaken);
  }
};

export default cbeBirrService;
