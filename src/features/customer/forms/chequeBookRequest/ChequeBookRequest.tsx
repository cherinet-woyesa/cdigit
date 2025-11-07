// features/customer/forms/chequeBookRequest/ChequeBookRequest.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '@context/BranchContext';
import { useToast } from '@context/ToastContext';
import { useFormSteps } from '@features/customer/hooks/useFormSteps';
import { useFormValidation } from '@features/customer/hooks/useFormValidation';
import { useOTPHandling } from '@features/customer/hooks/useOTPHandling';
import { FormLayout } from '@features/customer/components/FormLayout';
import { AccountSelector } from '@features/customer/components/AccountSelector';
import { OTPVerification } from '@features/customer/components/OTPVerification';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import { chequeBookRequestValidationSchema } from '@features/customer/utils/extendedValidationSchemas';
import { chequeBookRequestService } from '@services/forms/chequeBookRequestService';
import authService from '@services/auth/authService';
import { Shield } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

interface FormData {
  accountNumber: string;
  accountHolderName: string;
  numberOfChequeBooks: string;
  leavesPerChequeBook: string;
  otp: string;
  phoneNumber: string;
  signature: string;
}

export default function ChequeBookRequest() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError, info } = useToast();
  const navigate = useNavigate();
  const signatureRef = useRef<SignatureCanvas>(null);

  const { step, next, prev, isFirst } = useFormSteps(3);
  const { errors, validateForm, clearFieldError } = useFormValidation(chequeBookRequestValidationSchema);
  const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();

  const [formData, setFormData] = useState<FormData>({
    accountNumber: '',
    accountHolderName: '',
    numberOfChequeBooks: '1',
    leavesPerChequeBook: '25',
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
    setFormData(prev => ({ ...prev, otp }));
    if (otp.length === 6) clearFieldError('otp');
  };

  const handleNext = () => {
    if (step === 1) {
        if (!validateForm(formData, ['accountNumber', 'numberOfChequeBooks', 'leavesPerChequeBook', 'signature'])) {
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
      next(); // Move to OTP verification step
    } catch (error: any) {
      showError(error?.message || 'Failed to send OTP');
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
      const chequeBookRequestData = {
        phoneNumber: formData.phoneNumber,
        branchId: branch.id,
        accountNumber: formData.accountNumber,
        numberOfChequeBooks: parseInt(formData.numberOfChequeBooks),
        leavesPerChequeBook: parseInt(formData.leavesPerChequeBook),
        otpCode: formData.otp,
        digitalSignature: formData.signature,
      };

      const response = await chequeBookRequestService.submitChequeBookRequest(chequeBookRequestData);

      showSuccess('Cheque book request submitted successfully!');
      navigate('/form/cheque-book-request/confirmation', {
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
        <>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Cheque Books <span className="text-red-500">*</span>
                </label>
                <input
                type="number"
                value={formData.numberOfChequeBooks}
                onChange={(e) => handleInputChange('numberOfChequeBooks')(e.target.value)}
                className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                placeholder="1-10"
                min="1"
                max="10"
                />
                {errors.numberOfChequeBooks && (
                <p className="mt-1 text-sm text-red-600">{errors.numberOfChequeBooks}</p>
                )}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Leaves Per Cheque Book <span className="text-red-500">*</span>
                </label>
                <select
                    value={formData.leavesPerChequeBook}
                    onChange={(e) => handleInputChange('leavesPerChequeBook')(e.target.value)}
                    className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                >
                    <option value="25">25 Leaves</option>
                    <option value="50">50 Leaves</option>
                    <option value="100">100 Leaves</option>
                </select>
                {errors.leavesPerChequeBook && (
                <p className="mt-1 text-sm text-red-600">{errors.leavesPerChequeBook}</p>
                )}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Digital Signature <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <SignatureCanvas
                        ref={signatureRef}
                        penColor="black"
                        canvasProps={{ className: 'w-full h-40 rounded-lg border border-fuchsia-300 bg-gray-50' }}
                        onEnd={() => {
                            if (signatureRef.current) {
                                setFormData(prev => ({ ...prev, signature: signatureRef.current.toDataURL() }));
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => signatureRef.current?.clear()}
                        className="absolute top-2 right-2 text-xs text-gray-500 hover:text-gray-700"
                    >
                        Clear
                    </button>
                </div>
                {errors.signature && (
                    <p className="mt-1 text-sm text-red-600">{errors.signature}</p>
                )}
            </div>
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
          <span className="font-medium text-fuchsia-800">Number of Cheque Books:</span>
          <span className="font-semibold text-fuchsia-900">{formData.numberOfChequeBooks}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Leaves Per Cheque Book:</span>
          <span className="font-semibold text-fuchsia-900">{formData.leavesPerChequeBook}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="font-medium text-fuchsia-800">Phone Number:</span>
          <span className="font-semibold text-fuchsia-900">{formData.phoneNumber || 'Not found'}</span>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <OTPVerification
      phone={formData.phoneNumber}
      otp={formData.otp}
      onOtpChange={handleOtpChange}
      onResendOtp={handleRequestOTP}
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
      default: return null;
    }
  };

  const renderCustomNavigation = () => {
    if (step === 2) {
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

    // Default navigation for other steps
    return (
      <StepNavigation
        currentStep={step}
        totalSteps={3}
        onNext={step === 3 ? handleSubmit : handleNext}
        onBack={prev}
        nextLabel={step === 3 ? 'Verify & Submit' : 'Continue'}
        nextDisabled={
          (step === 1 && !accountValidated) || 
          (step === 3 && formData.otp.length !== 6) || 
          isSubmitting
        }
        nextLoading={isSubmitting}
        hideBack={isFirst}
      />
    );
  };

  return (
    <FormLayout
      title="Cheque Book Request"
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
