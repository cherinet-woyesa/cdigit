// src/services/managerPettyCashService.ts
import axios from "axios";
const API_URL = "http://localhost:5268/api/PettyCashForm"; // adjust if needed

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const managerPettyCashService = {

  async getAllByBranch(branchId: string) {

    const res = await axios.get(`${API_URL}/branch/${branchId}`);
    return res.data?.data || [];
  },

  async giveInitialCash(formId: string, voultManagerId: string, amount: number) {
    const res = await axios.put(`${API_URL}/manager/give-initial`, {
      formId,
      voultManagerId,
      cashReceivedFromVault: amount,
    });
    return res.data;
  },

  async giveAdditionalCash(formId: string, voultManagerId: string, amount: number) {
    const res = await axios.put(`${API_URL}/manager/give-additional`, {
      formId,
      voultManagerId,
      additionalCashReceivedFromVault: amount,
    });
    return res.data;
  },


  async approveSurrender(formId: string, makerId: string, token: string) {
    const res = await axios.put(
      `${API_URL}/${formId}/manager/approve-surrender?makerId=${makerId}`, // Pass makerId as a query parameter
      {}, // Empty body as per the backend implementation
      authHeader(token) // Include authorization header
    );
    return res.data;
  },

  async approveAdditionalSurrender(formId: string, makerId: string, token: string) {
    const res = await axios.put(
      `${API_URL}/${formId}/manager/approve-additional-surrender?makerId=${makerId}`, // Pass makerId as a query parameter
      {}, // Empty body as per the backend implementation
      authHeader(token) // Include authorization header
    );
    return res.data;
  },


  async approveForeignCurrency(formId: string, makerId: string, token: string) {
    const res = await axios.put(`${API_URL}/${formId}/manager/approve-foreignCurrency-surrender?makerId=${makerId}`,
      {}, // Empty body as per the backend implementation
      authHeader(token) // Include authorization header
    );
    return res.data;
  },
};

export default managerPettyCashService;