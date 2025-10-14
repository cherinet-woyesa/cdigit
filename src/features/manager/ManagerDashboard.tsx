import { useEffect, useState, useCallback } from "react";
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
import { DashboardErrorBoundary } from "../../components/dashboard/ErrorBoundary";
import DashboardMetrics, { type Metric } from "../../components/dashboard/DashboardMetrics";
import { safeJWTDecode, isTokenExpired } from "../../utils/jwt";
import { BRAND_COLORS } from "../../config/env";
import ApprovalDashboard from "./ApprovalDashboard";
import PettyCash from "./PettyCash";

interface Branch {
  id: string;
  name: string;
  code: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  isApproved: boolean;
  managerId: string;
}

interface DashboardStats {
  totalTransactions: number;
  activeWindows: number;
  pendingApprovals: number;
  queueLength: number;
}

export default function ManagerDashboard() {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [branchId, setBranchId] = useState<string>("");
  const [managerId, setManagerId] = useState<string>("");
  const [vaultManagerId, setVaultManagerId] = useState<string>("");
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalTransactions: 0,
    activeWindows: 0,
    pendingApprovals: 0,
    queueLength: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-branch");

  // Secure JWT decoding with error handling
  useEffect(() => {
    const decodeToken = () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Authentication required");
          return;
        }

        if (isTokenExpired(token)) {
          toast.error("Session expired. Please login again.");
          localStorage.removeItem("token");
          window.location.href = '/login';
          return;
        }

        const payload = safeJWTDecode<{ BranchId: string; nameid: string }>(token);
        setBranchId(payload.BranchId);
        setManagerId(payload.nameid);
        setVaultManagerId(payload.nameid); // Using managerId as vaultManagerId for now
        console.log("ManagerDashboard: Token decoded successfully", payload);
      } catch (error) {
        console.error("ManagerDashboard: Failed to decode token", error);
        toast.error("Authentication error");
      }
    };

    decodeToken();
  }, []);

  // Load manager's branch with error handling
  useEffect(() => {
    const fetchBranch = async () => {
      if (!managerId) return;
      
      try {
        setIsLoading(true);
        const res = await managerService.getBranchByManagerId(managerId);
        if (res.success && res.data) {
          setBranch(res.data);
          // Load dashboard stats after branch is loaded
          await loadDashboardStats(res.data.id);
        }
      } catch (err: any) {
        console.error("Failed to load branch:", err);
        toast.error(err.message || "Failed to load your branch.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranch();
  }, [managerId]);

  // Load dashboard statistics
  const loadDashboardStats = useCallback(async (branchId: string) => {
    try {
      // Simulated stats - replace with actual API calls
      const stats: DashboardStats = {
        totalTransactions: 247,
        activeWindows: 8,
        pendingApprovals: 12,
        queueLength: 23
      };
      setDashboardStats(stats);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    }
  }, []);

  // Dashboard metrics configuration
  const metrics: Metric[] = [
    {
      label: "Today's Transactions",
      value: dashboardStats.totalTransactions,
      color: "fuchsia" as const,
      trend: "up" as const
    },
    {
      label: "Active Windows",
      value: dashboardStats.activeWindows,
      color: "green" as const,
      trend: "neutral" as const
    },
    {
      label: "Pending Approvals",
      value: dashboardStats.pendingApprovals,
      color: "orange" as const,
      trend: "up" as const
    },
    {
      label: "Queue Length",
      value: dashboardStats.queueLength,
      color: "blue" as const,
      trend: "down" as const
    }
  ];

  // Handle tab change with analytics
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    // TODO: Add analytics tracking
    console.log(`Manager switched to tab: ${value}`);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600 mx-auto"></div>
          <p className="mt-4 text-fuchsia-700 font-medium">Loading Manager Dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Preparing branch overview</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 to-purple-50">
        {/* Enhanced Header */}
        <header className="bg-gradient-to-r from-fuchsia-700 to-purple-700 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">🏦 Branch Manager Dashboard</h1>
                <p className="text-fuchsia-100">
                  {branch ? `Managing: ${branch.name}` : 'No branch assigned'}
                  {branch?.code && ` • Code: ${branch.code}`}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="bg-white/10 px-4 py-2 rounded-lg">
                  <div className="text-xs text-fuchsia-200">Manager ID</div>
                  <div className="font-mono text-sm font-semibold">{managerId || 'N/A'}</div>
                </div>
                {branch && (
                  <div className={`px-4 py-2 rounded-lg ${
                    branch.isApproved 
                      ? 'bg-green-500/20 text-green-100' 
                      : 'bg-yellow-500/20 text-yellow-100'
                  }`}>
                    <div className="text-xs">Status</div>
                    <div className="text-sm font-semibold">
                      {branch.isApproved ? '✅ Approved' : '⏳ Pending Approval'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Metrics */}
        {branch && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <DashboardMetrics metrics={metrics} />
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="bg-fuchsia-100 p-1 rounded-xl shadow-inner mb-6 flex flex-wrap gap-2">
              <TabsTrigger 
                value="my-branch" 
                variant="brand"
                className="flex-1 min-w-[140px]"
              >
                🏦 My Branch
              </TabsTrigger>
              <TabsTrigger 
                value="approvals" 
                variant="brand"
                className="flex-1 min-w-[140px]"
              >
                ✅ Approvals
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                variant="brand"
                className="flex-1 min-w-[140px]"
              >
                👥 AD Users
              </TabsTrigger>
              <TabsTrigger 
                value="windows" 
                variant="brand"
                className="flex-1 min-w-[140px]"
              >
                🪟 Windows
              </TabsTrigger>
              <TabsTrigger 
                value="corporate-customers" 
                variant="brand"
                className="flex-1 min-w-[140px]"
              >
                🏢 Corporate
              </TabsTrigger>
              <TabsTrigger 
                value="assign" 
                variant="brand"
                className="flex-1 min-w-[140px]"
              >
                🔗 Assign Maker
              </TabsTrigger>
              <TabsTrigger 
                value="transactions" 
                variant="brand"
                className="flex-1 min-w-[140px]"
              >
                📊 Transactions
              </TabsTrigger>
              <TabsTrigger 
                value="petty-cash" 
                variant="brand"
                className="flex-1 min-w-[140px]"
              >
                💰 Petty Cash
              </TabsTrigger>
              <TabsTrigger 
                value="Screen-Display" 
                variant="brand"
                className="flex-1 min-w-[140px]"
              >
                📺 Screen Display
              </TabsTrigger>
            </TabsList>

            {/* Tab Contents */}
            <TabsContent value="approvals" className="animate-fadeIn">
              <ApprovalDashboard />
            </TabsContent>
            
            <TabsContent value="users" className="animate-fadeIn">
              <BranchAdUsers branchId={branchId} />
            </TabsContent>
            
            <TabsContent value="windows" className="animate-fadeIn">
              <Windows branchId={branchId} />
            </TabsContent>
            
            <TabsContent value="corporate-customers" className="animate-fadeIn">
              <CorporateCustomers managerId={managerId} />
            </TabsContent>
            
            <TabsContent value="assign" className="animate-fadeIn">
              <AssignMaker branchId={branchId} />
            </TabsContent>
            
            <TabsContent value="transactions" className="animate-fadeIn">
              <Transactions branchId={branchId} />
            </TabsContent>
            
            <TabsContent value="petty-cash" className="animate-fadeIn">
              {/* {branchId && ( */}
                <PettyCash 
                  branchId={branchId} 
                  voultManagerId={vaultManagerId} 
                />
              {/* )} */}
            </TabsContent>

            <TabsContent value="Screen-Display" className="animate-fadeIn">
              <ScreenDisplay />
            </TabsContent>

            {/* My Branch Tab - Enhanced */}
            <TabsContent value="my-branch" className="animate-fadeIn">
              {branch ? (
                <>
                  {/* Branch Overview Card */}
                  {!showCreateModal && (
                    <div className="space-y-6">
                      {/* Quick Actions */}
                      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-fuchsia-700 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <button 
                            onClick={() => setShowCreateModal(true)}
                            className="p-4 rounded-xl border-2 border-gray-100 hover:border-fuchsia-300 hover:bg-fuchsia-50 transition-all text-left group"
                          >
                            <div className="text-fuchsia-700 font-semibold group-hover:text-fuchsia-800">✏️ Edit Branch</div>
                            <div className="text-sm text-gray-600">Update branch details</div>
                          </button>
                          <button className="p-4 rounded-xl border-2 border-gray-100 hover:border-fuchsia-300 hover:bg-fuchsia-50 transition-all text-left group">
                            <div className="text-fuchsia-700 font-semibold group-hover:text-fuchsia-800">📊 View Reports</div>
                            <div className="text-sm text-gray-600">Performance analytics</div>
                          </button>
                          <button className="p-4 rounded-xl border-2 border-gray-100 hover:border-fuchsia-300 hover:bg-fuchsia-50 transition-all text-left group">
                            <div className="text-fuchsia-700 font-semibold group-hover:text-fuchsia-800">👥 Staff Management</div>
                            <div className="text-sm text-gray-600">Manage team members</div>
                          </button>
                          <button className="p-4 rounded-xl border-2 border-gray-100 hover:border-fuchsia-300 hover:bg-fuchsia-50 transition-all text-left group">
                            <div className="text-fuchsia-700 font-semibold group-hover:text-fuchsia-800">⚙️ Settings</div>
                            <div className="text-sm text-gray-600">Branch configuration</div>
                          </button>
                        </div>
                      </div>

                      {/* Branch Details Card */}
                      <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
                          <div>
                            <h2 className="text-2xl font-bold text-fuchsia-800 flex items-center gap-2 mb-2">
                              🏦 {branch.name}
                            </h2>
                            <p className="text-gray-600">Branch Code: <span className="font-mono font-semibold">{branch.code}</span></p>
                          </div>
                          
                          <div className="flex gap-3 mt-4 lg:mt-0">
                            <button
                              onClick={() => setShowCreateModal(true)}
                              className="bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 text-white px-4 py-2 rounded-lg hover:from-fuchsia-700 hover:to-fuchsia-500 transition-all shadow-md flex items-center gap-2"
                            >
                              <span>✏️ Edit Details</span>
                            </button>
                          </div>
                        </div>

                        {/* Enhanced Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <div className="p-4 bg-fuchsia-50 rounded-xl border border-fuchsia-100 hover:shadow-md transition-shadow">
                            <p className="font-semibold text-fuchsia-700 text-sm mb-1">Location</p>
                            <p className="text-gray-900 font-medium">{branch.location || "Not specified"}</p>
                          </div>
                          <div className="p-4 bg-fuchsia-50 rounded-xl border border-fuchsia-100 hover:shadow-md transition-shadow">
                            <p className="font-semibold text-fuchsia-700 text-sm mb-1">Latitude</p>
                            <p className="text-gray-900 font-mono text-sm">{branch.latitude ?? "—"}</p>
                          </div>
                          <div className="p-4 bg-fuchsia-50 rounded-xl border border-fuchsia-100 hover:shadow-md transition-shadow">
                            <p className="font-semibold text-fuchsia-700 text-sm mb-1">Longitude</p>
                            <p className="text-gray-900 font-mono text-sm">{branch.longitude ?? "—"}</p>
                          </div>
                          <div className="p-4 bg-fuchsia-50 rounded-xl border border-fuchsia-100 hover:shadow-md transition-shadow">
                            <p className="font-semibold text-fuchsia-700 text-sm mb-1">Manager ID</p>
                            <p className="text-gray-900 font-mono text-sm">{managerId || "—"}</p>
                          </div>
                        </div>

                        {/* Status and Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                                branch.isApproved
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              }`}
                            >
                              {branch.isApproved ? "✅ Approved" : "⏳ Pending Approval"}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                branch.status === "Active"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {branch.status}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-500">
                            Last updated: {new Date().toLocaleDateString()}
                          </div>
                        </div>
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
                // No branch state
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-lg border border-gray-200">
                  <div className="w-20 h-20 bg-fuchsia-100 rounded-full flex items-center justify-center mb-6">
                    <span className="text-2xl">🏦</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No Branch Assigned</h3>
                  <p className="text-gray-600 text-center mb-6 max-w-md">
                    You don't have a branch assigned yet. Create your branch to start managing operations, staff, and customer services.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 text-white px-6 py-3 rounded-lg font-semibold hover:from-fuchsia-700 hover:to-fuchsia-500 transition-all shadow-lg flex items-center gap-2"
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

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <p className="text-gray-700 font-medium">Branch Manager Dashboard</p>
                <p className="text-gray-500 text-sm">CBE Digital Services • {new Date().getFullYear()}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Last sync: {new Date().toLocaleTimeString()}</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>System Online</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </DashboardErrorBoundary>
  );
}