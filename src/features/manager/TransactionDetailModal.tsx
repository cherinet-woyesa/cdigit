// src/components/manager/TransactionDetailModal.tsx
import type { FC } from "react";
import { Button } from "../../components/ui/button";

interface TransactionDetailModalProps {
  txn: any;
  onClose: () => void;
}

export const TransactionDetailModal: FC<TransactionDetailModalProps> = ({ txn, onClose }) => {

  const statusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <span className="px-2 py-1 rounded bg-red-600 text-white">Canceled</span>;
      case 1:
        return <span className="px-2 py-1 rounded bg-yellow-500 text-white">On Queue</span>;
      case 2:
        return <span className="px-2 py-1 rounded bg-blue-500 text-white">On Progress</span>;
      case 3:
        return <span className="px-2 py-1 rounded bg-green-500 text-white">Completed</span>;
      default:
        return <span className="px-2 py-1 rounded bg-gray-400 text-white">Unknown</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-0 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-500 p-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg">Transaction Details</h3>
          <button onClick={onClose} className="text-white text-xl font-bold hover:text-gray-200">✕</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          <div className="flex justify-between">
            <span className="font-semibold">Queue #:</span>
            <span>#{txn.queueNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Type:</span>
            <span>{txn.transactionType}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Account Holder:</span>
            <span>{txn.accountHolderName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Amount:</span>
            <span>${txn.amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">Status:</span>
            {statusBadge(txn.status)}
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Submitted At:</span>
            <span>{new Date(txn.submittedAt).toLocaleString()}</span>
          </div>
          

          <div className="flex justify-between">
            <span className="font-semibold">Submitted to CBS At:</span>
            <span>{new Date(txn.depositedToCBSAt).toLocaleString()}</span>
          </div>


          <div className="flex justify-between">
            <span className="font-semibold">Form Reference ID:</span>
            <span>{txn.formReferenceId}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-4 text-right">
          <Button className="bg-purple-600 text-white hover:bg-purple-700" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
