
// features/customer/forms/statementRequest/StatementRequestForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { useToast } from '../../../../context/ToastContext';
import { useFormSteps } from '../../hooks/useFormSteps';
import { useAccountSelection } from '../../hooks/useAccountSelection';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useOTPHandling } from '../../hooks/useOTPHandling';
import { useSignaturePad } from '../../hooks/useSignaturePad';
import { useEmailList } from '../../hooks/useEmailList';
import { statementRequestValidationSchema } from '../../utils/statementRequestValidationSchema';
import { statementService } from '../../../../services/statementService';
import { FormLayout } from '../../components/FormLayout';
import { StepNavigation } from '../../components/StepNavigation';
import RequestDetailsStep from '../../components/statementrequest/RequestDetailsStep';
import SignatureStep from '../../components/stoppayment/SignatureStep';
import OTPStep from '../../components/stoppayment/OTPStep';

export default function StatementRequestForm() {
    const navigate = useNavigate();
    const { phone, user } = useAuth();
    const { branch } = useBranch();
    const { success: showSuccess, error: showError } = useToast();
    const { accounts, loadingAccounts, errorAccounts, selectedAccount, selectAccount } = useAccountSelection('selectedStatementAccount');
    const { step, next, prev, isFirst, isLast } = useFormSteps(3);
    const { errors, validateForm } = useFormValidation(statementRequestValidationSchema);
    const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();
    const { signaturePadRef, isSignatureEmpty, handleSignatureEnd, handleSignatureClear, getSignatureData } = useSignaturePad();
    const { emailAddresses, handleEmailChange, addEmailField, removeEmailField } = useEmailList();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        accountNumber: selectedAccount?.accountNumber || '',
        accountHolderName: selectedAccount?.accountHolderName || '',
        emailAddresses: emailAddresses,
        statementFrequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly',
        signature: '',
        otp: '',
    });

    useEffect(() => {
        if (selectedAccount) {
            setFormData(prev => ({
                ...prev,
                accountNumber: selectedAccount.accountNumber,
                accountHolderName: selectedAccount.accountHolderName || '',
            }));
        }
    }, [selectedAccount]);

    useEffect(() => {
        setFormData(prev => ({ ...prev, emailAddresses }));
    }, [emailAddresses]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRequestOTP = async () => {
        const signatureData = getSignatureData();
        if (!signatureData) {
            showError('Signature is required.');
            return;
        }
        setFormData(prev => ({ ...prev, signature: signatureData }));

        if (!validateForm(formData)) return;

        try {
            await requestOTP(() => statementService.requestStatementOtp(phone!));
            next();
        } catch (error: any) {
            showError(error.message || 'Failed to send OTP');
        }
    };

    const handleSubmit = async () => {
        if (!validateForm(formData) || !branch?.id || !user?.id) return;

        setIsSubmitting(true);
        try {
            const result = await statementService.submitStatementRequest({
                ...formData,
                branchName: branch.name,
                branchCode: branch.id,
                customerId: user.id,
                customerName: formData.accountHolderName,
                accountNumbers: [formData.accountNumber],
                termsAccepted: true,
                makerId: user.id,
                makerName: user.firstName + ' ' + user.lastName,
                makerDate: new Date().toISOString(),
                phoneNumber: phone!,
                branchId: branch.id,
                otpCode: formData.otp,
            });

            if (result.success) {
                showSuccess('Statement request submitted successfully!');
                navigate('/form/statement-request/confirmation', { state: { request: result.data } });
            } else {
                showError(result.message || 'Submission failed');
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
                return <RequestDetailsStep formData={formData} onChange={handleChange} errors={errors} onAccountChange={selectAccount} emailProps={{emailAddresses, handleEmailChange, addEmailField, removeEmailField}} accounts={accounts} />;
            case 2:
                return <SignatureStep signaturePadRef={signaturePadRef} onEnd={handleSignatureEnd} onClear={handleSignatureClear} isSignatureEmpty={isSignatureEmpty} error={errors.signature} />;
            case 3:
                return <OTPStep otpCode={formData.otp} onOtpChange={handleChange} onResend={() => resendOTP(() => statementService.requestStatementOtp(phone!))} resendCooldown={resendCooldown} otpMessage={otpMessage} error={errors.otp} />;
            default:
                return null;
        }
    };

    return (
        <FormLayout title="Statement Request" phone={phone} branchName={branch?.name} loading={loadingAccounts} error={errorAccounts}>
            <div className="space-y-6">
                {renderStep()}
                <StepNavigation 
                    currentStep={step} 
                    totalSteps={3} 
                    onNext={isLast ? handleSubmit : (step === 2 ? handleRequestOTP : next)} 
                    onBack={prev} 
                    nextLabel={isLast ? 'Submit' : (step === 2 ? 'Request OTP' : 'Continue')} 
                    nextDisabled={isSubmitting || otpLoading || (step === 2 && isSignatureEmpty)} 
                    nextLoading={isSubmitting || otpLoading} 
                    hideBack={isFirst}
                />
            </div>
        </FormLayout>
    );
}
