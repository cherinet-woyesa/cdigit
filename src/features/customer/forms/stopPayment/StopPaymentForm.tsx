
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import stopPaymentService from '../../../../services/stopPaymentService';
import { useUserAccounts } from '../../../../hooks/useUserAccounts';
import { toast } from 'react-toastify';
// import { ArrowLeft } from 'lucide-react';
import { SPOForm } from './components/SPOForm';
import { RSPOForm } from './components/RSPOForm';

const StopPaymentForm: React.FC = () => {
  const [mode, setMode] = useState<'spo' | 'rspo'>('spo');
  // const [isLoading, setIsLoading] = useState(false);
  // Use real accounts from backend
  const { accounts, loadingAccounts } = useUserAccounts();
  // Map Account[] to CustomerAccount[] for SPOForm compatibility
  const customerAccounts = accounts.map(acc => {
    const a = acc as any;
    return {
      accountNumber: a.accountNumber,
      accountType: a.accountType || a.TypeOfAccount || 'N/A',
      balance: a.balance ?? a.Balance ?? a.availableBalance ?? 0,
      currency: a.currency || a.Currency || 'ETB',
      status: a.status || a.Status || 'active',
    };
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSpo, setSelectedSpo] = useState<any>(null);
  const [signature, setSignature] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleDateString();



  // Handle SPO form submission
  const onSubmitSpo = async (data: any) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const selectedAccount = customerAccounts.find(acc => acc.accountNumber === data.accountNumber);
      const requestData = {
        type: 'SPO' as const,
        accountNumber: data.accountNumber,
        customerName: `${user.firstName} ${user.lastName}`.trim() || 'Customer',
        accountBalance: selectedAccount?.balance || 0,
        chequeNumber: data.chequeNumber,
        amount: parseFloat(data.amount),
        chequeDate: data.chequeDate,
        reason: data.reason,
        branchName: user.branchId || 'N/A',
        signatureData: signature,
        verifiedBy: user.id,
        approvedBy: user.id,
      };
      const response = await stopPaymentService.submitStopPaymentOrder(requestData);
      if (response && response.success && response.data) {
        toast.success('Stop Payment Order submitted successfully');
        navigate('/form/stop-payment/confirmation', {
          state: { request: response.data },
        });
      } else {
        throw new Error('Failed to submit Stop Payment Order');
      }
    } catch (error: any) {
      console.error('Error submitting SPO:', error);
      toast.error(error.message || 'Failed to submit Stop Payment Order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle RSPO form submission
  const onSubmitRspo = async () => {
    if (!user || !selectedSpo) return;
    setIsSubmitting(true);
    try {
      const response = await stopPaymentService.submitRevokeStopPaymentOrder(
        selectedSpo.id,
        {
          verifiedBy: user.id,
          approvedBy: user.id,
          signatureData: signature,
        }
      );
      if (response && response.success && 'data' in response && response.data && response.data.rspo) {
        toast.success('Stop Payment Order revoked successfully');
        navigate('/form/stop-payment/confirmation', {
          state: { 
            request: response.data.rspo,
            isRevoke: true,
          },
        });
      } else {
        throw new Error('Failed to revoke Stop Payment Order');
      }
    } catch (error: any) {
      console.error('Error revoking SPO:', error);
      toast.error(error.message || 'Failed to revoke Stop Payment Order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle search for RSPO
  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await stopPaymentService.searchStopPaymentOrders({
        accountNumber: searchTerm,
        chequeNumber: searchTerm,
      });
      if (response.success) {
        const activeSpos = response.data.filter(
          (spo: any) => spo.status === 'approved' && spo.type === 'SPO'
        );
        setSearchResults(activeSpos);
      }
    } catch (error) {
      console.error('Error searching SPOs:', error);
      toast.error('Failed to search Stop Payment Orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle SPO selection in RSPO mode
  const handleSelectSpo = (spo: any) => {
    setSelectedSpo(spo);
  };

  // Toggle between SPO and RSPO modes
  const toggleMode = (newMode: 'spo' | 'rspo') => {
    setMode(newMode);
    setSearchResults([]);
    setSelectedSpo(null);
    setSignature('');
  };

  // Handle signature capture (simplified)
  const handleSignatureCapture = () => {
    setSignature('signature-data-mock');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6">
      <div className="max-w-4xl w-full bg-white p-4 sm:p-6 rounded-lg shadow-lg">
        <div className="mb-4 sm:mb-6 bg-fuchsia-700 text-white p-3 sm:p-4 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{mode === 'spo' ? 'Stop Payment Order (SPO)' : 'Revoke Stop Payment Order (RSPO)'}</h1>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-2">
            <span className="bg-fuchsia-900 px-3 py-1 rounded text-xs sm:text-sm font-semibold">Branch: {user?.branchId || 'N/A'}</span>
            <span className="bg-fuchsia-900 px-3 py-1 rounded text-xs sm:text-sm font-semibold">Date: {currentDate}</span>
          </div>
          <p className="mt-1 text-sm text-fuchsia-100">
            {mode === 'spo'
              ? 'Request to stop payment on a specific cheque'
              : 'Revoke a previously issued stop payment order'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`py-2 px-4 font-medium ${
              mode === 'spo'
                ? 'text-fuchsia-700 border-b-2 border-fuchsia-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => toggleMode('spo')}
          >
            Stop Payment Order (SPO)
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              mode === 'rspo'
                ? 'text-fuchsia-700 border-b-2 border-fuchsia-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => toggleMode('rspo')}
          >
            Revoke Stop Payment (RSPO)
          </button>
        </div>

        {/* Form Content */}
        {mode === 'spo' ? (
          <SPOForm
            onSubmit={onSubmitSpo}
            isLoading={isSubmitting || loadingAccounts}
            customerAccounts={customerAccounts}
            signature={signature}
            onSignatureCapture={handleSignatureCapture}
          />
        ) : (
          <RSPOForm
            onSubmit={onSubmitRspo}
            isLoading={isSubmitting}
            searchResults={searchResults}
            selectedSpo={selectedSpo}
            onSelectSpo={handleSelectSpo}
            onSearch={handleSearch}
            signature={signature}
            onSignatureCapture={handleSignatureCapture}
          />
        )}
      </div>
    </div>
  );
};

export default StopPaymentForm;
