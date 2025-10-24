import React from 'react';
import type { PettyCashFormResponseDto } from '../../../types';

interface PettyCashActionsProps {
  data: PettyCashFormResponseDto | null;
  decoded: any;
  onInitialRequest: () => void;
  onApproveReceipt: () => void;
  onRequestAdditional: () => void;
  onApproveAdditionalReceipt: () => void;
  onOpenInitialSurrender: () => void;
  onOpenAdditionalSurrender: () => void;
  onOpenForeignModal: (makerId: string, formId: string) => void;
  onOpenPettyDenomModal: (makerId: string, formId: string) => void;
}

const PettyCashActions: React.FC<PettyCashActionsProps> = ({
  data,
  decoded,
  onInitialRequest,
  onApproveReceipt,
  onRequestAdditional,
  onApproveAdditionalReceipt,
  onOpenInitialSurrender,
  onOpenAdditionalSurrender,
  onOpenForeignModal,
  onOpenPettyDenomModal
}) => {
  const getActionButtons = () => {
    const buttons = [];

    // Initial Request
    if (!data) {
      buttons.push({
        label: "Request Initial",
        onClick: onInitialRequest,
        color: "bg-emerald-600 hover:bg-emerald-700",
        enabled: true
      });
    }

    // Approve Initial Receipt
    if (data && !data.initialApprovalByMaker && data.cashReceivedFromVault) {
      buttons.push({
        label: `Approve Initial Receipt, ETB ${data.cashReceivedFromVault.toFixed(2)}`,
        onClick: onApproveReceipt,
        color: "bg-green-700 hover:bg-green-800",
        enabled: true
      });
    }

    // Request Additional
    if (data?.initialApprovalByMaker && !data.makerRequestAdditional && !data.denominations) {
      buttons.push({
        label: "Request Additional",
        onClick: onRequestAdditional,
        color: "bg-blue-700 hover:bg-blue-800",
        enabled: true
      });
    }

    // Approve Additional Receipt
    if (!data?.additionalApprovalByMaker && data?.makerRequestAdditional && data.managerGiveAdditionalCashReq) {
      buttons.push({
        label: "Approve Additional Receipt",
        onClick: onApproveAdditionalReceipt,
        color: "bg-indigo-700 hover:bg-indigo-800",
        enabled: true
      });
    }

    // Surrender Initial
    if (data && !data.cashSurrenderedToVault && data.initialApprovalByMaker) {
      buttons.push({
        label: "Surrender Initial",
        onClick: onOpenInitialSurrender,
        color: "bg-yellow-600 hover:bg-yellow-700",
        enabled: true
      });
    }

    // Surrender Additional
    if (data?.initialApprovalByVManager && !data.makerRequestAdditionalSurrender && !data.makerGiveAdditionalSurrender) {
      buttons.push({
        label: "Surrender Additional",
        onClick: onOpenAdditionalSurrender,
        color: "bg-orange-700 hover:bg-orange-800",
        enabled: true
      });
    }

    // Foreign Currency
    if (data && data.initialApprovalByMaker && !data.foreignCurrencies) {
      buttons.push({
        label: "Submit Foreign Currency",
        onClick: () => onOpenForeignModal(data.frontMakerId || "", data.id || ""),
        color: "bg-purple-700 hover:bg-purple-800",
        enabled: true
      });
    }

    // Petty Denomination
    if (data && data.initialApprovalByMaker && !data.denominations) {
      buttons.push({
        label: "Submit Petty Cash",
        onClick: () => onOpenPettyDenomModal(data.frontMakerId || "", data.id || ""),
        color: "bg-teal-700 hover:bg-teal-800",
        enabled: true
      });
    }

    return buttons;
  };

  const actionButtons = getActionButtons();

  if (actionButtons.length === 0) {
    return (
      <p className="text-sm text-gray-600 text-center py-4">
        No actions available at this time.
      </p>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {actionButtons.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className={`${action.color} text-white px-4 py-2 rounded-lg shadow transition-colors font-medium`}
          disabled={!action.enabled}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};

export default PettyCashActions;