import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDoorOpen } from "@fortawesome/free-solid-svg-icons";

interface ActionButtonsProps {
  assignedWindow: any;
  busyAction: string | null;
  priorityCount: number;
  onCallNext: () => void;
  onOpenFormRefModal: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  assignedWindow,
  busyAction,
  priorityCount,
  onCallNext,
  onOpenFormRefModal
}) => {
  return (
    <section className="flex flex-wrap gap-3">
      <button
        onClick={onCallNext}
        disabled={!assignedWindow || busyAction === "calling" || priorityCount > 0}
        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <FontAwesomeIcon icon={faDoorOpen} />
        {busyAction === "calling"
          ? "Calling…"
          : priorityCount > 0
            ? `Waiting ${priorityCount} Priority`
            : "Call Next Customer"}
      </button>

      <button
        onClick={onOpenFormRefModal}
        className="px-6 py-3 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm transition-all font-medium"
      >
        Search by Form Ref ID
      </button>
      
      <span className="px-4 py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg font-medium">
        Priority: {priorityCount}
      </span>
    </section>
  );
};

export default ActionButtons;