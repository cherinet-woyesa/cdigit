// features/customer/forms/cashWithdrawal/CashWithdrawalForm.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBranch } from '@context/BranchContext';
import { useToast } from '@context/ToastContext';
import { useFormSteps } from '@features/customer/hooks/useFormSteps';
import { useCurrencyConversion } from '@features/customer/hooks/useCurrencyConversion';
import { useFormValidation } from '@features/customer/hooks/useFormValidation';
import { useOTPHandling } from '@features/customer/hooks/useOTPHandling';
import { useApprovalWorkflow } from '@hooks/useApprovalWorkflow';
import { FormLayout } from '@features/customer/components/FormLayout';
import { AccountSelector } from '@features/customer/components/AccountSelector';
import { AmountInput } from '@features/customer/components/AmountInput';
import { OTPVerification } from '@features/customer/components/OTPVerification';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import { SignatureStep } from '@features/customer/components/SignatureStep';
import { withdrawalValidationSchema, accountValidation, amountValidation } from '@features/customer/utils/validationSchemas';
import withdrawalService from '@services/transactions/withdrawalService';
import authService from '@services/auth/authService';
import { Shield } from 'lucide-react';

interface FormData {
  accountNumber: string;
  accountHolderName: string;
  amount: string;
  currency: string;
  otp: string;
  signature: string;
  phoneNumber: string;
}

