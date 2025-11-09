import { useEffect, useState, useMemo } from "react";
import { safeJWTDecode, isTokenExpired } from "@utils/jwt";
import authorizerService, { type AuthorizableItem } from '@services/authorizer';
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import { DashboardErrorBoundary } from "@components/dashboard/ErrorBoundary";

type Deposit = AuthorizableItem;

export default function AuthorizerDashboard() {
  const [branchId, setBranchId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(false);
  const [branchName, setBranchName] = useState<string>("");
  
  // Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDate, setSearchDate] = useState("");

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

  useEffect(() => {
    const load = async () => {
      if (!branchId) return;
      setLoading(true);
      try {
        // Use the general deposits endpoint and filter on frontend
        const res = await authorizerService.getDepositsByBranch(branchId);
        if (res.data?.success && res.data?.data) {
          // Filter for deposits that are not yet authorized and not audited
          const pendingDeposits = res.data.data.filter(
            (d) => !d.isAuthorized && !d.isAudited
          );
          setDeposits(pendingDeposits);
        } else if (res.data) {
          // Handle case where response structure is different
          if (Array.isArray(res.data)) {
            const pendingDeposits = res.data.filter(
              (d) => !d.isAuthorized && !d.isAudited
            );
            setDeposits(pendingDeposits);
          } else {
            setDeposits([]);
          }
        } else {
          setDeposits([]);
        }
      } catch (err: any) {
        console.error(err);
        // Don't show error toast if it's just a 404 (no endpoint yet)
        if (err.response?.status !== 404) {
          toast.error("Failed to load deposits");
        }
        setDeposits([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [branchId]);

  const handleAuthorize = async (depositId: string) => {
    try {
      const res = await authorizerService.authorizeDeposit(depositId, userId);
      if (res.data?.success) {
        toast.success("Deposit authorized successfully!");
        setDeposits((prev) =>
          prev.map((d) =>
            d.id === depositId ? { ...d, isAuthorized: true, authorizerId: userId } : d
          )
        );
      } else {
        toast.error(res.data?.message || "Authorization failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error authorizing deposit");
    }
  };
  
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
          : true)
      );
    });
  }, [deposits, searchTerm, searchDate]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const pending = filteredDeposits.filter(d => !d.isAuthorized).length;
    const authorized = filteredDeposits.filter(d => d.isAuthorized).length;
    const total = filteredDeposits.length;
    
    return [
      { label: "Total Deposits", value: total, color: "fuchsia", trend: "neutral" },
      { label: "Pending Authorization", value: pending, color: "orange", trend: "up" },
      { label: "Authorized", value: authorized, color: "green", trend: "up" },
    ];
  }, [filteredDeposits]);

  const columns = [
    { 
      name: "Account Holder", 
      selector: (r: Deposit) => r.accountHolderName, 
      sortable: true,
      wrap: true
    },
    { 
      name: "Account #", 
      selector: (r: Deposit) => r.accountNumber, 
      sortable: true 
    },
    {
      name: "Amount",
      selector: (r: Deposit) => r.amount,
      format: (r: Deposit) => `ETB ${r.amount.toFixed(2)}`,
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
      name: "Status",
      cell: (r: Deposit) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            r.isAuthorized
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {r.isAuthorized ? "Authorized ✅" : "Pending"}
        </span>
      ),
      sortable: true,
    },
    {
      name: "Action",
      cell: (r: Deposit) =>
        !r.isAuthorized ? (
          <button
            onClick={() => handleAuthorize(r.id)}
            className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-3 py-1 rounded-lg text-sm transition-colors shadow-sm"
          >
            Authorize
          </button>
        ) : (
          <span className="text-gray-400 text-sm">Done</span>
        ),
      ignoreRowClick: true,
      button: true,
      width: "120px"
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
          <p className="mt-4 text-fuchsia-700 font-medium">Loading Authorizer Dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching deposits for authorization</p>
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
                  <h1 className="text-2xl font-bold text-white">Authorizer Dashboard</h1>
                  <p className="mt-1 text-fuchsia-100">
                    Review and authorize deposits for {branchName}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-fuchsia-600 p-2 rounded-lg">
                    <span className="text-white font-medium">🧾</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                    "bg-green-100"
                  }`}>
                    <div className={`w-6 h-6 ${
                      metric.color === "fuchsia" ? "text-fuchsia-600" :
                      metric.color === "orange" ? "text-orange-600" :
                      "text-green-600"
                    }`}>
                      {metric.trend === "up" ? "↗️" : metric.trend === "down" ? "↘️" : "→"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Deposits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account/Holder</label>
                <input
                  type="text"
                  placeholder="Search by account holder or number"
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
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Deposits Requiring Authorization</h2>
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
                data={filteredDeposits.filter((d) => !d.isAudited)}
                progressPending={loading}
                pagination
                highlightOnHover
                striped
                responsive
                customStyles={customStyles}
                noDataComponent={
                  <div className="p-8 text-center text-gray-500">
                    No deposits pending authorization
                  </div>
                }
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 25, 50, 100]}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}