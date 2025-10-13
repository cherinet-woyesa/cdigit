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
    const res = await axios.get<ApiResponse<CustomerQueueItem[]>>(
      `${API_BASE_URL}/Teller/All_Customer_On_Queue/${branchId}`,
      authHeader(token)
    );
    return res.data;
  },

  callNextCustomer: async (makerId: string, windowId: string, branchId: string, token: string) => {
    const res = await axios.get<ApiResponse<NextCustomerData>>(
      `${API_BASE_URL}/Teller/Next/${makerId}/${windowId}/${branchId}`,
      authHeader(token)
    );
    return res.data;
  },

  // callNextCustomer: async (
  //   makerId: string,
  //   windowId: string,
  //   branchId: string,
  //   windowType: string,
  //   token: string
  // ) => {
  //   console.log("makerService.callNextCustomer called with:", { makerId, windowId, branchId, windowType });
  //   const payload = {
  //     frontMakerId: makerId,
  //     windowId: windowId,
  //     branchId: branchId,
  //     customerSegment: windowType, // e.g., "Retail", "Corporate"
  //     // priorityLevel: 0,            // default to 0; adjust as needed
  //     serviceType: windowType  // e.g., "Deposit", "Withdrawal"
  //   };

  //   const res = await axios.post<ApiResponse<NextCustomerData>>(
  //     `${API_BASE_URL}/Teller/Next`,
  //     payload,
  //     authHeader(token)
  //   );

  //   return res.data;
  // },


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
  searchCustomerByFormReferenceId: async (formReferenceId: string, token: string) => {
    const res = await axios.get<ApiResponse<NextCustomerData>>(
      `${API_BASE_URL}/Teller/SearchByFormReference/${formReferenceId}`,
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

};

export default makerService;
export type { NextCustomerData as NextCustomerResponse };