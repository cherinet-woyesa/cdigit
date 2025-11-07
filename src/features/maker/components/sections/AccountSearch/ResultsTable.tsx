import React from 'react';
import type { AccountSearchResult } from '@features/maker/types';

interface ResultsTableProps {
  results: AccountSearchResult[];
  onBlock: (account: AccountSearchResult) => void;
  onRecover: (account: AccountSearchResult) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({
  results,
  onBlock,
  onRecover
}) => {
  if (results.length === 0) {
    return (
      <table className="min-w-full text-sm border-t border-gray-200">
        <thead className="bg-gray-50 text-gray-700 font-semibold">
          <tr>
            <th className="px-4 py-2 text-left">Account Holder</th>
            <th className="px-4 py-2 text-left">Phone</th>
            <th className="px-4 py-2 text-left">Account #</th>
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
              No results found
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table className="min-w-full text-sm border-t border-gray-200">
      <thead className="bg-gray-50 text-gray-700 font-semibold">
        <tr>
          <th className="px-4 py-2 text-left">Account Holder</th>
          <th className="px-4 py-2 text-left">Phone</th>
          <th className="px-4 py-2 text-left">Account #</th>
          <th className="px-4 py-2 text-left">Type</th>
          <th className="px-4 py-2 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {results.map((account) => (
          <TableRow 
            key={account.id} 
            account={account} 
            onBlock={onBlock}
            onRecover={onRecover}
          />
        ))}
      </tbody>
    </table>
  );
};

const TableRow: React.FC<{
  account: AccountSearchResult;
  onBlock: (account: AccountSearchResult) => void;
  onRecover: (account: AccountSearchResult) => void;
}> = ({ account, onBlock, onRecover }) => (
  <tr className="border-t hover:bg-purple-50 transition-all">
    <td className="px-4 py-2">{account.accountHolderName}</td>
    <td className="px-4 py-2">{account.phoneNumber}</td>
    <td className="px-4 py-2 font-mono">{account.accountNumber}</td>
    <td className="px-4 py-2">{account.typeOfAccount}</td>
    <td className="px-4 py-2 text-center">
      <ActionButton
        variant="block"
        onClick={() => onBlock(account)}
        label="Block"
      />
      <ActionButton
        variant="recover"
        onClick={() => onRecover(account)}
        label="Recover"
      />
    </td>
  </tr>
);

const ActionButton: React.FC<{
  variant: 'block' | 'recover';
  onClick: () => void;
  label: string;
}> = ({ variant, onClick, label }) => {
  const baseClasses = "px-3 py-1 text-xs font-semibold rounded hover:transition-all";
  const variantClasses = {
    block: "bg-red-100 text-red-600 hover:bg-red-200",
    recover: "bg-green-100 text-green-600 hover:bg-green-200"
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${variant === 'recover' ? 'ml-2' : ''}`}
    >
      {label}
    </button>
  );
};

export default ResultsTable;