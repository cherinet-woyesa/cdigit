
import React, { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import type { DecodedToken } from "types/DecodedToken";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { HubConnectionBuilder } from '@microsoft/signalr';
import { faDoorOpen, faSpinner, faCheckCircle, faUserClock, faMoneyBillWave, faShuffle, faSackDollar, } from "@fortawesome/free-solid-svg-icons";
import makerService, { type CustomerQueueItem, type NextCustomerResponse, type TransactionType, } from "../../services/makerService";
import { useAuth } from "../../context/AuthContext";
import DenominationModal from "../../modals/DenominationModal";
import CurrentCustomerModal from "./CurrentCustomerModal";
import FormReferenceSearchModal from "./FormReferenceSearchModal";
import StatCard from "../../components/StatCard";
import CancelConfirmationModal from "../../modals/CancelConfirmationModal";
import type { ActionMessage } from "types/ActionMessage";
import type { WindowDto } from "../../types/WindowDto";



const statIconMap: Record<TransactionType, any> = {
    Deposit: faMoneyBillWave,
    Withdrawal: faSackDollar,
    FundTransfer: faShuffle,
};

// const MakerDashboard: React.FC = () => {



interface TransactionsProps {
    activeSection?: string;
    assignedWindow?: WindowDto | null;
}

const Transactions: React.FC<TransactionsProps> = ({ activeSection, assignedWindow }) => {

    //login session states
    const { token, logout } = useAuth();
    const [decoded, setDecoded] = useState<DecodedToken | null>(null);

    // Queue
    const [queue, setQueue] = useState<CustomerQueueItem[]>([]);
    const [loadingQueue, setLoadingQueue] = useState(false);
    const [queueError, setQueueError] = useState("");

    // New customer comming notify Modal state
    const [isQueueNotifyModalOpen, setIsQueueNotifyModalOpen] = useState(false);
    const [QueueNotifyModalMessage, setQueueNotifyModalMessage] = useState('');
    const [QueueNotifyModalTitle, setQueueNotifyModalTitle] = useState('');
    const [amount, setAmount] = useState('');

    // Current
    const [current, setCurrent] = useState<NextCustomerResponse | null>(null);
    const [busyAction, setBusyAction] = useState<"calling" | "completing" | "canceling" | null>(null);

    const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);
    const [showServices, setShowServices] = useState(false);


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

    /** Decode token */
    useEffect(() => {
        console.log("at transaction", assignedWindow)
        if (!token) return;
        try {
            const d = jwtDecode<DecodedToken>(token);
            setDecoded(d);
        } catch {
            logout();
        }
    }, [token, logout]);

    //save/Persist current customer to local storage
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

    //refresh total setved
    useEffect(() => {
        if (decoded?.nameid) void refreshTotalServed();
    }, [decoded?.nameid]);



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
                // assignedWindow.windowType, // pass window type
                token
            );
            console.log("callNextCustomer response at ui:", res);
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

        <div>
            {/* Stats */}
            <section className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-xs text-gray-500">Deposits</p>
                        <p className="text-lg font-bold text-fuchsia-700">{stats.Deposit}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Withdrawals</p>
                        <p className="text-lg font-bold text-fuchsia-700">{stats.Withdrawal}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Transfers</p>
                        <p className="text-lg font-bold text-fuchsia-700">{stats.FundTransfer}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Total in Queue</p>
                        <p className="text-lg font-bold text-gray-800">{stats.total}</p>
                    </div>
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
            <section className="flex gap-3 mt-6">
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
                {/* New Other Services Button */}
                <button
                    onClick={() => setShowServices((prev) => !prev)}
                    className="px-4 py-2 rounded-xl bg-fuchsia-600 text-white shadow hover:bg-fuchsia-700 transition"
                >
                    {showServices ? "Hide Services" : "Other Services"}
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
            <section className="w-fit mx-auto">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Total served by you (Today)
                </h3>
                <StatCard title="Total Served" value={totalServed} icon={faCheckCircle} bgColor="bg-fuchsia-600"
                    textColor="bg-fuchsia-100" />
            </section>



            {/* Cancel confirm */}
            <CancelConfirmationModal
                isOpen={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                onConfirm={async () => {
                    await handleCancel();
                    setShowCancelConfirm(false);
                }}
            />
            {/* )} */}

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

export default Transactions;




