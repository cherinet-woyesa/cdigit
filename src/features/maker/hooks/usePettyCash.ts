import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../../../context/AuthContext";
import pettyCashMakerService from "../../../services/pettyCashMakerService";
import type { 
  PettyCashFormResponseDto, 
  InitialRequestDto 
} from "../types";
import type { ActionMessage } from "../types/maker.types";

export const usePettyCash = () => {
  const { token, logout } = useAuth();
  const [decoded, setDecoded] = useState<any>(null);
  const [pettyCashData, setPettyCashData] = useState<PettyCashFormResponseDto | null>(null);
  const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);
  
  // Modal states
  const [showPettyModal, setShowPettyModal] = useState(false);
  const [showForeignModal, setShowForeignModal] = useState(false);
  const [showInitialSurrenderModal, setShowInitialSurrenderModal] = useState(false);
  const [showAdditionalSurrenderModal, setShowAdditionalSurrenderModal] = useState(false);
  
  const [foreignDenomForm, setForeignDenomForm] = useState<{ makerId: string; formId: string } | null>(null);
  const [pettyDenomForm, setPettyDenomForm] = useState<{ makerId: string; formId: string } | null>(null);

  // Decode token
  useEffect(() => {
    if (!token) return;
    try {
      const d = jwtDecode(token);
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
        const response = await pettyCashMakerService.getByFrontMaker(
          decoded.nameid, 
          decoded.BranchId, 
          token
        );
        setPettyCashData(response.data as PettyCashFormResponseDto);
      } catch (err) {
        console.error("Failed to fetch petty cash data", err);
        showMessage("error", "Failed to load petty cash data");
      }
    };
    fetchFormData();
  }, [decoded?.nameid, decoded?.BranchId, token]);

  // Helper to show feedback messages
  const showMessage = (type: "success" | "error", content: string) => {
    setActionMessage({ type, content });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Action handlers
  const handleInitialRequest = async () => {
    if (!token || !decoded) return;
    
    const dto: InitialRequestDto = {
      FrontMakerId: decoded.nameid,
      BranchId: decoded.BranchId,
    };
    
    try {
      const res = await pettyCashMakerService.requestInitial(dto, token);
      showMessage(res.success ? "success" : "error", res.message || "Initial request failed");
      // Refresh data after successful request
      if (res.success) {
        const response = await pettyCashMakerService.getByFrontMaker(decoded.nameid, decoded.BranchId, token);
        setPettyCashData(response.data as PettyCashFormResponseDto);
      }
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
      if (res.success) {
        const response = await pettyCashMakerService.getByFrontMaker(decoded.nameid, decoded.BranchId, token);
        setPettyCashData(response.data as PettyCashFormResponseDto);
      }
    } catch (err) {
      console.error("Approve receipt error:", err);
      showMessage("error", "Error approving receipt.");
    }
  };

  const handleRequestAdditional = async () => {
    if (!token || !pettyCashData) return;
    
    try {
      const res = await pettyCashMakerService.requestAdditional(pettyCashData.id, token);
      showMessage(res.success ? "success" : "error", res.message || "Failed to request additional cash");
      if (res.success) {
        const response = await pettyCashMakerService.getByFrontMaker(decoded.nameid, decoded.BranchId, token);
        setPettyCashData(response.data as PettyCashFormResponseDto);
      }
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
      if (res.success) {
        const response = await pettyCashMakerService.getByFrontMaker(decoded.nameid, decoded.BranchId, token);
        setPettyCashData(response.data as PettyCashFormResponseDto);
      }
    } catch (err) {
      console.error("Approve additional receipt error:", err);
      showMessage("error", "Error approving additional receipt.");
    }
  };

  const handleSurrenderInitial = async (amount: number) => {
    if (!token || !decoded || !pettyCashData) return;
    
    try {
      const res = await pettyCashMakerService.surrenderInitial(pettyCashData.id, decoded.nameid, amount, token);
      showMessage(res.success ? "success" : "error", res.message || "Failed to surrender initial cash");
      if (res.success) {
        const response = await pettyCashMakerService.getByFrontMaker(decoded.nameid, decoded.BranchId, token);
        setPettyCashData(response.data as PettyCashFormResponseDto);
      }
    } catch (err) {
      console.error("Surrender initial error:", err);
      showMessage("error", "Error surrendering initial petty cash.");
    }
  };

  const handleSurrenderAdditional = async (amount: number) => {
    if (!token || !decoded || !pettyCashData) return;
    
    try {
      const res = await pettyCashMakerService.surrenderAdditional(pettyCashData.id, decoded.nameid, amount, token);
      showMessage(res.success ? "success" : "error", res.message || "Failed to surrender additional cash");
      if (res.success) {
        const response = await pettyCashMakerService.getByFrontMaker(decoded.nameid, decoded.BranchId, token);
        setPettyCashData(response.data as PettyCashFormResponseDto);
      }
    } catch (err) {
      console.error("Surrender additional error:", err);
      showMessage("error", "Error surrendering additional petty cash.");
    }
  };

  // Modal handlers
  const handleOpenForeignModal = (makerId: string, formId: string) => {
    setForeignDenomForm({ makerId, formId });
    setShowForeignModal(true);
  };

  const handleOpenPettyDenomModal = (makerId: string, formId: string) => {
    setPettyDenomForm({ makerId, formId });
    setShowPettyModal(true);
  };

  return {
    // State
    pettyCashData,
    actionMessage,
    decoded,
    
    // Modal states
    showPettyModal,
    showForeignModal,
    showInitialSurrenderModal,
    showAdditionalSurrenderModal,
    foreignDenomForm,
    pettyDenomForm,
    
    // Actions
    handleInitialRequest,
    handleApproveReceipt,
    handleRequestAdditional,
    handleApproveAdditionalReceipt,
    handleSurrenderInitial,
    handleSurrenderAdditional,
    
    // Modal handlers
    handleOpenForeignModal,
    handleOpenPettyDenomModal,
    setShowPettyModal,
    setShowForeignModal,
    setShowInitialSurrenderModal,
    setShowAdditionalSurrenderModal,
    setActionMessage
  };
};