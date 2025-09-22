// Types
export interface PettyCashFormData {
  formRefId: string;
  date: string;
  branchName: string;
  makerName: string;
  
  // Denomination quantities
  etb200Qty: number;
  etb100Qty: number;
  etb50Qty: number;
  etb10Qty: number;
  etb5Qty: number;
  totalCoins: number;
  
  // Cash movements
  previousDayBalance: number;
  cashFromVault: number;
  cashToVault: number;
  cashFromCustomers: number;
  cashToCustomers: number;
  
  // Foreign currency
  foreignCurrencies: {
    [key: string]: number;
  };
  
  // Auto-calculated fields
  subtotal: number;
  totalPettyCash: number;
  todaysBalance: number;
}

// Mock data storage
let pettyCashRecords: PettyCashFormData[] = [];

// Helper function to generate form reference ID
const generateFormRefId = (): string => {
  const prefix = 'PC';
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

export const pettyCashService = {
  // Submit new petty cash record
  async submitPettyCashRecord(data: Omit<PettyCashFormData, 'formRefId' | 'date' | 'subtotal' | 'totalPettyCash' | 'todaysBalance'>) {
    try {
      // Calculate auto fields
      const subtotal = (data.etb200Qty * 200) + 
                      (data.etb100Qty * 100) + 
                      (data.etb50Qty * 50) + 
                      (data.etb10Qty * 10) + 
                      (data.etb5Qty * 5);
      
      const totalPettyCash = subtotal + (data.totalCoins || 0);
      
      const todaysBalance = 
        (data.previousDayBalance || 0) + 
        (data.cashFromVault || 0) + 
        (data.cashFromCustomers || 0) - 
        (data.cashToCustomers || 0) - 
        (data.cashToVault || 0);
      
      const newRecord: PettyCashFormData = {
        ...data,
        formRefId: generateFormRefId(),
        date: new Date().toISOString(),
        subtotal,
        totalPettyCash,
        todaysBalance,
      };
      
      pettyCashRecords.push(newRecord);
      
      return await simulateApiCall({
        success: true,
        message: 'Petty cash record submitted successfully',
        data: newRecord
      });
    } catch (error) {
      console.error('Error submitting petty cash record:', error);
      throw error;
    }
  },
  
  // Get petty cash records (for future use)
  async getPettyCashRecords() {
    return await simulateApiCall({
      success: true,
      data: pettyCashRecords
    });
  },
  
  // Get a single record by ID (for future use)
  async getPettyCashRecordById(id: string) {
    const record = pettyCashRecords.find(r => r.formRefId === id);
    return await simulateApiCall({
      success: !!record,
      data: record || null
    });
  }
};

export default pettyCashService;
