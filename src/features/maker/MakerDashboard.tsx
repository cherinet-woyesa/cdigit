import React, { useEffect, useMemo, useState } from 'react';
// import { jwtDecode } from 'jwt-decode';
import { jwtDecode } from "jwt-decode";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDoorOpen,
    faSpinner,
    faCheckCircle,
    faTimesCircle,
    faUserClock,
    faMoneyBillWave,
    faShuffle,
    faSackDollar,
} from '@fortawesome/free-solid-svg-icons';

import makerService, {
    type ApiResponse,
    type CustomerQueueItem,
    type NextCustomerResponse,
    type TransactionType,
} from '../../services/makerService';

import { useAuth } from '../../context/AuthContext';
import DenominationModal from '../../modals/DenominationModal';

/** Token claims we need */
type DecodedToken = {
    BranchId: string;
    nameid: string;        // makerId
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
    branchName?: string | null;
    branchCode?: string | null;
    windowNumber: number;
    description?: string | null;
    windowType?: string | null;
    status?: string | null;
    currentTellerId?: string | null;
    currentTellerFullName?: string | null;
    lastServedQueueNumber?: number;
    createdAt?: string;
    updatedAt?: string;
};

const statIconMap: Record<TransactionType, any> = {
    Deposit: faMoneyBillWave,
    Withdrawal: faSackDollar,
    FundTransfer: faShuffle,
};

