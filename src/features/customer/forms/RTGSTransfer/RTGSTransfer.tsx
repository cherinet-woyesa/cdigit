import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWindowsByBranch } from '../../../../services/windowService';
import { submitRtgsTransfer } from '../../../../services/rtgsTransferService';
import type { Window as WindowType } from '../../../../services/windowService';
import StepCustomerBeneficiary from './StepCustomerBeneficiary';
import StepSignature from './StepSignature';
import StepReview from './StepReview';
import { useAuth } from '../../../../context/AuthContext';
import { useUserAccounts } from '../../../../hooks/useUserAccounts';
import authService from '../../../../services/authService';

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
  otpCode: string;
};

type Errors = Partial<Record<keyof FormData | 'submit', string>>;

export default function RTGSTransferForm() {
  const { phone } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    branchName: 'Ayer Tena Branch',
    date: new Date().toISOString().split('T')[0],
    orderingAccountNumber: '',
    orderingCustomerName: '',
    beneficiaryBank: '',
    beneficiaryBranch: '',
    beneficiaryAccountNumber: '',
    beneficiaryName: '',
    transferAmount: '',
    paymentNarrative: '',
    customerTelephone: '',
    digitalSignature: '',
    otpCode: '',
  });

  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [_windows, setWindows] = useState<WindowType[]>([]);
  const { accounts, loadingAccounts } = useUserAccounts();
  const [customerAccounts, setCustomerAccounts] = useState<Array<{ accountNumber: string; accountName: string }>>([]);
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const [step, setStep] = useState(0); // 0: Customer+Beneficiary, 1: Signature, 2: Review
  const [stepError, setStepError] = useState('');
  const ABIY_BRANCH_ID = 'a3d3e1b5-8c9a-4c7c-a1e3-6b3d8f4a2b2c';
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpError, setOtpError] = useState('');
  const [phoneForOtp, setPhoneForOtp] = useState<string | null>(null);
  // Step-wise validation
  const validateStep = (): boolean => {
    const errs: Errors = {};
    if (step === 0) {
      // Customer + Beneficiary Information
      if (!formData.orderingAccountNumber) errs.orderingAccountNumber = 'Account Number is required.';
      if (!formData.orderingCustomerName) errs.orderingCustomerName = 'Customer Name is required.';
      if (formData.customerTelephone) {
        const digitsOnly = formData.customerTelephone.replace(/\D/g, '');
        if (digitsOnly.length < 9 || digitsOnly.length > 12) {
          errs.customerTelephone = 'Please enter a valid phone number (9-12 digits)';
        }
      }
      if (!formData.beneficiaryBank) errs.beneficiaryBank = 'Beneficiary Bank is required.';
      if (!formData.beneficiaryBranch) errs.beneficiaryBranch = 'Beneficiary Branch is required.';
      if (!formData.beneficiaryAccountNumber) errs.beneficiaryAccountNumber = 'Beneficiary Account Number is required.';
      if (!formData.beneficiaryName) errs.beneficiaryName = 'Beneficiary Name is required.';
      if (!formData.transferAmount) errs.transferAmount = 'Transfer Amount is required.';
      else {
        const amount = parseFloat(formData.transferAmount);
        if (isNaN(amount) || amount <= 0) {
          errs.transferAmount = 'Please enter a valid amount';
        }
      }
      if (!formData.paymentNarrative) errs.paymentNarrative = 'Payment narrative is required.';
      else if (formData.paymentNarrative.length < 10 || formData.paymentNarrative.length > 200) {
        errs.paymentNarrative = 'Payment narrative must be between 10 and 200 characters';
      }
    }
    if (step === 1) {
      if (!formData.digitalSignature) errs.digitalSignature = 'Digital Signature is required.';
      if (!formData.otpCode) errs.otpCode = 'OTP code is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && !formData.customerTelephone && phone) {
      setFormData(prev => ({ ...prev, customerTelephone: phone }));
    }
    if (!validateStep()) {
      setStepError('Please fix the highlighted fields before continuing.');
      return;
    }
    setStepError('');
    setStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
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
  }, []);

  // Prefill phone from auth
  useEffect(() => {
    if (phone) {
      setFormData(prev => ({ ...prev, customerTelephone: phone }));
    }
  }, [phone]);

  // Load customer accounts from hook and auto-select
  useEffect(() => {
    if (loadingAccounts) return;
    const mapped = (accounts || []).map(a => ({ accountNumber: a.accountNumber, accountName: a.accountHolderName || '' }));
    setCustomerAccounts(mapped);

    if (!accounts || accounts.length === 0) {
      setShowAccountSelection(false);
      setFormData(prev => ({ ...prev, orderingAccountNumber: '', orderingCustomerName: '' }));
      return;
    }

    if (accounts.length === 1) {
      const acc = accounts[0];
      setShowAccountSelection(false);
      setFormData(prev => ({ ...prev, orderingAccountNumber: acc.accountNumber, orderingCustomerName: acc.accountHolderName || '' }));
    } else {
      setShowAccountSelection(true);
      // default to first or previously selected logic could be added later
      setFormData(prev => ({ ...prev, orderingAccountNumber: '', orderingCustomerName: '' }));
    }
  }, [accounts, loadingAccounts]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
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

  const normalizePhone = (raw: string) => {
    const cleaned = raw.trim().replace(/[^\d+]/g, '');
    const digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
    if (/^0[79]\d{8}$/.test(digits)) return `+251${digits.slice(1)}`;
    if (/^[79]\d{8}$/.test(digits)) return `+251${digits}`;
    if (/^251[79]\d{8}$/.test(digits)) return `+${digits}`;
    return raw.trim();
  };

  const handleRequestOtp = async () => {
    setOtpError('');
    setOtpMessage('');
    setOtpLoading(true);
    try {
      const normalized = normalizePhone(formData.customerTelephone || phone || '');
      let phoneToSend = normalized;
      try {
        await authService.requestOtp(phoneToSend);
      } catch {
        phoneToSend = '0' + normalized.slice(-9);
        await authService.requestOtp(phoneToSend);
      }
      setPhoneForOtp(phoneToSend);
      setFormData(prev => ({ ...prev, customerTelephone: phoneToSend }));
      setOtpMessage('OTP sent successfully.');
    } catch (e: any) {
      setOtpError(e?.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError('');
    setOtpMessage('');
    setOtpLoading(true);
    try {
      const phoneToUse = phoneForOtp || normalizePhone(formData.customerTelephone || phone || '');
      const res = await authService.verifyOtp(phoneToUse, formData.otpCode);
      if (res.verified) {
        setOtpVerified(true);
        setOtpMessage(res.message || 'OTP verified.');
      } else {
        setOtpVerified(false);
        setOtpError(res.message || 'OTP verification failed');
      }
    } catch (e: any) {
      setOtpVerified(false);
      setOtpError(e?.message || 'OTP verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  const validateAll = (): boolean => {
    const errs: Errors = {};
    
    // Required fields validation
    const requiredFields: (keyof FormData)[] = [
      'orderingAccountNumber', 'orderingCustomerName', 'beneficiaryBank',
      'beneficiaryBranch', 'beneficiaryAccountNumber', 'beneficiaryName',
      'transferAmount', 'paymentNarrative', 'digitalSignature', 'otpCode'
    ];

    // Check each required field
    requiredFields.forEach(field => {
      const value = formData[field];
      if (!value) {
        const fieldName = field.split(/(?=[A-Z])/).join(' ');
        errs[field] = `${fieldName} is required.`;
        console.log(`Validation failed - ${field} is required`);
      } else {
        console.log(`Field ${field} has value:`, value);
      }
    });

    // Phone number validation (if provided)
    if (formData.customerTelephone) {
      const digitsOnly = formData.customerTelephone.replace(/\D/g, '');
      if (digitsOnly.length < 9 || digitsOnly.length > 12) {
        errs.customerTelephone = 'Please enter a valid phone number (9-12 digits)';
        console.log('Validation failed - Invalid phone number format');
      }
    } else {
      console.log('No customer telephone provided');
    }

    // Transfer amount validation
    if (formData.transferAmount) {
      const amount = parseFloat(formData.transferAmount);
      if (isNaN(amount) || amount <= 0) {
        errs.transferAmount = 'Please enter a valid amount';
        console.log('Validation failed - Invalid transfer amount');
      }
    } else {
      console.log('No transfer amount provided');
    }

    // Payment narrative validation
    if (formData.paymentNarrative) {
      if (formData.paymentNarrative.length < 10 || formData.paymentNarrative.length > 200) {
        errs.paymentNarrative = 'Payment narrative must be between 10 and 200 characters';
        console.log('Validation failed - Payment narrative length invalid');
      }
    } else {
      console.log('No payment narrative provided');
    }

    // OTP validation
    if (!formData.otpCode) {
      errs.otpCode = 'OTP code is required';
      console.log('Validation failed - OTP code is required');
    }

    // Digital signature validation
    if (!formData.digitalSignature) {
      errs.digitalSignature = 'Digital signature is required';
      console.log('Validation failed - Digital signature is required');
    }

    // Log all validation errors
    const errorCount = Object.keys(errs).length;
    if (errorCount > 0) {
      console.group('Form Validation Errors');
      console.log('Total errors:', errorCount);
      Object.entries(errs).forEach(([field, error]) => {
        console.log(`- ${field}: ${error}`);
      });
      console.groupEnd();
    } else {
      console.log('Form validation passed');
    }

    setErrors(errs);
    return errorCount === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateAll()) {
      console.log('Form validation failed');
      return;
    }
    
    setIsSubmitting(true);
    console.log('Starting form submission...');
    
    try {
      // Verify OTP if not already verified
      if (!otpVerified) {
        console.log('OTP not verified, attempting verification...');
        await handleVerifyOtp();
        if (!otpVerified) {
          console.error('OTP verification failed');
          throw new Error('OTP verification failed. Please try again.');
        }
        console.log('OTP verified successfully');
      }
      
      // Build backend payload
      const payload = {
        BranchId: ABIY_BRANCH_ID,
        OrderingAccountNumber: formData.orderingAccountNumber,
        BeneficiaryBank: formData.beneficiaryBank,
        BeneficiaryBranch: formData.beneficiaryBranch,
        BeneficiaryAccountNumber: formData.beneficiaryAccountNumber,
        BeneficiaryName: formData.beneficiaryName,
        TransferAmount: parseFloat(formData.transferAmount),
        PaymentNarrative: formData.paymentNarrative,
        CustomerTelephone: formData.customerTelephone || undefined,
        DigitalSignature: formData.digitalSignature,
        OtpCode: formData.otpCode,
      };
      
      console.log('Submitting payload to backend:', JSON.stringify(payload, null, 2));

      // Submit to backend
      const res = await submitRtgsTransfer(payload);
      console.log('Backend response:', res);
      
      if (!res?.success) {
        const errorMessage = res?.message || 'Failed to submit RTGS transfer';
        console.error('Backend error:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('Transfer submitted successfully, navigating to confirmation');
      navigate('/form/rtgs-transfer/confirmation', { state: { api: res.data } });
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      const errorMessage = error?.response?.data?.message || 
                         error?.message || 
                         'An unexpected error occurred. Please try again.';
      
      console.error('Error details:', {
        message: errorMessage,
        status: error?.response?.status,
        data: error?.response?.data
      });
      
      setErrors(prev => ({
        ...prev,
        submit: errorMessage
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-700"></div>
      </div>
    );
  }

  // Step content
  function getStepContent() {
    if (step === 0) {
      return (
        <StepCustomerBeneficiary
          formData={formData}
          errors={errors}
          onChange={handleChange}
          customerAccounts={customerAccounts}
          showAccountSelection={showAccountSelection}
          onAccountSelect={handleAccountSelect}
          BANKS={BANKS}
        />
      );
    }
    if (step === 1) {
      return (
        <StepSignature
          formData={formData}
          errors={errors}
          onChange={handleChange}
          onRequestOtp={handleRequestOtp}
          onVerifyOtp={async () => { await handleVerifyOtp(); if (otpVerified && formData.digitalSignature) { setStep(2); window.scrollTo(0,0); }}}
          otpVerified={otpVerified}
          otpLoading={otpLoading}
          otpMessage={otpMessage}
          otpError={otpError}
        />
      );
    }
    if (step === 2) {
      return <StepReview formData={formData} />;
    }
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6 bg-fuchsia-700 text-white p-4 rounded-lg shadow-lg">
        <h1 className="text-2xl font-extrabold text-white">RTGS Customer Transfer Order</h1>
        <div className="flex justify-center gap-8 mt-2">
          <div className="text-sm font-medium">
            <span className="text-white/80">Branch:</span> <span className="font-semibold">{formData.branchName}</span>
          </div>
          <div className="text-sm font-medium">
            <span className="text-white/80">Date:</span> <span className="font-semibold">{formData.date}</span>
          </div>
        </div>
      </div>
      <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
        {stepError && (
          <div className="p-3 bg-red-50 border-l-4 border-red-400 text-sm text-red-700 rounded">
            {stepError}
          </div>
        )}
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
          {step < 2 && (
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-fuchsia-700 hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-700"
            >
              Next
            </button>
          )}
          {step === 2 && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-fuchsia-700 hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Transfer'}
            </button>
          )}
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
