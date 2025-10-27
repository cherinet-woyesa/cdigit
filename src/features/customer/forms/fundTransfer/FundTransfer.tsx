// features/customer/forms/fundTransfer/FundTransferForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '../../../../context/BranchContext';
import { useToast } from '../../../../context/ToastContext';
import { useFormSteps } from '../../hooks/useFormSteps';
import { useCurrencyConversion } from '../../hooks/useCurrencyConversion';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useOTPHandling } from '../../hooks/useOTPHandling';
import { useApprovalWorkflow } from '../../../../hooks/useApprovalWorkflow';
import { FormLayout } from '../../components/FormLayout';
import { AccountSelector } from '../../components/AccountSelector';
import { AmountInput } from '../../components/AmountInput';
import { OTPVerification } from '../../components/OTPVerification';
import { StepNavigation } from '../../components/StepNavigation';
import { SignatureStep } from '../../components/SignatureStep';
import { transferValidationSchema } from '../../utils/validationSchemas';
import fundTransferService from '../../../../services/fundTransferService';
import { CheckCircle2, Shield } from 'lucide-react';

interface FormData {
  debitAccountNumber: string;
  debitAccountName: string;
  creditAccountNumber: string;
  creditAccountName: string;
  amount: string;
  currency: string;
  otp: string;
  isCreditAccountVerified: boolean;
  signature: string;
  phoneNumber: string;
}