const MakerDashboard: React.FC = () => {
    const { token, user, logout } = useAuth(); // assuming token is stored in context (as in your app)
    const [decoded, setDecoded] = useState<DecodedToken | null>(null);

    // Window selection
    const [assignedWindow, setAssignedWindow] = useState<WindowDto | null>(null);
    const [windows, setWindows] = useState<WindowDto[]>([]);
    const [showWindowModal, setShowWindowModal] = useState<boolean>(false);
    const [selectedWindowId, setSelectedWindowId] = useState<string>('');

    // Queue stats & list
    const [queue, setQueue] = useState<CustomerQueueItem[]>([]);
    const [loadingQueue, setLoadingQueue] = useState<boolean>(false);
    const [queueError, setQueueError] = useState<string>('');

    // Current serving
    const [current, setCurrent] = useState<NextCustomerResponse | null>(null);
    const [busyAction, setBusyAction] = useState<'calling' | 'completing' | 'canceling' | null>(null);
    const [actionMessage, setActionMessage] = useState<string>('');

    //total served
    const [totalServed, setTotalServed] = useState<number>(0);

    // confirm cancel
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    //search by form reference
    const [searchRefId, setSearchRefId] = useState("");
    const [searchResult, setSearchResult] = useState<NextCustomerResponse | null>(null);

    // Denomination modal (for deposits)
    const [showDenomModal, setShowDenomModal] = useState<boolean>(false);
    const [denomForm, setDenomForm] = useState<{ formReferenceId: string; amount: number } | null>(null);

    /** Decode token & bootstrap */
    useEffect(() => {
        if (!token) return;
        try {
            const d = jwtDecode<DecodedToken>(token);
            setDecoded(d);
        } catch {
            // invalid token → logout
            logout();
        }
    }, [token, logout]);

    /** Load assigned window; if none, force modal and load windows by branch */
    useEffect(() => {
        const initWindows = async () => {
    if (!token || !decoded?.nameid) return;

    try {
        const w = await makerService.getAssignedWindowForMaker(decoded.nameid, token);
        if (w && w.id) {
            setAssignedWindow(w);
            setShowWindowModal(false);
        } else if (decoded.BranchId) {
            const list = await makerService.getWindowsByBranchId(decoded.BranchId, token);
            if (Array.isArray(list)) {
                setWindows(list); // Ensure list is an array
            } else {
                console.error("Expected an array from getWindowsByBranchId", list);
                setWindows([]); // Set to empty array on error
            }
            setShowWindowModal(true);
        }
    } catch (e) {
        console.error("Error fetching windows:", e);
        if (decoded?.BranchId) {
            const list = await makerService.getWindowsByBranchId(decoded.BranchId, token);
            if (Array.isArray(list)) {
                setWindows(list); // Ensure list is an array
            } else {
                console.error("Expected an array from getWindowsByBranchId", list);
                setWindows([]); // Set to empty array on error
            }
            setShowWindowModal(true);
        }
    }
};
        if (decoded?.nameid) {
            void initWindows();
        }
    }, [decoded, token]);

    /** Load queue summary for stats cards */
    const refreshQueue = async () => {
        if (!token || !decoded?.BranchId) return;
        setLoadingQueue(true);
        setQueueError('');
        try {
            const res = await makerService.getAllCustomersOnQueueByBranch(decoded.BranchId, token);
            if (res.success) {
                setQueue(res.data || []);
            } else {
                setQueue([]);
                setQueueError(res.message || 'No customers in queue.');
            }
        } catch (err: any) {
            setQueue([]);
            setQueueError(err?.response?.data?.message || 'Failed to load queue.');
        } finally {
            setLoadingQueue(false);
        }
    };

    useEffect(() => {
        if (decoded?.BranchId) {
            void refreshQueue();
        }
    }, [decoded?.BranchId]); // eslint-disable-line react-hooks/exhaustive-deps

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
        const total = queue.length;
        return { ...totals, total };
    }, [queue]);

    //refesh total served count
    const refreshTotalServed = async () => {
        if (!token || !decoded?.nameid) return;
        try {
            const res = await makerService.getTotalServed(decoded.nameid, token);
            if (res.success && res.data != null) {
                setTotalServed(res.data);
            }
        } catch (err) {
            console.error("Failed to load total served:", err);
        }
    };

    // Fetch when component mounts & after serving a customer
    useEffect(() => {
        if (decoded?.nameid) {
            void refreshTotalServed();
        }
    }, [decoded?.nameid]);


    /** Assign window */
    const handleAssignWindow = async () => {
        if (!token || !decoded?.nameid || !selectedWindowId) return;
        try {
            const res = await makerService.assignMakerToWindow(selectedWindowId, decoded.nameid, token);
            setActionMessage(res.message || 'Assigned Successfully');
            // set assigned
            const found = windows.find((w) => w.id === selectedWindowId) || null;
            setAssignedWindow(found);
            setShowWindowModal(false);
        } catch (err: any) {
            setActionMessage(err?.response?.data?.message || 'Assignment failed.');
        } finally {
            setTimeout(() => setActionMessage(''), 4000);
        }
    };

    /** Call next */
    const handleCallNext = async () => {
        if (!token || !decoded?.nameid || !assignedWindow?.id || !decoded?.BranchId) return;
        setBusyAction('calling');
        setActionMessage('');
        try {
            const res = await makerService.callNextCustomer(decoded.nameid, assignedWindow.id, decoded.BranchId, token);
            console.log("Call next response data:", res);
            if (!res.success || !res.data) {
                setCurrent(null);
                setActionMessage(res.message || 'No customer in the queue.');
                return;
            }
            setCurrent(res.data);
            // refresh stats (one moved to OnProgress)
            await refreshQueue();
            await refreshTotalServed(); // refresh total served

        } catch (err: any) {
            setActionMessage(err?.response?.data?.message || 'Failed to call next.');
        } finally {
            setBusyAction(null);
            setTimeout(() => setActionMessage(''), 4000);
        }
    };

    /** Complete */
    const handleComplete = async () => {
        if (!token || !current?.id) return;
        setBusyAction('completing');
        setActionMessage('');
        try {
            const res = await makerService.completeTransaction(current.id, token);
            setActionMessage(res.message || 'Completed.');
            setCurrent(null);
            await refreshQueue();
            await refreshTotalServed(); // refresh total served

        } catch (err: any) {
            setActionMessage(err?.response?.data?.message || 'Failed to complete.');
        } finally {
            setBusyAction(null);
            setTimeout(() => setActionMessage(''), 4000);
        }
    };

    /** Cancel */
    const handleCancel = async () => {
        if (!token || !current?.id) return;
        setBusyAction('canceling');
        setActionMessage('');
        try {
            const res = await makerService.cancelTransaction(current.id, token);
            setActionMessage(res.message || 'Canceled.');
            setCurrent(null);
            await refreshQueue();
        } catch (err: any) {
            setActionMessage(err?.response?.data?.message || 'Failed to cancel.');
        } finally {
            setBusyAction(null);
            setTimeout(() => setActionMessage(''), 4000);
        }
    };


    const handleSearch = async () => {
        if (!searchRefId) return;
        try {
            const token = localStorage.getItem("token")!;
            const res = await makerService.searchCustomerByFormReferenceId(searchRefId, token);
            if (res.success && res.data) {
                setSearchResult(res.data);
            } else {
                alert(res.message || "Customer not found");
                setSearchResult(null);
            }
        } catch (err) {
            console.error(err);
            alert("Error searching customer");
        }
    };



    /** Denominations (Deposit only) */
    const openDenom = () => {
        if (!current) return;
        // for deposits, use amount = transferAmount? withdrawal? deposit?
        let amount = 0;
        if (current.transactionType === 'Deposit') {
            amount = Number(current.amount ?? current.depositAmount ?? current.TransferAmount ?? 0);
        }
        setDenomForm({ formReferenceId: current.formReferenceId, amount });
        setShowDenomModal(true);
    };

    /** RENDER */
    if (!token || !decoded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <FontAwesomeIcon icon={faSpinner} spin className="text-fuchsia-700 text-3xl" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#faf6fe]">
            {/* Header */}
            <header className="bg-fuchsia-700 text-white py-5 px-6 shadow-lg sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-wide">Maker Dashboard</h1>
                        <p className="text-white/80 text-sm">
                            Branch: <span className="font-semibold">{decoded.BranchId}</span>
                            {assignedWindow && (
                                <span className="ml-3">
                                    • Window <span className="font-semibold">{assignedWindow.windowNumber}</span>
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={handleCallNext}
                        disabled={!assignedWindow || busyAction === 'calling'}
                        className="bg-white text-fuchsia-700 font-semibold px-4 py-2 rounded-xl shadow hover:bg-white/90 disabled:opacity-60 flex items-center"
                    >
                        <FontAwesomeIcon icon={faDoorOpen} className="mr-2" />
                        {busyAction === 'calling' ? 'Calling…' : 'Call Next'}
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Alert / Action message */}
                {actionMessage && (
                    <div className="bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-900 px-4 py-3 rounded-xl">
                        {actionMessage}
                    </div>
                )}

                {/* Stats Cards */}
                <section>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard title="Deposits" value={stats.Deposit} icon={statIconMap.Deposit} />
                        <StatCard title="Withdrawals" value={stats.Withdrawal} icon={statIconMap.Withdrawal} />
                        <StatCard title="Transfers" value={stats.FundTransfer} icon={statIconMap.FundTransfer} />
                        <StatCard title="Total Requests" value={stats.total} icon={faUserClock} />

                    </div>
                    {loadingQueue && (
                        <div className="mt-3 text-sm text-gray-500 flex items-center">
                            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> refreshing…
                        </div>
                    )}
                    {queueError && !loadingQueue && (
                        <div className="mt-3 text-sm text-red-600">{queueError}</div>
                    )}
                </section>

                {/* Current Customer Panel */}
                <section className="bg-white rounded-2xl shadow p-6">
                    {!current ? (
                        <div className="text-center text-gray-500 py-8">
                            <p className="text-lg">No active customer. Click <span className="font-semibold">Call Next</span> to start.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        Serving: {current.accountHolderName || 'Customer'}
                                    </h2>
                                    <p className="text-gray-500">
                                        Queue No: <span className="font-semibold">{current.queueNumber}</span> • Type:{' '}
                                        <span className="font-semibold">{current.transactionType}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    {current.tokenNumber && (
                                        <p className="text-gray-500">Token: <span className="font-mono">{current.tokenNumber}</span></p>
                                    )}
                                    <p className="text-gray-500">
                                        Form Ref: <span className="font-mono">{current.formReferenceId}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="grid md:grid-cols-3 gap-4">
                                {current.accountNumber && (
                                    <InfoTile label="Account Number" value={String(current.accountNumber)} />
                                )}
                                {current.sourceAccountNumber && (
                                    <InfoTile label="Source Account" value={String(current.sourceAccountNumber)} />
                                )}
                                {current.destinationAccountNumber && (
                                    <InfoTile label="Destination Account" value={String(current.destinationAccountNumber)} />
                                )}

                                {/* Amounts by type */}
                                {current.transactionType === 'Deposit' && (
                                    <InfoTile label="Amount" value={String(current.amount ?? current.depositAmount ?? 0)} />
                                )}
                                {current.transactionType === 'Withdrawal' && (
                                    <InfoTile
                                        label="Withdrawal Amount"
                                        value={String(current.withdrawal_Amount ?? current.withdrawa_Amount ?? 0)}
                                    />
                                )}
                                {current.transactionType === 'FundTransfer' && (
                                    <InfoTile label="Transfer Amount" value={String(current.transferAmount ?? 0)} />
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-3 pt-2">
                                {current.transactionType === 'Deposit' && (
                                    <button
                                        onClick={openDenom}
                                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        Update Denominations
                                    </button>
                                )}

                                <button
                                    onClick={handleComplete}
                                    disabled={busyAction === 'completing'}
                                    className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 flex items-center"
                                >
                                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                                    {busyAction === 'completing' ? 'Completing…' : 'Complete'}
                                </button>

                                {/* <button
                                    onClick={handleCancel}
                                    disabled={busyAction === 'canceling'}
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 flex items-center"
                                >
                                    <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
                                    {busyAction === 'canceling' ? 'Canceling…' : 'Cancel'}
                                </button> */}


                                <button
                                    onClick={() => setShowCancelConfirm(true)}
                                    disabled={busyAction === 'canceling'}
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 flex items-center"
                                >
                                    <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
                                    {busyAction === 'canceling' ? 'Canceling…' : 'Cancel'}
                                </button>


                            </div>
                        </div>
                    )}
                </section>
                {/* Search by Form Reference ID */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Search By Form reference Id: </h3>
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                        <h3 className="font-semibold text-gray-700 mb-2">Search by Form Reference ID</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={searchRefId}
                                onChange={(e) => setSearchRefId(e.target.value)}
                                placeholder="Enter Form Reference ID"
                                className="flex-1 border px-3 py-2 rounded-lg"
                            />
                            <button
                                onClick={handleSearch}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Search
                            </button>
                        </div>

                        {searchResult && (
                            <div className="mt-4 p-3 border rounded-lg bg-white shadow">
                                <p><strong>Type:</strong> {searchResult.transactionType}</p>
                                <p><strong>Ref:</strong> {searchResult.formReferenceId}</p>
                                <p><strong>Customer:</strong> {searchResult.accountHolderName}</p>
                                <p><strong>Amount:</strong> {searchResult.amount}</p>

                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => {
                                            makerService.completeTransaction(searchResult.id, token)
                                            setSearchResult(null);
                                            setSearchRefId('');
                                            refreshTotalServed(); // refresh total served
                                        }
                                        }
                                        className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                                    >
                                        Complete
                                    </button>
                                    <button
                                        onClick={() => {
                                            makerService.cancelTransaction(searchResult.id, token);
                                            setSearchResult(null);
                                            setSearchRefId('');

                                        }}
                                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Queue Preview (today, still on queue) */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Waiting Queue (Today)</h3>
                    {queue.length === 0 ? (
                        <div className="bg-white rounded-xl p-6 text-center text-gray-500 shadow">
                            No customers in queue.
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {queue.map((q) => (
                                <div key={q.id} className="bg-white rounded-xl shadow p-4 border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full ${q.transactionType === 'Deposit'
                                                ? 'bg-blue-50 text-blue-700'
                                                : q.transactionType === 'Withdrawal'
                                                    ? 'bg-amber-50 text-amber-700'
                                                    : 'bg-purple-50 text-purple-700'
                                                }`}
                                        >
                                            {q.transactionType}
                                        </span>
                                        <span className="text-sm text-gray-500">Q#{q.queueNumber}</span>
                                    </div>
                                    <div className="font-semibold text-gray-800">{q.accountHolderName}</div>
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

                <section>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Total served by you: (Today)</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard title="Total Served" value={totalServed} icon={faCheckCircle} />
                    </div>
                </section>
            </main>

            {/* Window selection modal */}
            {showWindowModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-2">Select Your Window</h2>
                        <p className="text-gray-500 mb-4">
                            Choose an available window to start serving customers.
                        </p>

                        <select
                            className="w-full border rounded-lg p-2 mb-4"
                            value={selectedWindowId}
                            onChange={(e) => setSelectedWindowId(e.target.value)}
                        >
                            <option value="">-- Choose a window --</option>
                            {windows.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {`Window ${w.windowNumber} — ${w.description || 'Transaction'}`}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={handleAssignWindow}
                            disabled={!selectedWindowId}
                            className="w-full bg-fuchsia-700 text-white py-2 rounded-lg hover:bg-fuchsia-800 disabled:opacity-60"
                        >
                            Assign & Continue
                        </button>

                        {actionMessage && (
                            <div className="mt-3 text-sm text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-200 rounded-lg px-3 py-2">
                                {actionMessage}
                            </div>
                        )}
                    </div>
                </div>
            )}


            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Are you sure?</h2>
                        <p className="text-gray-600 mb-4">
                            Do you really want to cancel this transaction? This action cannot be undone.
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


            {/* Denominations Modal (your existing component) */}
            <DenominationModal
                isOpen={showDenomModal}
                onClose={() => setShowDenomModal(false)}
                onSave={() => {
                    // After saving denominations, nothing else needed immediately
                }}
                form={denomForm}
            />
        </div>
    );
};

/** Small helper components */
const StatCard = ({ title, value, icon }: { title: string; value: number; icon: any }) => (
    <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-extrabold text-gray-800">{value}</p>
            </div>
            <div className="p-3 rounded-xl bg-fuchsia-50">
                <FontAwesomeIcon icon={icon} className="text-fuchsia-700" />
            </div>
        </div>
    </div>
);

const InfoTile = ({ label, value }: { label: string; value: string }) => (
    <div className="bg-gray-50 rounded-xl p-4">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="font-semibold text-gray-800 break-all">{value}</div>
    </div>
);

export default MakerDashboard;