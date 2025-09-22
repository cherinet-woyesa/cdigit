import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Loader2, Mail, Check, X, Plus, Trash2 } from 'lucide-react';
import { statementService, type CustomerAccount } from '../../../../services/statementService';
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
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<CustomerAccount[]>([]);
  const [signature, setSignature] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    emailAddresses: [''] as string[],
    statementFrequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly',
    selectedAccounts: [] as string[],
    termsAccepted: false,
  });

  // Auto-fill branch and date
  const branchName = user?.branchName || 'Head Office';
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Load customer accounts on component mount
  useEffect(() => {
    const loadCustomerAccounts = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const customerAccounts = await statementService.getCustomerAccounts(user.id);
        setAccounts(customerAccounts);
      } catch (error) {
        console.error('Error loading customer accounts:', error);
        toast.error('Failed to load your accounts. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadCustomerAccounts();
  }, [user?.id]);

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (formData.selectedAccounts.length === 0) {
      toast.error('Please select at least one account');
      return;
    }
    
    // Validate emails
    const emailValidation = statementService.validateEmails(
      formData.emailAddresses.filter(email => email.trim() !== '')
    );
    
    if (!emailValidation.valid) {
      toast.error(`Invalid email format: ${emailValidation.invalidEmails.join(', ')}`);
      return;
    }
    
    if (!signature) {
      toast.error('Please provide your digital signature');
      return;
    }
    
    if (!formData.termsAccepted) {
      toast.error('You must accept the terms and conditions');
      return;
    }
    
    setLoading(true);
    
    try {
      // Get selected accounts details
      const selectedAccountsDetails = accounts.filter(acc => 
        formData.selectedAccounts.includes(acc.accountNumber)
      );
      
      // In a real app, we would submit to the API
      const result = await statementService.submitStatementRequest({
        branchName,
        branchCode: selectedAccountsDetails[0]?.branchCode || '100', // Default to first account's branch
        customerId: user?.id || 'CUSTOMER_ID',
        customerName: user?.name || 'Customer',
        accountNumbers: formData.selectedAccounts,
        emailAddresses: formData.emailAddresses.filter(email => email.trim() !== ''),
        statementFrequency: formData.statementFrequency,
        termsAccepted: formData.termsAccepted,
        signature: signature,
        makerId: user?.id || 'SYSTEM',
        makerName: user?.name || 'System User',
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
      setLoading(false);
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
        {loading ? (
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
                    <span className="font-medium">{account.accountName}</span>
                    <span className="text-sm text-gray-500">{account.currency}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {account.accountNumber} • {account.branchName}
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
          <CheckCircle2 size={48} className="mx-auto mb-2" />
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
    </div>
  );

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Statement Request</h1>
        <p className="mt-1 text-sm text-gray-500">
          Subscribe to receive periodic account statements via email
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Auto-filled Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-medium mb-4">Request Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Branch Name"
              value={branchName}
              readOnly
            />
            <Field
              label="Date"
              value={currentDate}
              readOnly
            />
          </div>
        </div>
        
        {/* Account Selection */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Account Selection</h2>
          {renderAccountSelection()}
        </div>
        
        {/* Statement Preferences */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Statement Preferences</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statement Frequency
            </label>
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
                  <label
                    htmlFor={`frequency-${option.value}`}
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address(es)
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Enter the email address(es) where you'd like to receive your statements
            </p>
            {renderEmailFields()}
          </div>
        </div>
        
        {/* Digital Signature */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Digital Signature</h2>
          {renderSignaturePad()}
        </div>
        
        {/* Terms and Conditions */}
        <div className="bg-white p-6 rounded-lg shadow">
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
              <label htmlFor="termsAccepted" className="font-medium text-gray-700">
                I agree to the terms and conditions
              </label>
              <p className="text-gray-500">
                By checking this box, I authorize the bank to send electronic statements to the 
                email address(es) provided above. I understand that I may be charged a fee for 
                this service as per the bank's tariff guide.
              </p>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3 mt-8">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading || formData.selectedAccounts.length === 0 || !signature || !formData.termsAccepted}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 inline" />
                Submitting...
              </>
            ) : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StatementRequestForm;
