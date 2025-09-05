import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import BranchAdUsers from "./BranchAdUsers";
import Windows from "./Windows";
import AssignMaker from "./AssignMaker";
import Transactions from "./Transactions";
import CreateManagerBranchModal from "./CreateManagerBranchModal.tsx";
import managerService from "../../services/managerService";
import toast from "react-hot-toast";

interface Branch {
  id: string;
  name: string;
  code: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  isApproved: boolean;
}

export default function ManagerDashboard() {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [branchId, setBranchId] = useState<string>("");
    const [managerId, setManagerId] = useState<string>("");

  const [showCreateModal, setShowCreateModal] = useState(false);

  // Decode branchId from JWT once on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setBranchId(payload.BranchId);
      setManagerId(payload.nameid);
      console.log("at frontend: ManagerDashboard loaded with manager id:", payload.nameid);
    }
  }, []);

  // Load manager's branch
  useEffect(() => {
    const fetchBranch = async () => {
      try {
        if (branchId) {
          const res = await managerService.getBranchByManagerId(managerId);
          if (res.success && res.data) setBranch(res.data);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load your branch.");
      }
    };
    fetchBranch();
  }, [branchId]);

  return (
    <div className="p-6 bg-purple-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-purple-900">🏦 Branch Manager Dashboard</h1>

      <Tabs defaultValue="my-branch" className="w-full">
        <TabsList className="flex space-x-2 bg-purple-100 rounded-xl p-1 shadow-inner">
          <TabsTrigger value="my-branch" className="flex-1 text-purple-900 font-semibold rounded-lg hover:bg-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-400 data-[state=active]:text-white transition-all duration-300 shadow-sm">
            🏦 My Branch
          </TabsTrigger>
          <TabsTrigger value="users" className="flex-1 text-purple-900 font-semibold rounded-lg hover:bg-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-400 data-[state=active]:text-white transition-all duration-300 shadow-sm">
            👥 AD Users
          </TabsTrigger>
          <TabsTrigger value="windows" className="flex-1 text-purple-900 font-semibold rounded-lg hover:bg-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-400 data-[state=active]:text-white transition-all duration-300 shadow-sm">
            🪟 Windows
          </TabsTrigger>
          <TabsTrigger value="assign" className="flex-1 text-purple-900 font-semibold rounded-lg hover:bg-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-400 data-[state=active]:text-white transition-all duration-300 shadow-sm">
            🔗 Assign Maker
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex-1 text-purple-900 font-semibold rounded-lg hover:bg-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-400 data-[state=active]:text-white transition-all duration-300 shadow-sm">
            📊 Transactions
          </TabsTrigger>
        </TabsList>

        {/* My Branch Tab */}
        <TabsContent value="my-branch">
          {branch ? (
            <div className="p-4 bg-white rounded shadow text-purple-900">
              <h2 className="text-lg font-semibold">Branch Name: {branch.name}</h2>
              <p>Code: {branch.code}</p>
              <p>Location: {branch.location}</p>
              <p>Latitude: {branch.latitude}</p>
              <p>Longitude: {branch.longitude}</p>
              <p>Status: {branch.isApproved ? "Approved" : "Pending Approval"}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6">
              <p className="mb-4 text-purple-900 font-medium">You have no branch yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-400 text-white px-4 py-2 rounded hover:from-purple-700 hover:to-purple-500 transition-all"
              >
                ➕ Create Your Branch
              </button>
            </div>
          )}

          {showCreateModal && (
            <CreateManagerBranchModal
              open={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              setBranch={setBranch}
            />
          )}
        </TabsContent>

        {/* Other Tabs */}
        <TabsContent value="users"><BranchAdUsers branchId={branchId} /></TabsContent>
        <TabsContent value="windows"><Windows branchId={branchId} /></TabsContent>
        <TabsContent value="assign"><AssignMaker branchId={branchId} /></TabsContent>
        <TabsContent value="transactions"><Transactions branchId={branchId} /></TabsContent>
      </Tabs>
    </div>
  );
}
