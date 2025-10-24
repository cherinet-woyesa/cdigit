// features/customer/forms/cashWithdrawal/CashWithdrawalForm.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { useToast } from '../../../../context/ToastContext';
import { useFormSteps } from '../../hooks/useFormSteps';
import { useAccountSelection } from '../../hooks/useAccountSelection';
import { useCurrencyConversion } from '../../hooks/useCurrencyConversion';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useOTPHandling } from '../../hooks/useOTPHandling';
import { useApprovalWorkflow } from '../../../../hooks/useApprovalWorkflow';
import { FormLayout } from '../../components/FormLayout';
import { AccountSelector } from '../../components/AccountSelector';
import { AmountInput } from '../../components/AmountInput';
import { OTPVerification } from '../../components/OTPVerification';
import { StepNavigation } from '../../components/StepNavigation';
import { withdrawalValidationSchema, accountValidation, amountValidation } from '../../utils/validationSchemas';
import withdrawalService from '../../../../services/withdrawalService';
import authService from '../../../../services/authService';
import { CheckCircle2, Shield } from 'lucide-react';

interface FormData {
  accountNumber: string;
  accountHolderName: string;
  amount: string;
  currency: string;
  otp: string;
  signature: string;
}

export default function CashWithdrawalForm() {
  const { phone, token } = useAuth();
  const { branch } = useBranch();
  const { success: showSuccess, error: showError, info } = useToast();
  const { createWorkflow } = useApprovalWorkflow();
  const navigate = useNavigate();
  const location = useLocation();

  // Custom Hooks
  const { step, next, prev, isFirst, isLast } = useFormSteps(5);
  const { accounts, loadingAccounts, errorAccounts, selectedAccount, selectAccount } = useAccountSelection('selectedWithdrawalAccount');
  const { convertAmount, getCurrencyOptions } = useCurrencyConversion();
  const { errors, validateForm, clearFieldError } = useFormValidation(withdrawalValidationSchema);
  const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();

  // State
  const [formData, setFormData] = useState<FormData>({
    accountNumber: selectedAccount?.accountNumber || '',
    accountHolderName: selectedAccount?.accountHolderName || '',
    amount: '',
    currency: selectedAccount?.isDiaspora ? 'USD' : 'ETB',
    otp: '',
    signature: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateId, setUpdateId] = useState<string | null>(null); // Track if this is an update
  const [accountValidated, setAccountValidated] = useState(false); // Track if account has been validated

  // Handle update state
  useEffect(() => {
    const state = location.state as any;
    if (state?.updateId && state?.formData) {
      setUpdateId(state.updateId);
      
      // Set form data from update state
      setFormData({
        accountNumber: state.formData.accountNumber || '',
        accountHolderName: state.formData.accountHolderName || '',
        amount: state.formData.amount ? state.formData.amount.toString() : '',
        currency: 'ETB', // Default to ETB
        otp: '',
        signature: '',
      });
      
      // Mark account as validated since we're loading existing data
      setAccountValidated(true);
      
      // Clear the location state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle missing phone number
  if (!phone) {
    return (
      <FormLayout
        title="Cash Withdrawal"
        phone={null}
        branchName={branch?.name}
        error="Phone number not available. Please log in again."
      >
        <div className="text-center p-8">
          <p className="text-red-600 mb-4">Authentication required. Please log in again.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800"
          >
            Go to Login
          </button>
        </div>
      </FormLayout>
    );
  }

  // Handle missing branch
  if (!branch?.id) {
    return (
      <FormLayout
        title="Cash Withdrawal"
        phone={phone}
        branchName={undefined}
        error="Branch information not available. Please select a branch."
      >
        <div className="text-center p-8">
          <p className="text-red-600 mb-4">Branch selection required. Please select a branch.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800"
          >
            Go to Dashboard
          </button>
        </div>
      </FormLayout>
    );
  }

  // Handlers
  const handleAccountChange = (accountNumber: string, accountHolderName?: string) => {
    const account = accounts.find(acc => acc.accountNumber === accountNumber);
    if (account) {
      selectAccount(accountNumber);
      setFormData(prev => ({
        ...prev,
        accountNumber,
        accountHolderName: accountHolderName || account.accountHolderName,
        currency: account.isDiaspora ? 'USD' : 'ETB',
      }));
      // Don't set accountValidated here as it's controlled by handleAccountValidation
      clearFieldError('accountNumber');
      clearFieldError('accountHolderName');
    } else {
      // If account number is cleared or manually entered
      setFormData(prev => ({
        ...prev,
        accountNumber,
        accountHolderName: accountHolderName || '',
      }));
      // For manual entry, we need explicit validation
      // Only reset validation if we're clearing the account AND we don't have a validated account
      if (!accountNumber && !accountValidated) {
        setAccountValidated(false);
      }
      // If we have an account number but no account in our list, we still might have a validated account
      // Don't change accountValidated state here as it should be controlled by handleAccountValidation
    }
  };

  const handleAccountValidation = (account: any | null) => {
    setAccountValidated(!!account);
    
    // Also update the form data with the validated account holder name
    if (account) {
      setFormData(prev => ({
        ...prev,
        accountHolderName: account.accountHolderName || '',
        // Set currency based on account type
        currency: account.isDiaspora ? 'USD' : 'ETB',
      }));
    }
  };

  const handleAmountChange = (amount: string) => {
    setFormData(prev => ({ ...prev, amount }));
    if (amount) clearFieldError('amount');
  };

  const handleCurrencyChange = (currency: string) => {
    setFormData(prev => ({ ...prev, currency }));
  };

  const handleOtpChange = (otp: string) => {
    setFormData(prev => ({ ...prev, otp }));
    if (otp.length === 6) clearFieldError('otp');
  };

  const handleSignatureChange = (signature: string) => {
    setFormData(prev => ({ ...prev, signature }));
    if (signature) clearFieldError('signature');
  };

  const handleNext = () => {
    // For step 1, we need to ensure account is validated and amount is entered
    if (step === 1) {
      // Check if we have a validated account
      if (!accountValidated) {
        showError('Please validate the account by entering the account number and clicking "Search"');
        return;
      }
      
      // Check if amount is entered
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        showError('Please enter a valid amount');
        return;
      }
      
      // Manually validate the required fields for step 1
      const accountNumberError = accountValidation.accountNumber(formData.accountNumber);
      const accountHolderNameError = accountValidation.accountHolderName(formData.accountHolderName);
      const amountError = amountValidation.amount(formData.amount);
      
      // Clear previous errors for these fields
      clearFieldError('accountNumber');
      clearFieldError('accountHolderName');
      clearFieldError('amount');
      
      // Check for validation errors
      if (accountNumberError && typeof accountNumberError === 'string') {
        showError(accountNumberError);
        return;
      }
      
      if (accountHolderNameError && typeof accountHolderNameError === 'string') {
        showError(accountHolderNameError);
        return;
      }
      
      if (amountError && typeof amountError === 'string') {
        showError(amountError);
        return;
      }
      
      // If we get here, validation passed
      next();
    } else if (step === 3) {
      // For step 3 (signature), validate that signature is provided
      const signatureError = signatureValidation.signature(formData.signature);
      if (signatureError && typeof signatureError === 'string') {
        showError(signatureError);
        return;
      }
      next();
    } else if (step === 5) {
      // For step 5 (OTP verification), validate the entire form including OTP
      if (validateForm(formData)) {
        next();
      }
    } else {
      // For other steps (2 and 4), validate account info and amount but not OTP
      const accountNumberError = accountValidation.accountNumber(formData.accountNumber);
      const accountHolderNameError = accountValidation.accountHolderName(formData.accountHolderName);
      const amountError = amountValidation.amount(formData.amount);
      
      // Clear previous errors for these fields
      clearFieldError('accountNumber');
      clearFieldError('accountHolderName');
      clearFieldError('amount');
      
      // Check for validation errors
      if (accountNumberError && typeof accountNumberError === 'string') {
        showError(accountNumberError);
        return;
      }
      
      if (accountHolderNameError && typeof accountHolderNameError === 'string') {
        showError(accountHolderNameError);
        return;
      }
      
      if (amountError && typeof amountError === 'string') {
        showError(amountError);
        return;
      }
      
      next();
    }
  };

  const handleRequestOTP = async () => {
    try {
      await requestOTP(
        () => authService.requestWithdrawalOTP(phone),
        'OTP sent to your phone'
      );
      info('OTP sent to your phone');
      next();
    } catch (error: any) {
      showError(error?.message || 'Failed to send OTP');
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOTP(
        () => authService.requestWithdrawalOTP(phone),
        'OTP resent successfully'
      );
      info('OTP resent successfully');
    } catch (error: any) {
      showError(error?.message || 'Failed to resend OTP');
    }
  };

  const handleSubmit = async () => {
    // Check if phone and branch are available
    if (!phone) {
      showError('Phone number is missing. Please refresh the page and try again.');
      return;
    }
    
    if (!branch?.id) {
      showError('Branch information is missing. Please select a branch and try again.');
      return;
    }

    // Ensure account is validated before submission
    if (!accountValidated) {
      showError('Please validate the account before submitting');
      return;
    }

    // For submission, we need to validate the entire form including OTP
    if (!validateForm(formData) || !token) return;

    setIsSubmitting(true);
    try {
      const amountInETB = convertAmount(formData.amount, formData.currency);
      
      // Check if this is an update or new withdrawal
      if (updateId) {
        // Handle update
        const withdrawalData = {
          phoneNumber: phone,
          branchId: branch.id,
          accountNumber: formData.accountNumber,
          accountHolderName: formData.accountHolderName,
          withdrawal_Amount: Number(amountInETB),
          signature: formData.signature,
          otpCode: formData.otp,
        };

        const response = await withdrawalService.submitWithdrawal(withdrawalData, token);

        await createWorkflow({
          voucherId: response.data?.id || updateId,
          voucherType: 'withdrawal',
          transactionType: 'withdrawal',
          amount: Number(amountInETB),
          currency: 'ETB',
          customerSegment: 'normal',
          reason: 'Customer withdrawal update request',
          voucherData: withdrawalData,
          customerSignature: formData.signature,
        });

        showSuccess('Withdrawal updated successfully!');
        
        // Reset update state
        setUpdateId(null);
        setAccountValidated(false);
        
        navigate('/form/cash-withdrawal/cashwithdrawalconfirmation', {
          state: {
            serverData: response,
            branchName: branch.name,
            ui: { ...formData, telephoneNumber: phone },
            tokenNumber: response.data?.tokenNumber,
            queueNumber: response.data?.queueNumber,
          }
        });
      } else {
        // Handle new withdrawal (existing code)
        const withdrawalData = {
          phoneNumber: phone,
          branchId: branch.id,
          accountNumber: formData.accountNumber,
          accountHolderName: formData.accountHolderName,
          withdrawal_Amount: Number(amountInETB),
          signature: formData.signature,
          otpCode: formData.otp,
        };

        const response = await withdrawalService.submitWithdrawal(withdrawalData, token);

        await createWorkflow({
          voucherId: response.data?.id || '',
          voucherType: 'withdrawal',
          transactionType: 'withdrawal',
          amount: Number(amountInETB),
          currency: 'ETB',
          customerSegment: 'normal',
          reason: 'Customer withdrawal request',
          voucherData: withdrawalData,
          customerSignature: formData.signature,
        });

        showSuccess('Withdrawal submitted successfully!');
        
        // Reset form data after successful submission
        setFormData({
          accountNumber: '',
          accountHolderName: '',
          amount: '',
          currency: 'ETB',
          otp: '',
          signature: '',
        });
        setAccountValidated(false);
        
        navigate('/form/cash-withdrawal/cashwithdrawalconfirmation', {
          state: {
            serverData: response,
            branchName: branch.name,
            ui: { ...formData, telephoneNumber: phone },
            tokenNumber: response.data?.tokenNumber,
            queueNumber: response.data?.queueNumber,
          }
        });
      }
    } catch (error: any) {
      showError(error?.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Steps
  const renderStep1 = () => (
    <div className="space-y-6">
      <AccountSelector
        accounts={[]} // Pass empty array to disable dropdown
        selectedAccount={formData.accountNumber}
        onAccountChange={handleAccountChange}
        onAccountValidation={handleAccountValidation}
        error={errors.accountNumber}
        allowManualEntry={true}
      />
      
      {/* Show validation message if account is not validated */}
      {!accountValidated && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-sm font-medium text-amber-800">
            Please validate the account by entering the account number and clicking "Search"
          </div>
        </div>
      )}
      
      {/* Show account holder name and amount fields only after account validation */}
      {accountValidated && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Holder Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.accountHolderName}
              readOnly
              className="w-full p-3 rounded-lg border border-fuchsia-300 bg-gradient-to-r from-amber-50 to-fuchsia-50"
            />
            {errors.accountHolderName && (
              <p className="mt-1 text-sm text-red-600">{errors.accountHolderName}</p>
            )}
          </div>

          <AmountInput
            value={formData.amount}
            onChange={handleAmountChange}
            currency={formData.currency}
            onCurrencyChange={formData.currency === 'USD' ? handleCurrencyChange : undefined} // Only allow currency change for USD accounts
            currencies={getCurrencyOptions()}
            error={errors.amount}
            showConversion={formData.currency === 'USD'} // Show conversion for USD accounts
            convertedAmount={convertAmount(formData.amount, formData.currency)}
          />
        </>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Account Holder:</span>
          <span className="font-semibold text-fuchsia-900">{formData.accountHolderName}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Account Number:</span>
          <span className="font-mono font-semibold text-fuchsia-900">{formData.accountNumber}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="font-medium text-fuchsia-800">Amount:</span>
          <span className="text-lg font-bold text-fuchsia-700">
            {Number(formData.amount).toLocaleString()} {formData.currency}
            {selectedAccount?.isDiaspora && formData.currency !== 'ETB' && (
              <div className="text-sm font-normal">
                ({convertAmount(formData.amount, formData.currency)} ETB)
              </div>
            )}
          </span>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="border border-fuchsia-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Signature</h2>
        <p className="text-gray-600 mb-4">
          Please provide your signature below to authorize this withdrawal.
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Signature <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.signature}
            onChange={(e) => handleSignatureChange(e.target.value)}
            placeholder="Enter your signature here..."
            className="w-full p-3 rounded-lg border border-gray-300 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
            rows={3}
          />
          {errors.signature && (
            <p className="mt-1 text-sm text-red-600">{errors.signature}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="border border-fuchsia-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-fuchsia-700" />
          Request OTP
        </h2>
        <p className="text-gray-600 mb-4">
          Click the button below to receive an OTP on your registered phone number.
        </p>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <OTPVerification
      phone={phone}
      otp={formData.otp}
      onOtpChange={handleOtpChange}
      onResendOtp={handleResendOTP}
      resendCooldown={resendCooldown}
      loading={otpLoading}
      error={errors.otp}
      message={otpMessage}
    />
  );

  const getStepContent = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3(); // Signature step
      case 4: return renderStep4(); // OTP request step
      case 5: return renderStep5(); // OTP verification step
      default: return null;
    }
  };

  const getNextHandler = () => {
    switch (step) {
      case 1: return handleNext;
      case 2: return handleNext;
      case 3: return handleNext; // Validate signature before proceeding
      case 4: return handleRequestOTP;
      case 5: return handleSubmit;
      default: return handleNext;
    }
  };

  const getNextLabel = () => {
    switch (step) {
      case 1: return 'Continue';
      case 2: return 'Continue';
      case 3: return 'Continue';
      case 4: return 'Request OTP';
      case 5: return 'Verify & Submit';
      default: return 'Continue';
    }
  };

  return (
    <FormLayout
      title="Cash Withdrawal"
      phone={phone}
      branchName={branch?.name}
      loading={loadingAccounts}
      error={errorAccounts || undefined}
    >
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {getStepContent()}

        <StepNavigation
          currentStep={step}
          totalSteps={5}
          onNext={getNextHandler()}
          onBack={prev}
          nextLabel={getNextLabel()}
          nextDisabled={(step === 5 && formData.otp.length !== 6) || isSubmitting}
          nextLoading={(step === 4 && otpLoading) || (step === 5 && isSubmitting)}
          hideBack={isFirst}
        />
      </form>
    </FormLayout>
  );
}

// Custom validation for signature
const signatureValidation = {
  signature: (value: string) => {
    if (!value?.trim()) return 'Signature is required';
    return undefined;
  }
};

// Custom validation schema for withdrawal form (without OTP for early steps)
const withdrawalStepValidationSchema = {
  ...accountValidation,
  ...amountValidation,
  ...signatureValidation
};
