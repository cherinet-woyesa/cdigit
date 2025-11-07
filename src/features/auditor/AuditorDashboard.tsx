import { useEffect, useState } from "react";
import { safeJWTDecode, isTokenExpired } from "@utils/jwt";
import auditorService, { type AuditableItem } from '@services/auditor';
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import { Button } from "@components/ui/button";

type Deposit = AuditableItem;

export default function AuditorDashboard() {
  const [branchId, setBranchId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(false);

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
    const payload = safeJWTDecode<{ BranchId: string; nameid: string }>(token);
    setBranchId(payload.BranchId);
    setUserId(payload.nameid);
  }, []);

  // Load deposits for the branch
  useEffect(() => {
    const loadDeposits = async () => {
      if (!branchId) return;
      setLoading(true);
      try {
        // Temporarily use the general endpoint and filter on frontend
        // TODO: Add backend endpoint /api/Deposits/branch/{branchId}/pending-audit
        const res = await auditorService.getDepositsByBranch(branchId);
        console.log("Deposits response:", res);
        
        if (res.success && res.data) {
          let allDeposits: Deposit[] = [];
          
          // Handle different response structures
          if (res.data.success && res.data.data) {
            allDeposits = res.data.data;
          } else if (Array.isArray(res.data)) {
            allDeposits = res.data;
          }
          
          // For testing: Show all deposits
          // TODO: In production, filter for: d.isAuthorized && !d.isAudited
          setDeposits(allDeposits);
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

  // Handle audit button click
  const handleAudit = async (depositId: string) => {
    if (!userId) {
      toast.error("User ID not found");
      return;
    }

    try {
      const res = await auditorService.auditDeposit(depositId, userId);
      console.log("Audit response:", res);
      
      if (res.success) {
        toast.success("Deposit audited successfully!");
        setDeposits((prev) =>
          prev.map((d) =>
            d.id === depositId ? { ...d, isAudited: true, auditerId: userId } : d
          )
        );
      } else {
        toast.error(res.message || "Audit failed.");
      }
    } catch (err: any) {
      console.error("Error auditing deposit:", err);
      toast.error(err.message || "Error auditing deposit");
    }
  };

  // DataTable columns
  const columns = [
    { 
      name: "Account Holder", 
      selector: (r: Deposit) => r.accountHolderName || 'N/A',
      sortable: true,
    },
    { 
      name: "Account #", 
      selector: (r: Deposit) => r.accountNumber || 'N/A',
      sortable: true,
    },
    {
      name: "Amount",
      selector: (r: Deposit) => r.amount || 0,
      format: (r: Deposit) => `${(r.amount || 0).toFixed(2)} ETB`,
      sortable: true,
    },
    {
      name: "Authorized",
      cell: (r: Deposit) => (
        <span
          className={`px-2 py-1 rounded text-sm font-medium ${
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
          className={`px-2 py-1 rounded text-sm font-medium ${
            r.isAudited
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {r.isAudited ? "Done" : "Pending"}
        </span>
      ),
      sortable: true,
    },
    {
      name: "Action",
      cell: (r: Deposit) =>
        !r.isAudited && r.isAuthorized ? (
          <Button
            onClick={() => handleAudit(r.id)}
            className="bg-fuchsia-600 text-white hover:bg-fuchsia-700 px-4 py-2 text-sm"
          >
            Audit
          </Button>
        ) : r.isAudited ? (
          <span className="text-green-600 text-sm font-medium">✓ Audited</span>
        ) : (
          <span className="text-gray-400 text-sm">Awaiting Auth</span>
        ),
      ignoreRowClick: true,
      button: true,
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-fuchsia-700 mb-4">
        📋 Auditor Dashboard
      </h2>
      <p className="text-gray-600 mb-2">
        Verify and audit deposits in your branch.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
        <p className="text-blue-700 text-sm">
          <strong>Testing Mode:</strong> Showing all deposits. In production, only authorized deposits pending audit will be shown.
        </p>
      </div>
      
      {deposits.length === 0 && !loading && (
        <div className="text-center py-12 bg-gray-50 rounded-lg mb-6">
          <p className="text-gray-500 text-lg">No deposits found</p>
        </div>
      )}
      
      <DataTable
        columns={columns}
        data={deposits}
        progressPending={loading}
        pagination
        highlightOnHover
        striped
        responsive
        noDataComponent={<div className="p-4 text-gray-500">No deposits found</div>}
      />
    </div>
  );
}
