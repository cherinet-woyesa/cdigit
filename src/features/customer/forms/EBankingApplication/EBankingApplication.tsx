import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Field from '../../../../components/Field';

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
  const [showTerms, setShowTerms] = useState(false);
  // const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    branchName: 'Ayer Tena Branch',
    date: new Date().toISOString().split('T')[0],
    accountNumber: '',
    customerName: '',
    mobileNumber: '',
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

  type Errors = {
    accountNumber?: string;
    customerName?: string;
    mobileNumber?: string;
    idNumber?: string;
    issuingAuthority?: string;
    idIssueDate?: string;
    idExpiryDate?: string;
    region?: string;
    city?: string;
    subCity?: string;
    wereda?: string;
    houseNumber?: string;
    ebankingChannels?: string;
    newPhoneNumber?: string;
    newAccountNumber?: string;
    termsAccepted?: string;
  };
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(0); // 0: Transaction+Customer, 1: ID, 2: Address, 3: E-Banking Services, 4: ID Copy & Terms, 5: Review/Submit

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'termsAccepted') {
        setFormData(prev => ({ ...prev, [name]: checked }));
        setShowTerms(true);
      } else if (name === 'idCopyAttached') {
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

  const validateStep = (): boolean => {
    const newErrors: Errors = {};
    if (step === 0) {
      // Transaction+Customer step
      if (!formData.accountNumber) newErrors.accountNumber = 'Account number is required';
      if (!formData.customerName) newErrors.customerName = 'Customer name is required';
      if (!formData.mobileNumber) newErrors.mobileNumber = 'Mobile number is required';
    }
    if (step === 1 && !formData.idCopyAttached) {
      if (!formData.idNumber) newErrors.idNumber = 'ID number is required';
      if (!formData.issuingAuthority) newErrors.issuingAuthority = 'Issuing authority is required';
      if (!formData.idIssueDate) newErrors.idIssueDate = 'Issue date is required';
      if (!formData.idExpiryDate) newErrors.idExpiryDate = 'Expiry date is required';
    }
    if (step === 2 && !formData.idCopyAttached) {
      if (!formData.region) newErrors.region = 'Region is required';
      if (!formData.city) newErrors.city = 'City is required';
      if (!formData.subCity) newErrors.subCity = 'Sub-city is required';
      if (!formData.wereda) newErrors.wereda = 'Wereda is required';
      if (!formData.houseNumber) newErrors.houseNumber = 'House number is required';
    }
    if (step === 3) {
      if (formData.ebankingChannels.length === 0) {
        newErrors.ebankingChannels = 'Please select at least one e-banking service';
      }
    }
    if (step === 4) {
      if (!formData.termsAccepted) {
        newErrors.termsAccepted = 'You must accept the terms and conditions';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((prev) => prev + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
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
          windowNumber: '3'
        } 
      });
    }, 1000);
  };

  // Step content function
  function getStepContent() {
    if (step === 0) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-fuchsia-700 mb-4">Transaction & Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Field label="Branch Name">
              <input
                type="text"
                value={formData.branchName}
                disabled
                className="w-full px-3 py-2 border rounded"
              />
            </Field>
            <Field label="Date">
              <input
                type="date"
                value={formData.date}
                disabled
                className="w-full px-3 py-2 border rounded"
              />
            </Field>
          </div>
          <div className="space-y-4">
            <Field label="Account Number *" error={typeof errors.accountNumber === 'string' ? errors.accountNumber : undefined}>
              <input
                name="accountNumber"
                type="text"
                value={formData.accountNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </Field>
            <Field label="Customer Name *" error={typeof errors.customerName === 'string' ? errors.customerName : undefined}>
              <input
                name="customerName"
                type="text"
                value={formData.customerName}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </Field>
            <Field label="Mobile Number *" error={typeof errors.mobileNumber === 'string' ? errors.mobileNumber : undefined}>
              <input
                name="mobileNumber"
                type="tel"
                value={formData.mobileNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </Field>
          </div>
        </div>
      );
    }
  if (step === 1 && !formData.idCopyAttached) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-fuchsia-700 mb-4">ID Information</h2>
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
            <Field label="ID Number *" error={typeof errors.idNumber === 'string' ? errors.idNumber : undefined}>
              <input
                name="idNumber"
                type="text"
                value={formData.idNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </Field>
            <Field label="Issuing Authority *" error={typeof errors.issuingAuthority === 'string' ? errors.issuingAuthority : undefined}>
              <input
                name="issuingAuthority"
                type="text"
                value={formData.issuingAuthority}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </Field>
            <Field label="Issue Date *" error={typeof errors.idIssueDate === 'string' ? errors.idIssueDate : undefined}>
              <input
                name="idIssueDate"
                type="date"
                value={formData.idIssueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </Field>
            <Field label="Expiry Date *" error={typeof errors.idExpiryDate === 'string' ? errors.idExpiryDate : undefined}>
              <input
                name="idExpiryDate"
                type="date"
                value={formData.idExpiryDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </Field>
          </div>
        </div>
      );
    }
  if (step === 2 && !formData.idCopyAttached) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-fuchsia-700 mb-4">Address Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Region *" error={typeof errors.region === 'string' ? errors.region : undefined}>
              <input
                name="region"
                type="text"
                value={formData.region}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </Field>
            <Field label="City *" error={typeof errors.city === 'string' ? errors.city : undefined}>
              <input
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </Field>
            <Field label="Sub-City *" error={typeof errors.subCity === 'string' ? errors.subCity : undefined}>
              <input
                name="subCity"
                type="text"
                value={formData.subCity}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </Field>
            <Field label="Wereda *" error={typeof errors.wereda === 'string' ? errors.wereda : undefined}>
              <input
                name="wereda"
                type="text"
                value={formData.wereda}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </Field>
            <Field label="House Number *" error={typeof errors.houseNumber === 'string' ? errors.houseNumber : undefined}>
              <input
                name="houseNumber"
                type="text"
                value={formData.houseNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </Field>
          </div>
        </div>
      );
    }
  if (step === 3) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-fuchsia-700 mb-4">E-Banking Services</h2>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Select the services you would like to apply for:</p>
          {errors.ebankingChannels && (
            <p className="text-sm text-red-500">{errors.ebankingChannels}</p>
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
                  className="h-4 w-4 text-fuchsia-700 focus:ring-fuchsia-700 border-gray-300 rounded"
                />
                <label htmlFor={option.id} className="ml-2 block text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (step === 4) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-fuchsia-700 mb-4">ID Copy & Terms</h2>
        <div className="flex items-start mb-4">
          <div className="flex items-center h-5">
            <input
              id="idCopyAttached"
              name="idCopyAttached"
              type="checkbox"
              checked={formData.idCopyAttached}
              onChange={handleChange}
              className="h-4 w-4 text-fuchsia-700 focus:ring-fuchsia-700 border-gray-300 rounded"
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
              className="h-4 w-4 text-fuchsia-700 focus:ring-fuchsia-700 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="termsAccepted" className="font-medium text-gray-700">
              I agree to the <button type="button" className="text-fuchsia-700 hover:text-fuchsia-800 underline" onClick={() => setShowTerms(true)}>Terms and Conditions</button> *
            </label>
            {errors.termsAccepted && (
              <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>
            )}
          </div>
        </div>
        {showTerms && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative">
              <h3 className="text-lg font-bold mb-2 text-fuchsia-700">Terms and Conditions</h3>
              <div className="text-sm text-gray-700 mb-4 max-h-64 overflow-y-auto">
                <p>By applying for E-Banking services, you agree to abide by the bank's policies and procedures. You are responsible for keeping your credentials secure. The bank is not liable for unauthorized access due to negligence. For full details, please contact your branch or visit our website.</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>Do not share your PIN or password with anyone.</li>
                  <li>Report suspicious activity immediately.</li>
                  <li>Service availability is subject to bank approval.</li>
                  <li>Fees and charges may apply.</li>
                </ul>
              </div>
              <button type="button" className="absolute top-2 right-2 text-gray-500 hover:text-fuchsia-700" onClick={() => setShowTerms(false)}>&times;</button>
              <button type="button" className="mt-4 px-4 py-2 bg-fuchsia-700 text-white rounded hover:bg-fuchsia-800" onClick={() => setShowTerms(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    );
  }
  if (step === 5) {
    return renderSummary();
  }
    return null;
  }

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
      <div className="text-center mb-6 bg-fuchsia-700 text-white p-4 rounded-lg shadow-lg">
        <h1 className="text-2xl font-extrabold text-white">E-Banking Application</h1>
      </div>
      <form onSubmit={step === 5 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
        {getStepContent()}
        <div className="flex justify-between pt-4">
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-fuchsia-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-700"
            >
              Back
            </button>
          )}
          {step < 5 && (
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-fuchsia-700 hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-700"
            >
              Next
            </button>
          )}
          {step === 5 && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-fuchsia-700 hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
