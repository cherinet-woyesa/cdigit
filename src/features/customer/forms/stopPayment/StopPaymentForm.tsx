import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../../../context/AuthContext';
import stopPaymentService from '../../../../services/stopPaymentService';
import { toast } from 'react-toastify';
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle, Search } from 'lucide-react';

// Form validation schemas
const spoSchema = yup.object().shape({
  accountNumber: yup.string().required('Account number is required'),
  chequeNumber: yup
    .string()
    .required('Cheque number is required')
    .matches(/^[0-9]+$/, 'Cheque number must be numeric'),
  amount: yup
    .number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .typeError('Amount must be a number'),
  chequeDate: yup
    .date()
    .required('Cheque date is required')
    .max(new Date(), 'Cheque date cannot be in the future'),
  reason: yup.string().required('Reason is required'),
  termsAccepted: yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
});

const rspoSchema = yup.object().shape({
  searchTerm: yup.string().required('Please enter a search term'),
  selectedSpoId: yup.string().required('Please select a stop payment order to revoke'),
  termsAccepted: yup.boolean().oneOf([true], 'You must accept the terms and conditions'),
});

type FormMode = 'spo' | 'rspo';

const StopPaymentForm: React.FC = () => {
  const [mode, setMode] = useState<FormMode>('spo');
  const [isLoading, setIsLoading] = useState(false);
  const [customerAccounts, setCustomerAccounts] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSpo, setSelectedSpo] = useState<any>(null);
  const [signature, setSignature] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Initialize forms
  const {
    control: spoControl,
    handleSubmit: handleSpoSubmit,
    formState: { errors: spoErrors },
    reset: resetSpoForm,
    watch: watchSpo,
    setValue: setSpoValue,
  } = useForm({
    resolver: yupResolver(spoSchema),
    defaultValues: {
      accountNumber: '',
      chequeNumber: '',
      amount: '',
      chequeDate: '',
      reason: '',
      termsAccepted: false,
    },
  });

  const {
    control: rspoControl,
    handleSubmit: handleRspoSbumit,
    formState: { errors: rspoErrors },
    reset: resetRspoForm,
    setValue: setRspoValue,
  } = useForm({
    resolver: yupResolver(rspoSchema),
    defaultValues: {
      searchTerm: '',
      selectedSpoId: '',
      termsAccepted: false,
    },
  });

  // Load customer accounts on mount
  useEffect(() => {
    const loadCustomerAccounts = async () => {
      if (user?.customerId) {
        setIsLoading(true);
        try {
          // In a real app, fetch customer accounts from the API
          // For now, we'll use mock data
          setCustomerAccounts([
            {
              accountNumber: '1000123456',
              accountType: 'Current Account',
              balance: 50000,
              currency: 'ETB',
            },
          ]);
        } catch (error) {
          console.error('Error loading accounts:', error);
          toast.error('Failed to load accounts');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadCustomerAccounts();
  }, [user]);

  // Handle SPO form submission
  const onSubmitSpo = async (data: any) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const requestData = {
        type: 'SPO' as const,
        accountNumber: data.accountNumber,
        customerName: user.name || 'Customer',
        accountBalance: customerAccounts.find(acc => acc.accountNumber === data.accountNumber)?.balance || 0,
        chequeNumber: data.chequeNumber,
        amount: parseFloat(data.amount),
        chequeDate: data.chequeDate,
        reason: data.reason,
        branchName: user.branchName || 'Unknown Branch',
        signatureData: signature,
        verifiedBy: user.id,
        approvedBy: user.id, // In a real app, this would be set by an approver
      };

      const response = await stopPaymentService.submitStopPaymentOrder(requestData);
      
      if (response.success) {
        toast.success('Stop Payment Order submitted successfully');
        navigate('/form/stop-payment/confirmation', {
          state: { request: response.data },
        });
      } else {
        throw new Error(response.error || 'Failed to submit Stop Payment Order');
      }
    } catch (error: any) {
      console.error('Error submitting SPO:', error);
      toast.error(error.message || 'Failed to submit Stop Payment Order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle RSPO form submission
  const onSubmitRspo = async (data: any) => {
    if (!user || !selectedSpo) return;
    
    setIsSubmitting(true);
    try {
      const response = await stopPaymentService.submitRevokeStopPaymentOrder(
        selectedSpo.id,
        {
          verifiedBy: user.id,
          approvedBy: user.id, // In a real app, this would be set by an approver
          signatureData: signature,
        }
      );
      
      if (response.success) {
        toast.success('Stop Payment Order revoked successfully');
        navigate('/form/stop-payment/confirmation', {
          state: { 
            request: response.data.rspo,
            isRevoke: true,
          },
        });
      } else {
        throw new Error(response.error || 'Failed to revoke Stop Payment Order');
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

    setIsLoading(true);
    try {
      const response = await stopPaymentService.searchStopPaymentOrders({
        accountNumber: searchTerm,
        chequeNumber: searchTerm,
      });
      
      if (response.success) {
        // Filter to only show active SPOs that can be revoked
        const activeSpos = response.data.filter(
          (spo: any) => spo.status === 'approved' && spo.type === 'SPO'
        );
        setSearchResults(activeSpos);
      }
    } catch (error) {
      console.error('Error searching SPOs:', error);
      toast.error('Failed to search Stop Payment Orders');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle SPO selection in RSPO mode
  const handleSelectSpo = (spo: any) => {
    setSelectedSpo(spo);
    setRspoValue('selectedSpoId', spo.id);
  };

  // Toggle between SPO and RSPO modes
  const toggleMode = (newMode: FormMode) => {
    setMode(newMode);
    setSearchResults([]);
    setSelectedSpo(null);
    setSignature('');
    resetSpoForm();
    resetRspoForm();
  };

  // Handle signature capture (simplified - in a real app, use a proper signature pad component)
  const handleSignatureCapture = () => {
    // In a real app, this would capture the signature from a signature pad component
    // For now, we'll just set a mock signature
    setSignature('signature-data-mock');
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-1" /> Back
        </button>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {mode === 'spo' ? 'Stop Payment Order (SPO)' : 'Revoke Stop Payment Order (RSPO)'}
        </h1>
        <p className="text-gray-600">
          {mode === 'spo'
            ? 'Request to stop payment on a specific cheque'
            : 'Revoke a previously issued stop payment order'}
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`py-2 px-4 font-medium ${
              mode === 'spo'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => toggleMode('spo')}
          >
            Stop Payment Order (SPO)
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              mode === 'rspo'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => toggleMode('rspo')}
          >
            Revoke Stop Payment (RSPO)
          </button>
        </div>

        {mode === 'spo' ? (
          // SPO Form
          <form onSubmit={handleSpoSubmit(onSubmitSpo)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Selection */}
              <div className="col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Account Information</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <Controller
                    name="accountNumber"
                    control={spoControl}
                    render={({ field }) => (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select Account
                        </label>
                        <select
                          {...field}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          disabled={isLoading}
                        >
                          <option value="">Select an account</option>
                          {customerAccounts.map((account) => (
                            <option key={account.accountNumber} value={account.accountNumber}>
                              {account.accountNumber} - {account.accountType} ({account.currency} {account.balance?.toLocaleString()})
                            </option>
                          ))}
                        </select>
                        {spoErrors.accountNumber && (
                          <p className="mt-1 text-sm text-red-600">
                            {spoErrors.accountNumber.message}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  {watchSpo('accountNumber') && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Account Holder</p>
                        <p className="font-medium">{user?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Available Balance</p>
                        <p className="font-medium">
                          ETB{' '}
                          {customerAccounts
                            .find((acc) => acc.accountNumber === watchSpo('accountNumber'))
                            ?.balance?.toLocaleString() || '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Branch</p>
                        <p className="font-medium">{user?.branchName || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cheque Details */}
              <div className="col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Cheque Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Controller
                    name="chequeNumber"
                    control={spoControl}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cheque Number
                        </label>
                        <input
                          type="text"
                          {...field}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter cheque number"
                        />
                        {spoErrors.chequeNumber && (
                          <p className="mt-1 text-sm text-red-600">
                            {spoErrors.chequeNumber.message}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="amount"
                    control={spoControl}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount (ETB)
                        </label>
                        <input
                          type="number"
                          {...field}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                        {spoErrors.amount && (
                          <p className="mt-1 text-sm text-red-600">
                            {spoErrors.amount.message}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    name="chequeDate"
                    control={spoControl}
                    render={({ field }) => (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cheque Date
                        </label>
                        <input
                          type="date"
                          {...field}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          max={new Date().toISOString().split('T')[0]}
                        />
                        {spoErrors.chequeDate && (
                          <p className="mt-1 text-sm text-red-600">
                            {spoErrors.chequeDate.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="col-span-2">
                <Controller
                  name="reason"
                  control={spoControl}
                  render={({ field }) => (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Stop Payment
                      </label>
                      <textarea
                        {...field}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Please specify the reason for stopping payment on this cheque"
                      />
                      {spoErrors.reason && (
                        <p className="mt-1 text-sm text-red-600">
                          {spoErrors.reason.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Signature */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digital Signature
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {signature ? (
                    <div className="text-green-600">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2" />
                      <p>Signature captured</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSignatureCapture}
                      className="w-full py-8 bg-gray-50 hover:bg-gray-100 rounded-md border-2 border-dashed border-gray-300 text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-sm">Click to sign</span>
                        <span className="text-xs text-gray-400 mt-1">
                          Your signature is required to process this request
                        </span>
                      </div>
                    </button>
                  )}
                </div>
                {!signature && spoErrors.signatureData && (
                  <p className="mt-1 text-sm text-red-600">Signature is required</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="col-span-2">
                <Controller
                  name="termsAccepted"
                  control={spoControl}
                  render={({ field }) => (
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="terms"
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          {...field}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="terms" className="font-medium text-gray-700">
                          I acknowledge and accept the{' '}
                          <a href="#" className="text-blue-600 hover:text-blue-500">
                            Terms and Conditions
                          </a>{' '}
                          of the Stop Payment Order service. I understand that a fee may apply.
                        </label>
                        {spoErrors.termsAccepted && (
                          <p className="mt-1 text-red-600">
                            {spoErrors.termsAccepted.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={isSubmitting || !signature}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Processing...
                  </>
                ) : (
                  'Submit Stop Payment Order'
                )}
              </button>
            </div>
          </form>
        ) : (
          // RSPO Form
          <form onSubmit={handleRspoSbumit(onSubmitRspo)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Search for Existing SPO */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Search for Stop Payment Order
                </h3>
                <div className="flex space-x-2">
                  <Controller
                    name="searchTerm"
                    control={rspoControl}
                    render={({ field }) => (
                      <div className="flex-1">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            {...field}
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Search by Account Number or Cheque Number"
                            onChange={(e) => {
                              field.onChange(e);
                              handleSearch(e.target.value);
                            }}
                          />
                        </div>
                        {rspoErrors.searchTerm && (
                          <p className="mt-1 text-sm text-red-600">
                            {rspoErrors.searchTerm.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>

                {/* Search Results */}
                {isLoading ? (
                  <div className="mt-4 flex justify-center">
                    <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-500">
                      {searchResults.length} active stop payment order(s) found
                    </p>
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                            >
                              Select
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                              Cheque #
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                              Amount
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                              Date Created
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            >
                              Reason
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {searchResults.map((spo) => (
                            <tr
                              key={spo.id}
                              className={`cursor-pointer ${
                                selectedSpo?.id === spo.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => handleSelectSpo(spo)}
                            >
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                <input
                                  type="radio"
                                  name="selectedSpo"
                                  checked={selectedSpo?.id === spo.id}
                                  onChange={() => handleSelectSpo(spo)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {spo.chequeNumber}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                ETB {spo.amount?.toLocaleString()}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {new Date(spo.dateCreated).toLocaleDateString()}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500">
                                <div className="line-clamp-1">{spo.reason}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {rspoErrors.selectedSpoId && !selectedSpo && (
                      <p className="mt-1 text-sm text-red-600">
                        Please select a stop payment order to revoke
                      </p>
                    )}
                  </div>
                ) : searchResults.length === 0 && rspoControl._formValues.searchTerm ? (
                  <div className="mt-4 text-center py-8 bg-gray-50 rounded-lg">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No stop payment orders found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No active stop payment orders match your search criteria.
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Selected SPO Details */}
              {selectedSpo && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Selected Stop Payment Order
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Account Number</p>
                      <p className="font-medium">{selectedSpo.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cheque Number</p>
                      <p className="font-medium">{selectedSpo.chequeNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-medium">ETB {selectedSpo.amount?.toLocaleString()}</p>
                    </div>
                    <div className="md:col-span-3">
                      <p className="text-sm text-gray-500">Reason for Stop Payment</p>
                      <p className="font-medium">{selectedSpo.reason}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date Created</p>
                      <p className="font-medium">
                        {new Date(selectedSpo.dateCreated).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium capitalize">{selectedSpo.status}</p>
                    </div>
                  </div>

                  {/* Signature for RSPO */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Digital Signature (Required for Revocation)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {signature ? (
                        <div className="text-green-600">
                          <CheckCircle2 className="h-12 w-12 mx-auto mb-2" />
                          <p>Signature captured</p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSignatureCapture}
                          className="w-full py-8 bg-white hover:bg-gray-50 rounded-md border-2 border-dashed border-gray-300 text-gray-500"
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-sm">Click to sign</span>
                            <span className="text-xs text-gray-400 mt-1">
                              Your signature is required to revoke this stop payment order
                            </span>
                          </div>
                        </button>
                      )}
                    </div>
                    {!signature && rspoErrors.signatureData && (
                      <p className="mt-1 text-sm text-red-600">Signature is required</p>
                    )}
                  </div>

                  {/* Terms and Conditions for RSPO */}
                  <div className="mt-6">
                    <Controller
                      name="termsAccepted"
                      control={rspoControl}
                      render={({ field }) => (
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="rspo-terms"
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              {...field}
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="rspo-terms" className="font-medium text-gray-700">
                              I acknowledge that revoking this stop payment order will make the
                              cheque payable again. I understand that I am responsible for any
                              transactions made with this cheque after revocation.
                            </label>
                            {rspoErrors.termsAccepted && (
                              <p className="mt-1 text-red-600">
                                {rspoErrors.termsAccepted.message}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={isSubmitting || !selectedSpo || !signature}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Processing...
                  </>
                ) : (
                  'Revoke Stop Payment Order'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StopPaymentForm;
