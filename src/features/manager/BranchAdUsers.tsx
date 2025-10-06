import { useEffect, useState } from "react";
import managerService from "../../services/managerService";
import CreateStaff from "./CreateStaff";
import DataTable from "react-data-table-component";
import { Button } from "../../components/ui/button";

interface AdUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: string;
}

interface AppUser {
  id: string;
  email: string;
}

export default function BranchAdUsers({ branchId }: { branchId: string }) {
  const [users, setUsers] = useState<AdUser[]>([]);
  const [systemUsers, setSystemUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdUser | null>(null);
  const [showModal, setShowModal] = useState(false); // ✅ modal state

  const loadUsers = async () => {
    setLoading(true);
    try {
      const adRes = await managerService.getAdUsersByBranch(branchId);
      const sysRes = await managerService.getUsersByBranch(branchId);
      setUsers(adRes || []);
      setSystemUsers(sysRes || []);
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) loadUsers();
  }, [branchId]);

  const isAlreadyInSystem = (email: string) =>
    systemUsers.some((u) => u.email.toLowerCase() === email.toLowerCase());

  const handleAddClick = (user: AdUser) => {
    setSelectedUser(user);
    setShowModal(true); // ✅ show modal
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const columns = [
    {
      name: "Name",
      selector: (row: AdUser) => `${row.firstName} ${row.lastName}`,
      sortable: true,
    },
    {
      name: "Email",
      selector: (row: AdUser) => row.email,
      sortable: true,
    },
    {
      name: "Role",
      selector: (row: AdUser) => row.role || "Staff",
      cell: (row: AdUser) => (
        <span className="px-2 py-1 rounded bg-black text-yellow-400">
          {row.role || "Staff"}
        </span>
      ),
    },

    {
      name: "Action",
      cell: (row: AdUser) => {
        const exists = isAlreadyInSystem(row.email);
        return exists ? (
          <span className="text-green-600 font-semibold">✔ Already Added</span>
        ) : (
          <Button
            onClick={() => handleAddClick(row)}
            className="bg-gradient-to-r from-purple-600 to-purple-400 text-white hover:from-purple-700 hover:to-purple-500 transition-all shadow-md hover:shadow-lg"
          >
            Add
          </Button>


        );
      },
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2 text-cbe-primary">
        👥 AD Users in Your Branch
      </h2>

      <div className="mt-4">
        <DataTable
          // title="Branch AD Users"
          columns={columns}
          data={users}
          progressPending={loading}
          pagination
          highlightOnHover
          striped
          responsive
          persistTableHead
          customStyles={{
            table: {
              style: {
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              },
            },
            headCells: {
              style: {
                fontWeight: "bold",
                fontSize: "14px",
                background: "linear-gradient(90deg, #6B21A8, #9333EA)", // gradient purple
                color: "white",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              },
            },
            rows: {
              style: {
                minHeight: "55px",
                borderRadius: "8px",
                margin: "4px 0",
                transition: "all 0.3s",
              },
            },
            cells: {
              style: {
                paddingLeft: "16px",
                paddingRight: "16px",
              },
            },
          }}
          conditionalRowStyles={[
            {
              when: () => true, // hover effect for all rows
              style: {
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  backgroundColor: "#A78BFA", // lighter purple on hover
                  color: "#fff",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  transform: "translateY(-2px)",
                },
              } as any,
            },
          ]}
        />

      </div>

      {/* ✅ Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 font-bold"
            >
              ✕
            </button>
            <CreateStaff
              branchId={branchId}
              reload={loadUsers}
              selectedUser={selectedUser}
            />
          </div>
        </div>
      )}
    </div>
  );
}