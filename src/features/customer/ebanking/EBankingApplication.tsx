import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { Field } from '../accountOpening/components/FormElements';
import { fetchWindowsByBranch } from '../../../../services/windowService';

type FormData = {
  branchName: string;
  date: string;
  accountNumber: string;
  customerName: string;
  mobileNumber: string;
  nationalId: string;
  idType: string;
  idNumber: string;
  issuingAuthority: string;
  idIssueDate: string;
  idExpiryDate: string;
  region: string;
  city: string;
  subCity: string;
  wereda: string;
  houseNumber: string;
  ebankingChannels: string[];
  newPhoneNumber: string;
  newAccountNumber: string;
  termsAccepted: boolean;
  idCopyAttached: boolean;
};

const E_BANKING_OPTIONS = [
  { id: 'mobile_banking', label: 'Mobile Banking' },
  { id: 'internet_banking', label: 'Internet Banking' },
  { id: 'ussd', label: 'USSD Banking' },
  { id: 'card_banking', label: 'Card Banking' },
];

export default function EBankingApplication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    branchName: user?.branchName || 'Ayer Tena Branch',
    date: new Date().toISOString().split('T')[0],
    accountNumber: '',
    customerName: '',
    mobileNumber: user?.phone || '',
    nationalId: '',
    idType: 'national_id',
    idNumber: '',
    issuingAuthority: 'NIRA',
    idIssueDate: '',
    idExpiryDate: '',
    region: '',
    city: '',
    subCity: '',
    wereda: '',
    houseNumber: '',
    ebankingChannels: [],
    newPhoneNumber: '',
    newAccountNumber: '',
    termsAccepted: false,
    idCopyAttached: false,
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'termsAccepted' || name === 'idCopyAttached') {
        setFormData(prev => ({ ...prev, [name]: checked }));
      } else {
        const channel = (e.target as HTMLInputElement).value;
        setFormData(prev => ({
          ...prev,
          ebankingChannels: checked
            ? [...prev.ebankingChannels, channel]
            : prev.ebankingChannels.filter(c => c !== channel)
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.accountNumber) newErrors.accountNumber = 'Account number is required';
    if (!formData.customerName) newErrors.customerName = 'Customer name is required';
    if (!formData.mobileNumber) newErrors.mobileNumber = 'Mobile number is required';
    
    if (!formData.idCopyAttached) {
      if (!formData.idNumber) newErrors.idNumber = 'ID number is required';
      if (!formData.issuingAuthority) newErrors.issuingAuthority = 'Issuing authority is required';
      if (!formData.idIssueDate) newErrors.idIssueDate = 'Issue date is required';
      if (!formData.idExpiryDate) newErrors.idExpiryDate = 'Expiry date is required';
      
      // Address validation if no ID copy is attached
      if (!formData.region) newErrors.region = 'Region is required';
      if (!formData.city) newErrors.city = 'City is required';
      if (!formData.subCity) newErrors.subCity = 'Sub-city is required';
      if (!formData.wereda) newErrors.wereda = 'Wereda is required';
      if (!formData.houseNumber) newErrors.houseNumber = 'House number is required';
    }
    
    if (formData.ebankingChannels.length === 0) {
      newErrors.ebankingChannels = ['Please select at least one e-banking service'];
    }
    
    if (formData.ebankingChannels.includes('change_phone') && !formData.newPhoneNumber) {
      newErrors.newPhoneNumber = 'New phone number is required';
    }
    
    if (formData.ebankingChannels.includes('add_account') && !formData.newAccountNumber) {
      newErrors.newAccountNumber = 'Account number is required';
    }
    
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!showSummary) {
      setShowSummary(true);
      window.scrollTo(0, 0);
      return;
    }
    
    setIsSubmitting(true);
    
    // In a real app, you would submit the form data to your backend here
    console.log('Form submitted:', formData);
    
    // Simulate API call
    setTimeout(() => {
      const formReferenceId = `EB-${Date.now()}`;
      navigate('/form/ebanking/confirmation', { 
        state: { 
          formData: {
            ...formData,
            formReferenceId,
            submittedAt: new Date().toISOString(),
          },
          windowNumber: '3' // This would come from the backend in a real app
        } 
      });
    }, 1000);
  };

  const renderForm = () => (
    <div className="space-y-6">
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

      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-cbe-primary mb-4">Customer Information</h2>
        <div className="space-y-4">
          <Field
            label="Account Number *"
            name="accountNumber"
            type="text"
            value={formData.accountNumber}
            onChange={handleChange}
            error={errors.accountNumber}
          />
          <Field
            label="Customer Name *"
            name="customerName"
            type="text"
            value={formData.customerName}
            onChange={handleChange}
            error={errors.customerName}
          />
          <Field
            label="Mobile Number *"
            name="mobileNumber"
            type="tel"
            value={formData.mobileNumber}
            onChange={handleChange}
            error={errors.mobileNumber}
          />
        </div>
      </div>

      {!formData.idCopyAttached && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-cbe-primary mb-4">ID Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Type *</label>
              <select
                name="idType"
                value={formData.idType}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cbe-primary focus:ring-cbe-primary sm:text-sm"
              >
                <option value="national_id">National ID</option>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
              </select>
            </div>
            <Field
              label="ID Number *"
              name="idNumber"
              type="text"
              value={formData.idNumber}
              onChange={handleChange}
              error={errors.idNumber}
            />
            <Field
              label="Issuing Authority *"
              name="issuingAuthority"
              type="text"
              value={formData.issuingAuthority}
              onChange={handleChange}
              error={errors.issuingAuthority}
            />
            <Field
              label="Issue Date *"
              name="idIssueDate"
              type="date"
              value={formData.idIssueDate}
              onChange={handleChange}
              error={errors.idIssueDate}
            />
            <Field
              label="Expiry Date *"
              name="idExpiryDate"
              type="date"
              value={formData.idExpiryDate}
              onChange={handleChange}
              error={errors.idExpiryDate}
            />
          </div>
        </div>
      )}

      {!formData.idCopyAttached && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-cbe-primary mb-4">Address Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Region *"
              name="region"
              type="text"
              value={formData.region}
              onChange={handleChange}
              error={errors.region}
            />
            <Field
              label="City *"
              name="city"
              type="text"
              value={formData.city}
              onChange={handleChange}
              error={errors.city}
            />
            <Field
              label="Sub-City *"
              name="subCity"
              type="text"
              value={formData.subCity}
              onChange={handleChange}
              error={errors.subCity}
            />
            <Field
              label="Wereda *"
              name="wereda"
              type="text"
              value={formData.wereda}
              onChange={handleChange}
              error={errors.wereda}
            />
            <Field
              label="House Number *"
              name="houseNumber"
              type="text"
              value={formData.houseNumber}
              onChange={handleChange}
              error={errors.houseNumber}
            />
          </div>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-cbe-primary mb-4">E-Banking Services</h2>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Select the services you would like to apply for:</p>
          {errors.ebankingChannels && (
            <p className="text-sm text-red-500">{errors.ebankingChannels[0]}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {E_BANKING_OPTIONS.map(option => (
              <div key={option.id} className="flex items-center">
                <input
                  id={option.id}
                  name="ebankingChannels"
                  type="checkbox"
                  value={option.id}
                  checked={formData.ebankingChannels.includes(option.id)}
                  onChange={handleChange}
                  className="h-4 w-4 text-cbe-primary focus:ring-cbe-primary border-gray-300 rounded"
                />
                <label htmlFor={option.id} className="ml-2 block text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="idCopyAttached"
            name="idCopyAttached"
            type="checkbox"
            checked={formData.idCopyAttached}
            onChange={handleChange}
            className="h-4 w-4 text-cbe-primary focus:ring-cbe-primary border-gray-300 rounded"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="idCopyAttached" className="font-medium text-gray-700">
            I have attached a copy of my ID
          </label>
          <p className="text-gray-500">
            If checked, you can skip the address information section
          </p>
        </div>
      </div>

      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="termsAccepted"
            name="termsAccepted"
            type="checkbox"
            checked={formData.termsAccepted}
            onChange={handleChange}
            className="h-4 w-4 text-cbe-primary focus:ring-cbe-primary border-gray-300 rounded"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="termsAccepted" className="font-medium text-gray-700">
            I agree to the <a href="#" className="text-cbe-primary hover:text-cbe-primary-dark">Terms and Conditions</a> *
          </label>
          {errors.termsAccepted && (
            <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:px-6 bg-gray-50">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Application Summary
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Review your E-Banking application details
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Branch</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formData.branchName}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Account Number</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formData.accountNumber ? `•••• ${formData.accountNumber.slice(-4)}` : 'N/A'}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Customer Name</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formData.customerName}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Mobile Number</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formData.mobileNumber}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Selected Services</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <ul className="list-disc pl-5">
                {formData.ebankingChannels.map(channel => (
                  <li key={channel}>
                    {E_BANKING_OPTIONS.find(opt => opt.id === channel)?.label || channel}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-cbe-primary mb-6">E-Banking Application</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {showSummary ? renderSummary() : renderForm()}
        
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={() => showSummary ? setShowSummary(false) : navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cbe-primary"
          >
            {showSummary ? 'Back to Edit' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cbe-primary hover:bg-cbe-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cbe-primary disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : showSummary ? 'Submit Application' : 'Continue to Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
