// Types
export interface StopPaymentOrder {
  id: string;
  formRefId: string;
  type: 'SPO' | 'RSPO';
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  accountNumber: string;
  customerName: string;
  accountBalance: number;
  chequeNumber: string;
  amount: number;
  chequeDate: string;
  reason: string;
  branchName: string;
  dateCreated: string;
  dateProcessed?: string;
  signatureData?: string;
  verifiedBy?: string;
  approvedBy?: string;
  relatedSpoId?: string; // For RSPO to reference original SPO
  auditLog: Array<{
    action: string;
    timestamp: string;
    performedBy: string;
    details?: string;
  }>;
}

// Mock data for development
const mockCustomerAccounts = {
  '1000123456': {
    accountNumber: '1000123456',
    customerName: 'John Doe',
    balance: 50000,
    branchName: 'Addis Ababa Main Branch',
    activeCheques: [
      { number: '123456', amount: 5000, date: '2025-09-15', status: 'active' },
      { number: '123457', amount: 7500, date: '2025-09-20', status: 'active' },
    ],
  },
};

// In-memory storage for development
let stopPaymentOrders: StopPaymentOrder[] = [];

// Generate a random reference ID
const generateReferenceId = (): string => {
  const prefix = 'SPO';
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${randomNum}`;
};

// Simulate API call delay
const simulateApiCall = <T>(data: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), 500);
  });
};

// Service methods
export const stopPaymentService = {
  // Get customer account details
  getCustomerAccount: async (accountNumber: string) => {
    return simulateApiCall({
      success: true,
      data: mockCustomerAccounts[accountNumber as keyof typeof mockCustomerAccounts] || null,
    });
  },

  // Submit Stop Payment Order
  submitStopPaymentOrder: async (data: Omit<StopPaymentOrder, 'id' | 'formRefId' | 'dateCreated' | 'auditLog' | 'status'>) => {
    const newOrder: StopPaymentOrder = {
      ...data,
      id: `order_${Date.now()}`,
      formRefId: generateReferenceId(),
      dateCreated: new Date().toISOString(),
      status: 'pending',
      auditLog: [
        {
          action: 'SPO_CREATED',
          timestamp: new Date().toISOString(),
          performedBy: data.verifiedBy || 'system',
          details: 'Stop Payment Order created',
        },
      ],
    };

    stopPaymentOrders.push(newOrder);
    return simulateApiCall({
      success: true,
      data: newOrder,
    });
  },

  // Submit Revoke Stop Payment Order
  submitRevokeStopPaymentOrder: async (spoId: string, data: {
    verifiedBy: string;
    approvedBy: string;
    signatureData: string;
  }) => {
    const spoIndex = stopPaymentOrders.findIndex(order => order.id === spoId);
    
    if (spoIndex === -1) {
      return simulateApiCall({
        success: false,
        error: 'Stop Payment Order not found',
      });
    }

    const updatedOrder = {
      ...stopPaymentOrders[spoIndex],
      status: 'revoked',
      dateProcessed: new Date().toISOString(),
      verifiedBy: data.verifiedBy,
      approvedBy: data.approvedBy,
      auditLog: [
        ...(stopPaymentOrders[spoIndex].auditLog || []),
        {
          action: 'SPO_REVOKED',
          timestamp: new Date().toISOString(),
          performedBy: data.verifiedBy,
          details: 'Stop Payment Order revoked',
        },
      ],
    };

    stopPaymentOrders[spoIndex] = updatedOrder;

    // Create RSPO record
    const rspoOrder: StopPaymentOrder = {
      id: `order_${Date.now()}`,
      formRefId: generateReferenceId(),
      type: 'RSPO',
      status: 'approved',
      accountNumber: updatedOrder.accountNumber,
      customerName: updatedOrder.customerName,
      accountBalance: updatedOrder.accountBalance,
      chequeNumber: updatedOrder.chequeNumber,
      amount: updatedOrder.amount,
      chequeDate: updatedOrder.chequeDate,
      reason: 'Revoked by customer request',
      branchName: updatedOrder.branchName,
      dateCreated: new Date().toISOString(),
      dateProcessed: new Date().toISOString(),
      signatureData: data.signatureData,
      verifiedBy: data.verifiedBy,
      approvedBy: data.approvedBy,
      relatedSpoId: spoId,
      auditLog: [
        {
          action: 'RSPO_CREATED',
          timestamp: new Date().toISOString(),
          performedBy: data.verifiedBy,
          details: 'Revoke Stop Payment Order created',
        },
      ],
    };

    stopPaymentOrders.push(rspoOrder);

    return simulateApiCall({
      success: true,
      data: {
        spo: updatedOrder,
        rspo: rspoOrder,
      },
    });
  },

  // Get Stop Payment Order by ID
  getStopPaymentOrder: async (id: string) => {
    const order = stopPaymentOrders.find(order => order.id === id);
    return simulateApiCall({
      success: !!order,
      data: order || null,
      error: order ? undefined : 'Stop Payment Order not found',
    });
  },

  // Search Stop Payment Orders
  searchStopPaymentOrders: async (criteria: {
    accountNumber?: string;
    chequeNumber?: string;
    customerName?: string;
  }) => {
    let results = [...stopPaymentOrders];
    
    if (criteria.accountNumber) {
      results = results.filter(order => 
        order.accountNumber.includes(criteria.accountNumber!)
      );
    }
    
    if (criteria.chequeNumber) {
      results = results.filter(order => 
        order.chequeNumber.includes(criteria.chequeNumber!)
      );
    }
    
    if (criteria.customerName) {
      const searchTerm = criteria.customerName.toLowerCase();
      results = results.filter(order => 
        order.customerName.toLowerCase().includes(searchTerm)
      );
    }
    
    return simulateApiCall({
      success: true,
      data: results,
    });
  },

  // Get all active (not revoked) Stop Payment Orders for an account
  getActiveStopPaymentOrders: async (accountNumber: string) => {
    const activeOrders = stopPaymentOrders.filter(
      order => 
        order.accountNumber === accountNumber && 
        order.status !== 'revoked' &&
        order.type === 'SPO'
    );
    
    return simulateApiCall({
      success: true,
      data: activeOrders,
    });
  },
};

export default stopPaymentService;
