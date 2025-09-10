import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';

import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faDoorOpen,
    faSpinner,
    faCheckCircle,
    faUserClock,
    faMoneyBillWave,
    faShuffle,
    faSackDollar,
} from "@fortawesome/free-solid-svg-icons";

import makerService, {
    type CustomerQueueItem,
    type NextCustomerResponse,
    type TransactionType,
} from "../../services/makerService";

import { useAuth } from "../../context/AuthContext";
import DenominationModal from "../../modals/DenominationModal";
import CurrentCustomerModal from "./CurrentCustomerModal";
import FormReferenceSearchModal from "./FormReferenceSearchModal";
import WindowSelectionModal from "./WindowSelectionModal";
import { HubConnectionBuilder } from '@microsoft/signalr';
import QueueNotifyModal from "../../modals/QueueNotifyModal";

/** Token claims we need */
type DecodedToken = {
    BranchId: string;
    nameid: string; // makerId
    role?: string;
    unique_name?: string;
    email?: string;
    exp?: number;
    iss?: string;
    aud?: string;
};

type WindowDto = {
    id: string;
    branchId: string;
    windowNumber: number;
    description?: string | null;
};

type ActionMessage = {
    type: 'success' | 'error';
    content: string;
};

const statIconMap: Record<TransactionType, any> = {
    Deposit: faMoneyBillWave,
    Withdrawal: faSackDollar,
    FundTransfer: faShuffle,
};