export default function FundTransferForm() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError, info } = useToast();
  const { createWorkflow } = useApprovalWorkflow();
  const navigate = useNavigate();

  const { step, next, prev, isFirst, isLast } = useFormSteps(6);
  const { convertAmount, getCurrencyOptions } = useCurrencyConversion();
  const { errors, validateForm, clearFieldError } = useFormValidation(transferValidationSchema);
  const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();

  const [formData, setFormData] = useState<FormData>({
    debitAccountNumber: '',
    debitAccountName: '',
    creditAccountNumber: '',
    creditAccountName: '',
    amount: '',
    currency: 'ETB',
    otp: '',
    isCreditAccountVerified: false,
    signature: '',
    phoneNumber: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [debitAccountValidated, setDebitAccountValidated] = useState(false);

  const handleDebitAccountChange = (accountNumber: string, accountHolderName?: string) => {
    setFormData(prev => ({
      ...prev,
      debitAccountNumber: accountNumber,
      debitAccountName: accountHolderName || '',
    }));
    if (!accountNumber) {
        setDebitAccountValidated(false);
    }
  };

  const handleDebitAccountValidation = (account: any | null) => {
    setDebitAccountValidated(!!account);
    if (account) {
      setFormData(prev => ({
        ...prev,
        debitAccountName: account.accountHolderName || '',
        currency: account.isDiaspora ? 'USD' : 'ETB',
      }));
    }
  };

  const handleCreditAccountChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      creditAccountNumber: value,
      creditAccountName: '',
      isCreditAccountVerified: false,
    }));
    clearFieldError('creditAccountNumber');
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

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({...prev, phoneNumber: e.target.value}));
  }

  const verifyCreditAccount = async () => {
    if (!formData.creditAccountNumber) return;

    setVerifyingAccount(true);
    try {
      const response = await fetch(`http://localhost:5268/api/Accounts/AccountNumExist/${formData.creditAccountNumber.trim()}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setFormData(prev => ({
            ...prev,
            creditAccountName: result.data.accountHolderName || result.data.name || '',
            isCreditAccountVerified: true,
          }));
          clearFieldError('creditAccountNumber');
        } else {
          setFormData(prev => ({ ...prev, creditAccountName: '', isCreditAccountVerified: false }));
          showError('Beneficiary account not found.');
        }
      } else {
        setFormData(prev => ({ ...prev, creditAccountName: '', isCreditAccountVerified: false }));
        showError('Beneficiary account not found.');
      }
    } catch (error) {
      setFormData(prev => ({ ...prev, creditAccountName: '', isCreditAccountVerified: false }));
      showError('Error validating account.');
    } finally {
      setVerifyingAccount(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
        if (!debitAccountValidated) {
            showError('Please validate the debit account.');
            return;
        }
        if (!formData.isCreditAccountVerified) {
            showError('Please verify the credit account.');
            return;
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            showError('Please enter a valid amount.');
            return;
        }
        if (validateForm(formData)) {
            next();
        }
    } else if (step === 3) {
        if (!formData.signature) {
            showError('Signature is required.');
            return;
        }
        next();
    } else if (step === 4) {
        if (!formData.phoneNumber) {
            showError('Phone number is required.');
            return;
        }
        next();
    } else {
        next();
    }
  };

  const handleRequestOTP = async () => {
    try {
      await requestOTP(
        () => fundTransferService.sendFundTransferOTP(formData.phoneNumber),
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
        () => fundTransferService.sendFundTransferOTP(formData.phoneNumber),
        'OTP resent successfully'
      );
      info('OTP resent successfully');
    } catch (error: any) {
      showError(error?.message || 'Failed to resend OTP');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm(formData) || !branch?.id) return;

    setIsSubmitting(true);
    try {
      const amountInETB = convertAmount(formData.amount, formData.currency);
      
      const transferData = {
        phoneNumber: formData.phoneNumber,
        branchId: branch.id,
        debitAccountNumber: formData.debitAccountNumber,
        creditAccountNumber: formData.creditAccountNumber,
        amount: parseFloat(amountInETB),
        otp: formData.otp,
        signature: formData.signature,
      };

      const response = await fundTransferService.submitTransfer(transferData);

      await createWorkflow({
        voucherId: response.data?.id || '',
        voucherType: 'transfer',
        transactionType: 'transfer',
        amount: parseFloat(amountInETB),
        currency: 'ETB',
        customerSegment: 'normal',
        reason: 'Customer fund transfer request',
        voucherData: transferData,
      });

      showSuccess('Transfer submitted successfully!');
      
      navigate('/fund-transfer-confirmation', {
        state: {
          serverData: response,
          branchName: branch.name,
          ui: { ...formData, telephoneNumber: formData.phoneNumber },
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
        selectedAccount={formData.debitAccountNumber}
        onAccountChange={handleDebitAccountChange}
        onAccountValidation={handleDebitAccountValidation}
        label="Debit Account"
        error={errors.debitAccountNumber}
        allowManualEntry={true}
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Credit Account <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.creditAccountNumber}
            onChange={(e) => handleCreditAccountChange(e.target.value)}
            placeholder="Enter credit account number"
            className="flex-1 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
          />
          <button
            type="button"
            onClick={verifyCreditAccount}
            disabled={!formData.creditAccountNumber || verifyingAccount}
            className="bg-fuchsia-700 text-white px-4 py-3 rounded-lg hover:bg-fuchsia-800 font-medium disabled:opacity-50 transition-all"
          >
            {verifyingAccount ? 'Verifying...' : 'Verify'}
          </button>
        </div>
        {errors.creditAccountNumber && (
          <p className="mt-1 text-sm text-red-600">{errors.creditAccountNumber}</p>
        )}
        
        {formData.isCreditAccountVerified && formData.creditAccountName && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Account Holder</p>
              <p className="text-green-700 font-semibold">{formData.creditAccountName}</p>
            </div>
          </div>
        )}
      </div>

      <AmountInput
        value={formData.amount}
        onChange={handleAmountChange}
        currency={formData.currency}
        onCurrencyChange={debitAccountValidated ? handleCurrencyChange : undefined}
        currencies={getCurrencyOptions()}
        error={errors.amount}
        showConversion={debitAccountValidated && formData.currency !== 'ETB'}
        convertedAmount={convertAmount(formData.amount, formData.currency)}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">From Account:</span>
          <span className="font-mono font-semibold text-fuchsia-900">{formData.debitAccountNumber}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">To Account:</span>
          <span className="font-mono font-semibold text-fuchsia-900">{formData.creditAccountNumber}</span>
        </div>
        {formData.isCreditAccountVerified && formData.creditAccountName && (
          <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
            <span className="font-medium text-fuchsia-800">Beneficiary Name:</span>
            <span className="font-semibold text-fuchsia-900">{formData.creditAccountName}</span>
          </div>
        )}
        <div className="flex justify-between items-center py-2">
          <span className="font-medium text-fuchsia-800">Amount:</span>
          <span className="text-lg font-bold text-fuchsia-700">
            {Number(formData.amount).toLocaleString()} {formData.currency}
            {debitAccountValidated && formData.currency !== 'ETB' && (
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
    <div className="space-y-6">
        <div className="border border-fuchsia-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Enter Phone Number</h2>
            <p className="text-gray-600 mb-4">
                Please enter the phone number associated with the account for OTP verification.
            </p>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handlePhoneNumberChange}
                    placeholder="Enter your phone number..."
                    className="w-full p-3 rounded-lg border border-gray-300 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
                />
                {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                )}
            </div>
        </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="border border-fuchsia-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-fuchsia-700" />
          Request OTP
        </h2>
        <p className="text-gray-600 mb-4">
          Click the button below to receive an OTP on the number you provided: <strong>{formData.phoneNumber}</strong>.
        </p>
      </div>
    </div>
  );

  const renderStep6 = () => (
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
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return null;
    }
  };

  const getNextHandler = () => {
    switch (step) {
      case 1: return handleNext;
      case 2: return handleNext;
      case 3: return handleNext;
      case 4: return handleNext;
      case 5: return handleRequestOTP;
      case 6: return handleSubmit;
      default: return handleNext;
    }
  };

  const getNextLabel = () => {
    switch (step) {
      case 5: return 'Request OTP';
      case 6: return 'Verify & Submit';
      default: return 'Continue';
    }
  };

  return (
    <FormLayout
      title="Fund Transfer"
      branchName={branch?.name}
    >
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {getStepContent()}

        <StepNavigation
          currentStep={step}
          totalSteps={6}
          onNext={getNextHandler()}
          onBack={prev}
          nextLabel={getNextLabel()}
          nextDisabled={(step === 6 && formData.otp.length !== 6) || isSubmitting}
          nextLoading={(step === 5 && otpLoading) || (step === 6 && isSubmitting)}
          hideBack={isFirst}
        />
      </form>
    </FormLayout>
  );
}