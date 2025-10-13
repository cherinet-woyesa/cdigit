
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
import type { ActionMessage } from "types/ActionMessage";
import type { WindowDto } from "../../types/WindowDto";
import { SkeletonCard } from "../../components/Skeleton";



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
            if (res.success) {
                setQueue(res.data || []);
            } else {
                setQueue([]);
                setQueueError(res.message || "No customers in queue.");
            }
        } catch (error) {
            console.error('Queue refresh error:', error);
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



    // notify the comming of New customer with improved connection handling
    useEffect(() => {
        if (!decoded?.BranchId) return;

        let connection: any = null;
        
        const setupSignalR = async () => {
            try {
                // Setup SignalR connection
                connection = new HubConnectionBuilder()
                    .withUrl('http://localhost:5268/hub/queueHub')
                    .withAutomaticReconnect({
                        nextRetryDelayInMilliseconds: (retryContext) => {
                            if (retryContext.previousRetryCount >= 5) {
                                console.warn('Max SignalR reconnection attempts reached');
                                return null;
                            }
                            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
                        }
                    })
                    .build();

                // Connection state handlers
                connection.onreconnecting(() => {
                    console.log('SignalR reconnecting...');
                });

                connection.onreconnected(() => {
                    console.log('SignalR reconnected successfully');
                    // Rejoin group after reconnection
                    connection.invoke('JoinBranchCustomersQueueGroup', decoded.BranchId).catch(console.error);
                });

                connection.onclose(() => {
                    console.log('SignalR connection closed');
                });

                await connection.start();
                console.log('Connected to SignalR hub');

                // Join group with Branch id
                await connection.invoke('JoinBranchCustomersQueueGroup', decoded.BranchId);

                // Listen for messages
                connection.on('NewCustomer', (data: any) => {
                    console.log('New customer notification received:', data);
                    setQueueNotifyModalTitle(data.transactionType + " Request");
                    setQueueNotifyModalMessage(`${data.message} is coming, please ready to serve.`);
                    setAmount(`Amount: ETB ${Number(data.amount).toLocaleString()}`);
                    setIsQueueNotifyModalOpen(true);
                    void refreshQueue();
                });
            } catch (error) {
                console.error('SignalR connection failed:', error);
            }
        };

        setupSignalR();

        return () => {
            if (connection) {
                console.log('Cleaning up SignalR connection');
                connection.off('NewCustomer');
                connection.stop().catch((err: any) => console.warn('Error stopping SignalR:', err));
            }
        };
    }, [decoded?.BranchId]);



    /** Call next */
    const handleCallNext = async () => {
        if (!token || !decoded?.nameid || !assignedWindow?.id || !decoded?.BranchId)
            return;

        const stored = localStorage.getItem("currentCustomer");
        if (stored) {
            setCurrent(JSON.parse(stored));
            return; // already have On Progress current Customer
        }

        setBusyAction("calling");
        try {
            const res = await makerService.callNextCustomer(
                decoded.nameid,
                assignedWindow.id,
                decoded.BranchId,
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
        } catch (error) {
            console.error('Call next customer error:', error);
            setActionMessage({ type: 'error', content: "Failed to call next customer." });
        } finally {
            setBusyAction(null);
            setTimeout(() => setActionMessage(null), 4000);
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
            setActionMessage({ type: 'success', content: res.message || "Transaction completed successfully." });
            
            // Clear current customer
            setCurrent(null);
            localStorage.removeItem("currentCustomer");
            
            await refreshQueue();
            await refreshTotalServed();
        } catch {
            setActionMessage({ type: 'error', content: "Failed to complete." });
        } finally {
            setBusyAction(null);
            setTimeout(() => setActionMessage(null), 4000);
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
            setActionMessage({ type: 'success', content: res.message || "Transaction canceled successfully." });

            setCurrent(null);
            localStorage.removeItem("currentCustomer"); // clear

            await refreshQueue();
        } catch {
            setActionMessage({ type: 'error', content: "Failed to cancel." });
        } finally {
            setBusyAction(null);
            setTimeout(() => setActionMessage(null), 4000);
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
            {/* Action Message */}
            {actionMessage && (
                <div className={`rounded-lg p-4 mb-6 border-l-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
                    actionMessage.type === 'success' 
                        ? 'bg-green-50 border-green-500 text-green-800'
                        : actionMessage.type === 'error'
                        ? 'bg-red-50 border-red-500 text-red-800'
                        : actionMessage.type === 'warning'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'bg-blue-50 border-blue-500 text-blue-800'
                }`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                {actionMessage.type === 'success' && (
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {actionMessage.type === 'error' && (
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {actionMessage.type === 'warning' && (
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {actionMessage.type === 'info' && (
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <p className="text-sm font-medium">{actionMessage.content}</p>
                        </div>
                        <button
                            onClick={() => setActionMessage(null)}
                            className="flex-shrink-0 ml-4 p-1 hover:bg-black/5 rounded-lg transition-colors"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
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
                {loadingQueue ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, idx) => (
                            <SkeletonCard key={idx} />
                        ))}
                    </div>
                ) : queue.length === 0 ? (
                    <div className="bg-white rounded-xl p-6 text-center text-gray-500 shadow">
                        {queueError || "No customers in queue."}
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
        </div>

    );
};

export default Transactions;




