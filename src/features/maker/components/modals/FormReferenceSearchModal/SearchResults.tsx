import React from 'react';
import type { Customer } from '../../../types';

interface SearchResultsProps {
  searchResult: Customer | null;
  onComplete: () => void;
  onCancel: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  searchResult,
  onComplete,
  onCancel
}) => {
  if (!searchResult) return null;

  const renderDetails = () => {
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
          onClick={onComplete}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition shadow"
        >
          Complete
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition shadow"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SearchResults;