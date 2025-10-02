// services/pettyCashMakerService.ts
import axios from "axios";

const API_BASE_URL = "http://localhost:5268/api";

export interface ApiResponse<T> {
  success: boolean;
  message?: string | null;
  data?: T | null;
}

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const pettyCashMakerService = {
  requestInitial: async (makerId: string, token: string) => {
    const res = await axios.post<ApiResponse<object>>(
      `${API_BASE_URL}/PettyCashForm/Maker/RequestInitial/${makerId}`,
      {},
      authHeader(token)
    );
    return res.data;
  },

  getByFrontMaker: async (makerId: string, branchId: string, token: string) => {
    const res = await axios.post<ApiResponse<object>>(
      `${API_BASE_URL}/PettyCashForm/by-frontmaker/${makerId}/branch/${branchId}`,
      {},
      authHeader(token)
    );

    console.log("petty cash data:", res.data);
    return res.data;
  },

  approveReceipt: async (makerId: string, token: string) => {
    const res = await axios.post<ApiResponse<object>>(
      `${API_BASE_URL}/PettyCashForm/Maker/ApproveInitialReceipt/${makerId}`,
      {},
      authHeader(token)
    );
    return res.data;
  },

  requestAdditional: async (makerId: string, token: string) => {
    const res = await axios.post<ApiResponse<object>>(
      `${API_BASE_URL}/PettyCashForm/Maker/RequestAdditional/${makerId}`,
      {},
      authHeader(token)
    );
    return res.data;
  },

  approveAdditionalReceipt: async (makerId: string, token: string) => {
    const res = await axios.post<ApiResponse<object>>(
      `${API_BASE_URL}/PettyCashForm/Maker/ApproveAdditionalReceipt/${makerId}`,
      {},
      authHeader(token)
    );
    return res.data;
  },

  surrenderInitial: async (makerId: string, token: string) => {
    const res = await axios.post<ApiResponse<object>>(
      `${API_BASE_URL}/PettyCashForm/Maker/SurrenderInitial/${makerId}`,
      {},
      authHeader(token)
    );
    return res.data;
  },

  surrenderAdditional: async (makerId: string, token: string) => {
    const res = await axios.post<ApiResponse<object>>(
      `${API_BASE_URL}/PettyCashForm/Maker/SurrenderAdditional/${makerId}`,
      {},
      authHeader(token)
    );
    return res.data;
  },

  submitForeignCurrency: async (makerId: string, dto: object, token: string) => {
    const res = await axios.post<ApiResponse<object>>(
      `${API_BASE_URL}/PettyCashForm/Maker/SubmitForeignCurrency/${makerId}`,
      dto,
      authHeader(token)
    );
    return res.data;
  },

  submitPettyCash: async (makerId: string, dto: object, token: string) => {
    const res = await axios.post<ApiResponse<object>>(
      `${API_BASE_URL}/PettyCashForm/Maker/SubmitPettyCash/${makerId}`,
      dto,
      authHeader(token)
    );
    return res.data;
  },
};

export default pettyCashMakerService;
