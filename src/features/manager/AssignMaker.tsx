import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import managerService from "../../services/managerService";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/button";
import AssignMakerModal from "./AssignMakerModal";

interface Window {
  id: string;
  description: string;
  windowType: string;
  windowNumber: number;
  status: string;
  frontMakerId: string | null;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export default function WindowsWithMaker({ branchId }: { branchId: string }) {
  const [windows, setWindows] = useState<Window[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWindow, setSelectedWindow] = useState("");

  // Fetch windows
  const loadWindows = async () => {
    setLoading(true);
    try {
      const windowsData = await managerService.getWindowsByBranch(branchId);
      setWindows(windowsData);
    } catch (err: any) {
      toast.error(err.message || "Failed to load windows");
    } finally {
      setLoading(false);
    }
  };

  // Fetch users (makers)
  const loadUsers = async () => {
    try {
      const usersData = await managerService.getUsersByBranch(branchId);
      const makers = usersData.filter((u: User) => u.roles.includes("Maker"));
      setUsers(makers);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    }
  };

  useEffect(() => {
    if (branchId) {
      loadWindows();
      loadUsers();
    }
  }, [branchId]);

  const openAssignModal = (windowId: string) => {
    setSelectedWindow(windowId);
    setModalOpen(true);
  };

  const columns = [
    { name: "Window #", selector: (row: Window) => row.windowNumber, sortable: true },
    { name: "Type", selector: (row: Window) => row.windowType, sortable: true },
    { name: "Description", selector: (row: Window) => row.description, sortable: true },
    {
      name: "Assigned Maker",
      selector: (row: Window) => {
        console.log("row:", row);
        if (!row.frontMakerId) return "-";
        const maker = users.find(u => u.id === row.frontMakerId);
        console.log("Maker found:", maker);
        return maker ? `${maker.firstName} ${maker.lastName}` : "-";
      },
      sortable: true,
    },


  ];

  return (
    <div>

      {/* <Button
        onClick={() => setModalOpen(true)}
        // className="mb-4 bg-purple-900 text-white hover:bg-purple-800"
        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-400 text-white px-4 py-2 rounded-lg shadow-lg hover:from-purple-700 hover:to-purple-500 transition-all"

      >
      </Button> */}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold mb-4 text-purple-900">🪟 Windows & Thier Respective Makers in Your Branch</h2>
        <Button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-400 text-white px-4 py-2 rounded-lg shadow-lg hover:from-purple-700 hover:to-purple-500 transition-all"
        >
          ➕         Assign Maker to Window
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
          headCells: { style: { fontWeight: "bold", fontSize: "14px", background: "linear-gradient(90deg, #6B21A8, #9333EA)", color: "white" } },
          rows: { style: { minHeight: "55px", borderRadius: "8px" } },
          cells: { style: { paddingLeft: "16px", paddingRight: "16px" } },
        }}
      />

      {modalOpen && (
        <AssignMakerModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          branchId={branchId}
          windows={windows}
          users={users}
          onAssigned={loadWindows} // refresh only windows after assigning
        />
      )}
    </div>
  );
}