import axios from "axios";

const API_BASE_URL = "http://localhost:5268/api";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});



const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};


const managerService = {
  // --- AD USERS ---
  getAdUsersByBranch: async (branchId: string) => {
    const res = await axios.get(
      `${API_BASE_URL}/simulatedadusers/bybranch/${branchId}`,
      authHeader()
    );
    return res.data?.data || []; // always return array
  },

  getUsersByBranch: async (branchId: string) => {
    console.log("at frontend: Fetching users for branch:", branchId);
    try {
      const response = await axios.get(`${API_BASE_URL}/users/by-branch/${branchId}`);
      console.log("at frontend: Response data:", response.data);
      return response.data?.data || []; // always return array // ApiResponse with list of users
    } catch (error: any) {
      console.error("Error fetching users by branch:", error);
      throw error.response?.data || { success: false, message: "Error fetching users" };
    }
  },

  createStaff: async (data: any) => {
    const res = await axios.post(
      `${API_BASE_URL}/auth/staff-register`,
      data,
      authHeader()
    );
    return res.data?.data || null; // return created staff object or null
  },


  // --- WINDOWS ---
  getWindowsByBranch: async (branchId: string) => {
    const res = await axios.get(
      `${API_BASE_URL}/Window/bybranch/${branchId}`,
      authHeader()
    );
    return res.data?.data || []; // always return array
  },

  createWindow: async (data: any) => {
    const res = await axios.post(`${API_BASE_URL}/Window`, data, authHeader());
    return res.data || null; // return created window object
  },

  //branch related
  async getBranchByManagerId(managerId: string) {
    const res = await axios.get(`${API_BASE_URL}/branches/manager/${managerId}`, getAuthHeaders());
    return res.data;
  },

  // async createBranch(branch: { name: string; code: string; latitude: number; longitude: number; location?: string }) {
  //   const res = await axios.post(`${API_BASE_URL}/branches`, branch, getAuthHeaders());
  //   return res.data;
  // },

  async createBranch(branch: { name: string; code: string; latitude: number; longitude: number; location?: string }) {
    const token = localStorage.getItem("token");
    let managerId = "";
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      managerId = payload.nameid; // Use 'id' property from token
      console.log("at frontend: createBranch called with manager id:", managerId);

    }

    const branchWithManager = {
      ...branch,
      managerId: managerId, // include managerId in request
    };

    const res = await axios.post(`${API_BASE_URL}/branches`, branchWithManager, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },


  async updateBranch(
    id: string,
    branch: {
      name: string;
      code: string;
      location?: string;
      latitude?: number;
      longitude?: number;
      status?: string;
    }
  ) {
    const res = await axios.put(`${API_BASE_URL}/branches/${id}`, branch, getAuthHeaders());
    return res.data;
  },

  updateWindowStatus: async (id: string, status: string) => {
    const res = await axios.put(
      `${API_BASE_URL}/Window/${id}/status`,
      { status },
      authHeader()
    );
    return res.data; // ApiResponse { success, message, data }
  },

  assignMakerToWindow: async (windowId: string, makerId: string) => {
    const res = await axios.put(
      `${API_BASE_URL}/Window/${windowId}/assign-maker/${makerId}`,
      {},
      authHeader()
    );
    console.log("at frontend: assignMakerToWindow response:", res.data.data);
    return res.data; // // return full ApiResponse, not just data
  },

  // --- TRANSACTIONS ---
  getTransactions: async (branchId: string) => {
    const res = await axios.get(
      `${API_BASE_URL}/Teller/All_Customer_On_Queue/${branchId}`,
      authHeader()
    );
    return res.data?.data || []; // always return array
  },
  getTodaysTransactions: async (branchId: string) => {
    const res = await axios.get(`${API_BASE_URL}/Teller/TodaysTransactions/${branchId}`, authHeader());
    return res.data; // full ApiResponse with { Transactions, Summary }
  },


  // --- CORPORATE CUSTOMERS ---
  getCorporateCustomers: async () => {
    const res = await axios.get(`${API_BASE_URL}/CorporateCustomer`, authHeader());
    return res.data;
  },

  createCorporateCustomer: async (customer: { accountNumber: string; phoneNumber: string; description?: string; creatorUserId: string }) => {
    const res = await axios.post(`${API_BASE_URL}/CorporateCustomer`, customer, authHeader());
    return res.data;
  },

  updateCorporateCustomer: async (id: string, customer: { accountNumber?: string; phoneNumber?: string; description?: string; status?: string }) => {
    const res = await axios.put(`${API_BASE_URL}/CorporateCustomer/${id}`, customer, authHeader());
    return res.data;
  },
 
  changeCorporateCustomerStatus: async (id: string, newStatus: string) => {
    console.log("at frontend: Changing corporate customer status to:", newStatus, "manager id:", id)
    const res = await axios.put(
      `${API_BASE_URL}/CorporateCustomer/${id}/status`,
      newStatus, // raw string
      {
        ...authHeader(),
        headers: {
          ...authHeader().headers,
          "Content-Type": "application/json", // default for ASP.NET Core
        },
      }
    );
    return res.data;
  },

  deleteCorporateCustomer: async (id: string) => {
    const res = await axios.delete(`${API_BASE_URL}/CorporateCustomer/${id}`, authHeader());
    return res.data;
  },

};

export default managerService;