const MakerDashboard: React.FC = () => {
    const { token, logout } = useAuth();
    const [decoded, setDecoded] = useState<DecodedToken | null>(null);

    // Windows
    const [assignedWindow, setAssignedWindow] = useState<WindowDto | null>(null);
    const [windows, setWindows] = useState<WindowDto[]>([]);
    const [showWindowSelectionModal, setShowWindowSelectionModal] = useState(false);
    const [showWindowChangeModal, setShowWindowChangeSelectionModal] = useState(false);

    const [selectedWindowId, setSelectedWindowId] = useState("");

    // Queue
    const [queue, setQueue] = useState<CustomerQueueItem[]>([]);
    const [loadingQueue, setLoadingQueue] = useState(false);
    const [queueError, setQueueError] = useState("");

    // Current
    const [current, setCurrent] = useState<NextCustomerResponse | null>(null);
    const [busyAction, setBusyAction] =
        useState<"calling" | "completing" | "canceling" | null>(null);
    // const [actionMessage, setActionMessage] = useState("");
    const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);


    // Served count
    const [totalServed, setTotalServed] = useState(0);

    // Modals
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showFormRefModal, setShowFormRefModal] = useState(false);
    const [showDenomModal, setShowDenomModal] = useState(false);
    const [denomForm, setDenomForm] = useState<{
        formReferenceId: string;
        amount: number;
    } | null>(null);
    //branch info
    const [branchName, setBranchName] = useState<string>("");

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
            void refreshQueue();
          });
        });
    
        return () => {
          connection.stop();
        };
      }, [decoded?.BranchId]);






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

    //save current customer to local storage
    // Persist current customer in localStorage
    useEffect(() => {
        if (current) {
            localStorage.setItem("currentCustomer", JSON.stringify(current));
        } else {
            // localStorage.removeItem("currentCustomer");
        }
    }, [current]);

    //Restore on refresh
    useEffect(() => {
        const stored = localStorage.getItem("currentCustomer");
        if (stored) {
            try {
                const parsed: NextCustomerResponse = JSON.parse(stored);
                setCurrent(parsed);
            } catch {
                localStorage.removeItem("currentCustomer");
            }
        }
    }, []);



    /** Refresh queue */
    const refreshQueue = async () => {
        if (!token || !decoded?.BranchId) return;
        setLoadingQueue(true);
        setQueueError("");
        try {
            const res = await makerService.getAllCustomersOnQueueByBranch(
                decoded.BranchId,
                token
            );
            if (res.success) setQueue(res.data || []);
            else {
                setQueue([]);
                setQueueError(res.message || "No customers in queue.");
            }
        } catch {
            setQueue([]);
            setQueueError("Failed to load queue.");
        } finally {
            setLoadingQueue(false);
        }
    };

    useEffect(() => {
        if (decoded?.BranchId) void refreshQueue();
    }, [decoded?.BranchId]);

    /** Stats */
    const stats = useMemo(() => {
        const totals = {
            Deposit: 0,
            Withdrawal: 0,
            FundTransfer: 0,
        } as Record<TransactionType, number>;
        queue.forEach((q) => {
            totals[q.transactionType as TransactionType] += 1;
        });
        return { ...totals, total: queue.length };
    }, [queue]);

    /** Refresh served */
    const refreshTotalServed = async () => {
        if (!token || !decoded?.nameid) return;
        try {
            const res = await makerService.getTotalServed(decoded.nameid, token);
            if (res.success && res.data != null) setTotalServed(res.data);
        } catch { }
    };

    useEffect(() => {
        if (decoded?.nameid) void refreshTotalServed();
    }, [decoded?.nameid]);

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


    /** Call next */
    const handleCallNext = async () => {
        if (!token || !decoded?.nameid || !assignedWindow?.id || !decoded?.BranchId)
            return;

        const stored = localStorage.getItem("currentCustomer");
        if (stored) {
            setCurrent(JSON.parse(stored));
            return;// already have On Progress current Customer
        }

        setBusyAction("calling");
        try {
            const res = await makerService.callNextCustomer(
                decoded.nameid,
                assignedWindow.id,
                decoded.BranchId,
                token
            );
            if (!res.success || !res.data) {
                setCurrent(null);
                setActionMessage({ type: 'error', content: res.message || "No customer in queue." });
                return;
            }
            setCurrent(res.data);
            setActionMessage({ type: 'success', content: res.message || "Customer called." });
            await refreshQueue();
            await refreshTotalServed();
        } catch {
            setActionMessage({ type: 'error', content: "Failed to call next." });

        } finally {
            setBusyAction(null);
            setTimeout(() => setActionMessage({ type: 'error', content: " " }), 4000);

        }
    };

    /** Complete */
    const handleComplete = async () => {

        if (!token || !current?.id) return;
        setBusyAction("completing");
        try {
            const res = await makerService.completeTransaction(current.id, token);
            if (!res.success) {
                setActionMessage({ type: 'error', content: res.message || "Failed to complete." });
                return;
            }
            setActionMessage({ type: 'success', content: res.message || "Completed." });
            // Wait for 1.5 seconds to allow flash/animation to be visible
            // await new Promise((resolve) => setTimeout(resolve, 1500));
            setCurrent(null);
            localStorage.removeItem("currentCustomer"); // clear
            await refreshQueue();
            await refreshTotalServed();
        } catch {
            setActionMessage({ type: 'error', content: "Failed to complete." });

        } finally {
            setBusyAction(null);
            setTimeout(() => setActionMessage({ type: 'error', content: "" }), 4000);
        }
    };


    /** Cancel */
    const handleCancel = async () => {
        if (!token || !current?.id) return;
        setBusyAction("canceling");
        try {
            const res = await makerService.cancelTransaction(current.id, token);
            if (!res.success) {
                setActionMessage({ type: 'error', content: res.message || "Failed to cancel." });
                return;
            }
            setActionMessage({ type: 'success', content: res.message || "Canceled." });

            setCurrent(null);
            localStorage.removeItem("currentCustomer"); // clear

            await refreshQueue();
        } catch {
            setActionMessage({ type: 'error', content: "Failed to cancel." });

        } finally {
            setBusyAction(null);
            setTimeout(() => setActionMessage({ type: 'error', content: "" }), 4000);
        }
    };

    /** Denoms */
    const openDenom = () => {
        if (!current) return;
        let amount = 0;
        if (current.transactionType === "Deposit") {
            amount = Number(
                current.amount ?? current.depositAmount ?? current.TransferAmount ?? 0
            );
        }
        setDenomForm({ formReferenceId: current.formReferenceId, amount });
        setShowDenomModal(true);
    };

    if (!token || !decoded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    className="text-purple-700 text-4xl"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
            {/* Header */}
            <header className="bg-purple-800 text-white py-5 px-6 shadow-lg sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold">Maker Dashboard</h1>
                        <p className="text-purple-100 text-sm">
                            Branch:{" "}
                            <span className="font-semibold">
                                {branchName || decoded.BranchId}
                            </span>
                            {assignedWindow && (
                                <span className="ml-3">
                                    • Window{" "}
                                    <span className="font-semibold">
                                        {assignedWindow.windowNumber}
                                    </span>
                                </span>
                            )}

                            <button
                                onClick={handleOpenChangeWindow}
                                className="ml-4 bg-purple-700 text-white font-semibold px-4 py-2 rounded-xl shadow hover:bg-purple-800 transition disabled:opacity-60"
                            >
                                {assignedWindow ? "Change Window" : "Select Window"}
                            </button>
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Alert */}
                {actionMessage?.content && (
                    <div className="bg-purple-50 border border-purple-200 text-purple-900 px-4 py-3 rounded-xl shadow-sm">
                        {actionMessage.content}
                    </div>
                )}

