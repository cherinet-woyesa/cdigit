import React from 'react';
import type { AccountSearchResult } from '@features/maker/types';

interface BlockRecoverModalProps {
  isOpen: boolean;
  mode: 'block' | 'recover' | null;
  account: AccountSearchResult | null;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const BlockRecoverModal: React.FC<BlockRecoverModalProps> = ({
  isOpen,
  mode,
  account,
  reason,
  onReasonChange,
  onConfirm,
  onCancel
}) => {
  if (!isOpen || !mode || !account) return null;

  const modalConfig = {
    block: {
      title: "🚫 Block Phone",
      confirmText: "Confirm Block",
      confirmColor: "bg-red-600 hover:bg-red-700",
      showReason: true
    },
    recover: {
      title: "🔓 Recover Phone", 
      confirmText: "Confirm Recover",
      confirmColor: "bg-green-600 hover:bg-green-700",
      showReason: false
    }
  };

  const config = modalConfig[mode];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-semibold text-purple-700">
          {config.title}
        </h3>
        
        <div className="text-sm text-gray-600">
          <p>Account Holder: <b>{account.accountHolderName}</b></p>
          <p>Phone: <b>{account.phoneNumber}</b></p>
        </div>

        {config.showReason && (
          <div>
            <label className="font-medium text-sm text-gray-700">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Enter reason for blocking..."
              className="w-full mt-1 border-2 border-purple-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500"
              rows={3}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-md ${config.confirmColor}`}
          >
            {config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockRecoverModal;