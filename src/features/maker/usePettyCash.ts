import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../../context/AuthContext";
import pettyCashMakerService from "../../services/pettyCashMakerService";
import type { ActionMessage } from "../../types/ActionMessage";
import type { DecodedToken } from "../../types/DecodedToken";
import type { InitialRequestDto } from "../../types/PettyCash/InitialRequestDto";
import type { PettyCashFormResponseDto } from "../../types/PettyCash/PettyCashFormResponseDto";

export const usePettyCash = () => {
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

    // Open Modals
    const handleOpenForeignModal = (makerId: string, formId: string) => {
        setForeignDenomForm({ makerId, formId });
        setShowForeignModal(true);
    };

    const handleOpenPettyDenomModal = (makerId: string, formId: string) => {
        setPettyDenomForm({ makerId, formId });
        setShowPettyModal(true);
    };

    return {
        pettyCashData,
        actionMessage,
        showPettyModal,
        showForeignModal,
        foreignDenomForm,
        pettyDenomForm,
        showInitialSurrenderModal,
        showAdditionalSurrenderModal,
        decoded,
        token,
        handleInitialRequest,
        handleApproveReceipt,
        handleRequestAdditional,
        handleApproveAdditionalReceipt,
        handleOpenForeignModal,
        handleOpenPettyDenomModal,
        setShowPettyModal,
        setShowForeignModal,
        setShowInitialSurrenderModal,
        setShowAdditionalSurrenderModal,
        showMessage
    };
};