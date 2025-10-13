import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import TellerSignature from "../../components/TellerSignature";
import { useApprovalWorkflow } from "../../hooks/useApprovalWorkflow";
import type { VoucherData } from "../../services/signatureCryptoService";

type Props = {
  isOpen: boolean;
  current: any | null;
  busyAction: string | null;
  onClose: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onOpenDenom: () => void;
};

const InfoTile = ({
  label,
  value,
  highlight = "default",
  index,
}: {
  label: string;
  value: string;
  highlight?: "default" | "amount" | "account" | "type";
  index: number;
}) => {
  let classes =
    "w-full rounded-lg p-2 shadow-sm transition bg-gray-50 hover:shadow";
  let valueClasses = "font-semibold break-all text-sm";

  if (highlight === "amount") {
    classes = "w-full rounded-lg p-2 shadow-sm transition bg-emerald-50";
    valueClasses = "font-bold text-emerald-700 text-base";
  } else if (highlight === "account") {
    classes = "w-full rounded-lg p-2 shadow-sm transition bg-indigo-50";
    valueClasses = "font-mono font-semibold text-indigo-700 text-sm";
  } else if (highlight === "type") {
    classes = "w-full rounded-lg p-2 shadow-sm transition bg-purple-50";
    valueClasses = "font-bold text-purple-700 uppercase tracking-wide text-sm";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
      className={classes}
    >
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <motion.div
        className={valueClasses}
        animate={highlight === "amount" ? { scale: [1, 1.05, 1] } : {}}
        transition={
          highlight === "amount"
            ? { repeat: Infinity, repeatDelay: 3, duration: 1.2 }
            : {}
        }
      >
        {value}
      </motion.div>
    </motion.div>
  );
};

