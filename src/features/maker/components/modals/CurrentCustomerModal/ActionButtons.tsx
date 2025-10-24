import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";

export interface ActionButtonsProps {
  customer: any; // Will be properly typed
  busyAction: string | null;
  flashComplete: boolean;
  shakeCancel: boolean;
  onComplete: () => void;
  onCancel: () => void;
  onOpenDenom: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  customer,
  busyAction,
  flashComplete,
  shakeCancel,
  onComplete,
  onCancel,
  onOpenDenom
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-wrap gap-2"
    >
      {customer && customer.transactionType === "Deposit" && (
        <button
          onClick={onOpenDenom}
          className="px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition shadow text-sm"
        >
          Denominations
        </button>
      )}

      <motion.button
        onClick={onComplete}
        disabled={busyAction === "completing"}
        className="flex-1 px-3 py-2 rounded-lg text-white flex items-center justify-center shadow transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        animate={
          flashComplete
            ? {
                backgroundColor: [
                  "#f59e0b",
                  "#fbbf24",
                  "#f59e0b",
                  "#f59e0b",
                ],
              }
            : {}
        }
        transition={{ duration: 1 }}
        style={{ backgroundColor: "#f59e0b" }}
      >
        <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
        {busyAction === "completing" ? "Completing…" : "Complete Transaction"}
      </motion.button>

      <motion.button
        onClick={onCancel}
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
  );
};

export default ActionButtons;