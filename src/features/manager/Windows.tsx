import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import CreateWindowModal from "./CreateWindowModal";
import { Button } from "../../components/ui/button";
import managerService from "../../services/managerService";
import toast from "react-hot-toast";

// ✅ New modal for status change
interface ChangeStatusModalProps {
  open: boolean;
  onClose: () => void;
  windowId: string;
  currentStatus: string;
  onUpdated: () => Promise<void>;
}

const statusOptions = ["Active", "Closed", "Assigned"];

function ChangeStatusModal({ open, onClose, windowId, currentStatus, onUpdated }: ChangeStatusModalProps) {
  const [status, setStatus] = useState(currentStatus);

  const handleSave = async () => {
    try {
      const res = await managerService.updateWindowStatus(windowId, status);
      if (res?.success) {
        toast.success(res.message || "Status updated!");
        await onUpdated();
        onClose();
      } else {
        toast.error(res?.message || "Failed to update status");
      }
    } catch (err: any) {
      toast.error(err?.message || "Unexpected error");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-lg animate-fadeIn">
        <h2 className="text-lg font-semibold mb-4 text-purple-900">📝 Change Window Status</h2>
        <div className="flex flex-col gap-2 mb-4">
          {statusOptions.map((s) => {
            const color =
              s === "Active" ? "bg-green-500" : s === "Closed" ? "bg-red-500" : "bg-yellow-500";
            return (
              <button
                key={s}
                className={`flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-100 transition-all ${
                  status === s ? "bg-gray-200" : "bg-white"
                }`}
                onClick={() => setStatus(s)}
              >
                <span className={`inline-block w-3 h-3 rounded-full ${color}`}></span>
                {s}
              </button>
            );
          })}
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} className="bg-gray-300 text-gray-900 hover:bg-gray-400">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-purple-900 text-white hover:bg-purple-800">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

// ========================== Main Windows Component ==========================

type WindowsProps = { branchId: string };

interface Window {
  id: string;
  description: string;
  windowType: string;
  windowNumber: number;
  status: string;
}

export default function Windows({ branchId }: WindowsProps) {
  const [windows, setWindows] = useState<Window[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ✅ State for status modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedWindowForStatus, setSelectedWindowForStatus] = useState<Window | null>(null);

  const load = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const data = await managerService.getWindowsByBranch(branchId);
      setWindows(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load windows.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) load();
  }, [branchId]);

  const openStatusModal = (window: Window) => {
    setSelectedWindowForStatus(window);
    setStatusModalOpen(true);
  };

  const columns = [
    { name: "Description", selector: (row: Window) => row.description, sortable: true },
    { name: "Type", selector: (row: Window) => row.windowType, sortable: true },
    { name: "Number", selector: (row: Window) => row.windowNumber, sortable: true },
    {
      name: "Status",
      selector: (row: Window) => row.status,
      cell: (row: Window) => {
        const bgColor =
          row.status.toLowerCase() === "active"
            ? "bg-green-500"
            : row.status.toLowerCase() === "closed"
            ? "bg-red-500"
            : "bg-yellow-500"; // assigned
        return (
          <span className={`px-2 py-1 rounded text-white font-semibold text-sm ${bgColor}`}>
            {row.status}
          </span>
        );
      },
      sortable: true,
    },
    {
      name: "Action",
      cell: (row: Window) => (
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => openStatusModal(row)}
            className="bg-yellow-500 text-white hover:bg-yellow-400 px-3 py-1 rounded"
          >
            Change Status
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-bank">🪟 Windows In Your Branch</h2>
        <Button
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-400 text-white px-4 py-2 rounded-lg shadow-lg hover:from-purple-700 hover:to-purple-500 transition-all"
          onClick={() => setShowCreateModal(true)}
        >
          ➕ Create Window
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={windows}
        progressPending={loading}
        pagination
        highlightOnHover
        striped
        responsive
        persistTableHead
        customStyles={{
          table: { style: { borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } },
          headCells: {
            style: {
              fontWeight: "bold",
              fontSize: "14px",
              background: "linear-gradient(90deg, #6B21A8, #9333EA)",
              color: "white",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            },
          },
          rows: { style: { minHeight: "55px", borderRadius: "8px", transition: "all 0.3s" } },
          cells: { style: { paddingLeft: "16px", paddingRight: "16px" } },
        }}
        conditionalRowStyles={[
          {
            when: () => true,
            style: {
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": {
                backgroundColor: "#A78BFA",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                transform: "translateY(-2px)",
              },
            } as any,
          },
        ]}
      />

      {showCreateModal && (
        <CreateWindowModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          branchId={branchId}
          onCreated={load} // reload windows after create
        />
      )}

      {/* Status modal */}
      {statusModalOpen && selectedWindowForStatus && (
        <ChangeStatusModal
          open={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          windowId={selectedWindowForStatus.id}
          currentStatus={selectedWindowForStatus.status}
          onUpdated={load}
        />
      )}
    </div>
  );
}