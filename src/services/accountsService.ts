import axios from "axios";

const API_BASE_URL = "http://localhost:5268/api";

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
