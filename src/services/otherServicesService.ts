import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api';

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export interface ServiceCount {
  serviceName: string;
  count: number;
}

export interface OtherServicesData {
  accountOpening: number;
  cbeBirrRegistration: number;
  eBankingApplication: number;
  posRequest: number;
  statementRequest: number;
  stopPayment: number;
  cbeBirrLink: number;
  rtgsTransfer: number;
  total: number;
}

const otherServicesService = {
  /**
   * Get count of pending/on-queue Account Opening requests by branch
   */
  getAccountOpeningCount: async (branchId: string, token: string): Promise<number> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/AccountOpening/pending-count/${branchId}`,
        authHeader(token)
      );
      return response.data?.data || 0;
    } catch (error) {
      console.error('Failed to fetch account opening count:', error);
      return 0;
    }
  },

  /**
   * Get count of pending CBE Birr Registration requests by branch
   */
  getCbeBirrRegistrationCount: async (branchId: string, token: string): Promise<number> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/CbeBirrRegistrations/pending-count/${branchId}`,
        authHeader(token)
      );
      return response.data?.data || 0;
    } catch (error) {
      console.error('Failed to fetch CBE Birr registration count:', error);
      return 0;
    }
  },

  /**
   * Get count of pending E-Banking Application requests by branch
   */
  getEBankingApplicationCount: async (branchId: string, token: string): Promise<number> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/EBankingApplication/pending-count/${branchId}`,
        authHeader(token)
      );
      return response.data?.data || 0;
    } catch (error) {
      console.error('Failed to fetch E-Banking application count:', error);
      return 0;
    }
  },

  /**
   * Get count of pending POS requests by branch
   */
  getPosRequestCount: async (branchId: string, token: string): Promise<number> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/posRequest/pending-count/${branchId}`,
        authHeader(token)
      );
      return response.data?.data || 0;
    } catch (error) {
      console.error('Failed to fetch POS request count:', error);
      return 0;
    }
  },

  /**
   * Get count of pending Statement requests by branch
   */
  getStatementRequestCount: async (branchId: string, token: string): Promise<number> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/StatementRequest/pending-count/${branchId}`,
        authHeader(token)
      );
      return response.data?.data || 0;
    } catch (error) {
      console.error('Failed to fetch statement request count:', error);
      return 0;
    }
  },

  /**
   * Get count of pending Stop Payment Orders by branch
   */
  getStopPaymentCount: async (branchId: string, token: string): Promise<number> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/StopPaymentOrder/pending-count/${branchId}`,
        authHeader(token)
      );
      return response.data?.data || 0;
    } catch (error) {
      console.error('Failed to fetch stop payment count:', error);
      return 0;
    }
  },

  /**
   * Get count of pending CBE Birr Link requests by branch
   */
  getCbeBirrLinkCount: async (branchId: string, token: string): Promise<number> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/CbeBirrLink/pending-count/${branchId}`,
        authHeader(token)
      );
      return response.data?.data || 0;
    } catch (error) {
      console.error('Failed to fetch CBE Birr link count:', error);
      return 0;
    }
  },

  /**
   * Get count of pending RTGS Transfer requests by branch
   */
  getRtgsTransferCount: async (branchId: string, token: string): Promise<number> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/RtgsTransfer/pending-count/${branchId}`,
        authHeader(token)
      );
      return response.data?.data || 0;
    } catch (error) {
      console.error('Failed to fetch RTGS transfer count:', error);
      return 0;
    }
  },

  /**
   * Get all other services counts for a branch
   */
  getAllServicesCounts: async (branchId: string, token: string): Promise<OtherServicesData> => {
    try {
      const [
        accountOpening,
        cbeBirrRegistration,
        eBankingApplication,
        posRequest,
        statementRequest,
        stopPayment,
        cbeBirrLink,
        rtgsTransfer
      ] = await Promise.all([
        otherServicesService.getAccountOpeningCount(branchId, token),
        otherServicesService.getCbeBirrRegistrationCount(branchId, token),
        otherServicesService.getEBankingApplicationCount(branchId, token),
        otherServicesService.getPosRequestCount(branchId, token),
        otherServicesService.getStatementRequestCount(branchId, token),
        otherServicesService.getStopPaymentCount(branchId, token),
        otherServicesService.getCbeBirrLinkCount(branchId, token),
        otherServicesService.getRtgsTransferCount(branchId, token)
      ]);

      const total = 
        accountOpening + 
        cbeBirrRegistration + 
        eBankingApplication + 
        posRequest + 
        statementRequest + 
        stopPayment + 
        cbeBirrLink + 
        rtgsTransfer;

      return {
        accountOpening,
        cbeBirrRegistration,
        eBankingApplication,
        posRequest,
        statementRequest,
        stopPayment,
        cbeBirrLink,
        rtgsTransfer,
        total
      };
    } catch (error) {
      console.error('Failed to fetch all services counts:', error);
      return {
        accountOpening: 0,
        cbeBirrRegistration: 0,
        eBankingApplication: 0,
        posRequest: 0,
        statementRequest: 0,
        stopPayment: 0,
        cbeBirrLink: 0,
        rtgsTransfer: 0,
        total: 0
      };
    }
  }
};

export default otherServicesService;
