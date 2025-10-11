import axios from "axios";
// const API_BASE = process.env.REACT_APP_API || "http://localhost:5268/api";
const API_BASE = "http://localhost:5268/api";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const reportService = {
  query: async (filter: any) => {
    const res = await axios.post(`${API_BASE}/Reports/query`, filter, authHeader());
    return res.data;
  },

  kpis: async (filter: any) => {
    const res = await axios.get(`${API_BASE}/Reports/kpis`, { params: filter, ...authHeader() });
    return res.data;
  },

  export: async (req: any) => {
    const res = await axios.post(`${API_BASE}/Reports/export`, req, { responseType: "blob", ...authHeader() });
    return res.data;
  }
};

export default reportService;
