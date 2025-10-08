// src/pages/PettyCash.tsx
import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/button";
import managerPettyCashService from "../../services/managerPettyCashService";
import PettyCashDetailModal from "./PettyCashDetailModal";
import { useAuth } from "../../context/AuthContext";

interface PettyCashForm {
  id: string;
  formReferenceId: string;
  frontMakerName: string;
  cashReceivedFromVault: number;
  cashSurrenderedToVault: number;
  todayBalance: number;
  updatedAt: string;
}

export default function PettyCash({ branchId, voultManagerId }: { branchId: string; voultManagerId: string, }) {
  const { token } = useAuth();

  const [data, setData] = useState<PettyCashForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PettyCashForm | null>(null);

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
    { name: "Form Ref", selector: (row: PettyCashForm) => row.formReferenceId, sortable: true },
    { name: "Maker", selector: (row: PettyCashForm) => row.frontMakerName, sortable: true },
    { name: "Received", selector: (row: PettyCashForm) => row.cashReceivedFromVault, sortable: true },
    { name: "Surrendered", selector: (row: PettyCashForm) => row.cashSurrenderedToVault, sortable: true },
    { name: "Today Balance", selector: (row: PettyCashForm) => row.todayBalance, sortable: true },
    { name: "Updated", selector: (row: PettyCashForm) => new Date(row.updatedAt).toLocaleString(), sortable: true },
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
