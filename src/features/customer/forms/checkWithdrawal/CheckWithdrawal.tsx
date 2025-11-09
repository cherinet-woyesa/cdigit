// features/customer/forms/checkWithdrawal/CheckWithdrawal.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '@context/BranchContext';
import { useToast } from '@context/ToastContext';
import { useFormSteps } from '@features/customer/hooks/useFormSteps';
import { useFormValidation } from '@features/customer/hooks/useFormValidation';
import { useOTPHandling } from '@features/customer/hooks/useOTPHandling';
import { FormLayout } from '@features/customer/components/FormLayout';
import { AccountSelector } from '@features/customer/components/AccountSelector';
import { AmountInput } from '@features/customer/components/AmountInput';
import { OTPVerification } from '@features/customer/components/OTPVerification';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import { SignatureStep } from '@features/customer/components/SignatureStep';
import { checkWithdrawalValidationSchema } from '@features/customer/utils/extendedValidationSchemas';
import checkWithdrawalService from '@services/transactions/checkWithdrawalService';
import authService from '@services/auth/authService';
import { Shield } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

interface FormData {
  accountNumber: string;
  accountHolderName: string;
  amount: string;
  chequeNo: string;
  checkType: string;
  checkValueDate: string;
  otp: string;
  phoneNumber: string;
  signature: string;
}

export default function CheckWithdrawal() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError, info } = useToast();
  const navigate = useNavigate();
  const signatureRef = useRef<SignatureCanvas>(null);

  const { step, next, prev, isFirst } = useFormSteps(5);
  const { errors, validateForm, clearFieldError } = useFormValidation(checkWithdrawalValidationSchema);
  const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();

  const [formData, setFormData] = useState<FormData>({
    accountNumber: '',
    accountHolderName: '',
    amount: '',
    chequeNo: '',
    checkType: '',
    checkValueDate: '',
    otp: '',
    phoneNumber: '',
    signature: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [accountValidated, setAccountValidated] = useState(false);
  
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
      }));
    }
  };

  const handlePhoneNumberFetched = (phoneNumber: string) => {
    setFormData(prev => ({ ...prev, phoneNumber }));
  };

  const handleInputChange = (field: keyof FormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (value) clearFieldError(field);
  };

  const handleOtpChange = (otp: string) => {
    setFormData(prev => ({
      ...prev,
      otp
    }));
    if (otp.length === 6) clearFieldError('otp');
  };

  const handleSignatureComplete = (signatureData: string) => {
    setFormData(prev => ({ ...prev, signature: signatureData }));
    clearFieldError('signature');
  };

  const handleSignatureClear = () => {
    setFormData(prev => ({ ...prev, signature: '' }));
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
      if (!formData.chequeNo.trim()) {
        showError('Please enter a cheque number');
        return;
      }
    }
    
    if (step === 2) {
      if (!formData.checkType) {
        showError('Please select a check type');
        return;
      }
      if (!formData.checkValueDate) {
        showError('Please select a check value date');
        return;
      }
    }
    
    if (step === 3) {
      if (!formData.signature) {
        showError('Please provide a signature');
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

  const handleSubmit = async () => {
    if (!branch?.id) {
      showError('Branch information is missing. Please select a branch and try again.');
      return;
    }
    if (!validateForm(formData)) return;

    setIsSubmitting(true);
    try {
      const checkWithdrawalData = {
        phoneNumber: formData.phoneNumber,
        branchId: branch.id,
        accountNumber: formData.accountNumber,
        amount: parseFloat(formData.amount),
        chequeNo: formData.chequeNo,
        checkType: formData.checkType,
        checkValueDate: formData.checkValueDate,
        otpCode: formData.otp,
        signature: formData.signature,
      };

      const response = await checkWithdrawalService.submitCheckWithdrawal(checkWithdrawalData);

      showSuccess('Check withdrawal request submitted successfully!');
      navigate('/form/check-withdrawal/confirmation', {
        state: {
          serverData: response,
          branchName: branch.name,
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
      {accountValidated && (
        <div className="space-y-6">
          <AmountInput
            value={formData.amount}
            onChange={handleInputChange('amount')}
            currency="ETB"
            error={errors.amount}
            label="Amount"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cheque Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.chequeNo}
              onChange={(e) => handleInputChange('chequeNo')(e.target.value)}
              className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
              placeholder="Enter cheque number"
            />
            {errors.chequeNo && (
              <p className="mt-1 text-sm text-red-600">{errors.chequeNo}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Check Type <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.checkType}
          onChange={(e) => handleInputChange('checkType')(e.target.value)}
          className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
        >
          <option value="">Select Check Type</option>
          <option value="EG">EG</option>
          <option value="Foreign">Foreign</option>
          <option value="Traveler">Traveler</option>
        </select>
        {errors.checkType && (
          <p className="mt-1 text-sm text-red-600">{errors.checkType}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Check Value Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.checkValueDate}
          onChange={(e) => handleInputChange('checkValueDate')(e.target.value)}
          className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
        />
        {errors.checkValueDate && (
          <p className="mt-1 text-sm text-red-600">{errors.checkValueDate}</p>
        )}
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
          <span className="font-medium text-fuchsia-800">Amount:</span>
          <span className="text-lg font-bold text-fuchsia-700">
            {Number(formData.amount).toLocaleString()} ETB
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Cheque Number:</span>
          <span className="font-semibold text-fuchsia-900">{formData.chequeNo}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Check Type:</span>
          <span className="font-semibold text-fuchsia-900">{formData.checkType}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="font-medium text-fuchsia-800">Check Value Date:</span>
          <span className="font-semibold text-fuchsia-900">{formData.checkValueDate}</span>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="border border-fuchsia-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-fuchsia-700" />
        OTP Verification
      </h2>
      
      <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 border border-fuchsia-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-fuchsia-700">
          An OTP has been sent to your phone number: 
          <strong className="text-fuchsia-900"> {formData.phoneNumber}</strong>
        </p>
      </div>

      <div className="max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter OTP <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.otp}
          onChange={(e) => {
            const sanitizedValue = e.target.value.replace(/\D/g, '').slice(0, 6);
            handleOtpChange(sanitizedValue);
          }}
          maxLength={6}
          className="w-full p-3 text-center text-2xl tracking-widest rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 font-mono bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
          placeholder="000000"
        />
        
        {errors.otp && (
          <p className="mt-1 text-sm text-red-600">{errors.otp}</p>
        )}
      </div>
    </div>
  );

  const getStepContent = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  const renderCustomNavigation = () => {
    if (step === 4) {
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
            disabled={!formData.phoneNumber || otpLoading}
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
    
    // Use StepNavigation for other steps, including step 5
    return (
      <StepNavigation
        currentStep={step}
        totalSteps={5}
        onNext={step === 5 ? handleSubmit : handleNext}
        onBack={prev}
        nextLabel={step === 5 ? 'Verify & Submit' : 'Continue'}
        nextDisabled={
          (step === 1 && !accountValidated) || 
          (step === 5 && formData.otp.length !== 6) || 
          isSubmitting
        }
        nextLoading={isSubmitting}
        hideBack={isFirst}
      />
    );
  };

  return (
    <FormLayout
      title="Check Withdrawal"
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