export default function CashWithdrawalForm() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError, info } = useToast();
  const { createWorkflow } = useApprovalWorkflow();
  const navigate = useNavigate();
  const location = useLocation();

  // Reduced from 5 to 4 steps
  const { step, next, prev, isFirst, isLast } = useFormSteps(4);
  const { convertAmount, getCurrencyOptions } = useCurrencyConversion();
  const { errors, validateForm, clearFieldError } = useFormValidation(withdrawalValidationSchema);
  const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();

  const [formData, setFormData] = useState<FormData>({
    accountNumber: '',
    accountHolderName: '',
    amount: '',
    currency: 'ETB',
    otp: '',
    signature: '',
    phoneNumber: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [accountValidated, setAccountValidated] = useState(false);

  useEffect(() => {
    const state = location.state as any;
    if (state?.updateId && state?.formData) {
      setUpdateId(state.updateId);
      setFormData({
        accountNumber: state.formData.accountNumber || '',
        accountHolderName: state.formData.accountHolderName || '',
        amount: state.formData.amount ? state.formData.amount.toString() : '',
        currency: 'ETB',
        otp: '',
        signature: '',
        phoneNumber: state.formData.phoneNumber || '',
      });
      setAccountValidated(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleAccountChange = (accountNumber: string, accountHolderName?: string) => {
    setFormData(prev => ({
      ...prev,
      accountNumber,
      accountHolderName: accountHolderName || '',
    }));
    if (!accountNumber) {
      setAccountValidated(false);
    }
  };

  const handleAccountValidation = (account: any | null) => {
    setAccountValidated(!!account);
    if (account) {
      setFormData(prev => ({
        ...prev,
        accountHolderName: account.accountHolderName || '',
        currency: account.isDiaspora ? 'USD' : 'ETB',
      }));
    }
  };

  const handlePhoneNumberFetched = (phoneNumber: string) => {
    setFormData(prev => ({ ...prev, phoneNumber }));
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

  const handleSignatureComplete = (signatureData: string) => {
    setFormData(prev => ({ ...prev, signature: signatureData }));
    clearFieldError('signature');
  };

  const handleSignatureClear = () => {
    setFormData(prev => ({ ...prev, signature: '' }));
  };

  const handleRequestOTP = async () => {
    if (!formData.phoneNumber) {
      showError('Phone number not found for this account. Please contact support.');
      return;
    }

    // Ensure phoneNumber is a valid string before passing to authService
    const phoneNumber = formData.phoneNumber.trim();
    if (!phoneNumber) {
      showError('Phone number not found for this account. Please contact support.');
      return;
    }

    try {
      await requestOTP(
        () => authService.requestWithdrawalOTP(phoneNumber),
        'OTP sent to your phone'
      );
      info('OTP sent to your phone');
      next(); // Move to OTP verification step
    } catch (error: any) {
      showError(error?.message || 'Failed to send OTP');
    }
  };

  const handleResendOTP = async () => {
    if (!formData.phoneNumber) {
      showError('Phone number not found for this account. Please contact support.');
      return;
    }

    // Ensure phoneNumber is a valid string before passing to authService
    const phoneNumber = formData.phoneNumber.trim();
    if (!phoneNumber) {
      showError('Phone number not found for this account. Please contact support.');
      return;
    }

    try {
      await resendOTP(
        () => authService.requestWithdrawalOTP(phoneNumber),
        'OTP resent successfully'
      );
      info('OTP resent successfully');
    } catch (error: any) {
      showError(error?.message || 'Failed to resend OTP');
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!accountValidated) {
        showError('Please validate the account by entering the account number and clicking "Search"');
        return;
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        showError('Please enter a valid amount');
        return;
      }
      
      const accountNumberError = accountValidation.accountNumber(formData.accountNumber);
      const accountHolderNameError = accountValidation.accountHolderName(formData.accountHolderName);
      const amountError = amountValidation.amount(formData.amount);
      
      if (accountNumberError || accountHolderNameError || amountError) {
        const errorMessage = accountNumberError || accountHolderNameError || amountError;
        if (errorMessage) {
          showError(errorMessage);
        }
        return;
      }
      next();
    } else {
      next();
    }
  };

  const handleSubmit = async () => {
    if (!branch?.id) {
      showError('Branch information is missing. Please select a branch and try again.');
      return;
    }
    if (!accountValidated) {
      showError('Please validate the account before submitting');
      return;
    }
    if (!validateForm(formData)) return;

    setIsSubmitting(true);
    try {
      const amountInETB = convertAmount(formData.amount, formData.currency);
      const withdrawalData = {
        phoneNumber: formData.phoneNumber,
        branchId: branch.id,
        accountNumber: formData.accountNumber,
        accountHolderName: formData.accountHolderName,
        withdrawal_Amount: Number(amountInETB),
        signature: formData.signature,
        otpCode: formData.otp,
      };

      const response = await withdrawalService.submitWithdrawal(withdrawalData);

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
      setFormData({
        accountNumber: '',
        accountHolderName: '',
        amount: '',
        currency: 'ETB',
        otp: '',
        signature: '',
        phoneNumber: '',
      });
      setAccountValidated(false);
      navigate('/form/cash-withdrawal/cashwithdrawalconfirmation', {
        state: {
          serverData: response,
          branchName: branch.name,
          ui: { ...formData, telephoneNumber: formData.phoneNumber },
          tokenNumber: response.data?.tokenNumber,
          queueNumber: response.data?.queueNumber,
        }
      });
    } catch (error: any) {
      showError(error?.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <AccountSelector
        accounts={[]}
        selectedAccount={formData.accountNumber}
        onAccountChange={handleAccountChange}
        onAccountValidation={handleAccountValidation}
        onPhoneNumberFetched={handlePhoneNumberFetched}
        error={errors.accountNumber}
        allowManualEntry={true}
      />
      {!accountValidated && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-sm font-medium text-amber-800">
            Please validate the account by entering the account number and clicking "Search"
          </div>
        </div>
      )}
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
            onCurrencyChange={formData.currency === 'USD' ? handleCurrencyChange : undefined}
            currencies={getCurrencyOptions()}
            error={errors.amount}
            showConversion={formData.currency === 'USD'}
            convertedAmount={convertAmount(formData.amount, formData.currency)}
          />
          {formData.phoneNumber && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm font-medium text-green-800">
                Phone number associated with this account: <strong>{formData.phoneNumber}</strong>
              </div>
              <div className="text-xs text-green-600 mt-1">
                OTP will be sent to this number
              </div>
            </div>
          )}
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
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Phone Number:</span>
          <span className="font-semibold text-fuchsia-900">{formData.phoneNumber || 'Not found'}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="font-medium text-fuchsia-800">Amount:</span>
          <span className="text-lg font-bold text-fuchsia-700">
            {Number(formData.amount).toLocaleString()} {formData.currency}
            {formData.currency !== 'ETB' && (
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
      <SignatureStep 
        onSignatureComplete={handleSignatureComplete}
        onSignatureClear={handleSignatureClear}
        error={errors.signature}
      />
    </div>
  );

  const renderStep4 = () => (
    <OTPVerification
      phone={formData.phoneNumber}
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
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  // Custom navigation for step 3 - Replace Continue with Request OTP button
  const renderCustomNavigation = () => {
    if (step === 3) {
      return (
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          {!isFirst && (
            <button
              type="button"
              onClick={prev}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
            >
              Back
            </button>
          )}
          
          <button
            type="button"
            onClick={handleRequestOTP}
            disabled={!formData.signature || !formData.phoneNumber || otpLoading}
            className="bg-fuchsia-600 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ml-auto"
          >
            {otpLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending OTP...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Request OTP
              </>
            )}
          </button>
        </div>
      );
    }

    // Default navigation for other steps
    return (
      <StepNavigation
        currentStep={step}
        totalSteps={4}
        onNext={step === 4 ? handleSubmit : handleNext}
        onBack={prev}
        nextLabel={step === 4 ? 'Verify & Submit' : 'Continue'}
        nextDisabled={
          (step === 1 && !accountValidated) || 
          (step === 4 && formData.otp.length !== 6) || 
          isSubmitting
        }
        nextLoading={isSubmitting}
        hideBack={isFirst}
      />
    );
  };

  if (!branch?.id) {
    return (
      <FormLayout
        title="Cash Withdrawal"
        branchName={undefined}
        phone={null}
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

  return (
    <FormLayout
      title="Cash Withdrawal"
      branchName={branch?.name}
      phone={formData.phoneNumber || null}
    >
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {getStepContent()}
        {renderCustomNavigation()}
      </form>
    </FormLayout>
  );
}