export default function CurrentCustomerModal({
  isOpen,
  current,
  busyAction,
  onClose,
  onComplete,
  onCancel,
  onOpenDenom,
}: Props) {
  const [flashComplete, setFlashComplete] = useState(false);
  const [shakeCancel, setShakeCancel] = useState(false);
  const [tellerBoundSignature, setTellerBoundSignature] = useState<any>(null);
  const [showApprovalMessage, setShowApprovalMessage] = useState(false);
  const { createWorkflow, requiresApproval: workflowRequiresApproval, currentWorkflow } = useApprovalWorkflow();

  const handleCompleteClick = async () => {
    // Validate teller signature
    if (!tellerBoundSignature) {
      alert('Teller signature is required to complete this transaction');
      return;
    }

    // Create approval workflow
    if (current) {
      const voucherData: VoucherData = {
        voucherId: current.formReferenceId,
        voucherType: current.transactionType,
        accountNumber: current.accountNumber || current.debitAccountNumber,
        amount: current.amount || current.withdrawal_Amount || current.transferAmount,
        currency: 'ETB',
        transactionType: current.transactionType?.toLowerCase(),
      };

      const workflow = await createWorkflow({
        voucherId: current.formReferenceId,
        voucherType: current.transactionType,
        transactionType: current.transactionType?.toLowerCase() as any,
        amount: voucherData.amount || 0,
        currency: 'ETB',
        customerSegment: 'normal',
        reason: 'Customer transaction processed by teller',
        voucherData: voucherData,
        tellerSignature: tellerBoundSignature,
      });

      if (workflow?.requiresApproval) {
        setShowApprovalMessage(true);
        setTimeout(() => setShowApprovalMessage(false), 5000);
      }
    }

    await onComplete();
    setFlashComplete(true);
    setTimeout(() => setFlashComplete(false), 3200);
    
    // Reset signature for next transaction
    setTellerBoundSignature(null);
  };

  const handleCancelClick = async () => {
    await onCancel();
    setShakeCancel(true);
    setTimeout(() => setShakeCancel(false), 600); // reset after animation
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
              <div className="space-y-3">
                {/* Basic Info */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {current.accountHolderName || "Customer"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Queue No:{" "}
                    <span className="font-semibold">{current.queueNumber}</span>
                  </p>
                  <p className="text-xs text-gray-600">
                    Token:{" "}
                    <span className="font-mono font-medium">
                      {current.tokenNumber}
                    </span>
                  </p>
                  <p className="text-xs text-gray-600">
                    Ref:{" "}
                    <span className="font-mono font-medium">
                      {current.formReferenceId}
                    </span>
                  </p>
                </motion.div>

                {/* Transaction Type */}
                <InfoTile
                  label="Transaction Type"
                  value={current.transactionType}
                  highlight="type"
                  index={0}
                />

                {/* Account Info */}
                {current.accountNumber && (
                  <InfoTile
                    label="Account Number"
                    value={String(current.accountNumber)}
                    highlight="account"
                    index={1}
                  />
                )}
                {current.debitAccountNumber && (
                  <InfoTile
                    label="Debit Account"
                    value={String(current.debitAccountNumber)}
                    highlight="account"
                    index={2}
                  />
                )}
                {current.beneficiaryAccountNumber && (
                  <InfoTile
                    label="Beneficiary Account"
                    value={String(current.beneficiaryAccountNumber)}
                    highlight="account"
                    index={3}
                  />
                )}

                {/* Transaction-Specific Amounts */}
                {current.transactionType === "Deposit" && (
                  <InfoTile
                    label="Deposit Amount"
                    value={String(current.amount ?? 0)}
                    highlight="amount"
                    index={4}
                  />
                )}
                {current.transactionType === "Withdrawal" && (
                  <InfoTile
                    label="Withdrawal Amount"
                    value={String(current.withdrawal_Amount ?? 0)}
                    highlight="amount"
                    index={5}
                  />
                )}
                {current.transactionType === "FundTransfer" && (
                  <InfoTile
                    label="Transfer Amount"
                    value={String(current.transferAmount ?? 0)}
                    highlight="amount"
                    index={6}
                  />
                )}

                {/* Extra Fields */}
                {current.reason && (
                  <InfoTile label="Reason" value={String(current.reason)} index={7} />
                )}
                {current.remark && (
                  <InfoTile label="Remark" value={String(current.remark)} index={8} />
                )}

                {/* Approval Message */}
                {showApprovalMessage && currentWorkflow && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-orange-800">
                          Approval Required
                        </h3>
                        <p className="mt-1 text-sm text-orange-700">
                          {currentWorkflow.approvalReason}
                        </p>
                        <p className="mt-1 text-xs text-orange-600">
                          This transaction has been queued for manager approval.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Teller Signature */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="border-t pt-3"
                >
                  <TellerSignature
                    voucherData={{
                      voucherId: current.formReferenceId,
                      voucherType: current.transactionType,
                      accountNumber: current.accountNumber || current.debitAccountNumber,
                      amount: current.amount || current.withdrawal_Amount || current.transferAmount,
                      currency: 'ETB',
                      transactionType: current.transactionType?.toLowerCase(),
                    }}
                    onSignatureBound={(boundSig) => {
                      setTellerBoundSignature(boundSig);
                      console.log('Teller signature bound:', {
                        signatureHash: boundSig.binding.signatureHash.substring(0, 16) + '...',
                        voucherHash: boundSig.binding.voucherHash.substring(0, 16) + '...',
                        bindingHash: boundSig.binding.bindingHash.substring(0, 16) + '...',
                      });
                    }}
                    label="Teller Signature"
                  />
                </motion.div>
              </div>
            )
            }
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="border-t px-4 py-3 bg-gray-50 flex-shrink-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-2"
              >
                {current && current.transactionType === "Deposit" && (
                  <button
                    onClick={onOpenDenom}
                    className="px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition shadow text-sm"
                  >
                    Denominations
                  </button>
                )}

                <motion.button
                  onClick={handleCompleteClick}
                  disabled={busyAction === "completing" || !tellerBoundSignature}
                  className="flex-1 px-3 py-2 rounded-lg text-white flex items-center justify-center shadow transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  animate={
                    flashComplete
                      ? {
                          backgroundColor: [
                            "#059669",
                            "#34d399",
                            "#059669",
                            "#10b981",
                          ],
                        }
                      : {}
                  }
                  transition={{ duration: 1 }}
                  style={{ backgroundColor: tellerBoundSignature ? "#059669" : "#9ca3af" }}
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                  {busyAction === "completing" ? "Completing…" : !tellerBoundSignature ? "Sign to Complete" : "Complete"}
                </motion.button>

                <motion.button
                  onClick={handleCancelClick}
                  disabled={busyAction === "canceling"}
                  className="flex-1 px-3 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 flex items-center justify-center shadow transition text-sm font-medium"
                  animate={
                    shakeCancel
                      ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
                      : {}
                  }
                  transition={{ duration: 0.6 }}
                >
                  <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
                  {busyAction === "canceling" ? "Canceling…" : "Cancel"}
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}