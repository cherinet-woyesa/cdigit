// src/pages/PettyCash.tsx
import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import { Button } from "@components/ui/button";
import managerPettyCashService from "@services/transactions/managerPettyCashService";
import PettyCashDetailModal from "@features/manager/PettyCashDetailModal";
import { useAuth } from "@context/AuthContext";
import type { PettyCashFormResponseDto } from "@types";

export default function PettyCash({ branchId, voultManagerId }: { branchId: string; voultManagerId: string, }) {
  const { token } = useAuth();

  const [data, setData] = useState<PettyCashFormResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PettyCashFormResponseDto | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await managerPettyCashService.getAllByBranch(branchId);
      setData(res);
    } catch (err) {
      toast.error("Failed to load petty cash data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) load();
  }, [branchId]);

  const columns = [
    { name: "Form Ref", selector: (row: PettyCashFormResponseDto) => row.formReferenceId || '', sortable: true },
    { name: "Maker", selector: (row: PettyCashFormResponseDto) => row.frontMakerName || '', sortable: true },
    { name: "CashGvn", selector: (row: PettyCashFormResponseDto) => row.cashReceivedFromVault ?? 0, sortable: true },
    { name: "Surrendered", selector: (row: PettyCashFormResponseDto) => row.cashSurrenderedToVault ?? 0, sortable: true },
    { name: "Today Balance", selector: (row: PettyCashFormResponseDto) => row.todayBalance ? row.todayBalance : (row.cashReceivedFromVault - row.cashSurrenderedToVault), sortable: true },
    // { name: "Updated", selector: (row: PettyCashFormResponseDto) => new Date(row.updatedAt).toLocaleString(), sortable: true },
    { name: "RequestAddCash", selector: (row: PettyCashFormResponseDto) => row.makerRequestAdditional ? "Yes" : "No", sortable: true },
    { name: "AddGiven", selector: (row: PettyCashFormResponseDto) => row.managerGiveAdditionalCashReq ? "Yes" : "No", sortable: true },
    { name: "addnlApprv", selector: (row: PettyCashFormResponseDto) => row.additionalApprovalByMaker ? "Yes" : "No", sortable: true },
    { name: "surenderAdd", selector: (row: PettyCashFormResponseDto) => row.makerRequestAdditionalSurrender ? "Yes" : "No", sortable: true },
    // { name: "surenderAddAprv", selector: (row: PettyCashFormResponseDto) => row.additionalApprovalByVManager ? "Yes" : "No", sortable: true },
  ];

  return (
    <div>
      <div className="flex justify-between mb-4 items-center">
        <h2 className="text-lg font-semibold text-bank">💰 Petty Cash Management</h2>
        <Button
          onClick={load}
          className="bg-gradient-to-r from-purple-600 to-purple-400 text-white px-4 py-2 rounded-lg shadow-lg hover:from-purple-700 hover:to-purple-500"
        >
          🔄 Refresh
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        progressPending={loading}
        pagination
        highlightOnHover
        striped
        onRowClicked={(row) => setSelected(row)}
        customStyles={{
          headCells: {
            style: {
              background: "linear-gradient(90deg, #6B21A8, #9333EA)",
              color: "white",
              fontWeight: "bold",
              textTransform: "uppercase",
            },
          },
          rows: { style: { cursor: "pointer" } },
        }}
      />

      {selected && (
        <PettyCashDetailModal
          token={token}
          open={!!selected}
          pettyCash={selected}
          voultManagerId={voultManagerId}
          onClose={() => setSelected(null)}
          onUpdated={load}
        />
      )}
    </div>
  );
}