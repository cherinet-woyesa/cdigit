import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import managerService from "@services/managerService";
import toast from "react-hot-toast";
import { Button } from "@components/ui/button";
import AssignMakerModal from "@features/manager/AssignMakerModal";



interface Window {
    id: string;
    description: string;
    windowType: string;
    windowNumber: number;
    status: string;
    frontMakerId: string | null; // use ID
}

interface User {
    id: string;
    firstName: string;
    lastName: string;
    roles: string[];
}

export default function WindowsWithMaker({ branchId }: { branchId: string }) {
    const [windows, setWindows] = useState<Window[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedWindow, setSelectedWindow] = useState("");
    const [users, setUsers] = useState<User[]>([]); // makers


    const loadData = async () => {
        setLoading(true);
        try {
            const windowsData = await managerService.getWindowsByBranch(branchId);

            const usersData = await managerService.getUsersByBranch(branchId);
            const makers = usersData.filter((u: User) => u.roles.includes("Maker"));
            setWindows(windowsData);
            setUsers(makers);


            setWindows(windowsData);
        } catch (err: any) {
            toast.error(err.message || "Failed to load windows");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (branchId) loadData();
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
            console.log("row.currentTellerId:", row.frontMakerId);
            if (!row.frontMakerId) return "-";
            const maker = users.find(u => u.id === row.frontMakerId);
            console.log("Maker found:", maker);
            return maker ? `${maker.firstName} ${maker.lastName}` : "-";
        },
        sortable: true,
    },
    {
        name: "Action",
        cell: (row: Window) => (
            <Button
                onClick={() => openAssignModal(row.id)}
                className="bg-purple-900 text-white hover:bg-purple-800"
            >
                Assign
            </Button>
        ),
    },
];

    return (
        <div>
            <h2 className="text-lg font-semibold mb-4 text-purple-900">🪟 Branch Windows & Makers</h2>
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
            />

            {modalOpen && (
                <AssignMakerModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    branchId={branchId}
                    windows={windows}
                    users={users}       // list of makers

                    onAssigned={loadData}
                />
            )}
        </div>
    );
}