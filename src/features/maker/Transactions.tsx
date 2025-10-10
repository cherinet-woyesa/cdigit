
import React, { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import type { DecodedToken } from "types/DecodedToken";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { HubConnectionBuilder } from '@microsoft/signalr';
import { faDoorOpen, faSpinner, faCheckCircle, faUserClock, faMoneyBillWave, faShuffle, faSackDollar, } from "@fortawesome/free-solid-svg-icons";
import { ClockIcon } from "@heroicons/react/24/outline";
import makerService, { type CustomerQueueItem, type NextCustomerResponse, type TransactionType, } from "../../services/makerService";
import { useAuth } from "../../context/AuthContext";
import DenominationModal from "../../modals/DenominationModal";
import CurrentCustomerModal from "./CurrentCustomerModal";
import FormReferenceSearchModal from "./FormReferenceSearchModal";
import StatCard from "../../components/StatCard";
import CancelConfirmationModal from "../../modals/CancelConfirmationModal";
import QueueNotificationModal from "../../modals/QueueNotificationModal";
import FeedbackModal from "../../modals/FeedbackModal";
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
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [completedTransaction, setCompletedTransaction] = useState<NextCustomerResponse | null>(null);

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
            
            // Store completed transaction for feedback
            setCompletedTransaction(current);
            
            // Clear current customer
            setCurrent(null);
            localStorage.removeItem("currentCustomer"); // clear
            
            await refreshQueue();
            await refreshTotalServed();
            
            // Show feedback modal after a short delay
            setTimeout(() => {
                setShowFeedbackModal(true);
            }, 500);
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

        <div className="space-y-6">
            {/* Stats */}
            <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-fuchsia-700 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-gray-900">Queue Statistics</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-600 font-medium mb-1">Deposits</p>
                        <p className="text-2xl font-bold text-blue-700">{stats.Deposit}</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-100">
                        <p className="text-xs text-amber-600 font-medium mb-1">Withdrawals</p>
                        <p className="text-2xl font-bold text-amber-700">{stats.Withdrawal}</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <p className="text-xs text-purple-600 font-medium mb-1">Transfers</p>
                        <p className="text-2xl font-bold text-purple-700">{stats.FundTransfer}</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 font-medium mb-1">Total in Queue</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
            <section className="flex flex-wrap gap-3">
                <button
                    onClick={handleCallNext}
                    disabled={!assignedWindow || busyAction === "calling"}
                    className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold px-6 py-3 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <FontAwesomeIcon icon={faDoorOpen} />
                    {busyAction === "calling" ? "Calling…" : "Call Next Customer"}
                </button>

                <button
                    onClick={() => setShowFormRefModal(true)}
                    className="px-6 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm transition-all font-medium"
                >
                    Search by Form Ref ID
                </button>
                
                <button
                    onClick={() => setShowServices((prev) => !prev)}
                    className="px-6 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm transition-all font-medium"
                >
                    {showServices ? "Hide Services" : "Other Services"}
                </button>
            </section>

            {/* Queue */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-6 bg-fuchsia-700 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Waiting Queue (Today)
                    </h3>
                </div>
                {queue.length === 0 ? (
                    <div className="bg-white rounded-xl p-6 text-center text-gray-500 shadow">
                        No customers in queue.
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {queue.map((q) => (
                            <div
                                key={q.id}
                                className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span
                                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                            q.transactionType === "Deposit"
                                                ? "bg-blue-100 text-blue-700"
                                                : q.transactionType === "Withdrawal"
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-purple-100 text-purple-700"
                                        }`}
                                    >
                                        {q.transactionType}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        Q#{q.queueNumber}
                                    </span>
                                </div>
                                <div className="font-semibold text-gray-900 mb-2">
                                    {q.accountHolderName}
                                </div>
                                <div className="text-sm text-gray-600 mb-3">
                                    ETB {Number(q.amount).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <ClockIcon className="h-3 w-3" />
                                    {new Date(q.submittedAt).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Served */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-fuchsia-700 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-gray-900">
                        Your Performance Today
                    </h3>
                </div>
                <div className="flex items-center justify-center">
                    <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-3xl mb-3" />
                        <p className="text-sm text-green-600 font-medium mb-1">Total Served</p>
                        <p className="text-4xl font-bold text-green-700">{totalServed}</p>
                    </div>
                </div>
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

            {/* Queue Notification Modal */}
            <QueueNotificationModal
                isOpen={isQueueNotifyModalOpen}
                onClose={() => setIsQueueNotifyModalOpen(false)}
                title={QueueNotifyModalTitle}
                message={QueueNotifyModalMessage}
                amount={amount}
            />

            {/* Feedback Modal */}
            {completedTransaction && (
                <FeedbackModal
                    isOpen={showFeedbackModal}
                    onClose={() => {
                        setShowFeedbackModal(false);
                        setCompletedTransaction(null);
                    }}
                    customerId={completedTransaction.accountHolderName}
                    makerId={decoded?.nameid || ''}
                    branchId={decoded?.BranchId || ''}
                    transactionId={completedTransaction.id}
                    token={token}
                />
            )}
        </div>

    );
};

export default Transactions;




