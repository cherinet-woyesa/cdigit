import { useState } from "react";
import { Button } from "../../components/ui/button";
import toast from "react-hot-toast";
import managerService from "../../services/managerService";

interface Props {
  open: boolean;
  onClose: () => void;
  windowId: string;
  currentStatus: string;
  onUpdated: () => Promise<void>;
}

const statusOptions = ["Active", "Closed", "Assigned"];

export default function ChangeStatusModal({ open, onClose, windowId, currentStatus, onUpdated }: Props) {
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