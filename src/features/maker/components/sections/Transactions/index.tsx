import React, { useState } from "react";
import { useTransactions } from '@features/maker/hooks/useTransactions';
import { ActionMessage } from '@features/maker/components/common';
import QueueStats from '@features/maker/components/sections/Transactions/QueueStats';
import ActionButtons from '@features/maker/components/sections/Transactions/ActionButtons';
import QueueList from '@features/maker/components/sections/Transactions/QueueList';
import CurrentCustomerModal from '@features/maker/modals/CurrentCustomerModal';
import FormReferenceSearchModal from '@features/maker/modals/FormReferenceSearchModal';
import CancelConfirmationModal from '@components/modals/CancelConfirmationModal';
import DenominationModal from '@components/modals/DenominationModal';
import type { WindowDto } from '@services/makerService';

interface TransactionsProps {
  activeSection?: string;
  assignedWindow?: WindowDto | null;
}

const Transactions: React.FC<TransactionsProps> = ({ activeSection, assignedWindow }) => {
  const {
    // State
    queue,
    loadingQueue,
    queueError,
    current,
    busyAction,
    actionMessage,
    priorityCount,
    stats,
    setCurrent,
    
    // Actions
    refreshQueue,
    handleCallNext,
    handleComplete,
    handleCancel,
    setActionMessage,
    
    // Computed
    showCurrentCustomerModal
  } = useTransactions(assignedWindow);

  // Modal states
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showFormRefModal, setShowFormRefModal] = useState(false);
  const [showDenomModal, setShowDenomModal] = useState(false);
  const [denomForm, setDenomForm] = useState<{ formReferenceId: string; amount: number; } | null>(null);

  const openDenom = () => {
    if (!current) return;
    let amount = 0;
    if (current.transactionType === "Deposit") {
      amount = Number(current.amount ?? current.depositAmount ?? current.TransferAmount ?? 0);
    }
    setDenomForm({ formReferenceId: current.formReferenceId, amount });
    setShowDenomModal(true);
  };

  // Convert NextCustomerData to Customer type for the modal
  const convertToCustomer = (data: any) => {
    if (!data) return null;
    return {
      ...data,
      queueNumber: String(data.queueNumber), // Convert number to string
    };
  };

  return (
    <div className="space-y-6">
      {/* Action Message */}
      {actionMessage && (
        <ActionMessage 
          message={actionMessage} 
          onClose={() => setActionMessage(null)}
        />
      )}

      {/* Stats */}
      <QueueStats stats={stats} />

      {/* Current customer modal */}
      <CurrentCustomerModal
        isOpen={showCurrentCustomerModal}
        current={convertToCustomer(current)}
        busyAction={busyAction}
        onClose={() => setCurrent(null)}
        onComplete={handleComplete}
        onCancel={() => setShowCancelConfirm(true)}
        onOpenDenom={openDenom}
      />

      {/* Actions */}
      <ActionButtons
        assignedWindow={assignedWindow}
        busyAction={busyAction}
        priorityCount={priorityCount}
        onCallNext={handleCallNext}
        onOpenFormRefModal={() => setShowFormRefModal(true)}
      />

      {/* Queue */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-6 bg-fuchsia-700 rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-900">
            Waiting Queue (Today)
          </h3>
        </div>
        <QueueList 
          queue={queue}
          loadingQueue={loadingQueue}
          queueError={queueError}
        />
      </section>

      {/* Modals */}
      <CancelConfirmationModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={async () => {
          await handleCancel();
          setShowCancelConfirm(false);
        }}
      />

      <DenominationModal
        isOpen={showDenomModal}
        onClose={() => setShowDenomModal(false)}
        onSave={() => { }}
        form={denomForm}
      />

      <FormReferenceSearchModal
        isOpen={showFormRefModal}
        onClose={() => setShowFormRefModal(false)}
        token={localStorage.getItem('token') || ''}
        branchId={current?.branchId || ''}
        onRefreshServed={refreshQueue}
      />
    </div>
  );
};

export default Transactions;