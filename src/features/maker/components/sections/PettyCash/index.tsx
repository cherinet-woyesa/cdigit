import React from 'react';
import { usePettyCash } from '@features/maker/hooks/usePettyCash';
import PettyCashSummary from '@features/maker/components/sections/PettyCash/PettyCashSummary';
import PettyCashActions from '@features/maker/components/sections/PettyCash/PettyCashActions';
import ActionMessage from '@features/maker/components/sections/PettyCash/ActionMessage';

// Import modals (you'll need to adjust these imports based on your modal structure)
import ForeignCurrencyModal from '@components/modals/ForeignCurrencyModal';
import PettyDenominationModal from '@components/modals/PettyDenominationModal';
import PettySurrenderModal from '@components/modals/PettySurrenderModal';

const PettyCash: React.FC = () => {
  const {
    // State
    pettyCashData,
    actionMessage,
    decoded,
    
    // Modal states
    showPettyModal,
    showForeignModal,
    showInitialSurrenderModal,
    showAdditionalSurrenderModal,
    foreignDenomForm,
    pettyDenomForm,
    
    // Actions
    handleInitialRequest,
    handleApproveReceipt,
    handleRequestAdditional,
    handleApproveAdditionalReceipt,
    handleSurrenderInitial,
    handleSurrenderAdditional,
    
    // Modal handlers
    handleOpenForeignModal,
    handleOpenPettyDenomModal,
    setShowPettyModal,
    setShowForeignModal,
    setShowInitialSurrenderModal,
    setShowAdditionalSurrenderModal,
    setActionMessage
  } = usePettyCash();

  return (
    <section className="mt-6 animate-fadeIn">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Petty Cash Actions</h3>
      
      <ActionMessage message={actionMessage} />

      {pettyCashData ? (
        <PettyCashSummary data={pettyCashData} decoded={decoded} />
      ) : (
        <p className="text-sm text-gray-600 mb-4">
          No petty cash form found. You may request an initial petty cash.
        </p>
      )}

      <PettyCashActions
        data={pettyCashData}
        decoded={decoded}
        onInitialRequest={handleInitialRequest}
        onApproveReceipt={handleApproveReceipt}
        onRequestAdditional={handleRequestAdditional}
        onApproveAdditionalReceipt={handleApproveAdditionalReceipt}
        onOpenInitialSurrender={() => setShowInitialSurrenderModal(true)}
        onOpenAdditionalSurrender={() => setShowAdditionalSurrenderModal(true)}
        onOpenForeignModal={handleOpenForeignModal}
        onOpenPettyDenomModal={handleOpenPettyDenomModal}
      />

      {/* Modals */}
      <PettyDenominationModal
        isOpen={showPettyModal}
        onClose={() => setShowPettyModal(false)}
        onSave={() => { }}
        form={pettyDenomForm}
      />
      
      <ForeignCurrencyModal
        isOpen={showForeignModal}
        onClose={() => setShowForeignModal(false)}
        onSave={() => { }}
        form={foreignDenomForm}
      />
      
      <PettySurrenderModal
        isOpen={showInitialSurrenderModal}
        onClose={() => setShowInitialSurrenderModal(false)}
        title="Initial Cash Surrender"
        onSubmit={handleSurrenderInitial}
      />
      
      <PettySurrenderModal
        isOpen={showAdditionalSurrenderModal}
        onClose={() => setShowAdditionalSurrenderModal(false)}
        title="Additional Cash Surrender"
        onSubmit={handleSurrenderAdditional}
      />
    </section>
  );
};

export default PettyCash;