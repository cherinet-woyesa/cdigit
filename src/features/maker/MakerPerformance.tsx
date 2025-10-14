import React, { useEffect, useState } from "react";
import makerService from "../../services/makerService";
import { useAuth } from "../../context/AuthContext";

interface PerformanceData {
  avgFeedback: number;
  avgServiceTime: number;
}

const MakerPerformance: React.FC<{ makerId: string; branchId: string }> = ({ makerId, branchId }) => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await makerService.getMakerPerformance(makerId, branchId, token!);
        setData(result);
      } catch (err) {
        console.error("Failed to fetch maker performance:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [makerId, branchId, token]);

  if (loading) return <div className="text-center py-8">Loading performance...</div>;
  if (!data) return <div className="text-center py-8 text-red-500">No data found</div>;

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">My Performance Overview</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Average Feedback */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center">
          <span className="text-gray-600 font-medium mb-2">Average Feedback</span>
          <span className="text-4xl font-bold text-blue-600">
            {data.avgFeedback.toFixed(1)} ★
          </span>
          <p className="text-sm text-gray-500 mt-2">Based on customer ratings</p>
        </div>

        {/* Average Service Time */}
        <div
          className={`p-6 rounded-xl shadow-md border flex flex-col items-center ${
            data.avgServiceTime > 5
              ? "bg-red-50 border-red-300 text-red-700"
              : "bg-green-50 border-green-300 text-green-700"
          }`}
        >
          <span className="font-medium mb-2 text-gray-600">Average Service Time</span>
          <span className="text-4xl font-bold">
            {data.avgServiceTime.toFixed(1)} min
          </span>
          <p className="text-sm mt-2">
            {data.avgServiceTime > 5
              ? "Above ideal time ⚠️"
              : "Excellent performance ✅"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MakerPerformance;
