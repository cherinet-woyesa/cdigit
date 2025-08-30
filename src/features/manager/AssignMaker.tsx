import { useEffect, useState } from "react";
import managerService from "../../services/managerService";
import { Button } from "../../components/ui/button";
import toast from "react-hot-toast";

export default function AssignMaker({ branchId }: { branchId: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [windows, setWindows] = useState<any[]>([]);
  const [selectedWindow, setSelectedWindow] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const resUsers = await managerService.getUsersByBranch(branchId);
        const makers = resUsers.filter((u: any) => u.roles.includes("Maker"));
        setUsers(makers);

        const resWindows = await managerService.getWindowsByBranch(branchId);
        setWindows(resWindows);
      } catch (err: any) {
        toast.error(err.message || "Failed to load users or windows");
      }
    };

    if (branchId) load();
  }, [branchId]);

  const handleAssign = async () => {
  if (!selectedWindow || !selectedUser) {
    toast.error("Please select both window and maker.");
    return;
  }

  try {
    const res = await managerService.assignMakerToWindow(selectedWindow, selectedUser);
    if (res?.success) {
      toast.success(res.message || "Assigned Successfully");

      // Reset selections
      setSelectedWindow("");
      setSelectedUser("");

      // Refresh windows
      const resWindows = await managerService.getWindowsByBranch(branchId);
      setWindows(resWindows);
    } else {
      toast.error(res?.message || "Failed to assign maker");
    }
  } catch (error: any) {
    toast.error(error.message || "Failed to assign maker");
  }
};

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2 text-purple-900">
        🔗 Assign Maker to Window
      </h2>
      <div className="flex gap-2">
        <select
          value={selectedWindow}
          onChange={(e) => setSelectedWindow(e.target.value)}
          className="border border-purple-900 rounded px-2"
        >
          <option value="">Select Window</option>
          {windows.map((w) => (
            <option key={w.id} value={w.id}>
              {w.description} #{w.windowNumber}
            </option>
          ))}
        </select>

        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="border border-purple-900 rounded px-2"
        >
          <option value="">Select Maker</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.firstName} {u.lastName}
            </option>
          ))}
        </select>

        <Button
          onClick={handleAssign}
          className="bg-purple-900 text-white hover:bg-purple-800"
        >
          Assign
        </Button>
      </div>
    </div>
  );
}

// http://localhost:5268/api/simulatedadusers/bybranch/a3d3e1b5-8c9a-4c7c-a1e3-6b3d8f4a2b2c
// http://localhost:5268/api/users/by-branch/a3d3e1b5-8c9a-4c7c-a1e3-6b3d8f4a2b2c