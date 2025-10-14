import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import CreateBranchModal from "./CreateBranchModal";
import EditBranchModal from "./EditBranchModal";
import CreateUserModal from "./CreateUserModal";
import ManageAccountTypesModal from "./ManageAccountTypesModal";
import adminService from "../../services/adminService";
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import { Button } from "../../components/ui/button";
import { DashboardErrorBoundary } from "../../components/dashboard/ErrorBoundary";
import DashboardMetrics, { type Metric } from "../../components/dashboard/DashboardMetrics";
import { BRAND_COLORS } from "../../config/env";
import AdminReportPanel from "./AdminReportPanel";

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

interface AppUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  branchName?: string;
  roleName?: string;
  isActive?: boolean;
  createdAt?: string;
}

interface AccountType {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
}

interface SystemStats {
  totalBranches: number;
  activeBranches: number;
  totalUsers: number;
  pendingApprovals: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

type BranchStatus = "Active" | "Closed";

const AdminDashboardContent: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalBranches: 0,
    activeBranches: 0,
    totalUsers: 0,
    pendingApprovals: 0,
    systemHealth: 'good'
  });

  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("branches");

  // Calculate branch summary
  const summary = useMemo(() => {
    const newSummary: Record<BranchStatus, number> = { Active: 0, Closed: 0 };
    branches.forEach((b) => {
      if (b.status === "Active") newSummary.Active++;
      else if (b.status === "Closed") newSummary.Closed++;
    });
    return newSummary;
  }, [branches]);

  // Calculate system stats
  useEffect(() => {
    const stats: SystemStats = {
      totalBranches: branches.length,
      activeBranches: branches.filter(b => b.status === "Active" && b.isApproved).length,
      totalUsers: appUsers.length,
      pendingApprovals: branches.filter(b => !b.isApproved).length,
      systemHealth: branches.length > 0 ? 'good' : 'warning'
    };
    setSystemStats(stats);
  }, [branches, appUsers]);

  // Dashboard metrics
  const metrics: Metric[] = [
    {
      label: "Total Branches",
      value: systemStats.totalBranches,
      color: "fuchsia" as const,
      trend: "up" as const
    },
    {
      label: "Active Branches",
      value: systemStats.activeBranches,
      color: "green" as const,
      trend: "neutral" as const
    },
    {
      label: "System Users",
      value: systemStats.totalUsers,
      color: "blue" as const,
      trend: "up" as const
    },
    {
      label: "Pending Approvals",
      value: systemStats.pendingApprovals,
      color: "orange" as const,
      trend: systemStats.pendingApprovals > 0 ? "up" : "neutral" as const
    }
  ];

  // Fetch admin data with error handling
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [branchRes, appRes, typeRes] = await Promise.all([
        adminService.getBranches(),
        adminService.getSystemUsers(),
        adminService.getAccountTypes(),
      ]);
      
      const branchData = branchRes.data || [];
      const userData = appRes.data || [];
      const typeData = typeRes.data || [];
      
      setBranches(branchData);
      setAppUsers(userData);
      setAccountTypes(typeData);
      
      toast.success("System data loaded successfully");
    } catch (err: any) {
      console.error("Failed to fetch admin data:", err);
      toast.error(err.message || "Failed to fetch system data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter branches based on status
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => statusFilter === "All" || b.status === statusFilter);
  }, [branches, statusFilter]);

  // Enhanced branch status badge
  const branchStatusBadge = useCallback((branch: Branch) => (
    <div className="flex flex-col gap-1">
      <span
        className={`px-2 py-1 rounded text-white text-xs font-semibold text-center ${
          branch.status === "Active" ? "bg-green-500" : "bg-red-500"
        }`}
      >
        {branch.status}
      </span>
      {!branch.isApproved && (
        <span className="px-2 py-1 rounded bg-yellow-500 text-white text-xs font-semibold text-center">
          Pending
        </span>
      )}
    </div>
  ), []);

  // User role badge
  const userRoleBadge = useCallback((roleName?: string) => (
    <span 
      className={`px-2 py-1 rounded text-white text-xs font-semibold ${
        roleName === "Manager" ? "bg-blue-500" : 
        roleName === "Admin" ? "bg-purple-500" : 
        roleName === "Maker" ? "bg-green-500" : 
        "bg-gray-500"
      }`}
    >
      {roleName || "-"}
    </span>
  ), []);

  // Handle branch approval
  const handleApproveBranch = useCallback(async (branchId: string) => {
    try {
      const res = await adminService.approveBranch(branchId);
      if (res.success) {
        toast.success(res.message || "Branch approved successfully!");
        setBranches(prev =>
          prev.map(b =>
            b.id === branchId ? { ...b, isApproved: true } : b
          )
        );
      } else {
        toast.error(res.message || "Failed to approve branch.");
      }
    } catch (err: any) {
      toast.error(err.message || "Error approving branch.");
    }
  }, []);

  // Handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    console.log(`Admin switched to tab: ${value}`);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-fuchsia-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600 mx-auto"></div>
          <p className="mt-4 text-fuchsia-700 font-medium">Loading Admin Dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Initializing system data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-fuchsia-50">
      {/* Enhanced Header */}
      <header className="bg-gradient-to-r from-fuchsia-700 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">⚙️ System Admin Dashboard</h1>
              <p className="text-fuchsia-100">
                Manage branches, users, and system configuration
                {systemStats.systemHealth === 'good' && ' • 🟢 System Healthy'}
                {systemStats.systemHealth === 'warning' && ' • 🟡 System Attention Needed'}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="bg-white/10 px-4 py-2 rounded-lg">
                <div className="text-xs text-fuchsia-200">System Status</div>
                <div className="text-sm font-semibold flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    systemStats.systemHealth === 'good' ? 'bg-green-400' : 'bg-yellow-400'
                  }`}></div>
                  {systemStats.systemHealth === 'good' ? 'Operational' : 'Needs Attention'}
                </div>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-lg">
                <div className="text-xs text-fuchsia-200">Last Updated</div>
                <div className="text-sm font-semibold">{new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* System Metrics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <DashboardMetrics metrics={metrics} />
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-fuchsia-700 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => setShowBranchModal(true)}
              className="p-4 rounded-xl border-2 border-gray-100 hover:border-fuchsia-300 hover:bg-fuchsia-50 transition-all text-left group"
            >
              <div className="text-fuchsia-700 font-semibold group-hover:text-fuchsia-800">🏦 Add Branch</div>
              <div className="text-sm text-gray-600">Create new branch</div>
            </button>
            <button 
              onClick={() => setShowUserModal(true)}
              className="p-4 rounded-xl border-2 border-gray-100 hover:border-fuchsia-300 hover:bg-fuchsia-50 transition-all text-left group"
            >
              <div className="text-fuchsia-700 font-semibold group-hover:text-fuchsia-800">👤 Add User</div>
              <div className="text-sm text-gray-600">Create system user</div>
            </button>
            <button 
              onClick={() => setShowAccountTypeModal(true)}
              className="p-4 rounded-xl border-2 border-gray-100 hover:border-fuchsia-300 hover:bg-fuchsia-50 transition-all text-left group"
            >
              <div className="text-fuchsia-700 font-semibold group-hover:text-fuchsia-800">💳 Account Types</div>
              <div className="text-sm text-gray-600">Manage account types</div>
            </button>
            <button 
              onClick={() => fetchData()}
              className="p-4 rounded-xl border-2 border-gray-100 hover:border-fuchsia-300 hover:bg-fuchsia-50 transition-all text-left group"
            >
              <div className="text-fuchsia-700 font-semibold group-hover:text-fuchsia-800">🔄 Refresh Data</div>
              <div className="text-sm text-gray-600">Sync latest information</div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList variant="brand" className="p-1 rounded-xl mb-6 flex flex-wrap gap-2">
            <TabsTrigger value="branches" variant="brand" className="flex-1 min-w-[140px]">
              🏦 Branches
            </TabsTrigger>
            <TabsTrigger value="users" variant="brand" className="flex-1 min-w-[140px]">
              👤 Users
            </TabsTrigger>
            <TabsTrigger value="account-types" variant="brand" className="flex-1 min-w-[140px]">
              💳 Account Types
            </TabsTrigger>
            <TabsTrigger value="documents" variant="brand" className="flex-1 min-w-[140px]">
              📄 Documents
            </TabsTrigger>
            <TabsTrigger
            value="reports"
            className="flex-1 rounded-lg font-semibold text-fuchsia-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-700 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white transition-all"
          >
            💳 Reports
          </TabsTrigger>
          </TabsList>

          {/* Branches Tab */}
          <TabsContent value="branches" className="animate-fadeIn space-y-6">
            {/* Filters and Actions */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-fuchsia-700 mb-2">Branch Management</h3>
                <p className="text-gray-600">
                  Manage {branches.length} branches across the system
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <button
                  onClick={() => setShowBranchModal(true)}
                  className="bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 text-white py-2 px-4 rounded-lg hover:from-fuchsia-700 hover:to-fuchsia-500 transition-all font-semibold flex items-center gap-2 justify-center"
                >
                  ➕ Add Branch
                </button>

                {/* Status Filter */}
                <div className="w-full sm:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm p-2 border focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
                  >
                    <option value="All">All Branches</option>
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {(["Active", "Closed"] as BranchStatus[]).map((status) => (
                <div key={status} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className={`text-2xl font-bold ${
                    status === "Active" ? "text-green-600" : "text-red-600"
                  }`}>
                    {summary[status]}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">{status} Branches</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round((summary[status] / branches.length) * 100)}% of total
                  </div>
                </div>
              ))}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-orange-600">
                  {systemStats.pendingApprovals}
                </div>
                <div className="text-sm text-gray-600 font-medium">Pending Approval</div>
                <div className="text-xs text-gray-500 mt-1">Requires attention</div>
              </div>
            </div>

            {/* Branches DataTable */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <DataTable
                columns={[
                  { 
                    name: "Branch Name", 
                    selector: (row: Branch) => row.name, 
                    sortable: true,
                    minWidth: "200px"
                  },
                  { 
                    name: "Code", 
                    selector: (row: Branch) => row.code, 
                    sortable: true,
                    width: "120px"
                  },
                  { 
                    name: "Location", 
                    selector: (row: Branch) => row.location || "-", 
                    sortable: true,
                    minWidth: "150px"
                  },
                  { 
                    name: "Coordinates", 
                    cell: (row: Branch) => (
                      <div className="text-xs font-mono">
                        {row.latitude ? `${row.latitude.toFixed(4)}` : "-"} / {row.longitude ? `${row.longitude.toFixed(4)}` : "-"}
                      </div>
                    ),
                    sortable: false,
                    width: "140px"
                  },
                  {
                    name: "Status",
                    cell: (row: Branch) => branchStatusBadge(row),
                    sortable: true,
                    width: "120px"
                  },
                  {
                    name: "Actions",
                    cell: (row: Branch) => (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          className="bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 text-white px-3 py-1 rounded hover:from-fuchsia-700 hover:to-fuchsia-500 transition-all text-xs"
                          onClick={() => setSelectedBranch(row)}
                        >
                          Edit
                        </Button>

                        {!row.isApproved && (
                          <Button
                            className="bg-gradient-to-r from-green-600 to-green-400 text-white px-3 py-1 rounded hover:from-green-700 hover:to-green-500 transition-all text-xs"
                            onClick={() => handleApproveBranch(row.id)}
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    ),
                    width: "140px"
                  },
                ]}
                data={filteredBranches}
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 25, 50]}
                highlightOnHover
                striped
                responsive
                persistTableHead
                noDataComponent={
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-lg mb-2">No branches found</div>
                    <div className="text-gray-500">Create your first branch to get started</div>
                  </div>
                }
                customStyles={{
                  table: { 
                    style: { 
                      borderRadius: "12px", 
                      overflow: "hidden",
                    } 
                  },
                  headCells: { 
                    style: { 
                      fontWeight: "bold", 
                      fontSize: "14px", 
                      background: "linear-gradient(90deg, #A21CAF, #C026D3)",
                      color: "white",
                      paddingLeft: "16px",
                      paddingRight: "16px",
                    } 
                  },
                  cells: { 
                    style: { 
                      paddingLeft: "16px", 
                      paddingRight: "16px",
                    } 
                  },
                  rows: {
                    style: {
                      minHeight: "60px",
                      '&:hover': {
                        backgroundColor: '#FDF4FF',
                      },
                    },
                  },
                }}
              />
            </div>
          </TabsContent>

          {/* Document Management Tab */}
          <TabsContent value="documents" className="animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 mb-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-fuchsia-700 mb-2">Document Management</h3>
                  <p className="text-gray-600">
                    Centralized digital storage and management of all bank documents
                  </p>
                </div>
                
                <a
                  href="/documents"
                  className="bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 text-white py-2 px-4 rounded-lg hover:from-fuchsia-700 hover:to-fuchsia-500 transition-all font-semibold flex items-center gap-2"
                >
                  📁 Manage Documents
                </a>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-fuchsia-50 to-white">
                  <h4 className="font-semibold text-fuchsia-700 mb-2">🔒 Secure Storage</h4>
                  <p className="text-sm text-gray-600">AES-256 encryption for all documents at rest and in transit</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-fuchsia-50 to-white">
                  <h4 className="font-semibold text-fuchsia-700 mb-2">🔍 Advanced Search</h4>
                  <p className="text-sm text-gray-600">Multi-criteria search with Boolean operators and range queries</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-fuchsia-50 to-white">
                  <h4 className="font-semibold text-fuchsia-700 mb-2">📋 Compliance</h4>
                  <p className="text-sm text-gray-600">Full audit trail and compliance with banking regulations</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="animate-fadeIn">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white rounded-2xl shadow-sm p-6 border border-gray-200 mb-6">
              <div>
                <h3 className="text-xl font-semibold text-fuchsia-700 mb-2">User Management</h3>
                <p className="text-gray-600">
                  Manage {appUsers.length} system users across all branches
                </p>
              </div>
              
              <button
                onClick={() => setShowUserModal(true)}
                className="bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 text-white py-2 px-4 rounded-lg hover:from-fuchsia-700 hover:to-fuchsia-500 transition-all font-semibold flex items-center gap-2"
              >
                ➕ Add User
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <DataTable
                columns={[
                  { 
                    name: "Email", 
                    selector: (row: AppUser) => row.email, 
                    sortable: true,
                    minWidth: "200px"
                  },
                  { 
                    name: "Full Name", 
                    cell: (row: AppUser) => (
                      <div>
                        {row.firstName || row.lastName ? `${row.firstName || ''} ${row.lastName || ''}`.trim() : '-'}
                      </div>
                    ),
                    sortable: true,
                    minWidth: "150px"
                  },
                  { 
                    name: "Phone", 
                    selector: (row: AppUser) => row.phoneNumber || "-", 
                    sortable: true,
                    width: "140px"
                  },
                  { 
                    name: "Branch", 
                    selector: (row: AppUser) => row.branchName || "-", 
                    sortable: true,
                    minWidth: "150px"
                  },
                  {
                    name: "Role",
                    cell: (row: AppUser) => userRoleBadge(row.roleName),
                    sortable: true,
                    width: "120px"
                  },
                  {
                    name: "Status",
                    cell: (row: AppUser) => (
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        row.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {row.isActive ? 'Active' : 'Inactive'}
                      </span>
                    ),
                    sortable: true,
                    width: "100px"
                  },
                  {
                    name: "Actions",
                    cell: (row: AppUser) => (
                      <div className="flex gap-2">
                        <Button
                          className="bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 text-white px-3 py-1 rounded hover:from-fuchsia-700 hover:to-fuchsia-500 transition-all text-xs"
                          onClick={() => alert(`Edit User: ${row.email}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          className="bg-gradient-to-r from-gray-600 to-gray-400 text-white px-3 py-1 rounded hover:from-gray-700 hover:to-gray-500 transition-all text-xs"
                          onClick={() => alert(`View Details: ${row.email}`)}
                        >
                          View
                        </Button>
                      </div>
                    ),
                    width: "140px"
                  },
                ]}
                data={appUsers}
                pagination
                paginationPerPage={10}
                highlightOnHover
                striped
                responsive
                persistTableHead
                customStyles={{
                  table: { 
                    style: { 
                      borderRadius: "12px", 
                      overflow: "hidden",
                    } 
                  },
                  headCells: { 
                    style: { 
                      fontWeight: "bold", 
                      fontSize: "14px", 
                      background: "linear-gradient(90deg, #A21CAF, #C026D3)",
                      color: "white",
                      paddingLeft: "16px",
                      paddingRight: "16px",
                    } 
                  },
                  cells: { 
                    style: { 
                      paddingLeft: "16px", 
                      paddingRight: "16px",
                    } 
                  },
                }}
              />
            </div>
          </TabsContent>

          {/* Account Types Tab */}
          <TabsContent value="account-types" className="animate-fadeIn">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white rounded-2xl shadow-sm p-6 border border-gray-200 mb-6">
              <div>
                <h3 className="text-xl font-semibold text-fuchsia-700 mb-2">Account Types</h3>
                <p className="text-gray-600">
                  Manage {accountTypes.length} account types in the system
                </p>
              </div>
              
              <button
                onClick={() => setShowAccountTypeModal(true)}
                className="bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 text-white py-2 px-4 rounded-lg hover:from-fuchsia-700 hover:to-fuchsia-500 transition-all font-semibold flex items-center gap-2"
              >
                ➕ Add Account Type
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <DataTable
                columns={[
                  { 
                    name: "Account Type Name", 
                    selector: (row: AccountType) => row.name, 
                    sortable: true,
                    minWidth: "200px"
                  },
                  {
                    name: "Status",
                    cell: (row: AccountType) => (
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        row.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {row.isActive ? 'Active' : 'Inactive'}
                      </span>
                    ),
                    sortable: true,
                    width: "100px"
                  },
                  {
                    name: "Created",
                    cell: (row: AccountType) => (
                      <span className="text-xs text-gray-600">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </span>
                    ),
                    sortable: true,
                    width: "120px"
                  },
                  {
                    name: "Actions",
                    cell: (row: AccountType) => (
                      <div className="flex gap-2">
                        <Button
                          className="bg-gradient-to-r from-red-600 to-red-400 text-white px-3 py-1 rounded hover:from-red-700 hover:to-red-500 transition-all text-xs"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${row.name}"?`)) {
                              alert(`Delete Account Type: ${row.name}`);
                            }
                          }}
                        >
                          Delete
                        </Button>
                        <Button
                          className="bg-gradient-to-r from-gray-600 to-gray-400 text-white px-3 py-1 rounded hover:from-gray-700 hover:to-gray-500 transition-all text-xs"
                          onClick={() => alert(`Edit: ${row.name}`)}
                        >
                          Edit
                        </Button>
                      </div>
                    ),
                    width: "140px"
                  },
                ]}
                data={accountTypes}
                pagination
                paginationPerPage={10}
                highlightOnHover
                striped
                responsive
                persistTableHead
                customStyles={{
                  table: { 
                    style: { 
                      borderRadius: "12px", 
                      overflow: "hidden",
                    } 
                  },
                  headCells: { 
                    style: { 
                      fontWeight: "bold", 
                      fontSize: "14px", 
                      background: "linear-gradient(90deg, #A21CAF, #C026D3)",
                      color: "white",
                      paddingLeft: "16px",
                      paddingRight: "16px",
                    } 
                  },
                  cells: { 
                    style: { 
                      paddingLeft: "16px", 
                      paddingRight: "16px",
                    } 
                  },
                }}
              />
            </div>
          </TabsContent>

           <TabsContent value="reports"><AdminReportPanel /></TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {selectedBranch && (
        <EditBranchModal
          open={!!selectedBranch}
          onClose={() => setSelectedBranch(null)}
          branch={selectedBranch}
          branches={branches}
          setBranches={setBranches}
        />
      )}

      <CreateBranchModal
        open={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        branches={branches}
        setBranches={setBranches}
      />

      <CreateUserModal
        open={showUserModal}
        onClose={() => setShowUserModal(false)}
        branches={branches}
        appUsers={appUsers}
        setAppUsers={setAppUsers}
      />

      <ManageAccountTypesModal
        open={showAccountTypeModal}
        onClose={() => setShowAccountTypeModal(false)}
        setAccountTypes={setAccountTypes}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-gray-700 font-medium">System Admin Dashboard</p>
              <p className="text-gray-500 text-sm">CBE Digital Services • {new Date().getFullYear()}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Data loaded: {new Date().toLocaleTimeString()}</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Export with error boundary
const AdminDashboard: React.FC = () => {
  return (
    <DashboardErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Admin Dashboard Error:', error, errorInfo);
        // TODO: Send to error reporting service
      }}
    >
      <AdminDashboardContent />
    </DashboardErrorBoundary>
  );
};

export default AdminDashboard;