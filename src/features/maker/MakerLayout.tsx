import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import MakerDashboard from "./MakerDashboard";
import type { WindowDto } from "types/WindowDto";
import { HubConnectionBuilder } from '@microsoft/signalr';
import type { DecodedToken } from "types/DecodedToken";
import type { ActionMessage } from "types/ActionMessage";
import WindowSelectionModal from "./WindowSelectionModal";
import makerService from "../../services/makerService";
import { jwtDecode } from "jwt-decode";
import QueueNotifyModal from "../../modals/QueueNotifyModal";

const MakerLayout: React.FC = () => {

    const { token, logout } = useAuth();
    const [decoded, setDecoded] = useState<DecodedToken | null>(null);

    const [activeSection, setActiveSection] = useState("transactions");
    const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);

    // branch related
    const [branchName, setBranchName] = useState<string>("");

    // window related
    const [assignedWindow, setAssignedWindow] = useState<WindowDto | null>(null);
    const [windows, setWindows] = useState<WindowDto[]>([]);
    const [showWindowSelectionModal, setShowWindowSelectionModal] = useState(false);
    const [showWindowChangeModal, setShowWindowChangeSelectionModal] = useState(false);
    const [selectedWindowId, setSelectedWindowId] = useState("");

    // New customer comming notify Modal state
    const [isQueueNotifyModalOpen, setIsQueueNotifyModalOpen] = useState(false);
    const [QueueNotifyModalMessage, setQueueNotifyModalMessage] = useState('');
    const [QueueNotifyModalTitle, setQueueNotifyModalTitle] = useState('');
    const [amount, setAmount] = useState('');

    /** Decode token */
    useEffect(() => {
        if (!token) return;
        try {
            const d = jwtDecode<DecodedToken>(token);
            setDecoded(d);
        } catch {
            logout();
        }
    }, [token, logout]);

    //fetch branch info
    useEffect(() => {
        const fetchBranch = async () => {
            if (!token || !decoded?.BranchId) return;
            try {
                const res = await makerService.getBranchById(decoded.BranchId, token);
                if (res.success && res.data?.name) {
                    setBranchName(res.data.name);
                } else {
                    setBranchName("Unknown Branch");
                }
            } catch (err) {
                console.error("Failed to fetch branch:", err);
                setBranchName("Error loading branch");
            }
        };

        fetchBranch();
    }, [decoded?.BranchId, token]);

    // notify the comming of New customer 
    useEffect(() => {
        if (!decoded?.BranchId) return;

        // Setup SignalR connection
        const connection = new HubConnectionBuilder()
            .withUrl('http://localhost:5268/hub/queueHub')
            .withAutomaticReconnect()
            .build();

        connection.start().then(() => {
            console.log('Connected to SignalR hub');

            // Join group with Branch id
            connection.invoke('JoinBranchCustomersQueueGroup', decoded?.BranchId);

            // Listen for messages
            connection.on('NewCustomer', (data) => {
                console.log('New customer notification received:', data);
                setQueueNotifyModalTitle(data.transactionType + " Request");
                setQueueNotifyModalMessage(`${data.message} is comming, please ready to serve. `);

                console.log("data.amount at dashboard", data.amount);
                setAmount(`Amount: ETB ${Number(data.amount).toLocaleString()}`);
                setIsQueueNotifyModalOpen(true);
                // void refreshQueue();
            });
        });

        return () => {
            connection.stop();
        };
    }, [decoded?.BranchId]);

        // window related
    /** Load windows */
    useEffect(() => {
        const initWindows = async () => {
            if (!token || !decoded?.nameid) return;
            try {
                const w = await makerService.getAssignedWindowForMaker(
                    decoded.nameid,
                    token
                );
                if (w && w.id) {
                    setAssignedWindow(w);
                    setShowWindowSelectionModal(false);
                } else if (decoded.BranchId) {
                    const list = await makerService.getWindowsByBranchId(
                        decoded.BranchId,
                        token
                    );
                    setWindows(Array.isArray(list) ? list : []);
                    setShowWindowSelectionModal(true);
                }
            } catch {
                if (decoded?.BranchId) {
                    const list = await makerService.getWindowsByBranchId(
                        decoded.BranchId,
                        token
                    );
                    setWindows(Array.isArray(list) ? list : []);
                    setShowWindowSelectionModal(true);
                }
            }
        };
        if (decoded?.nameid) void initWindows();
    }, [decoded, token]);

    /** Assign window submit */
    const handleAssignWindow = async () => {
        console.log("calling handleAssignWindow:", selectedWindowId);
        if (!token || !decoded?.nameid || !selectedWindowId) return;
        try {
            const res = await makerService.assignMakerToWindow(
                selectedWindowId,
                decoded.nameid,
                token
            );
            if (!res.success) {
                // setActionMessage("Failed: " + res.message);
                setActionMessage({ type: 'error', content: res.message });

            }
            else {
                // setActionMessage("Successfull" + res.message );
                setActionMessage({ type: 'success', content: res.message });

                const found = windows.find((w) => w.id === selectedWindowId) || null;
                setAssignedWindow(found);
                // localStorage.setItem("assignedWindowId", assignedWindow.id);
                setShowWindowSelectionModal(false);
            }
        } catch {
            setActionMessage({ type: 'error', content: "Failed" });

        } finally {
            setTimeout(() => setActionMessage({ type: 'error', content: "" }), 4000);
        }
    };

    //change window submit

    const handleChangeWindow = async () => {
        console.log("calling change window..., selectedWindowId:", selectedWindowId);

        if (!token || !decoded?.nameid || !selectedWindowId) return;
        try {
            const res = await makerService.changeMakerToWindow(
                selectedWindowId,
                decoded.nameid,
                token
            );
            if (res.success) {
                setActionMessage({ type: 'success', content: res.message || "Window Changed Successfully" });

                const found = windows.find((w) => w.id === selectedWindowId) || null;
                setAssignedWindow(found);
                setShowWindowChangeSelectionModal(false);
            } else {
                setActionMessage({ type: 'error', content: res.message || "changing window failed." });
            }
        } catch {
            setActionMessage({ type: 'error', content: "Window Change failed." });

        } finally {
            setTimeout(() => setActionMessage({ type: 'error', content: " " }), 4000);
        }
    };

    // change window, because it is opend from button, but assign window open when this component start, so no need to have "open handler" 
    const handleOpenChangeWindow = async () => {
        if (!token || !decoded?.BranchId) return;

        try {
            const list = await makerService.getWindowsByBranchId(decoded.BranchId, token);

            setWindows(Array.isArray(list) ? list : []);
            setShowWindowChangeSelectionModal(true);
            setSelectedWindowId(""); // reset selection
        } catch (err) {
            console.error("Failed to load windows:", err);
            setWindows([]);
            setShowWindowChangeSelectionModal(true);
        }
    };

    // logout clears token & redirects
    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/staff-login";
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
            {/* Sidebar */}
            <Sidebar
                activeSection={activeSection}
                onNavigate={setActiveSection}
                onLogout={handleLogout}
            />

            {/* Main Content = header, body and footer */}
            <div className="flex flex-col flex-1">
                <Header
                    decoded={decoded}
                    branchName={branchName}
                    assignedWindow={assignedWindow}
                    handleOpenChangeWindow={handleOpenChangeWindow}
                />

                <main className="flex-1 p-6 overflow-y-auto">
                    <MakerDashboard activeSection={activeSection} assignedWindow={assignedWindow} />
                </main>
                <Footer />
            </div>

            {/* modals */}

            {/* initial Window selection modal */}
            <WindowSelectionModal
                isOpen={showWindowSelectionModal}
                windows={windows}
                message={actionMessage}
                selectedWindowId={selectedWindowId}
                onSelect={setSelectedWindowId}
                onAssign={handleAssignWindow}
                onClose={() => setShowWindowSelectionModal(false)}
            />

            {/* later Window change modal */}
            <WindowSelectionModal
                isOpen={showWindowChangeModal}
                windows={windows}
                message={actionMessage}
                selectedWindowId={selectedWindowId}
                onSelect={setSelectedWindowId}
                onAssign={handleChangeWindow}
                onClose={() => setShowWindowChangeSelectionModal(false)}
            />

            <QueueNotifyModal
                isOpen={isQueueNotifyModalOpen}
                onClose={() => setIsQueueNotifyModalOpen(false)}
                title={QueueNotifyModalTitle}
                message={QueueNotifyModalMessage}
                amount={amount}
            />

        </div>
    );
};

export default MakerLayout;
