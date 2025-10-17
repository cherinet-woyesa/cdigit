import React, { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { safeJWTDecode, isTokenExpired } from "../../utils/jwt";
import managerService from "../../services/managerService";

import BranchAdUsers from "./BranchAdUsers";
import Windows from "./Windows";
import AssignMaker from "./AssignMaker";
import Transactions from "./Transactions";
import CorporateCustomers from "./CorporateCustomers";
import PettyCash from "./PettyCash";
import ApprovalDashboard from "./ApprovalDashboard";
import ScreenDisplay from "../screen/ScreenDisplay";
import ManagerReportPanel from "./ManagerReportPanel";
import CreateManagerBranchModal from "./CreateManagerBranchModal";
import DashboardMetrics, { type Metric } from "../../components/dashboard/DashboardMetrics";
import { DashboardErrorBoundary } from "../../components/dashboard/ErrorBoundary";
import MainLayout from "./ManagerLayout";

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
    queueLength: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("my-branch");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Decode JWT safely
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required");
        return;
      }
      if (isTokenExpired(token)) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      const payload = safeJWTDecode<{ BranchId: string; nameid: string }>(token);
      setBranchId(payload.BranchId);
      setManagerId(payload.nameid);
      setVaultManagerId(payload.nameid);
    } catch (error) {
      console.error("JWT decode failed:", error);
      toast.error("Authentication error");
    }
  }, []);

  // Fetch branch details
  useEffect(() => {
    const loadBranch = async () => {
      if (!branchId) return;
      try {
        setIsLoading(true);
        const res = await managerService.getBranchById(branchId);
        if (res.success && res.data) {
          setBranch(res.data);
          await loadDashboardStats(res.data.id);
        }
      } catch (err: any) {
        console.error("Failed to load branch:", err);
        toast.error(err.message || "Failed to load your branch.");
      } finally {
        setIsLoading(false);
      }
    };
    loadBranch();
  }, [branchId]);

  // Load dashboard stats (simulated or API)
  const loadDashboardStats = useCallback(async (branchId: string) => {
    try {
      const stats: DashboardStats = {
        totalTransactions: 247,
        activeWindows: 8,
        pendingApprovals: 12,
        queueLength: 23,
      };
      setDashboardStats(stats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }, []);

  // Dashboard metrics
  const metrics: Metric[] = useMemo(() => [
    { label: "Today's Transactions", value: dashboardStats.totalTransactions, color: "fuchsia", trend: "up" },
    { label: "Active Windows", value: dashboardStats.activeWindows, color: "green", trend: "neutral" },
    { label: "Pending Approvals", value: dashboardStats.pendingApprovals, color: "orange", trend: "up" },
    { label: "Queue Length", value: dashboardStats.queueLength, color: "blue", trend: "down" },
  ], [dashboardStats]);

  // Tab/Section change handler
  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
  }, []);

  // Window change stub
  const handleWindowChange = useCallback(() => {
    toast("Change window clicked!");
  }, []);

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
      <MainLayout
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onWindowChange={handleWindowChange}
        branchName={branch?.name}
      >
        {/* Dashboard Metrics at Top */}
        {branch && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <DashboardMetrics metrics={metrics} />
          </div>
        )}

        {/* Main Section Routing via Sidebar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          {activeSection === "approvals" && <ApprovalDashboard />}
          {activeSection === "users" && <BranchAdUsers branchId={branchId} />}
          {activeSection === "windows" && <Windows branchId={branchId} />}
          {activeSection === "corporate-customers" && <CorporateCustomers managerId={managerId} />}
          {activeSection === "assign" && <AssignMaker branchId={branchId} />}
          {activeSection === "transactions" && <Transactions branchId={branchId} />}
          {activeSection === "petty-cash" && (
            <PettyCash branchId={branchId} voultManagerId={vaultManagerId} />
          )}
          {activeSection === "Screen-Display" && <ScreenDisplay />}
          {activeSection === "reports" && <ManagerReportPanel defaultBranchId={branchId} />}

          {/* My Branch Section */}
          {activeSection === "my-branch" && (
            <>
              {branch ? (
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

                  {/* Branch Details */}
                  <div className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-fuchsia-800 flex items-center gap-2 mb-2">
                          🏦 {branch.name}
                        </h2>
                        <p className="text-gray-600">
                          Branch Code: <span className="font-mono font-semibold">{branch.code}</span>
                        </p>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="p-4 bg-fuchsia-50 rounded-xl border border-fuchsia-100">
                        <p className="font-semibold text-fuchsia-700 text-sm mb-1">Location</p>
                        <p className="text-gray-900 font-medium">{branch.location || "Not specified"}</p>
                      </div>
                      <div className="p-4 bg-fuchsia-50 rounded-xl border border-fuchsia-100">
                        <p className="font-semibold text-fuchsia-700 text-sm mb-1">Latitude</p>
                        <p className="text-gray-900 font-mono text-sm">{branch.latitude ?? "—"}</p>
                      </div>
                      <div className="p-4 bg-fuchsia-50 rounded-xl border border-fuchsia-100">
                        <p className="font-semibold text-fuchsia-700 text-sm mb-1">Longitude</p>
                        <p className="text-gray-900 font-mono text-sm">{branch.longitude ?? "—"}</p>
                      </div>
                      <div className="p-4 bg-fuchsia-50 rounded-xl border border-fuchsia-100">
                        <p className="font-semibold text-fuchsia-700 text-sm mb-1">Manager ID</p>
                        <p className="text-gray-900 font-mono text-sm">{managerId || "—"}</p>
                      </div>
                    </div>

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
              ) : (
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
            </>
          )}
        </div>
      </MainLayout>
    </DashboardErrorBoundary>
  );
}
