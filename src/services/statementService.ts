// Types
export interface CustomerAccount {
  accountNumber: string;
  accountName: string;
  branchCode: string;
  branchName: string;
  currency: string;
  balance: number;
  status: 'active' | 'inactive' | 'dormant';
}

export interface StatementRequestData {
  id: string;
  formRefId: string;
  date: string;
  branchName: string;
  branchCode: string;
  customerId: string;
  customerName: string;
  accountNumbers: string[];
  emailAddresses: string[];
  statementFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  termsAccepted: boolean;
  signature: string;
  status: 'pending' | 'approved' | 'rejected';
  makerId: string;
  makerName: string;
  makerDate: string;
  checkerId?: string;
  checkerName?: string;
  checkerDate?: string;
  approverId?: string;
  approverName?: string;
  approverDate?: string;
  auditorId?: string;
  auditorName?: string;
  auditorDate?: string;
  rejectionReason?: string;
  formReferenceId?: string;
  phoneNumber?: string;
  queueNumber?: number;
  tokenNumber?: string;
  serviceType?: string;
  submittedAt?: string;
  updatedAt?: string;
  calledAt?: string;
  depositedToCBSAt?: string;
  cancelledAt?: string;
  branchId?: string;
  windowId?: string;
  frontMakerId?: string;
  otpCode?: string; // Add this field
}

// API base URL - adjust according to your environment
const API_BASE_URL = 'http://localhost:5268/api';

// Helper function to generate form reference ID (for mock data)
const generateFormRefId = (): string => {
  const prefix = 'STMT';
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `${prefix}${timestamp}${random}`;
};

// Mock customer accounts (in a real app, this would come from an API)
const mockCustomerAccounts: Record<string, CustomerAccount[]> = {
  'CUST1001': [
    {
      accountNumber: '1000000001',
      accountName: 'John Doe - Savings',
      branchCode: '100',
      branchName: 'Head Office',
      currency: 'ETB',
      balance: 50000,
      status: 'active'
    },
    {
      accountNumber: '1000000002',
      accountName: 'John Doe - Current',
      branchCode: '100',
      branchName: 'Head Office',
      currency: 'USD',
      balance: 5000,
      status: 'active'
    }
  ]
};

export const statementService = {
  // Get customer accounts by customer ID
  async getCustomerAccounts(customerId: string): Promise<CustomerAccount[]> {
    try {
      // In a real app, this would be an API call to CBS
      const accounts = mockCustomerAccounts[customerId] || [];
      return accounts;
    } catch (error) {
      console.error('Error fetching customer accounts:', error);
      throw error;
    }
  },
  
  // Submit statement request
  async submitStatementRequest(data: Omit<StatementRequestData, 'formRefId' | 'date' | 'status' | 'id'> & { otpCode: string }) {
    try {
      // Backend expects PascalCase keys per DTO
      const payload = {
        AccountNumber: data.accountNumbers[0], // Backend expects single account
        PhoneNumber: data.phoneNumber || '',
        AccountHolderName: data.customerName,
        EmailAddress: data.emailAddresses.join(','), // Backend expects comma-separated string
        StatementFrequency: data.statementFrequency,
        TermsAccepted: data.termsAccepted,
        DigitalSignature: data.signature,
        BranchId: data.branchId || '00000000-0000-0000-0000-000000000000', // Default GUID
        OtpCode: data.otpCode // Use the actual OTP provided by the user (PascalCase to match backend DTO)
      };

      const response = await fetch(`${API_BASE_URL}/StatementRequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error submitting statement request:', error);
      throw error;
    }
  },
  
  // Get statement request by ID
  async getStatementRequestById(id: string): Promise<StatementRequestData | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/StatementRequest/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Transform backend response to match frontend interface
      const transformedData: StatementRequestData = {
        id: result.data.id,
        formRefId: result.data.formReferenceId,
        date: result.data.submittedAt,
        branchName: result.data.branch?.name || 'Unknown Branch',
        branchCode: result.data.branch?.code || '000',
        customerId: '', // Not provided in backend
        customerName: result.data.accountHolderName,
        accountNumbers: [result.data.accountNumber],
        emailAddresses: result.data.emailAddress ? result.data.emailAddress.split(',') : [],
        statementFrequency: result.data.statementFrequency,
        termsAccepted: result.data.termsAccepted,
        signature: result.data.digitalSignature,
        status: 'pending', // Map from backend status if needed
        makerId: result.data.frontMakerId || '',
        makerName: result.data.frontMaker?.userName || 'System',
        makerDate: result.data.submittedAt || new Date().toISOString(),
        formReferenceId: result.data.formReferenceId,
        phoneNumber: result.data.phoneNumber,
        queueNumber: result.data.queueNumber,
        tokenNumber: result.data.tokenNumber,
        serviceType: result.data.serviceType,
        submittedAt: result.data.submittedAt,
        updatedAt: result.data.updatedAt,
        branchId: result.data.branchId
      };
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching statement request:', error);
      throw error;
    }
  },
  
  // Get all statement requests
  async getStatementRequests(): Promise<StatementRequestData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/StatementRequest`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Transform backend response to match frontend interface
      return result.data.map((item: any) => ({
        id: item.id,
        formRefId: item.formReferenceId,
        date: item.submittedAt,
        branchName: item.branch?.name || 'Unknown Branch',
        branchCode: item.branch?.code || '000',
        customerId: '',
        customerName: item.accountHolderName,
        accountNumbers: [item.accountNumber],
        emailAddresses: item.emailAddress ? item.emailAddress.split(',') : [],
        statementFrequency: item.statementFrequency,
        termsAccepted: item.termsAccepted,
        signature: item.digitalSignature,
        status: 'pending',
        makerId: item.frontMakerId || '',
        makerName: item.frontMaker?.userName || 'System',
        makerDate: item.submittedAt || new Date().toISOString(),
        formReferenceId: item.formReferenceId,
        phoneNumber: item.phoneNumber,
        queueNumber: item.queueNumber,
        tokenNumber: item.tokenNumber,
        serviceType: item.serviceType,
        submittedAt: item.submittedAt,
        updatedAt: item.updatedAt,
        branchId: item.branchId
      }));
    } catch (error) {
      console.error('Error fetching statement requests:', error);
      throw error;
    }
  },
  
  // Cancel statement request
  async cancelStatementRequest(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/StatementRequest/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error canceling statement request:', error);
      throw error;
    }
  },
  
  // Request OTP for statement request
  async requestStatementOtp(phoneNumber: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/Auth/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const responseData = await response.json().catch(() => ({
        success: false,
        message: 'Invalid response from server',
      }));

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            message: 'No account found with this phone number',
          };
        }
        throw new Error(responseData?.message || 'Failed to request OTP');
      }

      return {
        success: true,
        message: responseData.message || 'OTP sent successfully',
        data: responseData.data,
      };
    } catch (error: any) {
      console.error('Error requesting OTP:', error);
      return {
        success: false,
        message: error.message || 'Failed to request OTP',
      };
    }
  },
  
  // Validate email format
  validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  
  // Validate multiple emails
  validateEmails(emails: string[]): { valid: boolean; invalidEmails: string[] } {
    const invalidEmails = emails.filter(email => email.trim() !== '' && !this.validateEmail(email));
    return {
      valid: invalidEmails.length === 0,
      invalidEmails
    };
  }
};

export default statementService;