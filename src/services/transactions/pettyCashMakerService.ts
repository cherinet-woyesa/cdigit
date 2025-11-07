// services/pettyCashMakerService.ts
import axios from "axios";
// Import InitialRequestDto from its module, adjust the path as needed
import type { InitialRequestDto } from "@types";

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

  requestInitial: async (dto: InitialRequestDto, token: string) => {
    console.log("initial request called");
    const res = await axios.post<ApiResponse<object>>(
      `${API_BASE_URL}/PettyCashForm/create-initial`,
      dto, // Pass the DTO as the payload
      authHeader(token)
    );
    console.log("data returned from initial request:", res.data);
    return res.data;
  },

  getByFrontMaker: async (frontMakerId: string, branchId: string, token: string) => {
    console.log("get petty by maker called ");
    const res = await axios.get<ApiResponse<object>>(
      `${API_BASE_URL}/PettyCashForm/by-frontmaker/${frontMakerId}/branch/${branchId}`,
      authHeader(token)
    );
    console.log("petty cash data:", res.data);
    return res.data;
  },


  approveReceipt: async (makerId: string, formId: string, token: string) => {
    const res = await axios.put<ApiResponse<object>>(
      `${API_BASE_URL}/PettyCashForm/${formId}/maker/approve-initial?makerId=${makerId}`, // Pass makerId as a query parameter

      {},
      authHeader(token)
    );
    return res.data;
  },


  requestAdditional: async (formId: string, token: string) => {
    const res = await axios.put<ApiResponse<object>>(
      `${API_BASE_URL}/PettyCashForm/${formId}/maker/request-additional`,
      {},
      authHeader(token)
    );
    return res.data;
  },

  approveAdditionalReceipt: async (makerId: string, formId: string, token: string) => {
    const res = await axios.put<ApiResponse<object>>(
      `${API_BASE_URL}/PettyCashForm/${formId}/maker/approve-additional?makerId=${makerId}`, // Pass makerId as a query parameter

      {},
      authHeader(token)
    );
    return res.data;
  },



  surrenderInitial: async (formId: string, frontMakerId: string, amount: number, token: string) => {
    const dto = {
      formId,
      FrontMakerId: frontMakerId,
      CashSurrenderedToVault: amount,
    };
    const res = await axios.put<ApiResponse<object>>(
      `${API_BASE_URL}/PettyCashForm/${formId}/maker/Initial-surrender`,
      dto,
      authHeader(token)
    );
    return res.data;
  },

  surrenderAdditional: async (formId: string, frontMakerId: string, amount: number, token: string) => {
    const dto = {
      formId,
      FrontMakerId: frontMakerId,
      AdditionalCashSurrenderedToVault: amount,
    };
    const res = await axios.put<ApiResponse<object>>(
      `${API_BASE_URL}/PettyCashForm/${formId}/maker/additional-surrender`,
      dto,
      authHeader(token)
    );
    return res.data;
  },

  submitForeignCurrency: async (formId: string, frontMakerId: string, foreignCurrencies: Record<string, number>, token: string) => {
    const dto = {
      formId,
      FrontMakerId: frontMakerId,
      ForeignCurrencies: foreignCurrencies,
    };

    const res = await axios.put<ApiResponse<object>>(
      `${API_BASE_URL}/PettyCashForm/${formId}/maker/submit-foreign-currency`,
      dto,
      authHeader(token)
    );
    return res.data;
  },

  submitPettyCash: async (formId: string, frontMakerId: string, denominations: Record<string, number>, token: string) => {
    const dto = {
      formId,
      FrontMakerId: frontMakerId,
      Denominations: denominations,
    };

    const res = await axios.put<ApiResponse<object>>(
      `${API_BASE_URL}/PettyCashForm/${formId}/maker/submit-petty-cash-denominations`,
      dto,
      authHeader(token)
    );
    return res.data;
  },


};

export default pettyCashMakerService;