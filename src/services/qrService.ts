import axios from "axios";

const BASE_URL = "http://localhost:5268/api/BranchQr"; 

export const qrService = {
  generate: async (branchId: string) => {
    console.log("Generating QR for branch:", branchId);
    const res = await axios.post(`${BASE_URL}/Generate/${branchId}`);
    return res.data;
  },

  validate: async (branchId: string, token: string) => {
    const res = await axios.post(`${BASE_URL}/Validate`, { branchId, token });
    return res.data;
  },
};
