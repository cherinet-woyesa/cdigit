import { useEffect, useState, useMemo } from "react";
import { safeJWTDecode, isTokenExpired } from "@utils/jwt";
import { kycService } from "@services/kyc/kycService";
import type { 
  KycableItem, 
  KycGetByIdDto, 
  KycGetByFormReferenceDto, 
  KycGetByAccountDto, 
  KycGetByPhoneDto, 
  KycGetByMakerDto, 
  KycGetByDateRangeDto 
} from "@services/kyc/kycService";
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import { DashboardErrorBoundary } from "@components/dashboard/ErrorBoundary";
import { VoucherStatusBadge, WorkflowActionDropdown } from "@components/workflow";

type KycVoucher = KycableItem;

export default function KYCDashboard() {
  const [branchId, setBranchId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [vouchers, setVouchers] = useState<KycVoucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [branchName, setBranchName] = useState<string>("");

  // Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchMaker, setSearchMaker] = useState("");
  const [searchCustomerId, setSearchCustomerId] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [specificSearchValue, setSpecificSearchValue] = useState("");
  const [dateRangeFrom, setDateRangeFrom] = useState("");
  const [dateRangeTo, setDateRangeTo] = useState("");

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

  // Load vouchers for the branch
  useEffect(() => {
    if (branchId) {
      loadVouchers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const loadVouchers = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await kycService.getToday({
        serviceName: "Deposits",
        branchId: branchId
      });
      
      if (res.data?.success && res.data?.data) {
        // Filter for vouchers in KYC stage
        const kycVouchers = res.data.data.filter(
          (v: KycableItem) => !v.isKycApproved && !v.isRejected
        );
        setVouchers(kycVouchers);
      } else if (res.data) {
        if (Array.isArray(res.data)) {
          const kycVouchers = res.data.filter(
            (v: KycableItem) => !v.isKycApproved && !v.isRejected
          );
          setVouchers(kycVouchers);
        } else {
          setVouchers([]);
        }
      } else {
        setVouchers([]);
      }
    } catch (err: any) {
      console.error("Error loading KYC vouchers:", err);
      if (err.response?.status !== 404) {
        toast.error("Failed to load KYC vouchers");
      }
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowSuccess = () => {
    // Refresh the vouchers list after successful workflow routing
    if (branchId) {
      loadVouchers();
    }
  };

  const handleKycApprove = async (voucherId: string) => {
    if (!userId) {
      toast.error("User ID not found");
      return;
    }

    try {
      const res = await kycService.kycApprove({
        serviceName: "Deposits",
        voucherId: voucherId,
        kycOfficerId: userId
      });

      if (res.data?.success) {
        toast.success("KYC approved successfully! You can now route it to the next stage.");
        setVouchers((prev) =>
          prev.map((v) =>
            v.id === voucherId
              ? {
                  ...v,
                  isKycApproved: true,
                  kycOfficerId: userId,
                }
              : v,
          ),
        );
      } else {
        toast.error(res.data?.message || "KYC approval failed.");
      }
    } catch (err: any) {
      console.error("Error approving KYC:", err);
      toast.error(err.message || "Error approving KYC");
    }
  };

  const handleSpecificSearch = async () => {
    if (!branchId) {
      toast.error("Branch ID not found");
      return;
    }

    setLoading(true);
    try {
      let res;
      switch (searchType) {
        case "id":
          const idDto: KycGetByIdDto = {
            serviceName: "Deposits",
            voucherId: specificSearchValue,
            branchId: branchId
          };
          res = await kycService.getById(idDto);
          break;
        case "formReference":
          const formDto: KycGetByFormReferenceDto = {
            serviceName: "Deposits",
            formReferenceId: specificSearchValue,
            branchId: branchId
          };
          res = await kycService.getByFormReference(formDto);
          break;
        case "account":
          const accountDto: KycGetByAccountDto = {
            serviceName: "Deposits",
            accountNumber: specificSearchValue,
            branchId: branchId
          };
          res = await kycService.getByAccount(accountDto);
          break;
        case "phone":
          const phoneDto: KycGetByPhoneDto = {
            serviceName: "Deposits",
            phoneNumber: specificSearchValue,
            branchId: branchId
          };
          res = await kycService.getByPhone(phoneDto);
          break;
        case "maker":
          const makerDto: KycGetByMakerDto = {
            serviceName: "Deposits",
            makerId: specificSearchValue,
            branchId: branchId
          };
          res = await kycService.getByMaker(makerDto);
          break;
        case "dateRange":
          if (!dateRangeFrom || !dateRangeTo) {
            toast.error("Please provide both from and to dates");
            return;
          }
          const rangeDto: KycGetByDateRangeDto = {
            serviceName: "Deposits",
            from: dateRangeFrom,
            to: dateRangeTo,
            branchId: branchId
          };
          res = await kycService.getByDateRange(rangeDto);
          break;
        default:
          const todayDto = {
            serviceName: "Deposits",
            branchId: branchId
          };
          res = await kycService.getToday(todayDto);
      }

      if (res.data?.success && res.data?.data) {
        let resultData = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
        const kycVouchers = resultData.filter(
          (v) => !v.isKycApproved && !v.isRejected
        );
        setVouchers(kycVouchers);
      } else {
        setVouchers([]);
        toast.error(res.data?.message || "No records found");
      }
    } catch (err: any) {
      console.error("Error performing search:", err);
      toast.error("Error performing search");
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter vouchers based on search criteria
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher: KycableItem) => {
      return (
        ((voucher.accountHolderName &&
          voucher.accountHolderName
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
          (voucher.accountNumber &&
            voucher.accountNumber
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))) &&
        (searchDate
          ? new Date(voucher.submittedAt).toLocaleDateString() ===
            new Date(searchDate).toLocaleDateString()
          : true) &&
        (searchMaker
          ? (voucher.makerId &&
              voucher.makerId
                .toLowerCase()
                .includes(searchMaker.toLowerCase())) ||
            (voucher.makerName &&
              voucher.makerName.toLowerCase().includes(searchMaker.toLowerCase()))
          : true) &&
        (searchCustomerId
          ? voucher.customerId &&
            voucher.customerId
              .toLowerCase()
              .includes(searchCustomerId.toLowerCase())
          : true)
      );
    });
  }, [vouchers, searchTerm, searchDate, searchMaker, searchCustomerId]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const approved = filteredVouchers.filter(v => v.isKycApproved).length;
    const pending = filteredVouchers.filter(v => !v.isKycApproved && !v.isRejected).length;
    const total = filteredVouchers.length;
    
    return [
      { label: "Total Vouchers", value: total, color: "fuchsia", trend: "neutral" },
      { label: "Pending KYC", value: pending, color: "orange", trend: "up" },
      { label: "Approved", value: approved, color: "green", trend: "up" },
    ];
  }, [filteredVouchers]);

  // DataTable columns
  const columns = [
    {
      name: "Account Holder",
      selector: (r: KycVoucher) => r.accountHolderName || "N/A",
      sortable: true,
      wrap: true
    },
    {
      name: "Account #",
      selector: (r: KycVoucher) => r.accountNumber || "N/A",
      sortable: true
    },
    {
      name: "Amount",
      selector: (r: KycVoucher) => r.amount || 0,
      format: (r: KycVoucher) => `ETB ${(r.amount || 0).toFixed(2)}`,
      sortable: true,
      right: true
    },
    {
      name: "Workflow Stage",
      cell: (r: KycVoucher) => {
        const stage = (r as any).workflowStage || "ToKYC";
        return (
          <VoucherStatusBadge
            status={stage}
            lastActionAt={r.submittedAt}
            isPending={!r.isKycApproved && !r.isRejected}
            showElapsedTime
          />
        );
      },
      sortable: true,
      width: "180px"
    },
    {
      name: "Submitted At",
      selector: (r: KycVoucher) => new Date(r.submittedAt).toLocaleDateString(),
      sortable: true,
      wrap: true
    },
    {
      name: "KYC Status",
      cell: (r: KycVoucher) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            r.isRejected
              ? "bg-red-100 text-red-800"
              : r.isKycApproved
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {r.isRejected ? "Rejected" : r.isKycApproved ? "Approved" : "Pending"}
        </span>
      ),
      sortable: true,
    },
    {
      name: "Action",
      cell: (r: KycVoucher) => (
        <div className="flex space-x-2">
          {!r.isKycApproved ? (
            <button
              onClick={() => handleKycApprove(r.id)}
              className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-3 py-1 rounded-lg text-sm transition-colors shadow-sm"
            >
              Approve KYC
            </button>
          ) : (
            <>
              <span className="text-green-600 text-sm font-medium mr-2">
                ✓ Approved
              </span>
              <WorkflowActionDropdown
                voucherId={r.id}
                serviceName="Deposits"
                currentStage={(r as any).workflowStage}
                onSuccess={handleWorkflowSuccess}
              />
            </>
          )}
        </div>
      ),
      ignoreRowClick: true,
      button: true,
      width: "250px"
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

  if (loading && vouchers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600 mx-auto"></div>
          <p className="mt-4 text-fuchsia-700 font-medium">Loading KYC Dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching vouchers for KYC verification</p>
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
                  <h1 className="text-2xl font-bold text-white">KYC Officer Dashboard</h1>
                  <p className="mt-1 text-fuchsia-100">
                    Verify customer identity and approve KYC for {branchName}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-fuchsia-600 p-2 rounded-lg">
                    <span className="text-white font-medium">🔍</span>
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

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-blue-600">ℹ️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Information:</strong> Showing vouchers requiring KYC verification.
                </p>
              </div>
            </div>
          </div>

          {/* Search Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Vouchers</h2>
            
            {/* Basic Search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
            
            {/* Advanced Search */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-md font-medium text-gray-900 mb-3">Advanced Search</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Type</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                  >
                    <option value="all">Today's Records</option>
                    <option value="id">By ID</option>
                    <option value="formReference">By Form Reference</option>
                    <option value="account">By Account Number</option>
                    <option value="phone">By Phone Number</option>
                    <option value="maker">By Maker ID</option>
                    <option value="dateRange">By Date Range</option>
                  </select>
                </div>
                
                {searchType !== "dateRange" && searchType !== "all" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {searchType === "id" && "Voucher ID"}
                      {searchType === "formReference" && "Form Reference"}
                      {searchType === "account" && "Account Number"}
                      {searchType === "phone" && "Phone Number"}
                      {searchType === "maker" && "Maker ID"}
                    </label>
                    <input
                      type="text"
                      placeholder={`Enter ${searchType === "id" ? "voucher ID" : searchType === "formReference" ? "form reference" : searchType === "account" ? "account number" : searchType === "phone" ? "phone number" : "maker ID"}`}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                      value={specificSearchValue}
                      onChange={(e) => setSpecificSearchValue(e.target.value)}
                    />
                  </div>
                )}
                
                {searchType === "dateRange" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                      <input
                        type="date"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                        value={dateRangeFrom}
                        onChange={(e) => setDateRangeFrom(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                      <input
                        type="date"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                        value={dateRangeTo}
                        onChange={(e) => setDateRangeTo(e.target.value)}
                      />
                    </div>
                  </>
                )}
                
                <div className="flex items-end">
                  <button
                    onClick={handleSpecificSearch}
                    className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-sm"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Vouchers Requiring KYC</h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredVouchers.length} vouchers found
              </p>
            </div>
            
            {filteredVouchers.length === 0 && !loading ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No vouchers found</h3>
                <p className="text-gray-500">Try adjusting your search filters</p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredVouchers}
                progressPending={loading}
                pagination
                highlightOnHover
                striped
                responsive
                customStyles={customStyles}
                noDataComponent={
                  <div className="p-8 text-center text-gray-500">
                    No vouchers available for KYC verification
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
