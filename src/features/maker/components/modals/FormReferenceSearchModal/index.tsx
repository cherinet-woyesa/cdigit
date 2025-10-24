import React, { useState } from "react";
import makerService from "../../../../../services/makerService";
import type { Customer } from 'features/maker/types';
import SearchResults from './SearchResults';

interface FormReferenceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onRefreshServed: () => void;
  branchId: string;
}

const FormReferenceSearchModal: React.FC<FormReferenceSearchModalProps> = ({
  isOpen,
  onClose,
  token,
  onRefreshServed,
  branchId,
}) => {
  const [searchRefId, setSearchRefId] = useState("");
  const [searchResult, setSearchResult] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!searchRefId) return;

    setLoading(true);
    setMessage("");
    try {
      const res = await makerService.searchCustomerByFormReferenceId(
        branchId,
        searchRefId,
        token
      );
      console.log("Customer res:", res);
      if (res.success && res.data) {
        // Map NextCustomerData to Customer type
        const customerData: Customer = {
          id: res.data.id || "",
          queueNumber: String(res.data.queueNumber || ""),
          tokenNumber: res.data.tokenNumber || "",
          formReferenceId: res.data.formReferenceId || "",
          accountHolderName: res.data.accountHolderName || "",
          transactionType: res.data.transactionType || "",
          accountNumber: res.data.accountNumber ? String(res.data.accountNumber) : undefined,
          debitAccountNumber: res.data.debitAccountNumber ? String(res.data.debitAccountNumber) : undefined,
          beneficiaryAccountNumber: res.data.beneficiaryAccountNumber ? String(res.data.beneficiaryAccountNumber) : undefined,
          amount: res.data.amount,
          withdrawal_Amount: res.data.withdrawal_Amount || res.data.withdrawa_Amount,
          transferAmount: res.data.transferAmount,
          reason: res.data.reason,
          remark: res.data.remark,
          status: res.data.status,
          telephoneNumber: res.data.telephoneNumber,
          depositedBy: res.data.depositedBy,
          debitAccountName: res.data.debitAccountName,
          beneficiaryName: res.data.beneficiaryName,
        };
        setSearchResult(customerData);
      } else {
        setSearchResult(null);
        console.log("Customer res:", res.message);
        setMessage(res.message || "Customer not found");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error searching customer");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!searchResult?.id) return;
    try {
      const res = await makerService.completeTransaction(searchResult.id, token);
      setMessage(res.message || "Completed.");
      setSearchResult(null);
      setSearchRefId("");
      onRefreshServed();
      localStorage.removeItem("currentCustomer");
    } catch (err) {
      console.error(err);
      setMessage("Failed to complete transaction.");
    }
  };

  const handleCancel = async () => {
    if (!searchResult?.id) return;
    try {
      const res = await makerService.cancelTransaction(searchResult.id, token);
      setMessage(res.message || "Canceled.");
      setSearchResult(null);
      setSearchRefId("");
      localStorage.removeItem("currentCustomer");
    } catch (err) {
      console.error(err);
      setMessage("Failed to cancel transaction.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg animate-fadeIn">
        <h2 className="text-2xl font-bold mb-2 text-gray-900">
          Search by Form Reference
        </h2>
        <p className="text-gray-500 mb-4">
          Enter a form reference ID to locate a customer's request.
        </p>

        {/* Search input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchRefId}
            onChange={(e) => setSearchRefId(e.target.value)}
            placeholder="Enter Form Reference ID"
            className="flex-1 border px-3 py-2 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-60 shadow"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        {message && (
          <div className="mb-3 text-sm font-medium text-gray-600">{message}</div>
        )}

        {/* Search result details */}
        <SearchResults
          searchResult={searchResult}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />

        {/* Close button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormReferenceSearchModal;