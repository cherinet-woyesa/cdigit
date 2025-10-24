// features/customer/forms/RTGSTransfer/RTGSTransfer.tsx
import { useState, useEffect, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { useToast } from '../../../../context/ToastContext';
import { useFormSteps } from '../../hooks/useFormSteps';
import { useAccountSelection } from '../../hooks/useAccountSelection';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useOTPHandling } from '../../hooks/useOTPHandling';
import { useSignaturePad } from '../../hooks/useSignaturePad';
import { useApprovalWorkflow } from '../../../../hooks/useApprovalWorkflow';
import { FormLayout } from '../../components/FormLayout';
import { StepNavigation } from '../../components/StepNavigation';
import { SignaturePad } from '../../components/SignaturePad';
import { OTPVerification } from '../../components/OTPVerification';
import { rtgsTransferValidationSchema } from '../../utils/rtgsTransferValidationSchema';
import { submitRtgsTransfer, requestRtgsTransferOtp } from '../../../../services/rtgsTransferService';
import { requiresTransactionApproval } from '../../../../config/rbacMatrix';
import Field from '../../../../components/Field';
import { 
    Loader2, 
    CheckCircle2, 
    Shield,
    PenTool
} from 'lucide-react';

const BANKS = ['Commercial Bank of Ethiopia', 'Awash International Bank', 'Dashen Bank', 'Abyssinia Bank', 'Nib International Bank', 'Bank of Abyssinia', 'Wegagen Bank', 'United Bank', 'Berhan Bank', 'Abay Bank', 'Bunna Bank', 'Addis International Bank', 'ZamZam Bank', 'Shabelle Bank', 'Tsedey Bank', 'Enat Bank', 'Lion International Bank', 'Oromia International Bank', 'Zemen Bank', 'Cooperative Bank of Oromia'];

interface FormData {
    orderingAccountNumber: string;
    orderingCustomerName: string;
    beneficiaryBank: string;
    beneficiaryBranch: string;
    beneficiaryAccountNumber: string;
    beneficiaryName: string;
    transferAmount: string;
    paymentNarrative: string;
    digitalSignature: string;
    otpCode: string;
}

