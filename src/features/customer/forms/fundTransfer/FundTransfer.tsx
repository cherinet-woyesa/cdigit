// features/customer/forms/fundTransfer/FundTransferForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '../../../../context/BranchContext';
import { useToast } from '../../../../context/ToastContext';
import { useFormSteps } from '../../hooks/useFormSteps';
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
import authService from '../../../../services/authService';
import { CheckCircle2, Shield } from 'lucide-react';

interface FormData {
  debitAccountNumber: string;
  debitAccountName: string;
  creditAccountNumber: string;
  creditAccountName: string;
  amount: string;
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

  const { step, next, prev, isFirst } = useFormSteps(4);
  const { errors, validateForm, clearFieldError } = useFormValidation(transferValidationSchema);
  const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();

  const [formData, setFormData] = useState<FormData>({
    debitAccountNumber: '',
    debitAccountName: '',
    creditAccountNumber: '',
    creditAccountName: '',
    amount: '',
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
        phoneNumber: account.phoneNumber || '',
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
        if (formData.debitAccountNumber === formData.creditAccountNumber) {
            showError('Debit and credit accounts cannot be the same.');
            return;
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            showError('Please enter a valid amount.');
            return;
        }
    }
    next();
  };

  const handleRequestOTP = async () => {
    if (!formData.phoneNumber) {
      showError('Phone number not found for this account. Please contact support.');
      return;
    }
    try {
      await requestOTP(
        () => authService.requestWithdrawalOTP(formData.phoneNumber),
        'OTP sent to your phone'
      );
      info('OTP sent to your phone');
      next();
    } catch (error: any) {
      showError(error?.message || 'Failed to send OTP');
    }
  };

  const handleResendOTP = async () => {
    if (!formData.phoneNumber) {
      showError('Phone number not found for this account. Please contact support.');
      return;
    }
    try {
      await resendOTP(
        () => authService.requestWithdrawalOTP(formData.phoneNumber),
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
      const transferData = {
        phoneNumber: formData.phoneNumber,
        branchId: branch.id,
        debitAccountNumber: formData.debitAccountNumber,
        creditAccountNumber: formData.creditAccountNumber,
        amount: parseFloat(formData.amount),
        otp: formData.otp,
        signature: formData.signature,
      };

      const response = await fundTransferService.submitTransfer(transferData);

      await createWorkflow({
        voucherId: response.data?.id || '',
        voucherType: 'transfer',
        transactionType: 'transfer',
        amount: parseFloat(formData.amount),
        currency: 'ETB',
        customerSegment: 'normal',
        reason: 'Customer fund transfer request',
        voucherData: transferData,
      });

      showSuccess('Transfer submitted successfully!');
      
      navigate('/form/fund-transfer/confirmation', {
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
        onPhoneNumberFetched={(phone) => setFormData(prev => ({...prev, phoneNumber: phone}))}
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
        error={errors.amount}
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
            {Number(formData.amount).toLocaleString()} ETB
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

    return (
      <StepNavigation
        currentStep={step}
        totalSteps={4}
        onNext={step === 4 ? handleSubmit : handleNext}
        onBack={prev}
        nextLabel={step === 4 ? 'Verify & Submit' : 'Continue'}
        nextDisabled={
          (step === 1 && (!debitAccountValidated || !formData.isCreditAccountVerified)) || 
          (step === 4 && formData.otp.length !== 6) || 
          isSubmitting
        }
        nextLoading={isSubmitting}
        hideBack={isFirst}
      />
    );
  };

  return (
    <FormLayout
      title="Fund Transfer"
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