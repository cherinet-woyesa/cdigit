import React from 'react';
import { useAccountSearch } from '@features/maker/hooks/useAccountSearch';
import SearchBar from '@features/maker/components/sections/AccountSearch/SearchBar';
import ResultsTable from '@features/maker/components/sections/AccountSearch/ResultsTable';
import BlockRecoverModal from '@features/maker/components/sections/AccountSearch/BlockRecoverModal';

const AccountSearch: React.FC = () => {
  const {
    // State
    query,
    setQuery,
    results,
    loading,
    selectedAccount,
    popupMode,
    reason,
    setReason,
    
    // Actions
    handleSearch,
    handleBlock,
    handleRecover,
    openBlockPopup,
    openRecoverPopup,
    closePopup
  } = useAccountSearch();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        🔍 Search Account by Name / Phone / Account #
      </h2>

      <SearchBar
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        loading={loading}
      />

      <ResultsTable
        results={results}
        onBlock={openBlockPopup}
        onRecover={openRecoverPopup}
      />

      <BlockRecoverModal
        isOpen={!!popupMode}
        mode={popupMode}
        account={selectedAccount}
        reason={reason}
        onReasonChange={setReason}
        onConfirm={popupMode === 'block' ? handleBlock : handleRecover}
        onCancel={closePopup}
      />
    </div>
  );
};

export default AccountSearch;