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
        const res = await auditorService.getDepositsByBranch(branchId);
        if (res.data && res.data.success) {
          setDeposits(res.data.data);
        }
        console.log("Deposits loaded:", res.data);
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to load deposits");
      } finally {
        setLoading(false);
      }
    };
    loadDeposits();
  }, [branchId]);

  // Handle audit button click
  const handleAudit = async (depositId: string) => {
    if (!userId) return;

    try {
      const res = await auditorService.auditDeposit(depositId, userId);
      if (res.data && res.data.success) {
        toast.success("Deposit audited successfully!");
        setDeposits((prev) =>
          prev.map((d) =>
            d.id === depositId ? { ...d, isAudited: true, auditerId: userId } : d
          )
        );
      } else {
        toast.error(res.data?.message || "Audit failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error auditing deposit");
    }
  };

  // DataTable columns
  const columns = [
    { name: "Account Holder", selector: (r: Deposit) => r.accountHolderName },
    { name: "Account #", selector: (r: Deposit) => r.accountNumber },
    {
      name: "Amount",
      selector: (r: Deposit) => `$${r.amount.toFixed(2)}`,
      sortable: true,
    },
    {
      name: "Authorized",
      cell: (r: Deposit) => (
        <span
          className={`px-2 py-1 rounded text-sm ${
            r.isAuthorized
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {r.isAuthorized ? "Yes" : "No"}
        </span>
      ),
    },
    {
      name: "Audited",
      cell: (r: Deposit) => (
        <span
          className={`px-2 py-1 rounded text-sm ${
            r.isAudited
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {r.isAudited ? "Done" : "Pending"}
        </span>
      ),
    },
    {
      name: "Action",
      cell: (r: Deposit) =>
        !r.isAudited ? (
          <Button
            onClick={() => handleAudit(r.id)}
            className="bg-fuchsia-600 text-white hover:bg-fuchsia-700"
          >
            Audit
          </Button>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        ),
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-fuchsia-700 mb-4">
        📋 Auditor Dashboard
      </h2>
      <p className="text-gray-600 mb-6">
        Verify and audit deposits in your branch.
      </p>
      <DataTable
        columns={columns}
        data={deposits} // show all deposits, no filter
        progressPending={loading}
        pagination
        highlightOnHover
      />
    </div>
  );
}
