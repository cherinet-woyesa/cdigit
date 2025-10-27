import axios from "axios";
import type { ApiResponse } from "../types/ApiResponse";

const API_BASE_URL = "http://localhost:5268/api";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

/**
 * Checks if an account exists for the given phone number.
 * Returns true if an account exists, false otherwise.
 */
export const checkAccountExistsByPhone = async (phoneNumber: string): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Accounts/by-phone/${encodeURIComponent(phoneNumber)}`);
    // If the response contains an account, return true
    if (response.data && (Array.isArray(response.data) ? response.data.length > 0 : response.data)) {
      return true;
    }
    return false;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      // 404 means no account found
      return false;
    }
    throw error;
  }
};

const accountService = {
  // 🔍 Search accounts by name, phone, or account number
  search: async (query: string, token: string) => {
    const res = await axios.get<ApiResponse<any>>(
      `${API_BASE_URL}/Accounts/Search?query=${encodeURIComponent(query)}`,
      authHeader()
    );
    return res.data;
  },

  // Get account by number
  getByNumber: async (accountNumber: string, token: string) => {
    const res = await axios.get<ApiResponse<any>>(
      `${API_BASE_URL}/Accounts/AccountNumExist/${accountNumber}`,
      authHeader()
    );
    return res.data;
  },

  // Get accounts linked to a phone number
  getByPhone: async (phoneNumber: string, token: string) => {
    const res = await axios.get<ApiResponse<any>>(
      `${API_BASE_URL}/Accounts/by-phone/${phoneNumber}`,
      authHeader()
    );
    return res.data;
  },

  // NEW: Get phone number by account number
  getPhoneByAccountNumber: async (accountNumber: string, token: string) => {
    const res = await axios.get<ApiResponse<string>>(
      `${API_BASE_URL}/Accounts/phone-by-account/${accountNumber}`,
      authHeader()
    );
    return res.data;
  },
};

export default accountService;