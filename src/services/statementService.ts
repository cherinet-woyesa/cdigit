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
}

// Mock data storage
let statementRequests: StatementRequestData[] = [];

// Helper function to generate form reference ID
const generateFormRefId = (): string => {
  const prefix = 'STMT';
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
      return await simulateApiCall(accounts);
    } catch (error) {
      console.error('Error fetching customer accounts:', error);
      throw error;
    }
  },
  
  // Submit statement request
  async submitStatementRequest(data: Omit<StatementRequestData, 'formRefId' | 'date' | 'status'>) {
    try {
      const newRequest: StatementRequestData = {
        ...data,
        formRefId: generateFormRefId(),
        date: new Date().toISOString(),
        status: 'pending'
      };
      
      statementRequests.push(newRequest);
      
      return await simulateApiCall({
        success: true,
        message: 'Statement request submitted successfully',
        data: newRequest
      });
    } catch (error) {
      console.error('Error submitting statement request:', error);
      throw error;
    }
  },
  
  // Get statement requests (for future use)
  async getStatementRequests() {
    return await simulateApiCall({
      success: true,
      data: statementRequests
    });
  },
  
  // Get a single request by ID (for future use)
  async getStatementRequestById(id: string) {
    const request = statementRequests.find(req => req.formRefId === id);
    return await simulateApiCall({
      success: !!request,
      data: request || null
    });
  },
  
  // Validate email format
  validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  
  // Validate multiple emails
  validateEmails(emails: string[]): { valid: boolean; invalidEmails: string[] } {
    const invalidEmails = emails.filter(email => !this.validateEmail(email));
    return {
      valid: invalidEmails.length === 0,
      invalidEmails
    };
  }
};

export default statementService;
