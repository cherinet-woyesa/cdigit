import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import CreateBranchModal from "./CreateBranchModal";
import EditBranchModal from "./EditBranchModal";
import CreateUserModal from "./CreateUserModal";
import ManageAccountTypesModal from "./ManageAccountTypesModal";
import adminService from "../../services/adminService";
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import { Button } from "../../components/ui/button";

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
}

interface AccountType {
  id: number;
  name: string;
}

interface BranchTransaction {
  id: string;
  formReferenceId: string;
  queueNumber: number;
  accountHolderName: string;
  amount: number;
  transactionType: string;
  frontMakerId: string;
  branchId: string;
  status: number; // 0: Canceled, 1: On Queue, 2: On Progress, 3: Completed
  submittedAt: string;
  calledAt: string;
  depositedToCBSAt: string;
}

interface BranchFeedback {
  id: string;
  rating: number;
  comments: string;
  branchId: string;
  frontMakerId: string;
  createdAt: string;
}


type BranchStatus = "Active" | "Closed";


export default function AdminDashboard() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);

  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("All");
  // const [summary, setSummary] = useState({ Active: 0, Closed: 0 });
  const [summary, setSummary] = useState<Record<BranchStatus, number>>({
    Active: 0,
    Closed: 0,
  });

  // Fetch admin data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchRes, appRes, typeRes] = await Promise.all([
          adminService.getBranches(),
          adminService.getSystemUsers(),
          adminService.getAccountTypes(),
        ]);
        const branchData = branchRes.data || [];
        setBranches(branchData);
        setAppUsers(appRes.data || []);
        setAccountTypes(typeRes.data || []);
        calculateBranchSummary(branchData);
      } catch (err: any) {
        toast.error(err.message || "Failed to fetch admin data.");
      }
    };
    fetchData();
  }, []);

  const calculateBranchSummary = (branches: Branch[]) => {
    const newSummary = { Active: 0, Closed: 0 };
    branches.forEach((b) => {
      if (b.status === "Active") newSummary.Active++;
      else if (b.status === "Closed") newSummary.Closed++;
    });
    setSummary(newSummary);
  };

  const filteredBranches = branches.filter((b) => statusFilter === "All" || b.status === statusFilter);

  const branchStatusBadge = (status: string) => (
    <span
      className={`px-2 py-1 rounded text-white text-sm font-semibold ${status === "Active" ? "bg-green-500" : "bg-red-500"
        }`}
    >
      {status}
    </span>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-fuchsia-700">⚙️ Admin Dashboard</h1>

      <Tabs defaultValue="branches" className="w-full">
        <TabsList className="bg-fuchsia-100 p-1 rounded-xl shadow-inner mb-4 flex space-x-2">
          <TabsTrigger
            value="branches"
            className="flex-1 rounded-lg font-semibold text-fuchsia-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-700 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white transition-all"
          >
            🏦 Branches
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="flex-1 rounded-lg font-semibold text-fuchsia-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-700 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white transition-all"
          >
            👤 Users
          </TabsTrigger>
          <TabsTrigger
            value="account-types"
            className="flex-1 rounded-lg font-semibold text-fuchsia-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-700 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white transition-all"
          >
            💳 Account Types
          </TabsTrigger>
        </TabsList>

        {/* Branches Tab */}
        <TabsContent value="branches">
          <div className="flex justify-between mb-4">
            <button
              onClick={() => setShowBranchModal(true)}
              className="bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 text-white py-2 px-4 rounded-md hover:from-fuchsia-700 hover:to-fuchsia-500 transition-all"
            >
              ➕ Add Branch
            </button>

            {/* Status Filter */}
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {(["Active", "Closed"] as BranchStatus[]).map((status) => (
              <div key={status} className="bg-purple-900 text-white p-4 rounded text-center">
                <div className="text-lg font-semibold">{summary[status]}</div>
                <div className="text-sm">{status}</div>
              </div>
            ))}


          </div>

          {/* Branches DataTable */}
          <DataTable
            columns={[
              { name: "Name", selector: (row: Branch) => row.name, sortable: true },
              { name: "Code", selector: (row: Branch) => row.code, sortable: true },
              { name: "Location", selector: (row: Branch) => row.location || "-", sortable: true },
              { name: "Latitude", selector: (row: Branch) => row.latitude ?? "-", sortable: true },
              { name: "Longitude", selector: (row: Branch) => row.longitude ?? "-", sortable: true },
              {
                name: "Status",
                cell: (row: Branch) =>
                  branchStatusBadge(row.status + (row.isApproved ? "" : " (Pending)")),
                sortable: true,
              },
              {
                name: "Action",
                cell: (row: Branch) => (
                  <div className="flex space-x-2">
                    <Button
                      className="bg-gradient-to-r from-purple-600 to-purple-400 text-white px-3 py-1 rounded hover:from-purple-700 hover:to-purple-500 transition-all"
                      onClick={() => setSelectedBranch(row)}
                    >
                      Edit
                    </Button>

                    {!row.isApproved && (
                      <Button
                        className="bg-gradient-to-r from-green-600 to-green-400 text-white px-3 py-1 rounded hover:from-green-700 hover:to-green-500 transition-all"
                        onClick={async () => {
                          try {
                            const res = await adminService.approveBranch(row.id);
                            if (res.success) {
                              toast.success(res.message || "Branch approved!");
                              // Update branch in state
                              setBranches((prev) =>
                                prev.map((b) =>
                                  b.id === row.id ? { ...b, isApproved: true } : b
                                )
                              );
                            } else {
                              toast.error(res.message || "Failed to approve branch.");
                            }
                          } catch (err: any) {
                            toast.error(err.message || "Error approving branch.");
                          }
                        }}
                      >
                        Approve
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            data={filteredBranches}
            pagination
            highlightOnHover
            striped
            responsive
            persistTableHead
            customStyles={{
              table: { style: { borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } },
              headCells: { style: { fontWeight: "bold", fontSize: "14px", background: "linear-gradient(90deg, #6B21A8, #9333EA)", color: "white" } },
              rows: { style: { minHeight: "55px", borderRadius: "8px", transition: "all 0.3s" } },
              cells: { style: { paddingLeft: "16px", paddingRight: "16px" } },
            }}
          />


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
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="flex justify-between mb-4">
            <h3 className="text-xl font-semibold text-fuchsia-700">👤 Users</h3>
            <button
              onClick={() => setShowUserModal(true)}
              className="bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 text-white py-2 px-4 rounded-md hover:from-fuchsia-700 hover:to-fuchsia-500 transition-all"
            >
              ➕ Add User
            </button>
          </div>

          <DataTable
            columns={[
              { name: "Email", selector: (row: AppUser) => row.email, sortable: true },
              { name: "First Name", selector: (row: AppUser) => row.firstName || "-", sortable: true },
              { name: "Last Name", selector: (row: AppUser) => row.lastName || "-", sortable: true },
              { name: "Phone", selector: (row: AppUser) => row.phoneNumber || "-", sortable: true },
              { name: "Branch", selector: (row: AppUser) => row.branchName || "-", sortable: true },
              {
                name: "Role",
                cell: (row: AppUser) => (
                  <span className={`px-2 py-1 rounded text-white text-sm font-semibold ${row.roleName === "Manager" ? "bg-blue-500" : "bg-purple-500"}`}>
                    {row.roleName || "-"}
                  </span>
                ),
                sortable: true,
              },
              {
                name: "Action",
                cell: (row: AppUser) => (
                  <Button
                    className="bg-gradient-to-r from-purple-600 to-purple-400 text-white px-3 py-1 rounded hover:from-purple-700 hover:to-purple-500 transition-all"
                    onClick={() => alert(`Edit User: ${row.email}`)}
                  >
                    Edit
                  </Button>
                ),
              },
            ]}
            data={appUsers}
            pagination
            highlightOnHover
            striped
            responsive
            persistTableHead
            customStyles={{
              table: { style: { borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } },
              headCells: { style: { fontWeight: "bold", fontSize: "14px", background: "linear-gradient(90deg, #6B21A8, #9333EA)", color: "white" } },
              rows: { style: { minHeight: "55px", borderRadius: "8px", transition: "all 0.3s" } },
              cells: { style: { paddingLeft: "16px", paddingRight: "16px" } },
            }}
          />

          <CreateUserModal
            open={showUserModal}
            onClose={() => setShowUserModal(false)}
            branches={branches}
            appUsers={appUsers}
            setAppUsers={setAppUsers}
          />
        </TabsContent>

        {/* Account Types Tab */}
        <TabsContent value="account-types">
          <div className="flex justify-between mb-4">
            <h3 className="text-xl font-semibold text-fuchsia-700">💳 Account Types</h3>
            <button
              onClick={() => setShowAccountTypeModal(true)}
              className="bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 text-white py-2 px-4 rounded-md hover:from-fuchsia-700 hover:to-fuchsia-500 transition-all"
            >
              ➕ Add Account Type
            </button>
          </div>

          <DataTable
            columns={[
              { name: "Name", selector: (row: AccountType) => row.name, sortable: true },
              {
                name: "Action",
                cell: (row: AccountType) => (
                  <Button
                    className="bg-gradient-to-r from-red-600 to-red-400 text-white px-3 py-1 rounded hover:from-red-700 hover:to-red-500 transition-all"
                    onClick={() => alert(`Delete Account Type: ${row.name}`)}
                  >
                    Delete
                  </Button>
                ),
              },
            ]}
            data={accountTypes}
            pagination
            highlightOnHover
            striped
            responsive
            persistTableHead
            customStyles={{
              table: { style: { borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } },
              headCells: { style: { fontWeight: "bold", fontSize: "14px", background: "linear-gradient(90deg, #6B21A8, #9333EA)", color: "white" } },
              rows: { style: { minHeight: "55px", borderRadius: "8px", transition: "all 0.3s" } },
              cells: { style: { paddingLeft: "16px", paddingRight: "16px" } },
            }}
          />

          <ManageAccountTypesModal
            open={showAccountTypeModal}
            onClose={() => setShowAccountTypeModal(false)}
            setAccountTypes={setAccountTypes}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
