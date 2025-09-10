import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

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
    "w-full rounded-xl p-4 shadow-sm transition bg-gray-50 hover:shadow";
  let valueClasses = "font-semibold break-all";

  if (highlight === "amount") {
    classes = "w-full rounded-xl p-4 shadow-sm transition bg-emerald-50";
    valueClasses = "font-bold text-emerald-700 text-lg";
  } else if (highlight === "account") {
    classes = "w-full rounded-xl p-4 shadow-sm transition bg-indigo-50";
    valueClasses = "font-mono font-semibold text-indigo-700";
  } else if (highlight === "type") {
    classes = "w-full rounded-xl p-4 shadow-sm transition bg-purple-50";
    valueClasses = "font-bold text-purple-700 uppercase tracking-wide";
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

  const handleCompleteClick = async () => {
    await onComplete();
    setFlashComplete(true);
    setTimeout(() => setFlashComplete(false), 3200); // reset after animation
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
            className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-2xl"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Current Customer
              </h2>
              <button
                onClick={onClose}
                className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
              >
                ✕
              </button>
            </div>

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
              <div className="space-y-4">
                {/* Basic Info */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {current.accountHolderName || "Customer"}
                  </h3>
                  <p className="text-gray-500">
                    Queue No:{" "}
                    <span className="font-semibold">{current.queueNumber}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Token:{" "}
                    <span className="font-mono font-medium">
                      {current.tokenNumber}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
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

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-wrap gap-3 pt-4"
                >
                  {current.transactionType === "Deposit" && (
                    <button
                      onClick={onOpenDenom}
                      className="px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition shadow"
                    >
                      Update Denominations
                    </button>
                  )}

                  <motion.button
                    onClick={handleCompleteClick}
                    disabled={busyAction === "completing"}
                    className="px-4 py-2 rounded-xl text-white flex items-center shadow transition"
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
                    style={{ backgroundColor: "#059669" }}
                  >
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                    {busyAction === "completing" ? "Completing…" : "Complete"}
                  </motion.button>

                  <motion.button
                    onClick={handleCancelClick}
                    disabled={busyAction === "canceling"}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 flex items-center shadow transition"
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
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
