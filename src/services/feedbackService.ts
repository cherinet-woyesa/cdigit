// services/feedbackService.ts
import axios from "axios";

const API_BASE_URL = "http://localhost:5268/api";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const feedbackService = {
  getByBranch: async (branchId: string) => {
    const res = await axios.get(`${API_BASE_URL}/feedback/branch/${branchId}`, authHeader());
    console.log("Feedback by branch response:", res);
    return res.data?.data || []; // array of feedback
  },
  getByMaker: async (makerId: string) => {
    const res = await axios.get(`${API_BASE_URL}/feedback/maker/${makerId}`, authHeader());
    return res.data?.data || [];
  },
};

export default feedbackService;