import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../../context/AuthContext";
import pettyCashMakerService from "../../services/pettyCashMakerService";
import ForeignCurrencyModal from "../../modals/ForeignCurrencyModal";
import PettyDenominationModal from "../../modals/PettyDenominationModal";
import type { ActionMessage } from "../../types/ActionMessage";
import type { DecodedToken } from "../../types/DecodedToken";
import type { InitialRequestDto } from "../../types/PettyCash/InitialRequestDto";
import type { PettyCashFormResponseDto } from "../../types/PettyCash/PettyCashFormResponseDto";
import PettySurrenderModal from "../../modals/PettySurrenderModal";


const PettyCash: React.FC = () => {
    const { token, logout } = useAuth();
    const [decoded, setDecoded] = useState<DecodedToken | null>(null);
    const [pettyCashData, setPettyCashData] = useState<PettyCashFormResponseDto | null>(null);
    const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);

    // Modals
    const [showPettyModal, setShowPettyModal] = useState(false);
    const [showForeignModal, setShowForeignModal] = useState(false);
    const [foreignDenomForm, setForeignDenomForm] = useState<{ makerId: string; formId: string } | null>(null);
    const [pettyDenomForm, setPettyDenomForm] = useState<{ makerId: string; formId: string } | null>(null);

    const [showInitialSurrenderModal, setShowInitialSurrenderModal] = useState(false);
    const [showAdditionalSurrenderModal, setShowAdditionalSurrenderModal] = useState(false);


    // Decode token
    useEffect(() => {
        if (!token) return;
        try {
            const d = jwtDecode<DecodedToken>(token);
            setDecoded(d);
        } catch {
            logout();
        }
    }, [token, logout]);

    // Fetch petty cash data
    useEffect(() => {
        const fetchFormData = async () => {
            if (!token || !decoded?.nameid) return;
            try {
                const response = await pettyCashMakerService.getByFrontMaker(decoded.nameid, decoded.BranchId, token);
                setPettyCashData(response.data as PettyCashFormResponseDto);
            } catch (err) {
                console.error("Failed to fetch petty cash data", err);
            }
        };
        fetchFormData();
    }, [decoded?.nameid, decoded?.BranchId, token]);

    // Helper to show feedback messages
    const showMessage = (type: "success" | "error", content: string) => {
        setActionMessage({ type, content });
        setTimeout(() => setActionMessage(null), 4000);
    };

    // --- Individual Action Handlers ---

    const handleInitialRequest = async () => {
        if (!token || !decoded) return;
        const dto: InitialRequestDto = {
            FrontMakerId: decoded.nameid,
            BranchId: decoded.BranchId,
        };
        try {
            const res = await pettyCashMakerService.requestInitial(dto, token);
            showMessage(res.success ? "success" : "error", res.message || "Initial request failed");
        } catch (err) {
            console.error("Initial request error:", err);
            showMessage("error", "Error requesting initial petty cash.");
        }
    };

    const handleApproveReceipt = async () => {
        if (!token || !decoded || !pettyCashData) return;
        try {
            const res = await pettyCashMakerService.approveReceipt(decoded.nameid, pettyCashData.id, token);
            showMessage(res.success ? "success" : "error", res.message || "Failed to approve receipt");
        } catch (err) {
            console.error("Approve receipt error:", err);
            showMessage("error", "Error approving receipt.");
        }
    };

    const handleRequestAdditional = async () => {
        if (!token || !decoded || !pettyCashData) return;
        try {
            const res = await pettyCashMakerService.requestAdditional(pettyCashData.id, token);
            showMessage(res.success ? "success" : "error", res.message || "Failed to request additional cash");
        } catch (err) {
            console.error("Request additional error:", err);
            showMessage("error", "Error requesting additional petty cash.");
        }
    };

    const handleApproveAdditionalReceipt = async () => {
        if (!token || !decoded || !pettyCashData) return;
        try {
            const res = await pettyCashMakerService.approveAdditionalReceipt(decoded.nameid, pettyCashData.id, token);
            showMessage(res.success ? "success" : "error", res.message || "Failed to approve additional receipt");
        } catch (err) {
            console.error("Approve additional receipt error:", err);
            showMessage("error", "Error approving additional receipt.");
        }
    };

    // const handleSurrenderInitial = async () => {
    //     if (!token || !decoded || !pettyCashData) return;
    //     try {
    //         const res = await pettyCashMakerService.surrenderInitial(decoded.nameid, token);
    //         showMessage(res.success ? "success" : "error", res.message || "Failed to surrender initial cash");
    //     } catch (err) {
    //         console.error("Surrender initial error:", err);
    //         showMessage("error", "Error surrendering initial petty cash.");
    //     }
    // };

    // const handleSurrenderAdditional = async () => {
    //     if (!token || !decoded || !pettyCashData) return;
    //     try {
    //         const res = await pettyCashMakerService.surrenderAdditional(decoded.nameid, token);
    //         showMessage(res.success ? "success" : "error", res.message || "Failed to surrender additional cash");
    //     } catch (err) {
    //         console.error("Surrender additional error:", err);
    //         showMessage("error", "Error surrendering additional petty cash.");
    //     }
    // };

    // Open Modals
    const handleOpenForeignModal = (makerId: string, formId: string) => {
        setForeignDenomForm({ makerId, formId });
        setShowForeignModal(true);
    };

    const handleOpenPettyDenomModal = (makerId: string, formId: string) => {
        setPettyDenomForm({ makerId, formId });
        setShowPettyModal(true);
    };

    // --- UI ---
    return (
        <section className="mt-6 animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Petty Cash Actions</h3>
            {actionMessage && (
                <div
                    className={`p-2 mb-3 rounded-lg text-white ${actionMessage.type === "success" ? "bg-green-600" : "bg-red-600"
                        }`}
                >
                    {actionMessage.content}
                </div>
            )}


            {/* ✅ Petty Cash Data Summary Section */}


            {pettyCashData ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6 shadow-sm">
                    <h4 className="font-semibold text-gray-700 mb-4">💰 Current Petty Cash Summary</h4>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-y-3 text-sm text-gray-800">
                        {/* Identifiers */}
                        <p><span className="font-medium text-gray-600">Form Reference:</span> {pettyCashData.formReferenceId}</p>
                        {/* <p><span className="font-medium text-gray-600">Form ID:</span> {pettyCashData.id}</p>
                        <p><span className="font-medium text-gray-600">Status:</span> {pettyCashData.status}</p> */}

                        {/* User & Branch Info */}
                        <p><span className="font-medium text-gray-600">Front Maker:</span> {pettyCashData.frontMakerName || decoded?.unique_name}</p>
                        {/* <p><span className="font-medium text-gray-600">Vault Manager:</span> {pettyCashData.voultManagerName || "—"}</p> */}
                        <p><span className="font-medium text-gray-600">Branch:</span> {pettyCashData.branchName || decoded?.BranchId}</p>

                        {/* Maker Requests */}
                        <p><span className="font-medium text-gray-600">Initial Request:</span> {pettyCashData.makerRequestInitial ? "✅ Yes" : "❌ No"}</p>
                        <p><span className="font-medium text-gray-600">Additional Request:</span> {pettyCashData.makerRequestAdditional ? "✅ Yes" : "❌ No"}</p>
                        <p><span className="font-medium text-gray-600">Additional Surrender Request:</span> {pettyCashData.makerRequestAdditionalSurrender ? "✅ Yes" : "❌ No"}</p>

                        {/* Vault Actions */}
                        <p><span className="font-medium text-gray-600">Cash Received from Vault:</span> {pettyCashData.cashReceivedFromVault.toFixed(2)}</p>
                        <p><span className="font-medium text-gray-600">Cash Surrendered to Vault:</span> {pettyCashData.cashSurrenderedToVault.toFixed(2)}</p>
                        <p><span className="font-medium text-gray-600">Initial Approved by Vault Mgr:</span> {pettyCashData.initialApprovalByVManager ? "✅" : "❌"}</p>

                        {/* Additional Cash Flow */}
                        <p><span className="font-medium text-gray-600">Additional Received from Vault:</span> {pettyCashData.additionalCashReceivedFromVault.toFixed(2)}</p>
                        <p><span className="font-medium text-gray-600">Additional Surrendered to Vault:</span> {pettyCashData.additionalCashSurrenderedToVault.toFixed(2)}</p>
                        <p><span className="font-medium text-gray-600">Additional Approved by Maker:</span> {pettyCashData.additionalApprovalByMaker ? "✅" : "❌"}</p>

                        {/* Transactions */}
                        <p><span className="font-medium text-gray-600">Cash Received from Customers:</span> {pettyCashData.cashReceivedFromCustomers.toFixed(2)}</p>
                        <p><span className="font-medium text-gray-600">Cash Paid to Customers:</span> {pettyCashData.cashPaidToCustomers.toFixed(2)}</p>
                        <p><span className="font-medium text-gray-600">Total Coins:</span> {pettyCashData.totalCoins.toFixed(2)}</p>

                        {/* Balances */}
                        <p><span className="font-medium text-gray-600">Previous Day Balance:</span> {pettyCashData.previousDayBalance.toFixed(2)}</p>
                        <p><span className="font-medium text-gray-600">Today’s Balance:</span> {pettyCashData.todayBalance.toFixed(2)}</p>

                        {/* Calculations */}
                        <p><span className="font-medium text-gray-600">Subtotal:</span> {pettyCashData.subtotal.toFixed(2)}</p>
                        <p><span className="font-medium text-gray-600">Total Petty Cash:</span> {pettyCashData.totalPettyCash.toFixed(2)}</p>

                        {/* Foreign & Audit */}
                        <p><span className="font-medium text-gray-600">Foreign Currency Approved:</span> {pettyCashData.foreignCurrencyApprovalByManager ? "✅" : "❌"}</p>
                        <p><span className="font-medium text-gray-600">Denominations:</span> {pettyCashData.denominations || "—"}</p>
                        <p><span className="font-medium text-gray-600">Foreign Currencies:</span> {pettyCashData.foreignCurrencies || "—"}</p>

                        {/* Dates */}
                        {/* <p><span className="font-medium text-gray-600">Submitted At:</span> {new Date(pettyCashData.submittedAt).toLocaleString()}</p>
                        <p><span className="font-medium text-gray-600">Updated At:</span> {new Date(pettyCashData.updatedAt).toLocaleString()}</p> */}
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-600 mb-4">No petty cash form found. You may request an initial petty cash.</p>
            )}




            {/* ✅ Action Buttons Section */}

            <div className="grid md:grid-cols-2 gap-4">
                {pettyCashData == null && (
                    <button
                        onClick={handleInitialRequest}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700"
                    >
                        Request Initial
                    </button>
                )}

                {(!pettyCashData?.initialApprovalByMaker && pettyCashData?.cashReceivedFromVault) && (
                    <button onClick={handleApproveReceipt} className="bg-green-700 text-white px-4 py-2 rounded-lg shadow hover:bg-green-800">
                        Approve Initial Receipt, {pettyCashData?.cashReceivedFromVault}
                    </button>
                )}

                {(pettyCashData?.initialApprovalByMaker && !pettyCashData.makerRequestAdditional && !pettyCashData.denominations) && (

                    <button
                        onClick={handleRequestAdditional}
                        className="bg-blue-700 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-800"
                        disabled={pettyCashData?.makerRequestAdditional} // Disable the button if additionalApprovalByMaker is truthy
                    >
                        Request Additional
                    </button>
                )}


                {(!pettyCashData?.additionalApprovalByMaker && pettyCashData?.makerRequestAdditional && pettyCashData.managerGiveAdditionalCashReq) && (

                    <button
                        onClick={handleApproveAdditionalReceipt}
                        className="bg-indigo-700 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-800"
                    >
                        Approve Additional Receipt
                    </button>

                )}

                {(pettyCashData && !pettyCashData.cashSurrenderedToVault && pettyCashData?.initialApprovalByMaker) && (

                    <button
                        onClick={() => setShowInitialSurrenderModal(true)}
                        className="bg-yellow-600 text-white px-4 py-2 rounded-lg shadow hover:bg-yellow-700"
                    >
                        Surrender Initial
                    </button>

                )}

                {/* {(pettyCashData?.initialApprovalByMaker && !pettyCashData.makerRequestAdditional && pettyCashData?.additionalApprovalByMaker) && ( */}

                {(pettyCashData?.initialApprovalByVManager && !pettyCashData.makerRequestAdditionalSurrender && !pettyCashData.makerGiveAdditionalSurrender) && (
                    <button
                        onClick={() => setShowAdditionalSurrenderModal(true)}
                        className="bg-orange-700 text-white px-4 py-2 rounded-lg shadow hover:bg-orange-800"
                        disabled={pettyCashData?.makerRequestAdditionalSurrender} // Disable the button if additionalApprovalByMaker is truthy
                    >
                        Surrender Additional
                    </button>
                )}

                {(pettyCashData && pettyCashData?.initialApprovalByMaker && !pettyCashData.foreignCurrencies) && (

                    <button
                        onClick={() => handleOpenForeignModal(pettyCashData?.frontMakerId || "", pettyCashData?.id || "")}
                        className="bg-purple-700 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-800"
                    >
                        Submit Foreign Currency
                    </button>
                )}

                {(pettyCashData && pettyCashData?.initialApprovalByMaker && !pettyCashData.denominations) && (

                    <button
                        onClick={() => handleOpenPettyDenomModal(pettyCashData?.frontMakerId || "", pettyCashData?.id || "")}
                        className="bg-teal-700 text-white px-4 py-2 rounded-lg shadow hover:bg-teal-800"
                    >
                        Submit Petty Cash
                    </button>
                )}


            </div>

            {/* Petty Cash Modal */}
            <PettyDenominationModal
                isOpen={showPettyModal}
                onClose={() => setShowPettyModal(false)}
                onSave={() => { }}
                form={pettyDenomForm}
            />
            <ForeignCurrencyModal
                isOpen={showForeignModal}
                onClose={() => setShowForeignModal(false)}
                onSave={() => { }}
                form={foreignDenomForm}
            />
            <PettySurrenderModal
                isOpen={showInitialSurrenderModal}
                onClose={() => setShowInitialSurrenderModal(false)}
                title="Initial Cash Surrender"
                onSubmit={async (amount) => {
                    if (!decoded || !pettyCashData || !token) return;
                    const res = await pettyCashMakerService.surrenderInitial(pettyCashData.id, decoded.nameid, amount, token);
                    showMessage(res.success ? "success" : "error", res.message || "Failed to surrender initial cash");
                }}
            />
            <PettySurrenderModal
                isOpen={showAdditionalSurrenderModal}
                onClose={() => setShowAdditionalSurrenderModal(false)}
                title="Additional Cash Surrender"
                onSubmit={async (amount) => {
                    if (!decoded || !pettyCashData || !token) return;
                    const res = await pettyCashMakerService.surrenderAdditional(pettyCashData.id, decoded.nameid, amount, token);
                    showMessage(res.success ? "success" : "error", res.message || "Failed to surrender additional cash");
                }}
            />
        </section>
    );
};

export default PettyCash;
