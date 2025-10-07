// src/modlas/CancelConfirmationModal.tsx

import React from 'react';

interface CancelConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>; // Handle the confirmation action
}

const CancelConfirmationModal: React.FC<CancelConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                <h2 className="text-lg font-bold text-gray-800 mb-2">Are you sure?</h2>
                <p className="text-gray-600 mb-4">
                    Do you really want to cancel this transaction? This action cannot
                    be undone.
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                        No, Keep
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                    >
                        Yes, Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CancelConfirmationModal;