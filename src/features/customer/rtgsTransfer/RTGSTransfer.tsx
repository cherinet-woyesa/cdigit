import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Field } from '../accountOpening/components/FormElements';
import { fetchWindowsByBranch } from '../../../services/windowService';
import type { Window as WindowType } from '../../../services/windowService';

const API_BASE_URL = 'http://localhost:5268/api';

// List of Ethiopian banks (can be fetched from an API in production)
const BANKS = [
  'Commercial Bank of Ethiopia',
  'Awash International Bank',
  'Dashen Bank',
  'Abyssinia Bank',
  'Nib International Bank',
  'Bank of Abyssinia',
  'Wegagen Bank',
  'United Bank',
  'Zemen Bank',
  'Berhan Bank',
  'Abay Bank',
  'Bunna Bank',
  'Addis International Bank',
  'ZamZam Bank',
  'Shabelle Bank',
  'Tsedey Bank',
  'Enat Bank',
  'Lion International Bank',
  'Oromia International Bank',
  'Zemen Bank',
  'Cooperative Bank of Oromia'
];

type FormData = {
  branchName: string;
  date: string;
  orderingAccountNumber: string;
  orderingCustomerName: string;
  beneficiaryBank: string;
  beneficiaryBranch: string;
  beneficiaryAccountNumber: string;
  beneficiaryName: string;
  transferAmount: string;
  paymentNarrative: string;
  customerTelephone: string;
  digitalSignature: string;
};

type Errors = Partial<Record<keyof FormData, string>>;

