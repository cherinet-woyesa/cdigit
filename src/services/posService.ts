// Mock data for development
interface POSRequestData {
  accountNumber: string;
  customerName: string;
  businessName: string;
  businessType: string;
  tinNumber: string;
  businessLicenseNumber: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  region: string;
  city: string;
  subCity: string;
  woreda: string;
  houseNumber: string;
  landmark?: string;
  numberOfPOS: number;
  posType: 'mobile' | 'desktop';
  estimatedMonthlyTransaction: string;
  bankAccountForSettlement: string;
  formRefId: string;
  branchName: string;
  submittedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

// Helper function to create mock response
const createMockResponse = (data: Omit<POSRequestData, 'status'>, status: POSRequestData['status'] = 'pending') => ({
  success: true,
  message: 'POS request processed successfully',
  data: {
    ...data,
    status,
    id: `pos-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
});

// Simulate API delay
const simulateApiCall = <T>(data: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), 1000);
  });
};

export const posService = {
  async submitRequest(data: Omit<POSRequestData, 'status'>) {
    try {
      const mockResponse = createMockResponse(data);
      return await simulateApiCall(mockResponse);
    } catch (error) {
      console.error('Error submitting POS request:', error);
      throw error;
    }
  },
  
  async getPOSRequests() {
    try {
      // Mock empty array response
      return await simulateApiCall({
        success: true,
        data: []
      });
    } catch (error) {
      console.error('Error fetching POS requests:', error);
      throw error;
    }
  },
  
  async getPOSRequestById(id: string) {
    try {
      // Mock null response for now
      return await simulateApiCall({
        success: true,
        data: null
      });
    } catch (error) {
      console.error(`Error fetching POS request ${id}:`, error);
      throw error;
    }
  },
  
  async updatePOSRequestStatus(id: string, status: 'approved' | 'rejected', comments?: string) {
    try {
      // Mock success response
      return await simulateApiCall({
        success: true,
        message: `POS request ${status} successfully`,
        data: {
          id,
          status,
          comments,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error(`Error updating POS request ${id} status:`, error);
      throw error;
    }
  }
};

export default posService;
