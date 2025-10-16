import React, { useState } from "react";
import makerService from "../../services/makerService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onRefreshServed: () => void;
  branchId: string;
}

const FormReferenceSearchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  token,
  onRefreshServed,
  branchId,
}) => {
  const [searchRefId, setSearchRefId] = useState("");
  const [searchResult, setSearchResult] = useState<any | null>(null);
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
      if (res.success && res.data) {
        setSearchResult(res.data);
      } else {
        setSearchResult(null);
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
      const res = await makerService.completeTransaction(
        searchResult.id,
        token
      );
      setMessage(res.message || "Completed.");
      setSearchResult(null);
      setSearchRefId("");
      onRefreshServed();
      localStorage.removeItem("currentCustomer"); // clear

    } catch (err) {
      console.error(err);
      setMessage("Failed to complete transaction.");
    }
  };

  const handleCancel = async () => {
    if (!searchResult?.id) return;
    try {
      const res = await makerService.cancelTransaction(
        searchResult.id,
        token
      );
      setMessage(res.message || "Canceled.");
      setSearchResult(null);
      setSearchRefId("");
      localStorage.removeItem("currentCustomer"); // clear

    } catch (err) {
      console.error(err);
      setMessage("Failed to cancel transaction.");
    }
  };

  // 🔹 Render based on transaction type
  const renderDetails = () => {
    if (!searchResult) return null;

    switch (searchResult.transactionType) {
      case "Deposit":
        return (
          <>
            <p><strong>Customer:</strong> {searchResult.accountHolderName}</p>
            <p><strong>Account No:</strong> {searchResult.accountNumber}</p>
            <p><strong>Amount:</strong> {searchResult.amount}</p>
            <p><strong>Deposited By:</strong> {searchResult.depositedBy}</p>
            <p><strong>Tel:</strong> {searchResult.telephoneNumber}</p>
          </>
        );

      case "FundTransfer":
        return (
          <>
            <p><strong>Debit Account:</strong> {searchResult.debitAccountNumber} ({searchResult.debitAccountName})</p>
            <p><strong>Beneficiary:</strong> {searchResult.beneficiaryAccountNumber} ({searchResult.beneficiaryName})</p>
            <p><strong>Amount:</strong> {searchResult.transferAmount}</p>
            <p><strong>Reason:</strong> {searchResult.reason}</p>
          </>
        );

      case "Withdrawal":
        return (
          <>
            <p><strong>Customer:</strong> {searchResult.accountHolderName}</p>
            <p><strong>Account No:</strong> {searchResult.accountNumber}</p>
            <p><strong>Amount:</strong> {searchResult.withdrawal_Amount}</p>
            <p><strong>Remark:</strong> {searchResult.remark}</p>
          </>
        );

      default:
        return <p>Unknown transaction type.</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg animate-fadeIn">
        <h2 className="text-2xl font-bold mb-2 text-gray-900">
          Search by Form Reference
        </h2>
        <p className="text-gray-500 mb-4">
          Enter a form reference ID to locate a customer’s request.
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

        {/* 🔹 Search result details */}
        {searchResult && (
          <div className="mt-4 p-4 border rounded-2xl bg-purple-50 shadow-inner space-y-1">
            <p>
              <strong>Type:</strong>{" "}
              <span className="px-2 py-0.5 bg-purple-600 text-white rounded-lg text-xs">
                {searchResult.transactionType}
              </span>
            </p>
            <p><strong>Ref:</strong> {searchResult.formReferenceId}</p>
            <p><strong>Token:</strong> {searchResult.tokenNumber}</p>
            <p><strong>Status:</strong> {searchResult.status}</p>

            {renderDetails()}

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleComplete}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition shadow"
              >
                Complete
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition shadow"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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