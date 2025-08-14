import axios, { AxiosError } from 'axios';

const API_BASE_URL = 'https://localhost:7101/api';


interface NextCustomerResponse {
    id: string;
    formKey: string;
    queueNumber: number;
    transactionType: 'Deposit' | 'Withdrawal' | 'FundTransfer';
    message: string;
}
interface DepositDenominationsUpdateDto {
  formkey: string;
  frontMakerId: string;
  denominations: { [key: string]: number };
}


const makerService = {
  // Fetch a list of pending forms for the maker's branch and assigned window
  getFormsForWindow: async (windowId: string, token: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/forms/pending-forms-for-window/${windowId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Return an empty array if no forms are found for the window, which is a clean state.
        console.warn(`No pending forms found for window ID: ${windowId}. Returning empty array.`);
        return [];
      }
      // Re-throw other errors (e.g., 500, network issues)
      console.error('Failed to fetch forms:', error);
      throw error;
    }
  },

  // Assign a maker to a window
  selectWindow: async (windowId: string, makerId: string, token: string) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/window/${windowId}/select-window/${makerId}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to assign maker to window:', error);
      throw error;
    }
  },

  // Get a list of all windows for a given branch
  getWindowsByBranchId: async (branchId: string, token: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/window/bybranch/${branchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Return an empty array if no windows are found for the branch.
        console.warn(`No windows found for branch ID: ${branchId}. Returning empty array.`);
        return [];
      }
      console.error('Failed to fetch windows by branch ID:', error);
      throw error;
    }
  },

  // Update deposit denominations
  updateDepositDenominations: async (formkey: string, updateDto: DepositDenominationsUpdateDto, token: string): Promise<{ message: string }> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/deposits/denominations/${formkey}`, updateDto, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update denominations:', error);
      throw error;
    }
  },



  // Mark a deposit as submitted to CBS
  markDepositAsDeposited: async (formkey: string, makerId: string, token: string) => {
    try {
      const updateDto = { formkey, frontMakerId: makerId };
      const response = await axios.put(`${API_BASE_URL}/deposits/mark-as-deposited`, updateDto, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to mark deposit as deposited:', error);
      throw error;
    }
  },

  getAssignedWindowForMaker: async (makerId: string, token: string) => {
    console.log('get Assigned window called:', { makerId });

    try {
      const response = await axios.get(`${API_BASE_URL}/window/assigned-to-maker/${makerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Assigned window response:', response.data);
      return response.data; // This will return the window object on success (200 OK)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // This is the expected case when no window is assigned.
        console.warn('No assigned window found (404). Returning null.');
        return null;
      }
      // For any other error (e.g., 500, network error), re-throw the error
      console.error('An unexpected error occurred:', error);
      throw error;
    }
  },
  callNextCustomer: async (makerId: string, windowId: string, branchId: string, token: string): Promise<NextCustomerResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/queue/call-next-customer/${makerId}/${windowId}/${branchId}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to call next customer:', error);
      throw error;
    }
  },
  getDepositById: async (id: string, token: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/deposits/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Failed to fetch deposit by ID:', error);
        throw error;
    }
},

getWithdrawalById: async (id: string, token: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/withdrawal/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Failed to fetch withdrawal by ID:', error);
        throw error;
    }
},

getFundTransferById: async (id: string, token: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/fundTransfer/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Failed to fetch fund transfer by ID:', error);
        throw error;
    }
},
};

export default makerService;