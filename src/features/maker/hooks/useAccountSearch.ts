import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import accountService from "../../../services/accountsService";
import phoneBlockService from "../../../services/phoneBlockService";
import type { AccountSearchResult, BlockRequestData, RecoverRequestData } from "../types";

export const useAccountSearch = () => {
  const { token, user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AccountSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountSearchResult | null>(null);
  const [popupMode, setPopupMode] = useState<"block" | "recover" | null>(null);
  const [reason, setReason] = useState("");

  const handleSearch = async () => {
    if (!query.trim() || !token) return;
    
    setLoading(true);
    try {
      const res = await accountService.search(query, token);
      setResults(res.success ? res.data : []);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!selectedAccount || !token) return;
    
    try {
      const blockData: BlockRequestData = {
        phoneNumber: selectedAccount.phoneNumber,
        accountNumber: selectedAccount.accountNumber,
        accountHolderName: selectedAccount.accountHolderName,
        reason,
      };
      
      await phoneBlockService.requestBlock(blockData);
      alert("✅ Block request submitted successfully.");
      closePopup();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit block request.");
    }
  };

  const handleRecover = async () => {
    if (!selectedAccount || !user?.id || !token) return;
    
    try {
      const recoverData: RecoverRequestData = {
        phoneNumber: selectedAccount.phoneNumber,
        recoveredById: user.id,
      };
      
      await phoneBlockService.recoverPhone(recoverData);
      alert("✅ Phone recovered and unblocked successfully.");
      closePopup();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to recover phone.");
    }
  };

  const openBlockPopup = (account: AccountSearchResult) => {
    setSelectedAccount(account);
    setPopupMode("block");
    setReason("");
  };

  const openRecoverPopup = (account: AccountSearchResult) => {
    setSelectedAccount(account);
    setPopupMode("recover");
  };

  const closePopup = () => {
    setSelectedAccount(null);
    setPopupMode(null);
    setReason("");
  };

  return {
    // State
    query,
    setQuery,
    results,
    loading,
    selectedAccount,
    popupMode,
    reason,
    setReason,
    
    // Actions
    handleSearch,
    handleBlock,
    handleRecover,
    openBlockPopup,
    openRecoverPopup,
    closePopup
  };
};