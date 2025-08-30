// src/services/adminService.ts
import axios from "axios";

const API_BASE_URL = "http://localhost:5268/api";

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("userToken"); // your login token key
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const adminService = {
  // -------------------- Branch APIs --------------------
  async getBranches() {
    const res = await axios.get(`${API_BASE_URL}/branches`, getAuthHeaders());
    return res.data; // ApiResponse { success, message, data }
  },

  async createBranch(branch: { name: string; code: string; location?: string }) {
    const res = await axios.post(`${API_BASE_URL}/branches`, branch, getAuthHeaders());
    return res.data;
  },

  // -------------------- User APIs --------------------
 
  async createUser(user: {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  branchId: string;
  roleName: string;        // "Manager" or "Maker"
}) {
  const res = await axios.post(`${API_BASE_URL}/auth/staff-register`, user, getAuthHeaders());
  return res.data; // ApiResponse<RegisterStaffDto>
},


  // -------------------- Account Type APIs --------------------
  async getAccountTypes() {
    const res = await axios.get(`${API_BASE_URL}/accounttypes`, getAuthHeaders());
    return res.data;
  },

  async addAccountType(accountTypeName: string) {
    const res = await axios.post(
      `${API_BASE_URL}/accounttypes`,
      { accountTypeName },
      getAuthHeaders()
    );
    return res.data;
  },

  async deleteAccountType(id: number) {
    const res = await axios.delete(`${API_BASE_URL}/accounttypes/${id}`, getAuthHeaders());
    return res.data;
  },

  // Get AD users
async getAdUsers() {
  const res = await axios.get(`${API_BASE_URL}/simulatedadusers`, getAuthHeaders());
  return res.data;
},


// Get System Users (AspNetUsers)
async getSystemUsers() {
  const res = await axios.get(`${API_BASE_URL}/users`, getAuthHeaders());
  return res.data;
},

};

export default adminService;