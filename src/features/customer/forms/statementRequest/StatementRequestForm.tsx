import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Loader2, Mail, Check, X, Plus, Trash2 } from 'lucide-react';
import { statementService } from '../../../../services/statementService';
import { useUserAccounts } from '../../../../hooks/useUserAccounts';
import Field from '../../../../components/Field';

// Statement frequency options
const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

const StatementRequestForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    accounts,
    loadingAccounts,
  } = useUserAccounts();
  const [signature, setSignature] = useState('');
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<{ selectedAccounts?: string; emailAddresses?: string; signature?: string; termsAccepted?: string }>({});

  // Form state
  const [formData, setFormData] = useState({
    emailAddresses: [''] as string[],
    statementFrequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly',
    selectedAccounts: [] as string[],
    termsAccepted: false,
  });

  // Auto-fill branch and date
  const branchName = user?.branchId || 'Head Office';
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Handle email input changes
  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...formData.emailAddresses];
    newEmails[index] = value;
    setFormData(prev => ({
      ...prev,
      emailAddresses: newEmails
    }));
  };

  // Add new email field
  const addEmailField = () => {
    setFormData(prev => ({
      ...prev,
      emailAddresses: [...prev.emailAddresses, '']
    }));
  };

  // Remove email field
  const removeEmailField = (index: number) => {
    if (formData.emailAddresses.length <= 1) return; // Keep at least one email field
    
    const newEmails = formData.emailAddresses.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      emailAddresses: newEmails
    }));
  };

  // Handle account selection
  const toggleAccount = (accountNumber: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedAccounts.includes(accountNumber);
      return {
        ...prev,
        selectedAccounts: isSelected
          ? prev.selectedAccounts.filter(acc => acc !== accountNumber)
          : [...prev.selectedAccounts, accountNumber]
      };
    });
  };

  // Handle select all/none for accounts
  const toggleAllAccounts = (selectAll: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedAccounts: selectAll 
        ? accounts.map(acc => acc.accountNumber)
        : []
    }));
  };

  // Handle signature capture (simplified - in a real app, use a proper signature pad component)
  const handleSignatureCapture = () => {
    // In a real app, this would open a signature pad component
    // For now, we'll just simulate a signature capture
    setSignature('captured');
    toast.success('Signature captured successfully');
  };

  // Step 1 validation
  const validateStep1 = () => {
    const errs: typeof errors = {};
    if (formData.selectedAccounts.length === 0) {
      errs.selectedAccounts = 'Please select at least one account';
    }
    const emailValidation = statementService.validateEmails(
      formData.emailAddresses.filter(email => email.trim() !== '')
    );
    if (!emailValidation.valid) {
      errs.emailAddresses = `Invalid email format: ${emailValidation.invalidEmails.join(', ')}`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 validation
  const validateStep2 = () => {
    const errs: typeof errors = {};
    if (!signature) {
      errs.signature = 'Please provide your digital signature';
    }
    if (!formData.termsAccepted) {
      errs.termsAccepted = 'You must accept the terms and conditions';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step navigation
  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const handleBack = () => setStep(1);

  // Final submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
  // No need for setLoading, use loadingAccounts for UI
    try {
      const selectedAccountsDetails = accounts.filter(acc => 
        formData.selectedAccounts.includes(acc.accountNumber)
      );
      const result = await statementService.submitStatementRequest({
        branchName,
  branchCode: selectedAccountsDetails[0]?.branchId || '100',
        customerId: user?.id || 'CUSTOMER_ID',
  customerName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer',
        accountNumbers: formData.selectedAccounts,
        emailAddresses: formData.emailAddresses.filter(email => email.trim() !== ''),
        statementFrequency: formData.statementFrequency,
        termsAccepted: formData.termsAccepted,
        signature: signature,
        makerId: user?.id || 'SYSTEM',
  makerName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'System User',
        makerDate: new Date().toISOString(),
      });
      if (result.success) {
        navigate('/form/statement-request/confirmation', {
          state: { request: result.data }
        });
      }
    } catch (error) {
      console.error('Error submitting statement request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
  // No need for setLoading, use loadingAccounts for UI
    }
  };

  // Render email fields
  const renderEmailFields = () => (
    <div className="space-y-3">
      {formData.emailAddresses.map((email, index) => (
        <div key={index} className="flex items-center space-x-2">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter email address"
                required={index === 0}
              />
            </div>
            {email && !statementService.validateEmail(email) && (
              <p className="mt-1 text-sm text-red-600">Please enter a valid email address</p>
            )}
          </div>
          {formData.emailAddresses.length > 1 && (
            <button
              type="button"
              onClick={() => removeEmailField(index)}
              className="p-2 text-red-500 hover:text-red-700"
              aria-label="Remove email"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      ))}
      
      <button
        type="button"
        onClick={addEmailField}
        className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
      >
        <Plus size={16} className="mr-1" /> Add another email address
      </button>
    </div>
  );

  // Render account selection
  const renderAccountSelection = () => (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Accounts for Statement
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => toggleAllAccounts(true)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Select All
          </button>
          <span>|</span>
          <button
            type="button"
            onClick={() => toggleAllAccounts(false)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
        </div>
      </div>
      
      <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
        {loadingAccounts ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
          </div>
        ) : accounts.length > 0 ? (
          accounts.map((account) => (
            <div 
              key={account.accountNumber}
              className={`p-3 border rounded-md cursor-pointer transition-colors ${
                formData.selectedAccounts.includes(account.accountNumber)
                  ? 'bg-blue-50 border-blue-200'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => toggleAccount(account.accountNumber)}
            >
              <div className="flex items-center">
                <div className={`flex items-center justify-center h-5 w-5 rounded border mr-3 ${
                  formData.selectedAccounts.includes(account.accountNumber)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300'
                }`}>
                  {formData.selectedAccounts.includes(account.accountNumber) && (
                    <Check size={14} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{account.accountHolderName}</span>
                    <span className="text-sm text-gray-500">{account.accountType}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {account.accountNumber} • {account.accountType}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            No accounts found for this customer.
          </div>
        )}
      </div>
    </div>
  );

  // Render signature pad (simplified)
  const renderSignaturePad = () => (
    <div className="border-2 border-dashed rounded-lg p-4 text-center">
      {signature ? (
        <div className="py-8 text-green-600">
          <Check size={48} className="mx-auto mb-2" />
          <p>Signature captured successfully</p>
          <button
            type="button"
            onClick={() => setSignature('')}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Clear and retry
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Please sign in the box below to authorize this request
          </p>
          <button
            type="button"
            onClick={handleSignatureCapture}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Click to Sign
          </button>
          <p className="mt-2 text-xs text-gray-500">
            Your signature is required to process this request
          </p>
        </div>
      )}
      {errors.signature && <p className="mt-2 text-sm text-red-600">{errors.signature}</p>}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white shadow-lg rounded-lg">
      <div className="mb-4 sm:mb-6 bg-fuchsia-700 text-white p-3 sm:p-4 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Statement Request</h1>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-2">
    <span className="bg-fuchsia-900 px-3 py-1 rounded text-xs sm:text-sm font-semibold">Branch: {user?.branchId || 'Head Office'}</span>
          <span className="bg-fuchsia-900 px-3 py-1 rounded text-xs sm:text-sm font-semibold">Date: {currentDate}</span>
        </div>
        <p className="text-white text-sm sm:text-base mt-1">Subscribe to receive periodic account statements via email</p>
      </div>
      {step === 1 && (
        <form onSubmit={handleNext} className="space-y-4 sm:space-y-6">
          {/* Request Information section removed: branch name and date are now in the header */}
          <div className="p-3 sm:p-4 border rounded-lg shadow-sm mt-4 sm:mt-6">
            <h2 className="text-lg sm:text-xl font-semibold text-fuchsia-700 mb-3 sm:mb-4">Account Selection</h2>
            {renderAccountSelection()}
            {errors.selectedAccounts && <p className="mt-2 text-sm text-red-600">{errors.selectedAccounts}</p>}
          </div>
          <div className="p-3 sm:p-4 border rounded-lg shadow-sm mt-4 sm:mt-6">
            <h2 className="text-lg sm:text-xl font-semibold text-fuchsia-700 mb-3 sm:mb-4">Statement Preferences</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Statement Frequency</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FREQUENCY_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center">
                    <input
                      id={`frequency-${option.value}`}
                      name="statementFrequency"
                      type="radio"
                      checked={formData.statementFrequency === option.value}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        statementFrequency: option.value as any
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor={`frequency-${option.value}`} className="ml-3 block text-sm font-medium text-gray-700">{option.label}</label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address(es)</label>
              <p className="text-sm text-gray-500 mb-3">Enter the email address(es) where you'd like to receive your statements</p>
              {renderEmailFields()}
              {errors.emailAddresses && <p className="mt-2 text-sm text-red-600">{errors.emailAddresses}</p>}
            </div>
          </div>
          <div className="pt-3 sm:pt-4">
            <button type="submit" disabled={loadingAccounts} className="w-full bg-fuchsia-700 hover:bg-fuchsia-800 text-white font-bold py-2 sm:py-3 px-4 rounded-lg shadow-lg transition transform duration-200 hover:scale-105 disabled:opacity-50 text-sm sm:text-base">
              Continue
            </button>
          </div>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="p-3 sm:p-4 border rounded-lg shadow-sm">
            <h2 className="text-lg sm:text-xl font-semibold text-fuchsia-700 mb-3 sm:mb-4">Digital Signature</h2>
            {renderSignaturePad()}
          </div>
          <div className="p-3 sm:p-4 border rounded-lg shadow-sm mt-4 sm:mt-6">
            <h2 className="text-lg sm:text-xl font-semibold text-fuchsia-700 mb-3 sm:mb-4">Terms and Conditions</h2>
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="termsAccepted"
                  name="termsAccepted"
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    termsAccepted: e.target.checked
                  }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  required
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="termsAccepted" className="font-medium text-gray-700">I agree to the terms and conditions</label>
                <p className="text-gray-500">By checking this box, I authorize the bank to send electronic statements to the email address(es) provided above. I understand that I may be charged a fee for this service as per the bank's tariff guide.</p>
                {errors.termsAccepted && <p className="mt-2 text-sm text-red-600">{errors.termsAccepted}</p>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3 sm:pt-4">
            <button type="button" onClick={handleBack} className="w-full bg-gray-200 text-fuchsia-800 font-bold py-2 sm:py-3 px-4 rounded-lg shadow-md hover:bg-gray-300 transition">Back</button>
            <button type="submit" disabled={loadingAccounts} className="w-full bg-fuchsia-700 hover:bg-fuchsia-800 text-white font-bold py-2 sm:py-3 px-4 rounded-lg shadow-lg transition transform duration-200 hover:scale-105 disabled:opacity-50 text-sm sm:text-base">
              {loadingAccounts ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 inline" />
                  Submitting...
                </>
              ) : 'Submit Request'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default StatementRequestForm;
