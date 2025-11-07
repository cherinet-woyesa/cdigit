// features/customer/forms/statementRequest/StatementRequestForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { useBranch } from '@context/BranchContext';
import { useToast } from '@context/ToastContext';
import { useFormSteps } from '@features/customer/hooks/useFormSteps';
import { useAccountSelection } from '@features/customer/hooks/useAccountSelection';
import { useFormValidation } from '@features/customer/hooks/useFormValidation';
import { useOTPHandling } from '@features/customer/hooks/useOTPHandling';
import { useSignaturePad } from '@features/customer/hooks/useSignaturePad';
import { useEmailList } from '@features/customer/hooks/useEmailList';
import { statementRequestValidationSchema } from '@features/customer/utils/statementRequestValidationSchema';
import { statementService } from '@services/statementService';
import { FormLayout } from '@features/customer/components/FormLayout';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import RequestDetailsStep from '@features/customer/components/statementrequest/RequestDetailsStep';
import SignatureStep from '@features/customer/components/statementrequest/SignatureStep';
import OTPStep from '@features/customer/components/statementrequest/OTPStep';
import { Shield } from 'lucide-react';

export default function StatementRequestForm() {
    const navigate = useNavigate();
    const { phone, user } = useAuth();
    const { branch } = useBranch();
    const { success: showSuccess, error: showError } = useToast();
    const { accounts, loadingAccounts, errorAccounts, selectedAccount, selectAccount } = useAccountSelection('selectedStatementAccount');
    const { step, next, prev, isFirst, isLast } = useFormSteps(4); // 4 steps
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
        phoneNumber: phone || '', // Add phone number to form data
    });

    // State for account validation
    const [accountValidated, setAccountValidated] = useState(false);
    const [validatedAccount, setValidatedAccount] = useState<any>(null);

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

    const handleFrequencyChange = (frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly') => {
        setFormData(prev => ({ ...prev, statementFrequency: frequency }));
    };

    const handleAccountValidation = (account: any | null) => {
        setValidatedAccount(account);
        setAccountValidated(!!account);
        if (account) {
            setFormData(prev => ({
                ...prev,
                accountHolderName: account.accountHolderName || '',
                phoneNumber: account.phoneNumber || phone || '', // Set phone number from account if available
            }));
        }
    };

    const handleRequestOTP = async () => {
        // Ensure account is validated before proceeding
        if (!accountValidated) {
            showError('Please validate the account before proceeding');
            return;
        }

        // Validate email addresses
        const emails = formData.emailAddresses.filter(email => email.trim() !== '');
        if (emails.length === 0) {
            showError('Please enter at least one email address');
            return;
        }

        const signatureData = getSignatureData();
        if (!signatureData) {
            showError('Signature is required.');
            return;
        }
        setFormData(prev => ({ ...prev, signature: signatureData }));

        if (!validateForm(formData)) return;

        try {
            // Use the phone number from form data
            await requestOTP(() => statementService.requestStatementOtp(formData.phoneNumber));
            next();
        } catch (error: any) {
            showError(error.message || 'Failed to send OTP');
        }
    };

    const handleSubmit = async () => {
        // Ensure account is validated before submission
        if (!accountValidated) {
            showError('Please validate the account before submitting');
            return;
        }

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
                phoneNumber: formData.phoneNumber,
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

    const handleNext = () => {
        if (step === 1) {
            // For step 1 (account validation), ensure account is validated
            if (!accountValidated) {
                showError('Please validate the account before proceeding');
                return;
            }
            next();
        } else if (step === 2) {
            // For step 2 (email and frequency), ensure at least one email is provided
            const emails = formData.emailAddresses.filter(email => email.trim() !== '');
            if (emails.length === 0) {
                showError('Please enter at least one email address');
                return;
            }
            next();
        } else {
            next();
        }
    };

    const getStepContent = () => {
        switch (step) {
            case 1:
                // Account validation step
                return (
                    <div className="space-y-6">
                        <RequestDetailsStep 
                            formData={formData} 
                            onChange={handleChange} 
                            errors={errors} 
                            onAccountChange={handleChange}
                            emailProps={{emailAddresses, handleEmailChange, addEmailField, removeEmailField}} 
                            accounts={accounts}
                            onAccountValidation={handleAccountValidation}
                            validatedAccount={validatedAccount}
                        />
                    </div>
                );
            case 2:
                // Email addresses and statement frequency step
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">Email Address(es)</h3>
                            <p className="text-sm text-gray-600">Please enter the email address(es) where you want to receive your statement.</p>
                            
                            <div className="space-y-3">
                                {emailAddresses.map((email, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <input 
                                            type="email" 
                                            value={email} 
                                            onChange={(e) => handleEmailChange(index, e.target.value)} 
                                            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700"
                                            placeholder={`Email address ${index + 1}`}
                                            required={index === 0} 
                                        />
                                        {emailAddresses.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeEmailField(index)} 
                                                className="p-2 text-red-500 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button 
                                    type="button" 
                                    onClick={addEmailField} 
                                    className="text-sm text-fuchsia-700 hover:text-fuchsia-900 font-medium"
                                >
                                    + Add another email
                                </button>
                            </div>
                            
                            {errors.emailAddresses && (
                                <p className="text-sm text-red-600">{errors.emailAddresses}</p>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">Statement Frequency</h3>
                            <p className="text-sm text-gray-600">Please select how often you would like to receive your statement.</p>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { value: 'daily', label: 'Daily' },
                                    { value: 'weekly', label: 'Weekly' },
                                    { value: 'monthly', label: 'Monthly' },
                                    { value: 'quarterly', label: 'Quarterly' }
                                ].map((option) => (
                                    <div 
                                        key={option.value} 
                                        className={`border rounded-lg p-4 cursor-pointer text-center transition-all ${
                                            formData.statementFrequency === option.value 
                                                ? 'border-fuchsia-500 bg-fuchsia-50 ring-2 ring-fuchsia-100' 
                                                : 'border-gray-300 hover:border-fuchsia-300'
                                        }`}
                                        onClick={() => handleFrequencyChange(option.value as 'daily' | 'weekly' | 'monthly' | 'quarterly')}
                                    >
                                        <span className="block text-sm font-medium">{option.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 3:
                // Signature step
                return <SignatureStep signaturePadRef={signaturePadRef} onEnd={handleSignatureEnd} onClear={handleSignatureClear} isSignatureEmpty={isSignatureEmpty} error={errors.signature} />;
            case 4:
                // OTP step
                return <OTPStep otpCode={formData.otp} onOtpChange={handleChange} onResend={() => resendOTP(() => statementService.requestStatementOtp(formData.phoneNumber))} resendCooldown={resendCooldown} otpMessage={otpMessage} error={errors.otp} />;
            default:
                return null;
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
                nextLabel={step === 4 ? 'Submit' : 'Continue'}
                nextDisabled={
                    (step === 1 && !accountValidated) || 
                    (step === 2 && formData.emailAddresses.filter(email => email.trim() !== '').length === 0) ||
                    (step === 4 && formData.otp.length !== 6) || 
                    isSubmitting
                }
                nextLoading={isSubmitting}
                hideBack={isFirst}
            />
        );
    };

    return (
        <FormLayout title="Statement Request" phone={phone} branchName={branch?.name} loading={loadingAccounts} error={errorAccounts}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                {getStepContent()}
                {renderCustomNavigation()}
            </form>
        </FormLayout>
    );
}