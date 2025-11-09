import { useEffect, useState, useMemo } from "react";
import { safeJWTDecode, isTokenExpired } from "@utils/jwt";
import auditorService, { type AuditableItem } from "@services/auditor";
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import { Button } from "@components/ui/button";
import { DashboardErrorBoundary } from "@components/dashboard/ErrorBoundary";
import TransactionDetailsModal from "./TransactionDetailsModal";

type Deposit = AuditableItem;

export default function AuditorDashboard() {
  const [branchId, setBranchId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [branchName, setBranchName] = useState<string>("");

  const handleCloseModal = () => {
    setSelectedDeposit(null);
  };

  const handleAudit = async (depositId: string) => {
    if (!userId) {
      toast.error("User ID not found");
      return;
    }

    try {
      const res = await auditorService.auditDeposit(depositId, userId);
      console.log("Audit response:", res);

      if (res.data?.success) {
        toast.success("Deposit audited successfully!");
        setDeposits((prev) =>
          prev.map((d) =>
            d.id === depositId
              ? {
                  ...d,
                  isAudited: true,
                  auditerId: userId,
                }
              : d,
          ),
        );
      } else {
        toast.error(res.data?.message || "Audit failed.");
      }
    } catch (err: any) {
      console.error("Error auditing deposit:", err);
      toast.error(err.message || "Error auditing deposit");
    }
  };

  const handleReject = async (depositId: string) => {
    const remark = prompt("Please enter a remark for rejecting this deposit:");
    if (!remark) {
      toast.error("A remark is required to reject a deposit.");
      return;
    }

    if (!userId) {
      toast.error("User ID not found");
      return;
    }

    try {
      const res = await auditorService.rejectDeposit(depositId, userId, remark);
      console.log("Reject response:", res);

      if (res.data?.success) {
        toast.success("Deposit rejected successfully!");
        setDeposits((prev) =>
          prev.map((d) =>
            d.id === depositId
              ? {
                  ...d,
                  isAudited: true,
                  isRejected: true,
                  auditerId: userId,
                  remark,
                }
              : d,
          ),
        );
      } else {
        toast.error(res.data?.message || "Rejection failed.");
      }
    } catch (err: any) {
      console.error("Error rejecting deposit:", err);
      toast.error(err.message || "Error rejecting deposit");
    }
  };

  // Load user info from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required");
      return;
    }
    if (isTokenExpired(token)) {
      toast.error("Session expired. Please log in again.");
      window.location.href = "/login";
      return;
    }
    const payload = safeJWTDecode<{ BranchId: string; nameid: string; branchName?: string }>(token);
    setBranchId(payload.BranchId);
    setUserId(payload.nameid);
    setBranchName(payload.branchName || "Your Branch");
  }, []);

  // Load deposits for the branch
  useEffect(() => {
    const loadDeposits = async () => {
      if (!branchId) return;
      setLoading(true);
      try {
        // Try to get pending deposits for audit
        const res = await auditorService.getDepositsByBranch(branchId);
        console.log("Deposits response:", res);

        if (res.data?.success && res.data?.data) {
          // Filter for deposits that are authorized but not yet audited
          const pendingAuditDeposits = res.data.data.filter(
            (d) => d.isAuthorized && !d.isAudited && !d.isRejected
          );
          
          setDeposits(pendingAuditDeposits);
        } else if (res.data) {
          // Handle case where response structure is different
          if (Array.isArray(res.data)) {
            const pendingAuditDeposits = res.data.filter(
              (d) => d.isAuthorized && !d.isAudited && !d.isRejected
            );
            setDeposits(pendingAuditDeposits);
          } else {
            setDeposits([]);
          }
        } else {
          setDeposits([]);
        }
      } catch (err: any) {
        console.error("Error loading deposits:", err);
        // Don't show error toast if it's just a 404 (no endpoint yet)
        if (err.response?.status !== 404) {
          toast.error("Failed to load deposits");
        }
        setDeposits([]);
      } finally {
        setLoading(false);
      }
    };
    loadDeposits();
  }, [branchId]);

  // Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchMaker, setSearchMaker] = useState("");
  const [searchCustomerId, setSearchCustomerId] = useState("");

  // Filter deposits based on search criteria
  const filteredDeposits = useMemo(() => {
    return deposits.filter((deposit) => {
      return (
        ((deposit.accountHolderName &&
          deposit.accountHolderName
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
          (deposit.accountNumber &&
            deposit.accountNumber
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))) &&
        (searchDate
          ? new Date(deposit.submittedAt).toLocaleDateString() ===
            new Date(searchDate).toLocaleDateString()
          : true) &&
        (searchMaker
          ? (deposit.makerId &&
              deposit.makerId
                .toLowerCase()
                .includes(searchMaker.toLowerCase())) ||
            (deposit.makerName &&
              deposit.makerName.toLowerCase().includes(searchMaker.toLowerCase()))
          : true) &&
        (searchCustomerId
          ? deposit.customerId &&
            deposit.customerId
              .toLowerCase()
              .includes(searchCustomerId.toLowerCase())
          : true)
      );
    });
  }, [deposits, searchTerm, searchDate, searchMaker, searchCustomerId]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const pending = filteredDeposits.filter(d => d.isAuthorized && !d.isAudited && !d.isRejected).length;
    const audited = filteredDeposits.filter(d => d.isAudited).length;
    const rejected = filteredDeposits.filter(d => d.isRejected).length;
    const total = filteredDeposits.length;
    
    return [
      { label: "Total Deposits", value: total, color: "fuchsia", trend: "neutral" },
      { label: "Pending Audit", value: pending, color: "orange", trend: "up" },
      { label: "Audited", value: audited, color: "green", trend: "up" },
      { label: "Rejected", value: rejected, color: "red", trend: "down" },
    ];
  }, [filteredDeposits]);

  // DataTable columns
  const columns = [
    {
      name: "Account Holder",
      selector: (r: Deposit) => r.accountHolderName || "N/A",
      sortable: true,
      wrap: true
    },
    {
      name: "Account #",
      selector: (r: Deposit) => r.accountNumber || "N/A",
      sortable: true
    },
    {
      name: "Amount",
      selector: (r: Deposit) => r.amount || 0,
      format: (r: Deposit) => `ETB ${(r.amount || 0).toFixed(2)}`,
      sortable: true,
      right: true
    },
    {
      name: "Submitted At",
      selector: (r: Deposit) => new Date(r.submittedAt).toLocaleDateString(),
      sortable: true,
      wrap: true
    },
    {
      name: "Authorized",
      cell: (r: Deposit) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            r.isAuthorized
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {r.isAuthorized ? "Yes" : "No"}
        </span>
      ),
      sortable: true,
    },
    {
      name: "Audited",
      cell: (r: Deposit) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            r.isRejected
              ? "bg-red-100 text-red-800"
              : r.isAudited
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {r.isRejected ? "Rejected" : r.isAudited ? "Done" : "Pending"}
        </span>
      ),
      sortable: true,
    },
    {
      name: "Action",
      cell: (r: Deposit) => (
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedDeposit(r)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition-colors shadow-sm"
          >
            Details
          </button>
          {!r.isAudited && r.isAuthorized ? (
            <>
              <button
                onClick={() => handleAudit(r.id)}
                className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-3 py-1 rounded-lg text-sm transition-colors shadow-sm"
              >
                Audit
              </button>
              <button
                onClick={() => handleReject(r.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition-colors shadow-sm"
              >
                Reject
              </button>
            </>
          ) : r.isAudited ? (
            <span className="text-green-600 text-sm font-medium">
              ✓ Audited
            </span>
          ) : (
            <span className="text-gray-400 text-sm">Awaiting Auth</span>
          )}
        </div>
      ),
      ignoreRowClick: true,
      button: true,
      width: "180px"
    },
  ];

  const customStyles = {
    rows: {
      style: {
        minHeight: "52px",
      },
    },
    headCells: {
      style: {
        paddingLeft: "16px",
        paddingRight: "16px",
        fontWeight: "600",
        fontSize: "14px",
        backgroundColor: "#f9fafb",
        color: "#374151",
      },
    },
    cells: {
      style: {
        paddingLeft: "16px",
        paddingRight: "16px",
        fontSize: "14px",
      },
    },
  };

  if (loading && deposits.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600 mx-auto"></div>
          <p className="mt-4 text-fuchsia-700 font-medium">Loading Auditor Dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching deposits for audit</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header with fuchsia-700 background */}
        <div className="bg-fuchsia-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">Auditor Dashboard</h1>
                  <p className="mt-1 text-fuchsia-100">
                    Verify and audit deposits in {branchName}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-fuchsia-600 p-2 rounded-lg">
                    <span className="text-white font-medium">📋</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    metric.color === "fuchsia" ? "bg-fuchsia-100" :
                    metric.color === "orange" ? "bg-orange-100" :
                    metric.color === "red" ? "bg-red-100" :
                    "bg-green-100"
                  }`}>
                    <div className={`w-6 h-6 ${
                      metric.color === "fuchsia" ? "text-fuchsia-600" :
                      metric.color === "orange" ? "text-orange-600" :
                      metric.color === "red" ? "text-red-600" :
                      "text-green-600"
                    }`}>
                      {metric.trend === "up" ? "↗️" : metric.trend === "down" ? "↘️" : "→"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-blue-600">ℹ️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Information:</strong> Showing authorized deposits pending audit.
                </p>
              </div>
            </div>
          </div>

          {/* Search Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Deposits</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account/Holder</label>
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maker</label>
                <input
                  type="text"
                  placeholder="Maker name"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  value={searchMaker}
                  onChange={(e) => setSearchMaker(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
                <input
                  type="text"
                  placeholder="Customer ID"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  value={searchCustomerId}
                  onChange={(e) => setSearchCustomerId(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Deposits Requiring Audit</h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredDeposits.length} deposits found
              </p>
            </div>
            
            {filteredDeposits.length === 0 && !loading ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No deposits found</h3>
                <p className="text-gray-500">Try adjusting your search filters</p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredDeposits}
                progressPending={loading}
                pagination
                highlightOnHover
                striped
                responsive
                customStyles={customStyles}
                noDataComponent={
                  <div className="p-8 text-center text-gray-500">
                    No deposits available for audit
                  </div>
                }
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 25, 50, 100]}
              />
            )}
          </div>
        </div>
        
        {selectedDeposit && (
          <TransactionDetailsModal
            deposit={selectedDeposit}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </DashboardErrorBoundary>
  );
}