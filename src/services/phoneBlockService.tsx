import axios from "axios";
import type { ApiResponse } from "../types/ApiResponse";

const API_BASE_URL = "http://localhost:5268/api";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const phoneBlockService = {
 async requestBlock(data: any) {
    const res = await axios.post(
      `${API_BASE_URL}/PhoneBlock/Request`,
      data,
      authHeader()
    );
    return res.data?.data || null; // return created staff object or null
  },

   async recoverPhone(data: any) {
    const res = await axios.post(
      `${API_BASE_URL}/PhoneBlock/Recover`,
      data,
      authHeader()
    );
    return res.data?.data || null; // return created staff object or null
  },

};

export default phoneBlockService;
