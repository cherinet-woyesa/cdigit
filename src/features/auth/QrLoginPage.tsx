import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function QrLoginPage() {
  const { branchId, token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const validateQr = async () => {
      try {
        const res = await axios.post("/api/BranchQr/Validate", {
          branchId,
          token,
        });

        if (res.data.success) {
          localStorage.setItem("selectedBranchId", branchId!);
          alert("✅ Branch access validated!");
          navigate("/otp-login");
        } else {
          alert(`⚠️ ${res.data.message}`);
          navigate("/");
        }
      } catch (err: any) {
        alert(`❌ Error: ${err.response?.data?.message || err.message}`);
        navigate("/");
      }
    };

    if (branchId && token) validateQr();
  }, [branchId, token, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h2 className="text-lg font-semibold mb-2">Verifying QR access...</h2>
      <p className="text-gray-600 text-sm">Branch ID: {branchId}</p>
      <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>
  );
}
