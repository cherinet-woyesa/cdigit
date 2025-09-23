import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';

import { toast } from 'react-toastify';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import FormHeader from './FormHeader';
import CustomerInfoSection from './CustomerInfoSection';
import { cbeBirrService, type CustomerInfo } from '../../../../services/cbeBirrService';
import Field from '../../../../components/Field';

// ID types for dropdown
const ID_TYPES = [
  { value: 'NID', label: 'National ID' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
  { value: 'RESIDENCE_PERMIT', label: 'Residence Permit' },
];

// Action types
const ACTION_TYPES = [
  { value: 'link', label: 'Link Account' },
  { value: 'unlink', label: 'Unlink Account' },
  { value: 'change_phone', label: 'Change Phone Number' },
  { value: 'modify_end_date', label: 'Modify End Date' },
];

const CbeBirrLinkForm: React.FC = () => {
  // const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    actionType: 'link' as 'link' | 'unlink' | 'change_phone' | 'modify_end_date',
    idNumber: '',
    idType: 'NID',
    idIssueDate: '',
    idExpiryDate: '',
    newPhoneNumber: '',
    newEndDate: '',
    selectedAccounts: [] as string[],
    termsAccepted: false,
    formRefId: '', // Added Form Ref ID placeholder
  });

  // Auto-fill branch and date
  const branchName = user?.branchId || 'Head Office';
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Handle customer search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setSearching(true);
    try {
      const customer = await cbeBirrService.getCustomerInfo(searchTerm);
      if (customer) {
        setCustomerInfo(customer);
        // Auto-fill form with customer data
        setFormData(prev => ({
          ...prev,
          idNumber: customer.idNumber,
          idType: customer.idType,
          idIssueDate: customer.idIssueDate,
          idExpiryDate: customer.idExpiryDate || '',
        }));
        setStep(2);
      } else {
        toast.error('Customer not found. Please check the ID or phone number.');
      }
    } catch (error) {
      console.error('Error searching for customer:', error);
      toast.error('Failed to fetch customer information');
    } finally {
      setSearching(false);
    }
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Only allow selection of active accounts
  const toggleAccount = (accountNumber: string) => {
    if (!customerInfo) return;
    const account = customerInfo.accounts.find(acc => acc.accountNumber === accountNumber);
    if (!account || account.status !== 'active') {
      toast.error('Only active accounts can be linked or unlinked.');
      return;
    }
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
    if (!customerInfo) return;
    
    setFormData(prev => ({
      ...prev,
      selectedAccounts: selectAll 
        ? customerInfo.accounts.map(acc => acc.accountNumber) 
        : []
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo || !user) return;
    
    // Validate form
    if (formData.actionType === 'link' && formData.selectedAccounts.length === 0) {
      toast.error('Please select at least one account to link');
      return;
    }
    
    if (formData.actionType === 'change_phone' && !formData.newPhoneNumber) {
      toast.error('Please enter a new phone number');
      return;
    }
    
    if (!formData.termsAccepted) {
      toast.error('You must accept the terms and conditions');
      return;
    }
    
    setLoading(true);
    
    try {
      const requestData = {
        branchName,
        customerId: customerInfo.customerId,
        fullName: customerInfo.fullName,
        idNumber: formData.idNumber,
        idType: formData.idType,
        idIssueDate: formData.idIssueDate,
        idExpiryDate: formData.idExpiryDate || undefined,
        actionType: formData.actionType,
        accounts: formData.selectedAccounts,
        currentPhoneNumber: customerInfo.phoneNumber,
        newPhoneNumber: formData.newPhoneNumber || undefined,
        newEndDate: formData.newEndDate || undefined,
        termsAccepted: formData.termsAccepted,
  makerId: user.id,
  makerName: `${user.firstName} ${user.lastName}`.trim() || 'System User',
        makerDate: new Date().toISOString(),
      };
      
      const result = await cbeBirrService.submitLinkRequest(requestData);
      
      if (result.success) {
        navigate('/form/cbe-birr-link/confirmation', {
          state: { request: result.data }
        });
      }
    } catch (error) {
      console.error('Error submitting CBE-Birr link request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render customer search step
  const renderSearchStep = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <FormHeader title="CBE-Birr & Bank Account Link Application" branchName={branchName} currentDate={currentDate} />
      <h2 className="text-xl font-semibold mb-4 text-fuchsia-700">Customer Search</h2>
      <p className="text-gray-600 mb-6">
        Please enter the customer's ID number, phone number, or account number to begin.
      </p>
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">
            Search by ID, Phone, or Account Number
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              id="searchTerm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500"
              placeholder="Enter ID, phone, or account number"
              required
            />
            <button
              type="submit"
              disabled={searching || !searchTerm.trim()}
              className="px-4 py-2 bg-fuchsia-700 text-white rounded-md hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  // Render customer information step
  const renderCustomerInfoStep = () => {
    if (!customerInfo) return null;
    return (
      <div className="space-y-6">
        <FormHeader title="CBE-Birr & Bank Account Link Application" branchName={branchName} currentDate={currentDate} />
        <CustomerInfoSection customerInfo={customerInfo} />
        {/* Form Ref ID (display only, generated on submit) */}
        <div className="bg-white p-4 rounded-lg shadow flex items-center gap-4 mb-4">
          <span className="font-semibold text-fuchsia-700">Form Ref ID:</span>
          <span className="text-gray-500">(Will be generated upon submission)</span>
        </div>
        {/* Account Selection */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-fuchsia-700">Account Selection</h2>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Accounts to {formData.actionType === 'unlink' ? 'Unlink' : 'Link'}
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => toggleAllAccounts(true)}
                  className="text-xs text-fuchsia-700 hover:text-fuchsia-900"
                >
                  Select All
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => toggleAllAccounts(false)}
                  className="text-xs text-fuchsia-700 hover:text-fuchsia-900"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <div 
                className="p-3 bg-gray-50 border-b cursor-pointer flex justify-between items-center"
                onClick={() => setShowAccounts(!showAccounts)}
              >
                <span className="font-medium">
                  {formData.selectedAccounts.length} account(s) selected
                </span>
                {showAccounts ? <ChevronUp size={20} className="text-fuchsia-700" /> : <ChevronDown size={20} className="text-fuchsia-700" />}
              </div>
              
              {showAccounts && (
                <div className="max-h-60 overflow-y-auto">
                  {customerInfo.accounts.map(account => (
                    <div 
                      key={account.accountNumber}
                      className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${formData.selectedAccounts.includes(account.accountNumber) ? 'bg-fuchsia-50' : ''}`}
                      onClick={() => toggleAccount(account.accountNumber)}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.selectedAccounts.includes(account.accountNumber)}
                          onChange={() => toggleAccount(account.accountNumber)}
                          className="h-4 w-4 text-fuchsia-700 rounded border-gray-300 focus:ring-fuchsia-500 mr-2"
                          disabled={account.status !== 'active'}
                        />
                        <div>
                          <div className="font-medium">{account.accountNumber}</div>
                          <div className="text-sm text-gray-500">
                            {account.accountType} • {account.currency} • {account.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Action Type */}
          <div className="mb-4">
            <label htmlFor="actionType" className="block text-sm font-medium text-gray-700 mb-1">
              Request Type
            </label>
            <select
              id="actionType"
              name="actionType"
              value={formData.actionType}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500"
              required
            >
              {ACTION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Conditional Fields Based on Action Type */}
          {formData.actionType === 'change_phone' && (
            <div className="mb-4">
              <Field label="New Phone Number" required>
                <input
                  type="tel"
                  name="newPhoneNumber"
                  value={formData.newPhoneNumber}
                  onChange={handleChange}
                  placeholder="+251XXXXXXXXX"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  pattern="^\+251[0-9]{9}$"
                  title="Phone number must be in the format +251XXXXXXXXX"
                />
                {formData.newPhoneNumber && !/^\+251[0-9]{9}$/.test(formData.newPhoneNumber) && (
                  <p className="mt-1 text-sm text-red-600">Phone number must be in the format +251XXXXXXXXX</p>
                )}
              </Field>
            </div>
          )}
          
          {formData.actionType === 'modify_end_date' && (
            <div className="mb-4">
              <Field label="New End Date" required>
                <input
                  type="date"
                  name="newEndDate"
                  value={formData.newEndDate}
                  onChange={handleChange}
                  min={currentDate}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
              </Field>
            </div>
          )}
          
          {/* ID Information */}
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-lg font-medium mb-4">ID Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="idType" className="block text-sm font-medium text-gray-700 mb-1">
                  ID Type
                </label>
                <select
                  id="idType"
                  name="idType"
                  value={formData.idType}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {ID_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <Field label="ID Number" required>
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  required
                // formRefId removed; not needed in request data
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
              </Field>
              <Field label="Issue Date" required>
                <input
                  type="date"
                  name="idIssueDate"
                  value={formData.idIssueDate}
                  onChange={handleChange}
                  max={currentDate}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
              </Field>
              <Field label="Expiry Date (if any)">
                <input
                  type="date"
                  name="idExpiryDate"
                  value={formData.idExpiryDate}
                  onChange={handleChange}
                  min={formData.idIssueDate || currentDate}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </Field>
            </div>
          </div>
          
          {/* Terms and Conditions */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="termsAccepted"
                  name="termsAccepted"
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="h-4 w-4 text-fuchsia-700 border-gray-300 rounded focus:ring-fuchsia-500"
                  required
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="termsAccepted" className="font-medium text-gray-700">
                  I agree to the terms and conditions
                </label>
                <p className="text-gray-500">
                  By checking this box, I confirm that all the information provided is accurate and I understand the implications of this request.
                </p>
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-fuchsia-700 bg-white hover:bg-gray-50"
            >
              Back
            </button>
            
            <div className="space-x-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-fuchsia-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || (formData.actionType === 'link' && formData.selectedAccounts.length === 0) || !formData.termsAccepted}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-fuchsia-700 hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 inline" />
                    Submitting...
                  </>
                ) : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex items-center ${step >= 1 ? 'text-fuchsia-700' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-fuchsia-700 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <div className="ml-2 text-sm font-medium">Customer Search</div>
          </div>
          <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-fuchsia-700' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center ${step >= 2 ? 'text-fuchsia-700' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-fuchsia-700 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <div className="ml-2 text-sm font-medium">Account Selection</div>
          </div>
        </div>
      </div>
      {/* Form Content */}
      {step === 1 ? renderSearchStep() : renderCustomerInfoStep()}
    </div>
  );
};

export default CbeBirrLinkForm;