export default function RTGSTransferForm() {
    const { t } = useTranslation();
    const { phone } = useAuth();
    const { branch } = useBranch();
    const navigate = useNavigate();
    const { success: showSuccess, error: showError, info } = useToast();
    const { createWorkflow } = useApprovalWorkflow();

    const { accounts, loadingAccounts, errorAccounts, selectedAccount, selectAccount } = useAccountSelection('selectedRtgsAccount');
    const { step, next, prev, isFirst, isLast } = useFormSteps(5);
    const { errors, validateForm, clearFieldError } = useFormValidation(rtgsTransferValidationSchema);
    const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();
    const { signaturePadRef, isSignatureEmpty, handleSignatureEnd, handleSignatureClear, getSignatureData } = useSignaturePad();

    const [formData, setFormData] = useState<FormData>({
        orderingAccountNumber: selectedAccount?.accountNumber || '',
        orderingCustomerName: selectedAccount?.accountHolderName || '',
        beneficiaryBank: '',
        beneficiaryBranch: '',
        beneficiaryAccountNumber: '',
        beneficiaryName: '',
        transferAmount: '',
        paymentNarrative: '',
        digitalSignature: '',
        otpCode: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (selectedAccount) {
            setFormData(prev => ({
                ...prev,
                orderingAccountNumber: selectedAccount.accountNumber,
                orderingCustomerName: selectedAccount.accountHolderName || '',
            }));
        }
    }, [selectedAccount]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        clearFieldError(name);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAccountChange = (accountNumber: string) => {
        selectAccount(accountNumber);
    };

    const handleNext = () => {
        if (validateForm(formData)) {
            next();
        }
    };

    const handleRequestOTP = async () => {
        const signatureData = getSignatureData();
        if (!signatureData) {
            showError('Signature is required.');
            return;
        }
        setFormData(prev => ({ ...prev, digitalSignature: signatureData }));

        if (!validateForm(formData)) return;

        try {
            await requestOTP(() => requestRtgsTransferOtp(phone!));
            info('OTP sent to your phone');
            next();
        } catch (error: any) {
            showError(error?.message || 'Failed to send OTP');
        }
    };

    const handleResend = () => {
        resendOTP(() => requestRtgsTransferOtp(phone!));
    }

    const handleSubmit = async () => {
        if (!validateForm(formData) || !branch?.id) return;

        setIsSubmitting(true);
        try {
            const payload = {
                BranchId: branch.id,
                OrderingAccountNumber: formData.orderingAccountNumber,
                OrderingCustomerName: formData.orderingCustomerName,
                BeneficiaryBank: formData.beneficiaryBank,
                BeneficiaryBranch: formData.beneficiaryBranch,
                BeneficiaryAccountNumber: formData.beneficiaryAccountNumber,
                BeneficiaryName: formData.beneficiaryName,
                TransferAmount: parseFloat(formData.transferAmount),
                PaymentNarrative: formData.paymentNarrative,
                CustomerTelephone: phone!,
                PhoneNumber: phone!,
                DigitalSignature: formData.digitalSignature,
                OtpCode: formData.otpCode,
            };

            const response = await submitRtgsTransfer(payload);
            
            if (response.success) {
                await createWorkflow({
                    voucherId: response.data?.Id || '',
                    voucherType: 'rtgs',
                    transactionType: 'rtgs',
                    amount: parseFloat(formData.transferAmount),
                    currency: 'ETB',
                    customerSegment: 'normal',
                    reason: 'Customer RTGS transfer request',
                    voucherData: payload,
                    customerSignature: formData.digitalSignature,
                });
                
                showSuccess('RTGS Transfer submitted successfully!');
                navigate('/form/rtgs-transfer/confirmation', { 
                    state: { api: response.data, branchName: branch.name } 
                });
            } else {
                throw new Error(response.message || 'Submission failed');
            }
        } catch (error: any) {
            showError(error?.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const checkApprovalStatus = () => {
        const approvalCheck = requiresTransactionApproval('rtgs', Number(formData.transferAmount), 'ETB', 'normal');
        if (approvalCheck.required) {
            return (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <p className="text-orange-800 font-medium">⚠️ {t('approvalRequired', 'This transaction will require manager approval')}</p>
                    <p className="text-sm text-orange-700 mt-1">{approvalCheck.reason}</p>
                </div>
            );
        }
        return null;
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <Field label="Account Number" required error={errors.orderingAccountNumber}>
                <select name="orderingAccountNumber" value={formData.orderingAccountNumber} onChange={e => handleAccountChange(e.target.value)} className="w-full p-3 rounded-lg border border-gray-300">
                    <option value="">Choose your account</option>
                    {accounts.map(acc => <option key={acc.accountNumber} value={acc.accountNumber}>{acc.accountNumber} - {acc.accountHolderName}</option>)}
                </select>
            </Field>
            <Field label="Customer Name" required error={errors.orderingCustomerName}>
                <input type="text" name="orderingCustomerName" value={formData.orderingCustomerName} readOnly className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50" />
            </Field>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Beneficiary Bank" required error={errors.beneficiaryBank}>
                    <select name="beneficiaryBank" value={formData.beneficiaryBank} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300">
                        <option value="">Select a bank</option>
                        {BANKS.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                    </select>
                </Field>
                <Field label="Beneficiary Branch" required error={errors.beneficiaryBranch}>
                    <input type="text" name="beneficiaryBranch" value={formData.beneficiaryBranch} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300" />
                </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Beneficiary Account" required error={errors.beneficiaryAccountNumber}>
                    <input type="text" name="beneficiaryAccountNumber" value={formData.beneficiaryAccountNumber} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300" />
                </Field>
                <Field label="Beneficiary Name" required error={errors.beneficiaryName}>
                    <input type="text" name="beneficiaryName" value={formData.beneficiaryName} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300" />
                </Field>
            </div>
            <Field label="Transfer Amount (ETB)" required error={errors.transferAmount}>
                <input type="text" name="transferAmount" value={formData.transferAmount} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300" placeholder="0.00" />
            </Field>
            <Field label="Payment Narrative" required error={errors.paymentNarrative}>
                <textarea name="paymentNarrative" rows={3} value={formData.paymentNarrative} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300" maxLength={200} />
            </Field>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-4">
            {checkApprovalStatus()}
            {/* Review details here */}
        </div>
    );

    const renderStep4 = () => (
        <SignaturePad 
            ref={signaturePadRef} 
            onEnd={handleSignatureEnd} 
            onClear={handleSignatureClear} 
            isSignatureEmpty={isSignatureEmpty} 
            error={errors.digitalSignature} 
        />
    );

    const renderStep5 = () => (
        <OTPVerification
            phone={phone!}
            otp={formData.otpCode}
            onOtpChange={(otp) => setFormData(prev => ({...prev, otpCode: otp}))}
            onResendOtp={handleResend}
            resendCooldown={resendCooldown}
            loading={otpLoading}
            error={errors.otpCode}
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
            default: return null;
        }
    };

    return (
        <FormLayout title="RTGS Transfer" phone={phone!} branchName={branch?.name} loading={loadingAccounts} error={errorAccounts}>
            <form onSubmit={e => e.preventDefault()} className="space-y-6">
                {getStepContent()}
                <StepNavigation 
                    currentStep={step} 
                    totalSteps={5} 
                    onNext={isLast ? handleSubmit : (step === 4 ? handleRequestOTP : handleNext)} 
                    onBack={prev} 
                    nextLabel={isLast ? 'Submit' : (step === 4 ? 'Request OTP' : 'Continue')} 
                    nextDisabled={isSubmitting || otpLoading || (step === 4 && isSignatureEmpty)} 
                    nextLoading={isSubmitting || otpLoading} 
                    hideBack={isFirst} 
                />
            </form>
        </FormLayout>
    );
}