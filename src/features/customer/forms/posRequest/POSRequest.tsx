import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useUserAccounts } from '../../../../hooks/useUserAccounts';
import Field from '../../../../components/Field';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import authService from '../../../../services/authService';
import { submitPosRequest } from '../../../../services/posRequestService';

interface FormData {
  accountNumber: string;
  customerName: string;
  businessName: string;
  businessType: string;
  tinNumber: string;
  businessLicenseNumber: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  region: string;
  city: string;
  subCity: string;
  woreda: string;
  houseNumber: string;
  landmark: string;
  numberOfPOS: number;
  posType: 'mobile' | 'desktop';
  estimatedMonthlyTransaction: string;
  bankAccountForSettlement: string;
  termsAccepted: boolean;
  otpCode?: string;
}

type Errors = Partial<Record<keyof FormData, string>>;

export default function POSRequestForm() {
  const { t } = useTranslation();
  const { phone } = useAuth();
  const navigate = useNavigate();
  const { accounts, loadingAccounts, errorAccounts } = useUserAccounts();
  // Define current date for header
  const currentDate = new Date().toLocaleDateString();
  
  const [formData, setFormData] = useState<FormData>({
    accountNumber: '',
    customerName: '',
    businessName: '',
    businessType: '',
    tinNumber: '',
    businessLicenseNumber: '',
    contactPerson: '',
    phoneNumber: phone || '',
    email: '',
    region: '',
    city: '',
    subCity: '',
    woreda: '',
    houseNumber: '',
    landmark: '',
    numberOfPOS: 1,
    posType: 'mobile',
    estimatedMonthlyTransaction: '',
    bankAccountForSettlement: '',
    termsAccepted: false,
    otpCode: '',
  });
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpError, setOtpError] = useState('');
  
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [branchName] = useState('Ayer Tena Branch'); // Would come from auth context
  const [formRefId] = useState(`POS-${Date.now()}`);
  
  // Auto-fill customer name when account is selected
  useEffect(() => {
    if (formData.accountNumber && accounts.length > 0) {
      const selectedAccount = accounts.find(acc => acc.accountNumber === formData.accountNumber);
      if (selectedAccount) {
        setFormData(prev => ({
          ...prev,
          customerName: selectedAccount.accountHolderName || '',
          bankAccountForSettlement: selectedAccount.accountNumber
        }));
      }
    }
  }, [formData.accountNumber, accounts]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when field is updated
    if (errors[name as keyof Errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  const validateStep1 = (): boolean => {
    const newErrors: Errors = {};
    
    if (!formData.accountNumber) newErrors.accountNumber = 'Account number is required';
    if (!formData.businessName) newErrors.businessName = 'Business name is required';
    if (!formData.businessType) newErrors.businessType = 'Business type is required';
    if (!formData.tinNumber) newErrors.tinNumber = 'TIN number is required';
    if (!formData.businessLicenseNumber) newErrors.businessLicenseNumber = 'Business license number is required';
    if (!formData.contactPerson) newErrors.contactPerson = 'Contact person is required';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep2 = (): boolean => {
    const newErrors: Errors = {};
    
    if (!formData.region) newErrors.region = 'Region is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.subCity) newErrors.subCity = 'Sub-city is required';
    if (!formData.woreda) newErrors.woreda = 'Woreda is required';
    if (!formData.houseNumber) newErrors.houseNumber = 'House number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !formData.termsAccepted) {
      toast.error('You must accept the terms and conditions');
      return;
    }
    
    setStep(prev => prev + 1);
  };
  
  const handleBack = () => {
    setStep(prev => prev - 1);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.termsAccepted) {
      toast.error('You must accept the terms and conditions');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Build backend payload
      const ABIY_BRANCH_ID = 'a3d3e1b5-8c9a-4c7c-a1e3-6b3d8f4a2b2c';
      const payload = {
        BranchId: ABIY_BRANCH_ID,
        OtpCode: formData.otpCode || '',
        AccountNumber: formData.accountNumber,
        ContactNumber: formData.phoneNumber,
        SecondaryContactNumber: undefined,
        Address: `${formData.region}, ${formData.city}, ${formData.subCity}, ${formData.woreda}, ${formData.houseNumber}${formData.landmark ? ', ' + formData.landmark : ''}`,
        NatureOfBusiness: formData.businessName,
        TypeOfBusiness: formData.businessType,
        NumberOfPOSRequired: formData.numberOfPOS,
        TermsAccepted: formData.termsAccepted,
      };

      const response = await submitPosRequest(payload as any);
      if (!response?.success) throw new Error(response?.message || 'Submission failed');

      navigate('/form/pos-request/confirmation', { state: { api: response.data } });
      toast.success('POS request submitted successfully');
    } catch (error) {
      console.error('Error submitting POS request:', error);
      toast.error('Failed to submit POS request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizePhone = (raw: string) => {
    const cleaned = raw.trim().replace(/[^\d+]/g, '');
    const digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
    if (/^0[79]\d{8}$/.test(digits)) return `+251${digits.slice(1)}`;
    if (/^[79]\d{8}$/.test(digits)) return `+251${digits}`;
    if (/^251[79]\d{8}$/.test(digits)) return `+${digits}`;
    return raw.trim();
  };

  const requestOtp = async () => {
    setOtpLoading(true);
    setOtpMessage('');
    setOtpError('');
    try {
      const normalized = normalizePhone(formData.phoneNumber || phone || '');
      let phoneToSend = normalized;
      try { await authService.requestOtp(phoneToSend); }
      catch { phoneToSend = '0' + normalized.slice(-9); await authService.requestOtp(phoneToSend); }
      setFormData(prev => ({ ...prev, phoneNumber: phoneToSend }));
      setOtpMessage('OTP sent successfully.');
    } catch (e: any) {
      setOtpError(e?.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    setOtpLoading(true);
    setOtpMessage('');
    setOtpError('');
    try {
      const phoneToUse = formData.phoneNumber || phone || '';
      const res = await authService.verifyOtp(phoneToUse, formData.otpCode || '');
      if (res.verified) { setOtpVerified(true); setOtpMessage(res.message || 'OTP verified.'); }
      else { setOtpVerified(false); setOtpError(res.message || 'OTP verification failed'); }
    } catch (e: any) {
      setOtpVerified(false);
      setOtpError(e?.message || 'OTP verification failed');
    } finally {
      setOtpLoading(false);
    }
  };
  
  // Loading state
  if (loadingAccounts) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin h-12 w-12 text-fuchsia-700" />
      </div>
    );
  }
  
  // Error state
  if (errorAccounts) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Error loading accounts. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Confirmation screen
  if (step === 4) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md">
        <div className="text-center p-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-gray-900">
            {t('requestSubmitted', 'Request Submitted Successfully!')}
          </h2>
          <p className="mt-2 text-gray-600">
            {t('posRequestSubmitted', 'Your POS request has been submitted successfully. Our team will review and contact you shortly.')}
          </p>
          
          <div className="mt-8 bg-gray-50 p-6 rounded-lg text-left">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t('requestDetails', 'Request Details')}
            </h3>
            <dl className="space-y-4">
              <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">
                  {t('referenceNumber', 'Reference Number')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                  {formRefId}
                </dd>
              </div>
              <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">
                  {t('branch', 'Branch')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                  {branchName}
                </dd>
              </div>
              <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">
                  {t('accountNumber', 'Account Number')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                  {formData.accountNumber.replace(/(\d{4})(\d+)(\d{4})/, '$1****$3')}
                </dd>
              </div>
              <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">
                  {t('businessName', 'Business Name')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                  {formData.businessName}
                </dd>
              </div>
              <div className="sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">
                  {t('numberOfPOS', 'Number of POS')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                  {formData.numberOfPOS}
                </dd>
              </div>
            </dl>
          </div>
          
          <div className="mt-8 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-fuchsia-700 hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500"
            >
              {t('backToDashboard', 'Back to Dashboard')}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6">
      <div className="max-w-4xl w-full bg-white p-4 sm:p-6 rounded-lg shadow-lg">
        <div className="mb-4 sm:mb-6 bg-fuchsia-700 text-white p-3 sm:p-4 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">POS Request</h1>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-2">
            <span className="bg-fuchsia-900 px-3 py-1 rounded text-xs sm:text-sm font-semibold">Branch: {branchName}</span>
            <span className="bg-fuchsia-900 px-3 py-1 rounded text-xs sm:text-sm font-semibold">Date: {currentDate}</span>
          </div>
          <p className="mt-1 text-sm text-fuchsia-100">
            {t('fillAllRequiredFields', 'Please fill in all required fields to apply for a POS terminal')}
          </p>
        </div>
        
        {/* Progress Steps */}
        <div className="bg-white px-4 py-4 border-b border-gray-200 sm:px-6">
          <nav className="flex items-center justify-center" aria-label="Progress">
            <ol className="flex items-center space-x-4">
              {[1, 2, 3].map((stepNumber) => (
                <li key={stepNumber} className="flex items-center">
                  {stepNumber < step ? (
                    <div className="flex items-center">
                      <span className="flex items-center justify-center h-8 w-8 rounded-full bg-fuchsia-700">
                        <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="ml-4 text-sm font-medium text-gray-900">
                        {stepNumber === 1 && t('businessInfo', 'Business Info')}
                        {stepNumber === 2 && t('addressInfo', 'Address')}
                        {stepNumber === 3 && t('review', 'Review')}
                      </span>
                    </div>
                  ) : stepNumber === step ? (
                    <div className="flex items-center">
                      <span className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-fuchsia-700">
                        <span className="text-fuchsia-700">{stepNumber}</span>
                      </span>
                      <span className="ml-4 text-sm font-medium text-fuchsia-700">
                        {stepNumber === 1 && t('businessInfo', 'Business Info')}
                        {stepNumber === 2 && t('addressInfo', 'Address')}
                        {stepNumber === 3 && t('review', 'Review')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-gray-300">
                        <span className="text-gray-500">{stepNumber}</span>
                      </span>
                      <span className="ml-4 text-sm font-medium text-gray-500">
                        {stepNumber === 1 && t('businessInfo', 'Business Info')}
                        {stepNumber === 2 && t('addressInfo', 'Address')}
                        {stepNumber === 3 && t('review', 'Review')}
                      </span>
                    </div>
                  )}
                  
                  {stepNumber < 3 && (
                    <svg className="h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
        
        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('businessInformation', 'Business Information')}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t('provideBusinessDetails', 'Please provide your business details')}
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <Field 
                    label={t('accountNumber', 'Account Number')} 
                    required
                    error={errors.accountNumber}
                  >
                    <select
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-2 ${
                        errors.accountNumber ? 'border-red-300' : 'border-gray-300'
                      } focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm rounded-md`}
                    >
                      <option value="">{t('selectAccount', 'Select Account')}</option>
                      {accounts.map((account) => (
                        <option key={account.accountNumber} value={account.accountNumber}>
                          {account.accountNumber} - {account.accountType}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                
                <div className="sm:col-span-3">
                  <Field 
                    label={t('customerName', 'Customer Name')} 
                  >
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      readOnly
                      className="mt-1 block w-full border-2 border-gray-200 bg-gray-100 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm"
                    />
                  </Field>
                </div>
                
                <div className="sm:col-span-6">
                  <Field 
                    label={t('businessName', 'Business Name')} 
                    required
                    error={errors.businessName}
                  >
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      className={`mt-1 block w-full border-2 ${
                        errors.businessName ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm`}
                    />
                  </Field>
                </div>
                
                <div className="sm:col-span-3">
                  <Field 
                    label={t('typeOfBusiness', 'Type of Business')} 
                    required
                    error={errors.businessType}
                  >
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-2 ${
                        errors.businessType ? 'border-red-300' : 'border-gray-300'
                      } focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm rounded-md`}
                    >
                      <option value="">{t('selectBusinessType', 'Select Business Type')}</option>
                      <option value="retail">{t('retail', 'Retail')}</option>
                      <option value="wholesale">{t('wholesale', 'Wholesale')}</option>
                      <option value="service">{t('service', 'Service')}</option>
                      <option value="hospitality">{t('hospitality', 'Hospitality')}</option>
                      <option value="other">{t('other', 'Other')}</option>
                    </select>
                  </Field>
                </div>
                
                <div className="sm:col-span-3">
                  <Field 
                    label={t('tinNumber', 'TIN Number')} 
                    required
                    error={errors.tinNumber}
                  >
                    <input
                      type="text"
                      name="tinNumber"
                      value={formData.tinNumber}
                      onChange={handleChange}
                      className={`mt-1 block w-full border-2 ${
                        errors.tinNumber ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm`}
                    />
                  </Field>
                </div>
                
                <div className="sm:col-span-3">
                  <Field 
                    label={t('businessLicenseNumber', 'Business License Number')} 
                    required
                    error={errors.businessLicenseNumber}
                  >
                    <input
                      type="text"
                      name="businessLicenseNumber"
                      value={formData.businessLicenseNumber}
                      onChange={handleChange}
                      className={`mt-1 block w-full border-2 ${
                        errors.businessLicenseNumber ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm`}
                    />
                  </Field>
                </div>
                
                <div className="sm:col-span-3">
                  <Field 
                    label={t('contactPerson', 'Contact Person')} 
                    required
                    error={errors.contactPerson}
                  >
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      className={`mt-1 block w-full border-2 ${
                        errors.contactPerson ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm`}
                    />
                  </Field>
                </div>
                
                <div className="sm:col-span-3">
                  <Field 
                    label={t('phoneNumber', 'Phone Number')} 
                    required
                    error={errors.phoneNumber}
                  >
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={`mt-1 block w-full border-2 ${
                        errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm`}
                    />
                  </Field>
                </div>
                
                <div className="sm:col-span-3">
                  <Field 
                    label={t('emailAddress', 'Email Address')} 
                    required
                    error={errors.email}
                  >
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`mt-1 block w-full border-2 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm`}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('businessAddress', 'Business Address')}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t('provideBusinessAddress', 'Please provide your business address')}
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <Field 
                    label={t('region', 'Region')} 
                    required
                    error={errors.region}
                  >
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      className={`mt-1 block w-full border-2 ${
                        errors.region ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm`}
                    />
                  </Field>
                </div>
                
                <div className="sm:col-span-3">
                  <Field 
                    label={t('city', 'City')} 
                    required
                    error={errors.city}
                  >
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`mt-1 block w-full border-2 ${
                        errors.city ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm`}
                    />
                  </Field>
                </div>
                
                <div className="sm:col-span-3">
                  <Field 
                    label={t('subCity', 'Sub-city')} 
                    required
                    error={errors.subCity}
                  >
                    <input
                      type="text"
                      name="subCity"
                      value={formData.subCity}
                      onChange={handleChange}
                      className={`mt-1 block w-full border-2 ${
                        errors.subCity ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm`}
                    />
                  </Field>
                </div>
                
                <div className="sm:col-span-3">
                  <Field 
                    label={t('woreda', 'Woreda')} 
                    required
                    error={errors.woreda}
                  >
                    <input
                      type="text"
                      name="woreda"
                      value={formData.woreda}
                      onChange={handleChange}
                      className={`mt-1 block w-full border-2 ${
                        errors.woreda ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm`}
                    />
                  </Field>
                </div>
                
                <div className="sm:col-span-3">
                  <Field 
                    label={t('houseNumber', 'House Number')} 
                    required
                    error={errors.houseNumber}
                  >
                    <input
                      type="text"
                      name="houseNumber"
                      value={formData.houseNumber}
                      onChange={handleChange}
                      className={`mt-1 block w-full border-2 ${
                        errors.houseNumber ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm`}
                    />
                  </Field>
                </div>
                
                <div className="sm:col-span-3">
                  <Field 
                    label={t('landmark', 'Landmark (Optional)')} 
                  >
                    <input
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                      className="mt-1 block w-full border-2 border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm"
                    />
                  </Field>
                </div>
                
                <div className="sm:col-span-6">
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      {t('posDetails', 'POS Terminal Details')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {t('providePosDetails', 'Please provide details about the POS terminal you need')}
                    </p>
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <Field 
                    label={t('numberOfPOS', 'Number of POS Terminals')} 
                    required
                  >
                    <select
                      name="numberOfPOS"
                      value={formData.numberOfPOS}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-2 border-gray-300 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm rounded-md"
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                
                <div className="sm:col-span-3">
                  <Field 
                    label={t('posType', 'POS Type')} 
                    required
                  >
                    <select
                      name="posType"
                      value={formData.posType}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-2 border-gray-300 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm rounded-md"
                    >
                      <option value="mobile">{t('mobilePos', 'Mobile POS')}</option>
                      <option value="desktop">{t('desktopPos', 'Desktop POS')}</option>
                    </select>
                  </Field>
                </div>
                
                <div className="sm:col-span-6">
                  <Field 
                    label={t('estimatedMonthlyTransaction', 'Estimated Monthly Transaction Volume (ETB)')} 
                    required
                  >
                    <select
                      name="estimatedMonthlyTransaction"
                      value={formData.estimatedMonthlyTransaction}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-2 border-gray-300 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm rounded-md"
                    >
                      <option value="">{t('selectRange', 'Select Range')}</option>
                      <option value="1-50000">1 - 50,000 ETB</option>
                      <option value="50001-200000">50,001 - 200,000 ETB</option>
                      <option value="200001-500000">200,001 - 500,000 ETB</option>
                      <option value="500001-1000000">500,001 - 1,000,000 ETB</option>
                      <option value="1000001+">1,000,000+ ETB</option>
                    </select>
                  </Field>
                </div>
                
                <div className="sm:col-span-6">
                  <Field 
                    label={t('bankAccountForSettlement', 'Bank Account for Settlement')} 
                    required
                  >
                    <input
                      type="text"
                      name="bankAccountForSettlement"
                      value={formData.bankAccountForSettlement}
                      readOnly
                      className="mt-1 block w-full border-2 border-gray-200 bg-gray-100 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {t('settlementAccountNote', 'This is the account where your POS transactions will be settled')}
                    </p>
                  </Field>
                </div>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('reviewAndSubmit', 'Review & Submit')}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t('reviewInformation', 'Please review your information before submitting')}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  {t('businessInformation', 'Business Information')}
                </h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      {t('businessName', 'Business Name')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formData.businessName}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      {t('businessType', 'Business Type')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">
                      {formData.businessType}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      {t('tinNumber', 'TIN Number')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formData.tinNumber}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      {t('businessLicenseNumber', 'Business License')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formData.businessLicenseNumber}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      {t('contactPerson', 'Contact Person')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formData.contactPerson}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      {t('phoneNumber', 'Phone Number')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formData.phoneNumber}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      {t('emailAddress', 'Email')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formData.email}
                    </dd>
                  </div>
                </dl>
                
                <h4 className="text-md font-medium text-gray-900 mt-8 mb-4">
                  {t('businessAddress', 'Business Address')}
                </h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      {t('region', 'Region')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formData.region}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      {t('city', 'City')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formData.city}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      {t('subCity', 'Sub-city')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formData.subCity}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      {t('woreda', 'Woreda')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formData.woreda}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      {t('houseNumber', 'House Number')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formData.houseNumber}
                    </dd>
                  </div>
                  {formData.landmark && (
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">
                        {t('landmark', 'Landmark')}
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formData.landmark}
                      </dd>
                    </div>
                  )}
                </dl>
                
                <h4 className="text-md font-medium text-gray-900 mt-8 mb-4">
                  {t('posDetails', 'POS Terminal Details')}
                </h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      {t('numberOfPOS', 'Number of POS')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formData.numberOfPOS}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      {t('posType', 'POS Type')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">
                      {formData.posType}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      {t('estimatedMonthlyTransaction', 'Estimated Monthly Volume')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formData.estimatedMonthlyTransaction || 'N/A'}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">
                      {t('settlementAccount', 'Settlement Account')}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formData.bankAccountForSettlement}
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div className="mt-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      name="termsAccepted"
                      type="checkbox"
                      checked={formData.termsAccepted}
                      onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                      className="h-4 w-4 text-fuchsia-600 focus:ring-fuchsia-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="font-medium text-gray-700">
                      {t('acceptTerms', 'I agree to the terms and conditions')}
                    </label>
                    <p className="text-gray-500">
                      {t('termsDescription', 'By submitting this form, I confirm that all the information provided is accurate and complete.')}
                    </p>
                    {!formData.termsAccepted && errors.termsAccepted && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.termsAccepted}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <Field label="OTP Code" error={undefined}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="otpCode"
                        value={formData.otpCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, otpCode: e.target.value }))}
                        className="mt-1 block w-full border-2 border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm"
                      />
                      <button type="button" onClick={requestOtp} disabled={otpLoading} className="px-3 py-2 bg-fuchsia-700 text-white rounded disabled:opacity-50">{otpLoading ? 'Sending...' : 'Request OTP'}</button>
                      <button type="button" onClick={verifyOtp} disabled={otpLoading || !formData.otpCode} className="px-3 py-2 bg-gray-200 text-fuchsia-800 rounded disabled:opacity-50">{otpLoading ? 'Verifying...' : (otpVerified ? 'Verified' : 'Verify OTP')}</button>
                    </div>
                    {(otpMessage || otpError) && (
                      <div className="mt-2 text-sm">
                        {otpMessage && <p className="text-green-600">{otpMessage}</p>}
                        {otpError && <p className="text-red-600">{otpError}</p>}
                      </div>
                    )}
                  </Field>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {t('back', 'Back')}
              </button>
            ) : (
              <div></div>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-fuchsia-700 hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500"
              >
                {t('next', 'Next')}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-fuchsia-700 hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    {t('submitting', 'Submitting...')}
                  </>
                ) : (
                  t('submitRequest', 'Submit Request')
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
