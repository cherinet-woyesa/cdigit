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
import { useStopPaymentForm, type SPOFormData } from '@features/customer/hooks/useStopPaymentForm';
import { stopPaymentValidationSchema } from '@features/customer/utils/stopPaymentValidationSchema';
import stopPaymentService from '@services/transactions/stopPaymentService';
import { FormLayout } from '@features/customer/components/FormLayout';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import { AccountSelector } from '@features/customer/components/AccountSelector';
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
    const { step, next, prev, isFirst, isLast } = useFormSteps(5);
    const { formData, setFormData, selectedSpo, toggleMode, handleFormChange, handleSpoSelection } = useStopPaymentForm();
    const { errors, validateForm } = useFormValidation(stopPaymentValidationSchema);
    const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();
    const { signaturePadRef, isSignatureEmpty, handleSignatureEnd, handleSignatureClear, getSignatureData } = useSignaturePad();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [accountValidated, setAccountValidated] = useState(false);
    const [accountPhoneNumber, setAccountPhoneNumber] = useState<string | null>(null);

    const handleAccountValidation = (account: any | null) => {
        setAccountValidated(!!account);
    };

    const handlePhoneNumberFetched = (phoneNumber: string) => {
        setAccountPhoneNumber(phoneNumber);
        setFormData(prev => ({ ...prev, phoneNumber }));
    };

    const handleRequestOTP = async () => {
        const signatureData = getSignatureData();
        if (!signatureData) {
            showError('Signature is required.');
            return;
        }
        
        // Update formData with signature before validation
        const updatedFormData = { ...formData, signature: signatureData };
        setFormData(updatedFormData);

        if (!validateForm(updatedFormData)) return;

        try {
            await requestOTP(() => stopPaymentService.requestOtp(phone!));
            next();
        } catch (error: any) {
            showError(error?.message || 'Failed to send OTP');
        }
    };

    const handleSubmit = async () => {
        // Make sure we have the latest signature data
        const signatureData = getSignatureData();
        if (signatureData && !formData.signature) {
            setFormData(prev => ({ ...prev, signature: signatureData }));
        }
        
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
            showError(error?.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOtpChange = (otp: string) => {
        handleFormChange({
            target: {
                name: 'otpCode',
                value: otp
            }
        } as React.ChangeEvent<HTMLInputElement>);
    };

    const handleNext = () => {
        // For step 1 (SPO mode), only proceed if account is validated
        if (step === 1 && formData.mode === 'spo' && !accountValidated) {
            showError('Please validate the account by entering the account number and clicking "Search"');
            return;
        }
        
        // For step 1 (RSPO mode), only proceed if account is validated
        if (step === 1 && formData.mode === 'rspo' && !accountValidated) {
            showError('Please validate the account by entering the account number and clicking "Search"');
            return;
        }
        
        // For step 2 (SPO mode), validate form data before proceeding
        if (step === 2 && formData.mode === 'spo') {
            const accountNumberError = errors.accountNumber;
            const chequeNumberError = errors.chequeNumber;
            const amountError = errors.amount;
            const chequeDateError = errors.chequeDate;
            const reasonError = errors.reason;
            
            if (accountNumberError || chequeNumberError || amountError || chequeDateError || reasonError) {
                showError('Please correct the errors in the form before proceeding');
                return;
            }
            
            if (!formData.accountNumber || !formData.chequeNumber || !formData.amount || !formData.chequeDate || !formData.reason) {
                showError('Please fill in all required fields');
                return;
            }
        }
        
        // For step 2 (RSPO mode), validate that an SPO is selected
        if (step === 2 && formData.mode === 'rspo' && !formData.selectedSpoId) {
            showError('Please select a stop payment order to revoke');
            return;
        }
        
        next();
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="flex mb-4 border-b">
                <button 
                    onClick={() => toggleMode('spo')} 
                    className={`py-2 px-4 ${formData.mode === 'spo' ? 'border-b-2 border-fuchsia-700' : ''}`}
                >
                    SPO
                </button>
                <button 
                    onClick={() => toggleMode('rspo')} 
                    className={`py-2 px-4 ${formData.mode === 'rspo' ? 'border-b-2 border-fuchsia-700' : ''}`}
                >
                    RSPO
                </button>
            </div>
            
            <AccountSelector
                accounts={[]}
                selectedAccount={formData.accountNumber}
                onAccountChange={(accountNumber, accountHolderName) => {
                    handleFormChange({
                        target: {
                            name: 'accountNumber',
                            value: accountNumber
                        }
                    } as React.ChangeEvent<HTMLInputElement>);
                    
                    if (accountHolderName) {
                        handleFormChange({
                            target: {
                                name: 'accountHolderName',
                                value: accountHolderName
                            }
                        } as React.ChangeEvent<HTMLInputElement>);
                    }
                }}
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
            
            {accountValidated && accountPhoneNumber && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm font-medium text-green-800">
                        Phone number: <strong>{accountPhoneNumber}</strong>
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                        OTP will be sent to this number
                    </div>
                </div>
            )}
        </div>
    );

    const renderStep2 = () => {
        if (formData.mode === 'spo') {
            return (
                <div className="space-y-6">
                    <SPOForm 
                        formData={formData}
                        onChange={handleFormChange} 
                        errors={errors} 
                    />
                </div>
            );
        } else {
            return (
                <div className="space-y-6">
                    <RSPOForm 
                        onSelect={handleSpoSelection} 
                        selectedSpo={selectedSpo}
                        accountValidated={accountValidated}
                        setAccountValidated={setAccountValidated}
                    />
                </div>
            );
        }
    };

    const renderStep3 = () => (
        <ReviewStep formData={formData} selectedSpo={selectedSpo} />
    );

    const renderStep4 = () => (
        <SignatureStep 
            signaturePadRef={signaturePadRef} 
            onEnd={handleSignatureEnd} 
            onClear={handleSignatureClear} 
            isSignatureEmpty={isSignatureEmpty} 
            error={errors.signature} 
        />
    );

    const renderStep5 = () => (
        <OTPStep 
            otpCode={formData.otpCode} 
            onOtpChange={handleOtpChange} 
            onResend={() => resendOTP(() => stopPaymentService.requestOtp(phone!))} 
            resendCooldown={resendCooldown} 
            otpMessage={otpMessage} 
            error={errors.otpCode} 
            phone={accountPhoneNumber || phone || ""}
        />
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

    return (
        <FormLayout title={formData.mode === 'spo' ? 'Stop Payment Order' : 'Revoke Stop Payment'} phone={phone} branchName={branch?.name}>
            <div className="space-y-6">
                {getStepContent()}
                <StepNavigation 
                    currentStep={step} 
                    totalSteps={5} 
                    onNext={isLast ? handleSubmit : (step === 4 ? handleRequestOTP : handleNext)} 
                    onBack={prev} 
                    nextLabel={isLast ? 'Submit' : (step === 4 ? 'Request OTP' : 'Continue')} 
                    nextDisabled={
                        isSubmitting || otpLoading || 
                        (step === 4 && isSignatureEmpty) || 
                        (step === 1 && !accountValidated) ||
                        (step === 2 && formData.mode === 'spo' && (!formData.chequeNumber || !formData.amount || !formData.chequeDate || !formData.reason)) ||
                        (step === 2 && formData.mode === 'rspo' && !formData.selectedSpoId)
                    } 
                    nextLoading={isSubmitting || otpLoading} 
                    hideBack={isFirst}
                />
            </div>
        </FormLayout>
    );
}