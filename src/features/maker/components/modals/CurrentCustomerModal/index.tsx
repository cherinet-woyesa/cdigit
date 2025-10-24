import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useApprovalWorkflow } from "../../../../../hooks/useApprovalWorkflow";
import type { Customer } from '../../../../../features/maker/types';
import CustomerDetails from './CustomerDetails';
import ActionButtons from './ActionButtons';

export interface CurrentCustomerModalProps {
  isOpen: boolean;
  current: Customer | null;
  busyAction: string | null;
  onClose: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onOpenDenom: () => void;
}

const CurrentCustomerModal: React.FC<CurrentCustomerModalProps> = ({
  isOpen,
  current,
  busyAction,
  onClose,
  onComplete,
  onCancel,
  onOpenDenom,
}) => {
  const [flashComplete, setFlashComplete] = React.useState(false);
  const [shakeCancel, setShakeCancel] = React.useState(false);
  const [showApprovalMessage, setShowApprovalMessage] = React.useState(false);
  const { createWorkflow, currentWorkflow } = useApprovalWorkflow();

  const handleCompleteClick = async () => {
    if (current) {
      // Map transactionType to the correct values for approval workflow
      const mappedTransactionType = current.transactionType?.toLowerCase() as string;
      const validTransactionTypes = ['withdrawal', 'deposit', 'transfer', 'rtgs'];
      const transactionType = validTransactionTypes.includes(mappedTransactionType) 
        ? mappedTransactionType as 'withdrawal' | 'deposit' | 'transfer' | 'rtgs' 
        : undefined;

      const workflow = await createWorkflow({
        voucherId: current.formReferenceId,
        voucherType: current.transactionType as 'withdrawal' | 'deposit' | 'transfer' | 'rtgs' | 'account_opening' | 'stop_payment' | 'other',
        transactionType: transactionType,
        amount: current.amount || current.withdrawal_Amount || current.transferAmount || 0,
        currency: 'ETB',
        customerSegment: 'normal',
        reason: 'Customer transaction processed by teller',
        voucherData: {
          voucherId: current.formReferenceId,
          voucherType: current.transactionType,
          accountNumber: current.accountNumber || current.debitAccountNumber,
          amount: current.amount || current.withdrawal_Amount || current.transferAmount,
          currency: 'ETB',
          transactionType: current.transactionType?.toLowerCase(),
        },
      });

      if (workflow?.requiresApproval) {
        setShowApprovalMessage(true);
        setTimeout(() => setShowApprovalMessage(false), 5000);
      }
    }

    await onComplete();
    setFlashComplete(true);
    setTimeout(() => setFlashComplete(false), 3200);
  };

  const handleCancelClick = async () => {
    await onCancel();
    setShakeCancel(true);
    setTimeout(() => setShakeCancel(false), 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", stiffness: 120, damping: 15 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b px-4 py-3 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                Current Customer
              </h2>
              <button
                onClick={onClose}
                className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition text-sm"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto px-4 py-3 flex-1">
              {!current ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-gray-500 py-8"
                >
                  <p className="text-lg">
                    No active customer. Click{" "}
                    <span className="font-semibold text-purple-700">Call Next</span>{" "}
                    to start.
                  </p>
                </motion.div>
              ) : (
                <CustomerDetails
                  customer={current}
                  showApprovalMessage={showApprovalMessage}
                  currentWorkflow={currentWorkflow}
                />
              )}
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="border-t px-4 py-3 bg-gray-50 flex-shrink-0">
              {current && (
                <ActionButtons
                  customer={current}
                  busyAction={busyAction}
                  flashComplete={flashComplete}
                  shakeCancel={shakeCancel}
                  onComplete={handleCompleteClick}
                  onCancel={handleCancelClick}
                  onOpenDenom={onOpenDenom}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CurrentCustomerModal;