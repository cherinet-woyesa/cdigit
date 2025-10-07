import { useState } from "react";
import { Button } from "../../components/ui/button";
import toast from "react-hot-toast";
import managerService from "../../services/managerService";

interface Props {
  open: boolean;
  onClose: () => void;
  branchId: string;
  users: any[];
  windows: any[];
  onAssigned: () => Promise<void>;
}

export default function AssignMakerModal({ open, onClose, branchId, users, windows, onAssigned }: Props) {
  const [selectedWindow, setSelectedWindow] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  const handleAssign = async () => {
    if (!selectedWindow || !selectedUser) {
      toast.error("Please select both window and maker.");
      return;
    }

    try {
      const res = await managerService.assignMakerToWindow(selectedWindow, selectedUser);
      if (res?.success) {
        toast.success(res.message || "Assigned Successfully");
        setSelectedWindow("");
        setSelectedUser("");
        await onAssigned();
        onClose();
      } else {
        toast.error(res?.message || "Failed to assign maker");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign maker");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg animate-fadeIn">
        <h2 className="text-lg font-semibold mb-4 text-purple-900">🔗 Assign Maker</h2>

        <div className="flex flex-col gap-4">
          <select
            value={selectedWindow}
            onChange={(e) => setSelectedWindow(e.target.value)}
            className="border border-purple-900 rounded px-2 py-1"
          >
            <option value="">Select Window</option>
            {windows.map((w: any) => (
              <option key={w.id} value={w.id}>
                {w.description} #{w.windowNumber}
              </option>
            ))}
          </select>

          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="border border-purple-900 rounded px-2 py-1"
          >
            <option value="">Select Maker</option>
            {users.map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-2 mt-2">
            <Button
              onClick={onClose}
              className="bg-gray-300 text-gray-900 hover:bg-gray-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              className="bg-purple-900 text-white hover:bg-purple-800"
            >
              Assign
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}