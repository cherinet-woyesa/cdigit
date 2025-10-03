import React, { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDoorOpen, faSpinner, faCheckCircle, faUserClock, faMoneyBillWave, faShuffle, faSackDollar, } from "@fortawesome/free-solid-svg-icons";
import makerService, { type CustomerQueueItem, type NextCustomerResponse, type TransactionType, } from "../../services/makerService";
import { useAuth } from "../../context/AuthContext";
import DenominationModal from "../../modals/DenominationModal";
import CurrentCustomerModal from "./CurrentCustomerModal";
import FormReferenceSearchModal from "./FormReferenceSearchModal";
import { HubConnectionBuilder } from '@microsoft/signalr';
import QueueNotifyModal from "../../modals/QueueNotifyModal";
import pettyCashMakerService from "../../services/pettyCashMakerService";
import PettyDenominationModal from "../../modals/PettyDenominationModal";
import ForeignCurrencyModal from "../../modals/ForeignCurrencyModal";
import type { InitialRequestDto } from "types/PettyCash/InitialRequestDto";
import type { PettyCashFormResponseDto } from "types/PettyCash/PettyCashFormResponseDto"
import StatCard from "../../components/StatCard";
import CancelConfirmationModal from "../../modals/CancelConfirmationModal";
import type { DecodedToken } from "types/DecodedToken";
import type { ActionMessage } from "types/ActionMessage";
import type { WindowDto } from "types/WindowDto";

const statIconMap: Record<TransactionType, any> = {
    Deposit: faMoneyBillWave,
    Withdrawal: faSackDollar,
    FundTransfer: faShuffle,
};

// const MakerDashboard: React.FC = () => {
type Props = {
    activeSection?: string;
    assignedWindow?: WindowDto;

};

