import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api';

/** Unified API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data?: T | null;
}

/** Queue item (from Teller/All_Customer_On_Queue) */
export type TransactionType = 'Deposit' | 'Withdrawal' | 'FundTransfer';

export interface CustomerQueueItem {
  id: string;
  formReferenceId: string;
  queueNumber: number;
  accountHolderName: string;
  amount: number;
  transactionType: TransactionType;
  status: number | string;
  submittedAt: string;
}

/** "Next customer" payload can be any of the mapped DTOs; include common fields + indexer for extras */
export interface NextCustomerData {
  id: string;
  formReferenceId: string;
  queueNumber: number;
  transactionType: TransactionType;
  accountNumber?: string | number;
  accountHolderName?: string;
  sourceAccountNumber?: string | number;
  destinationAccountNumber?: string | number;
  withdrawal_Amount?: number;         // server spelled "withdrawa_Amount" in sample; keep both
  withdrawa_Amount?: number;
  transferAmount?: number;
  tokenNumber?: string;
  [key: string]: any;
}

/** Update denominations DTO */
export interface DepositDenominationsUpdateDto {
  formReferenceId: string;            // (We’ll pass the same formReferenceId here)
  frontMakerId: string;       // maker GUID from token (nameid)
  denominations: { [key: string]: number };
}

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const makerService = {
  /** WINDOWS */
  getWindowsByBranchId: async (branchId: string, token: string) => {
    const res = await axios.get(`${API_BASE_URL}/Window/bybranch/${branchId}`, authHeader(token));
    //return res.data as any[]; // plain array
    return res.data?.data as any[]; // <-- pick .data

  },

  getAssignedWindowForMaker: async (makerId: string, token: string) => {
    const res = await axios.get(`${API_BASE_URL}/Window/assigned-to-maker/${makerId}`, authHeader(token));
    return res.data?.data || null;
  },

  assignMakerToWindow: async (windowId: string, makerId: string, token: string) => {
    const res = await axios.put(
      `${API_BASE_URL}/Window/${windowId}/assign-maker/${makerId}`,
      {},
      authHeader(token)
    );
    // return res.data as { message: string };
    return res.data;

  },

  changeMakerToWindow: async (windowId: string, makerId: string, token: string) => {
    console.log("makerService.changeMakerToWindow called with:", { windowId, makerId });
    const res = await axios.put(
      `${API_BASE_URL}/Window/${windowId}/change-window/${makerId}`,
      {},
      authHeader(token)
    );
    return res.data;
  },

  /** QUEUE & TELLER */
  getAllCustomersOnQueueByBranch: async (branchId: string, token: string) => {
    try {
      console.log(`Fetching customers on queue for branch: ${branchId}`);
      
      // Validate branchId
      if (!branchId) {
        throw new Error('Branch ID is required');
      }
      
      // Validate that branchId is a valid GUID format
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!guidRegex.test(branchId)) {
        console.warn('BranchId is not in valid GUID format:', branchId);
        // Try to convert to GUID format if it's missing dashes
        if (branchId.length === 32) {
          const formattedGuid = `${branchId.substring(0, 8)}-${branchId.substring(8, 12)}-${branchId.substring(12, 16)}-${branchId.substring(16, 20)}-${branchId.substring(20)}`;
          console.log('Converted branchId to GUID format:', formattedGuid);
          branchId = formattedGuid;
        } else {
          console.warn('BranchId cannot be converted to GUID format:', branchId);
        }
      }

      const res = await axios.get<ApiResponse<CustomerQueueItem[]>>(
        `${API_BASE_URL}/Teller/All_Customer_On_Queue/${branchId}`,
        authHeader(token)
      );
      
      console.log('Queue API response:', res.data);
      return res.data;
    } catch (error: any) {
      console.error('Error in getAllCustomersOnQueueByBranch:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        branchId
      });
      
      // Handle the case where there are no customers in queue (404 with specific message)
      if (error.response?.status === 404) {
        // Check if it's the "No customers in queue" message
        const errorMessage = error.response?.data?.message || '';
        if (errorMessage.includes('No customers in queue')) {
          // Return a successful response with empty data
          return {
            success: true,
            message: errorMessage,
            data: []
          } as ApiResponse<CustomerQueueItem[]>;
        }
      }
      
      // Re-throw the error so it can be handled by the caller
      throw error;
    }
  },

  callNextCustomer: async (
    makerId: string,
    windowId: string,
    branchId: string,
    windowType: string,
    token: string
  ) => {
    const res = await axios.get<ApiResponse<NextCustomerData>>(
      `${API_BASE_URL}/Teller/Next/${makerId}/${windowId}/${branchId}/${windowType}`,
      authHeader(token)
    );
    return res.data;
  },

  completeTransaction: async (id: string, token: string) => {
    const res = await axios.post<ApiResponse<null>>(
      `${API_BASE_URL}/Teller/Complete`,
      null,
      { ...authHeader(token), params: { id } }
    );
    return res.data;
  },

  cancelTransaction: async (id: string, token: string) => {
    const res = await axios.post<ApiResponse<null>>(
      `${API_BASE_URL}/Teller/Cancel`,
      null,
      { ...authHeader(token), params: { id } }
    );
    return res.data;
  },

  /** DEPOSIT */
  updateDepositDenominations: async (
    formReferenceId: string,
    updateDto: DepositDenominationsUpdateDto,
    token: string
  ) => {
    const res = await axios.put<ApiResponse<object>>(
      `${API_BASE_URL}/Deposits/denominations/${formReferenceId}`,

      updateDto,
      {
        ...authHeader(token),
        headers: {
          ...authHeader(token).headers,
          'Content-Type': 'application/json',
        },
      }
    );
    return res.data;
  },

  //get total served by current logged in maker
  getTotalServed: async (makerId: string, token: string) => {
    const res = await axios.get<ApiResponse<number>>(
      `${API_BASE_URL}/Teller/TotalServed/${makerId}`,
      authHeader(token)
    );
    return res.data;
  },

  //get by form reference id
  searchCustomerByFormReferenceId: async (branchId: string, formReferenceId: string, token: string) => {
    const res = await axios.get<ApiResponse<NextCustomerData>>(
      `${API_BASE_URL}/Teller/SearchByFormReference/${branchId}/${formReferenceId}`,
      authHeader(token)
    );
    return res.data;
  },



  //get branch info
  getBranchById: async (branchId: string, token: string) => {
    const res = await axios.get<ApiResponse<any>>(
      `${API_BASE_URL}/branches/${branchId}`,
      authHeader(token)
    );
    return res.data;
  },

  getMakerPerformance: async (makerId: string, branchId: string, token: string) => {
  const res = await axios.get(
    `${API_BASE_URL}/Performance/maker/${makerId}/${branchId}`,
    authHeader(token)
  );
  return res.data?.data;
},

};

export default makerService;
export type { NextCustomerData as NextCustomerResponse };