<QueueNotifyModal
        isOpen={isQueueNotifyModalOpen}
        onClose={() => setIsQueueNotifyModalOpen(false)}
        title={QueueNotifyModalTitle}
        message={QueueNotifyModalMessage}
        amount={amount}
      />
      
                {/* Stats */}
                <section>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            title="Deposits"
                            value={stats.Deposit}
                            icon={statIconMap.Deposit}
                            bgColor="bg-fuchsia-600"
                            textColor="bg-fuchsia-100"
                        />

                        <StatCard
                            title="Withdrawals"
                            value={stats.Withdrawal}
                            icon={statIconMap.Withdrawal}
                            bgColor="bg-fuchsia-600"
                            textColor="bg-fuchsia-100"
                        />
                        <StatCard
                            title="Transfers"
                            value={stats.FundTransfer}
                            icon={statIconMap.FundTransfer}
                            bgColor="bg-fuchsia-600"
                            textColor="bg-fuchsia-100"
                        />
                        <StatCard title="Total Requests" value={stats.total} icon={faUserClock} bgColor="bg-fuchsia-700"
                            textColor="bg-fuchsia-100" />
                    </div>
                </section>

                {/* Current customer modal */}
                <CurrentCustomerModal
                    isOpen={!!current}
                    current={current}
                    busyAction={busyAction}
                    onClose={() => setCurrent(null)}
                    onComplete={handleComplete}
                    onCancel={() => setShowCancelConfirm(true)}
                    onOpenDenom={openDenom}
                />

                {/* Actions */}
                <section className="flex gap-3">
                    <button
                        onClick={handleCallNext}
                        disabled={!assignedWindow || busyAction === "calling"}
                        className="bg-purple-700 text-white font-semibold px-4 py-2 rounded-xl shadow hover:bg-purple-800 transition disabled:opacity-60"
                    >
                        <FontAwesomeIcon icon={faDoorOpen} className="mr-2" />
                        {busyAction === "calling" ? "Calling…" : "Call Next"}
                    </button>

                    <button
                        onClick={() => setShowFormRefModal(true)}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white shadow hover:bg-blue-700 transition"
                    >
                        Search by Form Ref ID
                    </button>
                </section>

                {/* Queue */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Waiting Queue (Today)
                    </h3>
                    {queue.length === 0 ? (
                        <div className="bg-white rounded-xl p-6 text-center text-gray-500 shadow">
                            No customers in queue.
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

                            {queue.map((q) => (
                                <div
                                    key={q.id}
                                    // className="bg-fuchsia-300 rounded-xl shadow p-4 border border-gray-100 hover:shadow-md transition"
                                    className="rounded-xl shadow p-4 border border-gray-100 hover:shadow-md transition"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full ${q.transactionType === "Deposit"
                                                ? "bg-blue-50 text-blue-700"
                                                : q.transactionType === "Withdrawal"
                                                    ? "bg-amber-50 text-amber-700"
                                                    : "bg-purple-50 text-purple-700"
                                                }`}
                                        >
                                            {q.transactionType}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            Q#{q.queueNumber}
                                        </span>
                                    </div>
                                    <div className="font-semibold text-gray-800">
                                        {q.accountHolderName}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        ETB {Number(q.amount).toLocaleString()}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2">
                                        {new Date(q.submittedAt).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Served */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Total served by you (Today)
                    </h3>
                    <StatCard title="Total Served" value={totalServed} icon={faCheckCircle} bgColor="bg-fuchsia-600"
                        textColor="bg-fuchsia-100" />
                </section>
            </main>

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

            {/* Cancel confirm */}
            {showCancelConfirm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Are you sure?</h2>
                        <p className="text-gray-600 mb-4">
                            Do you really want to cancel this transaction? This action cannot
                            be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowCancelConfirm(false)}
                                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                            >
                                No, Keep
                            </button>
                            <button
                                onClick={async () => {
                                    await handleCancel();
                                    setShowCancelConfirm(false);
                                }}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                            >
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Denominations */}
            <DenominationModal
                isOpen={showDenomModal}
                onClose={() => setShowDenomModal(false)}
                onSave={() => { }}
                form={denomForm}
            />

            {/* Form Reference Modal */}
            <FormReferenceSearchModal
                isOpen={showFormRefModal}
                onClose={() => setShowFormRefModal(false)}
                token={token}
                onRefreshServed={refreshTotalServed}
            />
        </div>
    );
};

/** Stat card */
/** Stat card */
const StatCard = ({
    title,
    value,
    icon,
    bgColor, // default fallback
    textColor, // optional text color
}: {
    title: string;
    value: number;
    icon: any;
    bgColor?: string;
    textColor?: string;
}) => (
    <div
        className={`${bgColor} rounded-2xl shadow p-5 border border-gray-100 hover:shadow-md transition`}
    >
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-200 font-bold">{title}</p>
                <p className={`text-2xl text-gray-200 font-extrabold `}>{value}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/20">
                <FontAwesomeIcon icon={icon} className="text-white" />
            </div>
        </div>
    </div>
);


export default MakerDashboard;
