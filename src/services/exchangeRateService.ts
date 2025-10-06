// services/exchangeRateService.ts

import axios from "axios";
// import { authHeader } from "./authHeader"; // your helper that attaches JWT from localStorage/session
import type { ExchangeRate } from "../types/ExchangeRate";

const API_BASE_URL = "http://localhost:5268/api/exchangeRate";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const exchangeRateService = {
  getRates: async (): Promise<ExchangeRate[]> => {
    const res = await axios.get(`${API_BASE_URL}`);
    if (res.data.success) {
      return res.data.data;
    }
    return [];
  },

  createRate: async (data: ExchangeRate) => {
    const res = await axios.post(`${API_BASE_URL}`, data, authHeader());
    return res.data;
  },

  updateRate: async (id: string, data: ExchangeRate) => {
    const res = await axios.put(`${API_BASE_URL}/${id}`, data, authHeader());
    return res.data;
  },

  deleteRate: async (id: string) => {
    const res = await axios.delete(`${API_BASE_URL}/${id}`, authHeader());
    return res.data;
  },
};