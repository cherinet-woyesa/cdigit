import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { User, CreditCard, DollarSign, Building, Calendar, Hash } from 'lucide-react';
import { searchService } from '@services/search';
import { useBranch } from '@context/BranchContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import depositService from '@services/transactions/depositService';
import withdrawalService from '@services/transactions/withdrawalService';

interface TransactionSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchType = 'account' | 'token' | 'formReference';
type ServiceType = 'Deposit' | 'Withdrawal' | 'FundTransfer';

export default function TransactionSearchModal({ isOpen, onClose }: TransactionSearchModalProps) {
  const { branch } = useBranch();
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState<SearchType>('token');
  const [serviceType, setServiceType] = useState<ServiceType>('Deposit');
  const [searchValue, setSearchValue] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!branch?.id) {
      toast.error('Please select a branch first');
      return;
    }

    if (!searchValue && searchType !== 'account') {
      toast.error('Please enter a search value');
      return;
    }

    if (searchType === 'account' && !accountNumber) {
      toast.error('Please enter an account number');
      return;
    }

    setLoading(true);
    setSearchResults(null);

    try {
      let result;

      switch (searchType) {
        case 'account':
          result = await searchService.searchByAccount({
            branchId: branch.id,
            serviceName: serviceType,
            accountNumber: accountNumber
          });
          break;

        case 'token':
          result = await searchService.searchByToken({
            branchId: branch.id,
            tokenNumber: searchValue
          });
          break;

        case 'formReference':
          result = await searchService.searchByFormReference({
            branchId: branch.id,
            formReferenceId: searchValue
          });
          break;
      }

      if (result.success && result.data) {
        setSearchResults(result.data);
        toast.success('Transaction found!');
      } else {
        toast.error(result.message || 'No transactions found');
        setSearchResults(null);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (transaction: any) => {
    const serviceType = transaction.transactionType || 'Deposit';
    
    if (serviceType.toLowerCase().includes('deposit')) {
      navigate('/form/cash-deposit', {
        state: {
          updateId: transaction.id,
          formData: {
            accountNumber: transaction.accountNumber,
            accountHolderName: transaction.accountHolderName,
            amount: transaction.amount,
          },
          tokenNumber: transaction.tokenNumber,
          queueNumber: transaction.queueNumber
        }
      });
    } else if (serviceType.toLowerCase().includes('withdrawal')) {
      navigate('/form/cash-withdrawal', {
        state: {
          updateId: transaction.id,
          formData: {
            accountNumber: transaction.accountNumber,
            accountHolderName: transaction.accountHolderName,
            amount: transaction.amount,
          },
          tokenNumber: transaction.tokenNumber,
          queueNumber: transaction.queueNumber
        }
      });
    }
    
    onClose();
  };

  const handleCancelTransaction = async (transaction: any) => {
    setCancellingId(transaction.id);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!cancellingId) return;

    try {
      setLoading(true);
      const transaction = Array.isArray(searchResults) 
        ? searchResults.find((t: any) => t.id === cancellingId)
        : searchResults;

      const serviceType = transaction?.transactionType || 'Deposit';
      let response;

      if (serviceType.toLowerCase().includes('deposit')) {
        response = await depositService.cancelDepositByCustomer(cancellingId);
      } else if (serviceType.toLowerCase().includes('withdrawal')) {
        response = await withdrawalService.cancelWithdrawal(cancellingId);
      }

      if (response?.success) {
        toast.success('Transaction cancelled successfully');
        setShowCancelModal(false);
        setCancellingId(null);
        // Refresh search results
        handleSearch();
      } else {
        toast.error(response?.message || 'Failed to cancel transaction');
      }
    } catch (error: any) {
      console.error('Cancel error:', error);
      toast.error('Failed to cancel transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchValue('');
    setAccountNumber('');
    setSearchResults(null);
    onClose();
  };

  const renderTransaction = (transaction: any, index?: number) => {
    const status = transaction.status || 'Pending';
    const statusColor = status === 'Completed' ? 'green' : status === 'Cancelled' ? 'red' : 'yellow';

    return (
      <div key={transaction.id || index} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        {/* Status Badge */}
        <div className="flex justify-between items-start mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${statusColor}-100 text-${statusColor}-800`}>
            {status}
          </span>
          {transaction.tokenNumber && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-fuchsia-100 text-fuchsia-800">
              Token: {transaction.tokenNumber}
            </span>
          )}
        </div>

        {/* Transaction Details */}
        <div className="space-y-2 text-sm mb-4">
          <DetailRow icon={User} label="Account Holder" value={transaction.accountHolderName || 'N/A'} />
          <DetailRow icon={CreditCard} label="Account Number" value={transaction.accountNumber || 'N/A'} isMono />
          <DetailRow icon={DollarSign} label="Amount" value={`${(transaction.amount || 0).toFixed(2)} ETB`} isBold />
          <DetailRow icon={Building} label="Branch" value={branch?.name || 'N/A'} />
          {transaction.formReferenceId && (
            <DetailRow icon={Hash} label="Reference ID" value={transaction.formReferenceId} isMono />
          )}
          {transaction.submittedAt && (
            <DetailRow 
              icon={Calendar} 
              label="Submitted" 
              value={new Date(transaction.submittedAt).toLocaleString()} 
            />
          )}
        </div>

        {/* Action Buttons */}
        {status !== 'Cancelled' && status !== 'Completed' && (
          <div className="flex gap-2 pt-3 border-t border-gray-200">
            <button
              onClick={() => handleUpdate(transaction)}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <PencilIcon className="h-4 w-4" />
              Update
            </button>
            <button
              onClick={() => handleCancelTransaction(transaction)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <TrashIcon className="h-4 w-4" />
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-2xl shadow-xl my-8">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <Dialog.Title className="text-2xl font-bold text-fuchsia-700">
                🔍 Search Your Transaction
              </Dialog.Title>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Search Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search By
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setSearchType('token')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      searchType === 'token'
                        ? 'bg-fuchsia-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Token Number
                  </button>
                  <button
                    onClick={() => setSearchType('account')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      searchType === 'account'
                        ? 'bg-fuchsia-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Account Number
                  </button>
                  <button
                    onClick={() => setSearchType('formReference')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      searchType === 'formReference'
                        ? 'bg-fuchsia-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Form Reference
                  </button>
                </div>
              </div>

              {/* Service Type (only for account search) */}
              {searchType === 'account' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as ServiceType)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  >
                    <option value="Deposit">Deposit</option>
                    <option value="Withdrawal">Withdrawal</option>
                    <option value="FundTransfer">Fund Transfer</option>
                  </select>
                </div>
              )}

              {/* Account Number Input (for account search) */}
              {searchType === 'account' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter your account number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  />
                </div>
              )}

              {/* Search Value Input */}
              {searchType !== 'account' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {searchType === 'token' ? 'Token Number' : 'Form Reference ID'}
                  </label>
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={
                      searchType === 'token'
                        ? 'Enter your token number (e.g., A001)'
                        : 'Enter form reference ID (e.g., dep-1234567890)'
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  />
                </div>
              )}

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 hover:from-fuchsia-700 hover:to-fuchsia-800 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Searching...
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    Search Transaction
                  </>
                )}
              </button>

              {/* Search Results */}
              {searchResults && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Search Results
                  </h3>
                  {Array.isArray(searchResults) ? (
                    searchResults.length > 0 ? (
                      searchResults.map((transaction, index) => renderTransaction(transaction, index))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No transactions found</p>
                    )
                  ) : (
                    renderTransaction(searchResults)
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Cancel Confirmation Modal */}
      <Dialog open={showCancelModal} onClose={() => setShowCancelModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-xl shadow-xl p-6">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              Confirm Cancellation
            </Dialog.Title>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this transaction? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                No, Keep It
              </button>
              <button
                onClick={confirmCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}

// Helper component for detail rows
function DetailRow({ icon: Icon, label, value, isMono = false, isBold = false }: {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  isMono?: boolean;
  isBold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="font-medium text-gray-700 flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-500" />
        {label}:
      </span>
      <span className={`text-right ${isMono ? 'font-mono' : ''} ${isBold ? 'text-lg font-bold text-fuchsia-700' : 'font-semibold text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}