const MakerDashboard: React.FC<Props> = ({ activeSection, assignedWindow }) => {

    const { token, logout } = useAuth();
    const [decoded, setDecoded] = useState<DecodedToken | null>(null);



    // Queue

    const [queue, setQueue] = useState<CustomerQueueItem[]>([]);
    const [loadingQueue, setLoadingQueue] = useState(false);
    const [queueError, setQueueError] = useState("");


    //petty cash related states
    const [showPettyModal, setShowPettyModal] = useState(false);
    const [showForeignModal, setShowForeignModal] = useState<boolean>(false);
    const [foreignDenomForm, setForeignDenomForm] = useState<{ makerId: string; formId: string } | null>(null);


    const [pettyCashData, setPettyCashData] = useState<PettyCashFormResponseDto | null>(null);


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


    const [branchName, setBranchName] = useState<string>("");

    // New customer comming notify Modal state
    const [isQueueNotifyModalOpen, setIsQueueNotifyModalOpen] = useState(false);
    const [QueueNotifyModalMessage, setQueueNotifyModalMessage] = useState('');
    const [QueueNotifyModalTitle, setQueueNotifyModalTitle] = useState('');
    const [amount, setAmount] = useState('');

    // inside MakerDashboard component state
    const [showServices, setShowServices] = useState(false);

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

    // fetching petty cash data
    useEffect(() => {
        const fetchFormData = async () => {
            console.log("get petty Cash Called");
            if (!token || !decoded?.nameid) return;

            try {
                const response = await pettyCashMakerService.getByFrontMaker(decoded?.nameid, decoded?.BranchId, token);
                setPettyCashData(response.data as PettyCashFormResponseDto | null);

            } catch (err) {
                // setError('Failed to fetch data.');
                console.error(err);
            } finally {
                // setLoading(false);
            }
        };

        fetchFormData();
    }, [decoded?.nameid, decoded?.BranchId]);




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

    // --- Petty Cash Handlers ---
    const handlePettyAction = async (
        action: keyof typeof pettyCashMakerService,
        dto?: object
    ) => {
        if (!token || !decoded?.nameid) return;

        try {
            // @ts-ignore dynamic service call
            const res = await pettyCashMakerService[action](decoded.nameid, dto || {}, token);

            if (res.success) {
                setActionMessage({ type: "success", content: res.message || "Success" });
            } else {
                setActionMessage({ type: "error", content: res.message || "Failed" });
            }
        } catch (err) {
            console.error("PettyCash error:", err);
            setActionMessage({ type: "error", content: "Something went wrong." });
        } finally {
            setTimeout(() => setActionMessage(null), 4000);
        }
    };
    const handleInitialRequest = async () => {
        if (!token || !decoded) return;
        const dto: InitialRequestDto = {
            FrontMakerId: decoded.nameid,
            BranchId: decoded.BranchId
        };

        try {
            const response = await pettyCashMakerService.requestInitial(dto, token);
            console.log("Response from initial request:", response);
            // Handle the response as needed
        } catch (error) {
            console.error("Error making initial request:", error);
            // Handle the error as needed
        }
    };

    const handleOpenForeignModal = (makerId: string, formId: string) => {
        setForeignDenomForm({ makerId, formId });
        setShowForeignModal(true);
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

                {activeSection === "transactions" && (
                    // your transactions UI (queue, call next, current modal...)
                    <div>
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


                    </div>
                )}



                {activeSection === "other" && (
                    // your "Other Services" section

                    <section className="mt-6 animate-fadeIn">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Other Services</h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { title: "Account Opening Request", color: "from-purple-500 to-fuchsia-600" },
                                { title: "CBE Birr Requests", color: "from-indigo-500 to-purple-600" },
                                { title: "E-Banking Request", color: "from-pink-500 to-purple-600" },
                            ].map((service, idx) => (
                                <div
                                    key={idx}
                                    className={`rounded-2xl shadow-lg p-6 text-white cursor-pointer bg-gradient-to-br ${service.color} transform transition hover:scale-105 hover:shadow-2xl`}
                                >
                                    <h4 className="text-xl font-bold mb-2">{service.title}</h4>
                                    <p className="text-sm text-white/80">
                                        Manage and process {service.title.toLowerCase()} here.
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}


                {/* Toggle Petty Cash Services */}


                {activeSection === "petty" && (
                    // your Petty Cash Services section

                    <section className="mt-6 animate-fadeIn">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Petty Cash Actions</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <button
                                onClick={() => handleInitialRequest()}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700"
                            >
                                Request Initial
                            </button>
                            <button
                                onClick={() => handlePettyAction("approveReceipt")}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700"
                            >
                                Approve Initial Receipt
                            </button>
                            <button
                                onClick={() => handlePettyAction("requestAdditional")}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700"
                            >
                                Request Additional
                            </button>
                            <button
                                onClick={() => handlePettyAction("approveAdditionalReceipt")}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700"
                            >
                                Approve Additional Receipt
                            </button>
                            <button
                                onClick={() => handlePettyAction("surrenderInitial")}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700"
                            >
                                Surrender Initial
                            </button>
                            <button
                                onClick={() => handlePettyAction("surrenderAdditional")}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700"
                            >
                                Surrender Additional
                            </button>

                            {/* Submit Petty Cash -> open modal */}
                            <button
                                onClick={() => {
                                    setShowPettyModal(true);
                                }}
                                className="bg-emerald-700 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-800"
                            >
                                Submit Petty Cash
                            </button>

                            {/* Submit Foreign Currency -> open modal */}
                            <button onClick={() => handleOpenForeignModal(pettyCashData?.frontMakerId || '', pettyCashData?.id || '')} className="bg-teal-700 text-white px-4 py-2 rounded-lg shadow hover:bg-teal-800"
                            >
                                Submit Foreign Currency
                            </button>
                        </div>
                    </section>
                )}

                {/* {activeSection === "performance" && (
   // served stats, performance, ratings...
)}

                {activeSection === "settings" && (
   // change window, maybe profile, etc.
)} */}


            </main>



            {/* Petty Cash Modal */}

            <PettyDenominationModal
                isOpen={showPettyModal}

                onClose={() => setShowPettyModal(false)}
                onSave={() => { }}
                form={denomForm}
            />
            <ForeignCurrencyModal
                isOpen={showForeignModal}
                onClose={() => setShowForeignModal(false)}
                onSave={() => { }}
                form={foreignDenomForm}
            />


            {/* Cancel confirm */}
            {showCancelConfirm && (
                <CancelConfirmationModal
                    isOpen={showCancelConfirm}
                    onClose={() => setShowCancelConfirm(false)}
                    onConfirm={async () => {
                        await handleCancel();
                        setShowCancelConfirm(false);
                    }}
                />
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


export default MakerDashboard;
