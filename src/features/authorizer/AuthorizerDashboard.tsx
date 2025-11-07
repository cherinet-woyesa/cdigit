import { useEffect, useState } from "react";
import { safeJWTDecode, isTokenExpired } from "@utils/jwt";
import authorizerService, { type AuthorizableItem } from '@services/authorizer';
import toast from "react-hot-toast";
import DataTable from "react-data-table-component";
import { Button } from "@components/ui/button";

type Deposit = AuthorizableItem;

export default function AuthorizerDashboard() {
  const [branchId, setBranchId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    const load = async () => {
      if (!branchId) return;
      setLoading(true);
      try {
        const res = await authorizerService.getDepositsByBranch(branchId);
        if (res.data && res.data.success) {
          setDeposits(res.data.data);
        }
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to load deposits");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [branchId]);

  const handleAuthorize = async (depositId: string) => {
    try {
      const res = await authorizerService.authorizeDeposit(depositId, userId);
      if (res.data && res.data.success) {
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

  const columns = [
    { name: "Account Holder", selector: (r: Deposit) => r.accountHolderName },
    { name: "Account #", selector: (r: Deposit) => r.accountNumber },
    {
      name: "Amount",
      selector: (r: Deposit) => `$${r.amount.toFixed(2)}`,
      sortable: true,
    },
    {
      name: "Status",
      cell: (r: Deposit) => (
        <span
          className={`px-2 py-1 rounded text-sm ${
            r.isAuthorized
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {r.isAuthorized ? "Authorized ✅" : "Pending"}
        </span>
      ),
    },
    {
      name: "Action",
      cell: (r: Deposit) =>
        !r.isAuthorized ? (
          <Button
            onClick={() => handleAuthorize(r.id)}
            className="bg-fuchsia-600 text-white hover:bg-fuchsia-700"
          >
            Authorize
          </Button>
        ) : (
          <span className="text-gray-400 text-sm">Done</span>
        ),
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-fuchsia-700 mb-4">
        🧾 Authorizer Dashboard
      </h2>
      <p className="text-gray-600 mb-6">
        Review and authorize deposits for your branch.
      </p>
      <DataTable
        columns={columns}
        data={deposits.filter((d) => !d.isAudited)} // show only non-audited
        progressPending={loading}
        pagination
        highlightOnHover
      />
    </div>
  );
}