export default function RTGSTransferForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    branchName: user?.branchName || 'Ayer Tena Branch', // Default, will be overridden if available in user context
    date: new Date().toISOString().split('T')[0],
    orderingAccountNumber: '',
    orderingCustomerName: '',
    beneficiaryBank: '',
    beneficiaryBranch: '',
    beneficiaryAccountNumber: '',
    beneficiaryName: '',
    transferAmount: '',
    paymentNarrative: '',
    customerTelephone: user?.phone || '',
    digitalSignature: '',
  });

  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [windows, setWindows] = useState<WindowType[]>([]);
  const [customerAccounts, setCustomerAccounts] = useState<Array<{
    accountNumber: string;
    accountName: string;
  }>>([]);
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const ABIY_BRANCH_ID = 'a3d3e1b5-8c9a-4c7c-a1e3-6b3d8f4a2b2c';

  useEffect(() => {
    // In a real app, this would fetch the teller's branch from their session
    if (user?.branchName) {
      setFormData(prev => ({
        ...prev,
        branchName: user.branchName
      }));
    }

    // Fetch available windows
    const loadWindows = async () => {
      try {
        const windowsData = await fetchWindowsByBranch(ABIY_BRANCH_ID);
        setWindows(windowsData);
      } catch (error) {
        console.error('Error loading windows:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWindows();
  }, [user]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If phone number changes and is valid, fetch customer accounts
    if (name === 'customerTelephone' && /^\d{9,12}$/.test(value)) {
      // Simulate API call to fetch customer accounts
      setTimeout(() => {
        // Mock data - in a real app, this would be an API call
        const mockAccounts = [
          { accountNumber: '1000123456789', accountName: 'John Doe' },
          { accountNumber: '1000987654321', accountName: 'John Doe Business' },
        ];
        
        setCustomerAccounts(mockAccounts);
        
        if (mockAccounts.length === 1) {
          // Auto-select if only one account
          setFormData(prev => ({
            ...prev,
            [name]: value,
            orderingAccountNumber: mockAccounts[0].accountNumber,
            orderingCustomerName: mockAccounts[0].accountName
          }));
        } else if (mockAccounts.length > 1) {
          // Show account selection if multiple accounts
          setShowAccountSelection(true);
          setFormData(prev => ({
            ...prev,
            [name]: value,
            orderingAccountNumber: '',
            orderingCustomerName: ''
          }));
        }
      }, 500);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAccountSelect = (account: { accountNumber: string; accountName: string }) => {
    setFormData(prev => ({
      ...prev,
      orderingAccountNumber: account.accountNumber,
      orderingCustomerName: account.accountName
    }));
    setShowAccountSelection(false);
  };

  const validateAll = (): boolean => {
    const errs: Errors = {};
    
    // Required fields validation
    const requiredFields: (keyof FormData)[] = [
      'orderingAccountNumber', 'orderingCustomerName', 'beneficiaryBank',
      'beneficiaryBranch', 'beneficiaryAccountNumber', 'beneficiaryName',
      'transferAmount', 'paymentNarrative', 'digitalSignature'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        const fieldName = field.split(/(?=[A-Z])/).join(' ');
        errs[field] = `${fieldName} is required.`;
      }
    });

    // Phone number validation (if provided)
    if (formData.customerTelephone && !/^\d{9,12}$/.test(formData.customerTelephone)) {
      errs.customerTelephone = 'Please enter a valid phone number (9-12 digits)';
    }

    // Transfer amount validation
    if (formData.transferAmount) {
      const amount = parseFloat(formData.transferAmount);
      if (isNaN(amount) || amount <= 0) {
        errs.transferAmount = 'Please enter a valid amount';
      }
    }

    // Payment narrative validation
    if (formData.paymentNarrative && (formData.paymentNarrative.length < 10 || formData.paymentNarrative.length > 200)) {
      errs.paymentNarrative = 'Payment narrative must be between 10 and 200 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;
    
    setIsSubmitting(true);
    
    try {
      // Generate a random window number from available windows
      const randomWindow = windows.length > 0 
        ? windows[Math.floor(Math.random() * windows.length)] 
        : { id: '1', name: 'Window 1', branchId: ABIY_BRANCH_ID };

      // Generate form reference ID (RTGS-YYYYMMDD-XXX)
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const refNumber = Math.floor(100 + Math.random() * 900); // Random 3-digit number
      const formReferenceId = `RTGS-${dateStr}-${refNumber}`;

      // Generate token number (RTGS-XXXXXX)
      const tokenNumber = `RTGS-${Math.floor(100000 + Math.random() * 900000)}`;

      const rtgsData = {
        formReferenceId,
        branchId: ABIY_BRANCH_ID,
        windowId: randomWindow.id,
        windowNumber: randomWindow.name.replace('Window ', ''),
        tokenNumber,
        ...formData,
        transferAmount: parseFloat(formData.transferAmount),
        submittedAt: now.toISOString(),
      };

      // In a real app, you would send this to your backend
      console.log('Submitting RTGS transfer:', rtgsData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate to confirmation page with the form data
      navigate('/form/rtgs-transfer/confirmation', { 
        state: { 
          formData: rtgsData,
          windowNumber: randomWindow.name.replace('Window ', '')
        } 
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to submit the form. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cbe-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-cbe-primary mb-6">RTGS Customer Transfer Order</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branch and Date Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-cbe-primary mb-4">Transaction Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Branch Name"
              name="branchName"
              type="text"
              value={formData.branchName}
              onChange={handleChange}
              disabled
            />
            
            <Field
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              disabled
            />
          </div>
        </div>
        
        {/* Customer Information Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-cbe-primary mb-4">Customer Information</h2>
          
          <div className="space-y-4">
            <Field
              label="Customer Telephone *"
              name="customerTelephone"
              type="tel"
              value={formData.customerTelephone}
              onChange={handleChange}
              error={errors.customerTelephone}
              placeholder="0912345678"
            />
            
            {showAccountSelection && customerAccounts.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Account *
                </label>
                <div className="space-y-2">
                  {customerAccounts.map(account => (
                    <div 
                      key={account.accountNumber}
                      className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${
                        formData.orderingAccountNumber === account.accountNumber ? 'border-cbe-primary bg-blue-50' : 'border-gray-300'
                      }`}
                      onClick={() => handleAccountSelect(account)}
                    >
                      <div className="font-medium">{account.accountName}</div>
                      <div className="text-sm text-gray-600">{account.accountNumber}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Field
              label="Account Number *"
              name="orderingAccountNumber"
              type="text"
              value={formData.orderingAccountNumber}
              onChange={handleChange}
              error={errors.orderingAccountNumber}
              disabled={!showAccountSelection}
            />
            
            <Field
              label="Customer Name *"
              name="orderingCustomerName"
              type="text"
              value={formData.orderingCustomerName}
              onChange={handleChange}
              error={errors.orderingCustomerName}
              disabled
            />
          </div>
        </div>
        
        {/* Beneficiary Information Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-cbe-primary mb-4">Beneficiary Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beneficiary Bank *
              </label>
              <select
                name="beneficiaryBank"
                value={formData.beneficiaryBank}
                onChange={handleChange}
                className={`mt-1 block w-full py-2 px-3 border ${
                  errors.beneficiaryBank ? 'border-red-500' : 'border-gray-300'
                } bg-white rounded-md shadow-sm focus:outline-none focus:ring-cbe-primary focus:border-cbe-primary sm:text-sm`}
              >
                <option value="">Select Bank</option>
                {BANKS.map(bank => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
              {errors.beneficiaryBank && (
                <p className="mt-1 text-sm text-red-600">{errors.beneficiaryBank}</p>
              )}
            </div>
            
            <Field
              label="Beneficiary Branch *"
              name="beneficiaryBranch"
              type="text"
              value={formData.beneficiaryBranch}
              onChange={handleChange}
              error={errors.beneficiaryBranch}
            />
            
            <Field
              label="Beneficiary Account Number *"
              name="beneficiaryAccountNumber"
              type="text"
              value={formData.beneficiaryAccountNumber}
              onChange={handleChange}
              error={errors.beneficiaryAccountNumber}
            />
            
            <Field
              label="Beneficiary Name *"
              name="beneficiaryName"
              type="text"
              value={formData.beneficiaryName}
              onChange={handleChange}
              error={errors.beneficiaryName}
            />
            
            <Field
              label="Transfer Amount (ETB) *"
              name="transferAmount"
              type="number"
              value={formData.transferAmount}
              onChange={handleChange}
              error={errors.transferAmount}
              min="1"
              step="0.01"
            />
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Narrative / Purpose *
              </label>
              <textarea
                name="paymentNarrative"
                rows={3}
                value={formData.paymentNarrative}
                onChange={handleChange}
                className={`mt-1 block w-full border ${
                  errors.paymentNarrative ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cbe-primary focus:border-cbe-primary sm:text-sm`}
                placeholder="Enter payment purpose (10-200 characters)"
              />
              {errors.paymentNarrative && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentNarrative}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Digital Signature */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-cbe-primary mb-4">Digital Signature</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Please sign in the box below using your mouse or touch screen
            </p>
            <div className="bg-white border border-gray-300 rounded h-40 mb-4 flex items-center justify-center">
              {/* In a real app, you would integrate a signature pad component here */}
              <p className="text-gray-400">Signature pad will be here</p>
            </div>
            <input
              type="hidden"
              name="digitalSignature"
              value={formData.digitalSignature}
            />
            <div className="flex justify-between">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                onClick={() => {
                  // In a real app, this would clear the signature pad
                  setFormData(prev => ({
                    ...prev,
                    digitalSignature: ''
                  }));
                }}
              >
                Clear Signature
              </button>
              <span className="text-xs text-gray-500 self-center">
                Your signature will be used for verification
              </span>
            </div>
            {errors.digitalSignature && (
              <p className="mt-2 text-sm text-red-600">{errors.digitalSignature}</p>
            )}
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cbe-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cbe-primary hover:bg-cbe-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cbe-primary disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Transfer'}
          </button>
        </div>
        
        {errors.submit && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
