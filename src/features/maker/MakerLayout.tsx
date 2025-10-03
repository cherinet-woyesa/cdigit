import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import MakerDashboard from "./MakerDashboard";
import type { WindowDto } from "types/WindowDto";
// import makerService from "services/makerService";
import type { DecodedToken } from "types/DecodedToken";
import type { ActionMessage } from "types/ActionMessage";
import WindowSelectionModal from "./WindowSelectionModal";
import makerService, { type CustomerQueueItem, type NextCustomerResponse, type TransactionType, } from "../../services/makerService";


const MakerLayout: React.FC = () => {

    const { token, logout } = useAuth();
    const [decoded, setDecoded] = useState<DecodedToken | null>(null);

    const [activeSection, setActiveSection] = useState("transactions");
    const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);


    // window related
    const [assignedWindow, setAssignedWindow] = useState<WindowDto | null>(null);
    const [windows, setWindows] = useState<WindowDto[]>([]);
    const [showWindowSelectionModal, setShowWindowSelectionModal] = useState(false);
    const [showWindowChangeModal, setShowWindowChangeSelectionModal] = useState(false);
    const [selectedWindowId, setSelectedWindowId] = useState("");


    // logout clears token & redirects
    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/login";
    };


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


    // window related

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


    return (
        <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
            {/* Sidebar */}
            <Sidebar
                activeSection={activeSection}
                onNavigate={setActiveSection}
                onLogout={handleLogout}
            />

            {/* Main Content */}
            <div className="flex flex-col flex-1">
                <Header
                decoded={decoded ?? undefined}
                    branchName= {decoded?.BranchId}
                    windowNumber={undefined}
                    assignedWindow = {assignedWindow}
                    handleOpenChangeWindow={handleOpenChangeWindow}
                />

                <main className="flex-1 p-6 overflow-y-auto">
                    <MakerDashboard activeSection={activeSection} />
                </main>

                <Footer />
            </div>


                        {/* initial Window selection modal */}
            {showWindowSelectionModal && (
                <WindowSelectionModal
                    isOpen={showWindowSelectionModal}
                    windows={windows}
                    message={actionMessage}
                    selectedWindowId={selectedWindowId}
                    onSelect={setSelectedWindowId}
                    onAssign={handleAssignWindow}
                    onClose={() => setShowWindowSelectionModal(false)}
                />

            )}

            {/* later Window change modal */}
            {showWindowChangeModal && (
                <WindowSelectionModal
                    isOpen={showWindowChangeModal}
                    windows={windows}
                    message={actionMessage}
                    selectedWindowId={selectedWindowId}
                    onSelect={setSelectedWindowId}
                    onAssign={handleChangeWindow}
                    onClose={() => setShowWindowChangeSelectionModal(false)}
                />

            )}
            
        </div>
    );
};

export default MakerLayout;
