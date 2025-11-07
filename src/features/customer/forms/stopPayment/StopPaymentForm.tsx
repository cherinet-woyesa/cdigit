// features/customer/forms/stopPayment/StopPaymentForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { useBranch } from '@context/BranchContext';
import { useToast } from '@context/ToastContext';
import { useFormSteps } from '@features/customer/hooks/useFormSteps';
import { useFormValidation } from '@features/customer/hooks/useFormValidation';
import { useOTPHandling } from '@features/customer/hooks/useOTPHandling';
import { useSignaturePad } from '@features/customer/hooks/useSignaturePad';
import { useStopPaymentForm } from '@features/customer/hooks/useStopPaymentForm';
import { stopPaymentValidationSchema } from '@features/customer/utils/stopPaymentValidationSchema';
import stopPaymentService from '@services/transactions/stopPaymentService';
import { FormLayout } from '@features/customer/components/FormLayout';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import SPOForm from '@features/customer/components/stoppayment/SPOForm';
import RSPOForm from '@features/customer/components/stoppayment/RSPOForm';
import ReviewStep from '@features/customer/components/stoppayment/ReviewStep';
import SignatureStep from '@features/customer/components/stoppayment/SignatureStep';
import OTPStep from '@features/customer/components/stoppayment/OTPStep';

export default function StopPaymentForm() {
    const navigate = useNavigate();
    const { phone } = useAuth();
    const { branch } = useBranch();
    const { success: showSuccess, error: showError } = useToast();
    const { step, next, prev, isFirst, isLast } = useFormSteps(4);
    const { formData, setFormData, selectedSpo, toggleMode, handleFormChange, handleSpoSelection } = useStopPaymentForm();
    const { errors, validateForm } = useFormValidation(stopPaymentValidationSchema);
    const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();
    const { signaturePadRef, isSignatureEmpty, handleSignatureEnd, handleSignatureClear, getSignatureData } = useSignaturePad();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRequestOTP = async () => {
        const signatureData = getSignatureData();
        if (!signatureData) {
            showError('Signature is required.');
            return;
        }
        setFormData(prev => ({ ...prev, signature: signatureData }));

        if (!validateForm(formData)) return;

        try {
            await requestOTP(() => stopPaymentService.requestOtp(phone!));
            next();
        } catch (error: any) {
            showError(error.message || 'Failed to send OTP');
        }
    };

    const handleSubmit = async () => {
        if (!validateForm(formData) || !branch?.id) return;

        setIsSubmitting(true);
        try {
            let response;
            if (formData.mode === 'spo') {
                response = await stopPaymentService.submitStopPaymentOrder({
                    ...formData,
                    chequeAmount: parseFloat(formData.amount),
                    chequeDate: new Date(formData.chequeDate).toISOString(),
                    branchId: branch.id,
                    phoneNumber: phone!,
                    chequeBookRequestId: '00000000-0000-0000-0000-000000000000',
                });
            } else {
                response = await stopPaymentService.submitRevokeStopPaymentOrder({
                    stopPaymentOrderId: formData.selectedSpoId,
                    chequeNumber: selectedSpo!.chequeNumber,
                    signature: formData.signature,
                    otpCode: formData.otpCode,
                    phoneNumber: phone!,
                });
            }

            if (response.success) {
                showSuccess(`Request submitted successfully!`);
                navigate('/form/stop-payment/confirmation', { state: { response: response.data, isRevoke: formData.mode === 'rspo' } });
            } else {
                showError(response.error || 'Submission failed');
            }
        } catch (error: any) {
            showError(error.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return formData.mode === 'spo' ? <SPOForm formData={formData} onChange={handleFormChange} errors={errors} /> : <RSPOForm onSelect={handleSpoSelection} selectedSpo={selectedSpo} />;
            case 2:
                return <ReviewStep formData={formData} selectedSpo={selectedSpo} />;
            case 3:
                return <SignatureStep signaturePadRef={signaturePadRef} onEnd={handleSignatureEnd} onClear={handleSignatureClear} isSignatureEmpty={isSignatureEmpty} error={errors.signature} />;
            case 4:
                return <OTPStep otpCode={formData.otpCode} onOtpChange={handleFormChange} onResend={() => resendOTP(() => stopPaymentService.requestOtp(phone!))} resendCooldown={resendCooldown} otpMessage={otpMessage} error={errors.otpCode} />;
            default:
                return null;
        }
    };

    return (
        <FormLayout title={formData.mode === 'spo' ? 'Stop Payment Order' : 'Revoke Stop Payment'} phone={phone} branchName={branch?.name}>
            <div className="flex mb-4 border-b">
                <button onClick={() => toggleMode('spo')} className={`py-2 px-4 ${formData.mode === 'spo' ? 'border-b-2 border-fuchsia-700' : ''}`}>SPO</button>
                <button onClick={() => toggleMode('rspo')} className={`py-2 px-4 ${formData.mode === 'rspo' ? 'border-b-2 border-fuchsia-700' : ''}`}>RSPO</button>
            </div>
            <div className="space-y-6">
                {renderStep()}
                <StepNavigation 
                    currentStep={step} 
                    totalSteps={4} 
                    onNext={isLast ? handleSubmit : (step === 3 ? handleRequestOTP : next)} 
                    onBack={prev} 
                    nextLabel={isLast ? 'Submit' : (step === 3 ? 'Request OTP' : 'Continue')} 
                    nextDisabled={isSubmitting || otpLoading || (step === 3 && isSignatureEmpty)} 
                    nextLoading={isSubmitting || otpLoading} 
                    hideBack={isFirst}
                />
            </div>
        </FormLayout>
    );
}