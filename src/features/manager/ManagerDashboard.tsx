import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import BranchAdUsers from "./BranchAdUsers";
import Windows from "./Windows";
import AssignMaker from "./AssignMaker";
import Transactions from "./Transactions";
import CreateManagerBranchModal from "./CreateManagerBranchModal.tsx";
import managerService from "../../services/managerService";
import toast from "react-hot-toast";
import MyBranchModal from "./MyBranchModal.tsx";
import CorporateCustomers from "./CorporateCustomers.tsx";
import ScreenDisplay from "../screen/ScreenDisplay";

interface Branch {
  id: string;
  name: string;
  code: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  isApproved: boolean;
  managerId: string; // add this
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

          <TabsTrigger value="users" className="flex-1 text-purple-900 font-semibold rounded-lg hover:bg-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-400 data-[state=active]:text-white transition-all duration-300 shadow-sm">
            👥 AD Users
          </TabsTrigger>
          <TabsTrigger value="windows" className="flex-1 text-purple-900 font-semibold rounded-lg hover:bg-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-400 data-[state=active]:text-white transition-all duration-300 shadow-sm">
            🪟 Windows
          </TabsTrigger>

          <TabsTrigger value="corporate-customers" className="flex-1 text-purple-900 font-semibold rounded-lg hover:bg-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-400 data-[state=active]:text-white transition-all duration-300 shadow-sm">
            🏢 Corporate Customers
          </TabsTrigger>


          <TabsTrigger value="assign" className="flex-1 text-purple-900 font-semibold rounded-lg hover:bg-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-400 data-[state=active]:text-white transition-all duration-300 shadow-sm">
            🔗 Assign Maker
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex-1 text-purple-900 font-semibold rounded-lg hover:bg-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-400 data-[state=active]:text-white transition-all duration-300 shadow-sm">
            📊 Transactions
          </TabsTrigger>
          <TabsTrigger value="my-branch" className="flex-1 text-purple-900 font-semibold rounded-lg hover:bg-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-400 data-[state=active]:text-white transition-all duration-300 shadow-sm">
            🏦 My Branch
          </TabsTrigger>
          <TabsTrigger value="Screen-Display" className="flex-1 text-purple-900 font-semibold rounded-lg hover:bg-purple-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-400 data-[state=active]:text-white transition-all duration-300 shadow-sm">
            🏦 Screen Display
          </TabsTrigger>

        </TabsList>

        {/* Other Tabs */}
        <TabsContent value="users"><BranchAdUsers branchId={branchId} /></TabsContent>
        <TabsContent value="windows"><Windows branchId={branchId} /></TabsContent>
        <TabsContent value="corporate-customers"> <CorporateCustomers managerId={managerId} /> </TabsContent>
        <TabsContent value="assign"><AssignMaker branchId={branchId} /></TabsContent>
        <TabsContent value="transactions"><Transactions branchId={branchId} /></TabsContent>
        <TabsContent value="Screen-Display"> <ScreenDisplay /> </TabsContent>

        {/* My Branch Tab */}
        <TabsContent value="my-branch">
          {branch ? (
            <>
              {/* Branch Card View */}
              {!showCreateModal && (
                <div className="p-6 bg-white rounded-2xl shadow-lg max-w-lg mx-auto  animate-fadeIn hover:shadow-2xl transition-shadow duration-300">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-purple-800 flex items-center gap-2">
                      🏦 {branch.name}
                    </h2>

                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm  text-gray-700">
                    <div className="p-4 bg-purple-50 rounded-lg shadow-inner hover:shadow-md transition-shadow">
                      <p className="font-semibold text-purple-700">Branch Code</p>
                      <p className="text-gray-900">{branch.code}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg shadow-inner hover:shadow-md transition-shadow">
                      <p className="font-semibold text-purple-700">Location</p>
                      <p className="text-gray-900">{branch.location || "—"}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg shadow-inner hover:shadow-md transition-shadow">
                      <p className="font-semibold text-purple-700">Latitude</p>
                      <p className="text-gray-900">{branch.latitude ?? "—"}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg shadow-inner hover:shadow-md transition-shadow">
                      <p className="font-semibold text-purple-700">Longitude</p>
                      <p className="text-gray-900">{branch.longitude ?? "—"}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-6">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${branch.isApproved
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                        }`}
                    >
                      {branch.isApproved ? "✅ Approved" : "⏳ Pending Approval"}
                    </span>
                    <span>
                      <button
                        onClick={() => setShowCreateModal(true)} // open modal for edit
                        className="bg-gradient-to-r from-purple-600 to-purple-400 text-white px-4 py-2 mx-4 rounded-lg hover:from-purple-700 hover:to-purple-500 transition-all shadow-md"
                      >
                        ✏️ Detail
                      </button>
                    </span>
                  </div>
                </div>
              )}

              {/* Edit Modal */}
              {showCreateModal && (
                <MyBranchModal
                  open={true}
                  onClose={() => setShowCreateModal(false)}
                  branch={branch}
                  setBranch={setBranch}
                />
              )}
            </>
          ) : (
            // No branch → show create button
            <div className="flex flex-col items-center justify-center p-6">
              <p className="mb-4 text-purple-900 font-medium">You have no branch yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-400 text-white px-4 py-2 rounded hover:from-purple-700 hover:to-purple-500 transition-all"
              >
                ➕ Create Your Branch
              </button>

              {showCreateModal && (
                <CreateManagerBranchModal
                  open={true}
                  onClose={() => setShowCreateModal(false)}
                  setBranch={setBranch}
                />
              )}
            </div>
          )}
        </TabsContent>


      </Tabs>
    </div>
  );
}
