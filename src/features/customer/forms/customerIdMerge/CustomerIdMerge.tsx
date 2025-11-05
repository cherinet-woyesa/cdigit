// features/customer/forms/customerIdMerge/CustomerIdMerge.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '../../../../context/BranchContext';
import { useToast } from '../../../../context/ToastContext';
import { useFormValidation } from '../../hooks/useFormValidation';
import { FormLayout } from '../../components/FormLayout';
import { StepNavigation } from '../../components/StepNavigation';
import { customerIdMergeValidationSchema } from '../../utils/extendedValidationSchemas';
import { customerIdMergeService } from '../../../../services/customerIdMergeService';
import { OTPVerification } from '../../components/OTPVerification';
import { useOTPHandling } from '../../hooks/useOTPHandling';
import authService from '../../../../services/authService';
import { useFormSteps } from '../../hooks/useFormSteps';

interface FormData {
  sourceCustomerId: string;
  targetCustomerId: string;
  reason: string;
  otp: string;
  phoneNumber: string;
}

export default function CustomerIdMerge() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError, info } = useToast();
  const navigate = useNavigate();
  const { step, next, prev, isFirst } = useFormSteps(2);
  const { errors, validateForm, clearFieldError } = useFormValidation(customerIdMergeValidationSchema);
  const { otpLoading, otpMessage, resendCooldown, requestOTP } = useOTPHandling();

  const [formData, setFormData] = useState<FormData>({
    sourceCustomerId: '',
    targetCustomerId: '',
    reason: '',
    otp: '',
    phoneNumber: '251911223344', // Hardcoded for now
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof FormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (value) clearFieldError(field);
  };

  const handleOtpChange = (otp: string) => {
    setFormData(prev => ({ ...prev, otp }));
    if (otp.length === 6) clearFieldError('otp');
  };

  const handleRequestOTP = async () => {
    if (!validateForm(formData, ['sourceCustomerId', 'targetCustomerId', 'reason'])) {
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
      const customerIdMergeData = {
        branchId: branch.id,
        sourceCustomerId: formData.sourceCustomerId,
        targetCustomerId: formData.targetCustomerId,
        reason: formData.reason,
        otpCode: formData.otp,
      };

      const response = await customerIdMergeService.submitCustomerIdMerge(customerIdMergeData);

      showSuccess('Customer ID merge request submitted successfully!');
      navigate('/form/customer-id-merge/confirmation', {
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
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Source Customer ID <span className="text-red-500">*</span>
            </label>
            <input
            type="text"
            value={formData.sourceCustomerId}
            onChange={(e) => handleInputChange('sourceCustomerId')(e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            placeholder="Enter source customer ID"
            />
            {errors.sourceCustomerId && (
            <p className="mt-1 text-sm text-red-600">{errors.sourceCustomerId}</p>
            )}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Customer ID <span className="text-red-500">*</span>
            </label>
            <input
            type="text"
            value={formData.targetCustomerId}
            onChange={(e) => handleInputChange('targetCustomerId')(e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            placeholder="Enter target customer ID"
            />
            {errors.targetCustomerId && (
            <p className="mt-1 text-sm text-red-600">{errors.targetCustomerId}</p>
            )}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason <span className="text-red-500">*</span>
            </label>
            <textarea
            value={formData.reason}
            onChange={(e) => handleInputChange('reason')(e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            placeholder="Enter reason"
            rows={4}
            />
            {errors.reason && (
            <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
            )}
        </div>
    </div>
  );

  const renderStep2 = () => (
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
      default: return null;
    }
    };

  return (
    <FormLayout
      title="Customer ID Merge"
      branchName={branch?.name}
      phone={null}
    >
      <form onSubmit={(e) => { e.preventDefault(); step === 1 ? handleRequestOTP() : handleSubmit(); }} className="space-y-6">
        {getStepContent()}
        <StepNavigation
            currentStep={step}
            totalSteps={2}
            onNext={step === 1 ? handleRequestOTP : handleSubmit}
            onBack={prev}
            nextLabel={step === 1 ? 'Request OTP' : 'Verify & Submit'}
            nextDisabled={isSubmitting || otpLoading}
            nextLoading={isSubmitting || otpLoading}
            hideBack={isFirst}
        />
      </form>
    </FormLayout>
  );
}
