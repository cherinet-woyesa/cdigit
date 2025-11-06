// features/customer/forms/RTGSTransfer/RTGSTransfer.tsx
import { useState, useEffect, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { useToast } from '../../../../context/ToastContext';
import { useFormSteps } from '../../hooks/useFormSteps';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useOTPHandling } from '../../hooks/useOTPHandling';
import { useApprovalWorkflow } from '../../../../hooks/useApprovalWorkflow';
import { FormLayout } from '../../components/FormLayout';
import { StepNavigation } from '../../components/StepNavigation';
import { AccountSelector } from '../../components/AccountSelector';
import { SignatureStep } from '../../components/SignatureStep';
import { OTPVerification } from '../../components/OTPVerification';
import { rtgsTransferValidationSchema } from '../../utils/rtgsTransferValidationSchema';
import { submitRtgsTransfer, requestRtgsTransferOtp } from '../../../../services/rtgsTransferService';
import authService from '../../../../services/authService';
import { requiresTransactionApproval } from '../../../../config/rbacMatrix';
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
    phoneNumber: string;
}

export default function RTGSTransferForm() {
    const { t } = useTranslation();
    const { phone } = useAuth();
    const { branch } = useBranch();
    const navigate = useNavigate();
    const { success: showSuccess, error: showError, info } = useToast();
    const { createWorkflow } = useApprovalWorkflow();

    const { step, next, prev, isFirst, isLast } = useFormSteps(5);
    const { errors, validateForm, clearFieldError } = useFormValidation(rtgsTransferValidationSchema);
    const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();

    const [formData, setFormData] = useState<FormData>({
        orderingAccountNumber: '',
        orderingCustomerName: '',
        beneficiaryBank: '',
        beneficiaryBranch: '',
        beneficiaryAccountNumber: '',
        beneficiaryName: '',
        transferAmount: '',
        paymentNarrative: '',
        digitalSignature: '',
        otpCode: '',
        phoneNumber: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [accountValidated, setAccountValidated] = useState(false);

    const handleAccountChange = (accountNumber: string, accountHolderName?: string) => {
        setFormData(prev => ({
            ...prev,
            orderingAccountNumber: accountNumber,
            orderingCustomerName: accountHolderName || '',
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
                orderingCustomerName: account.accountHolderName || '',
                phoneNumber: account.phoneNumber || '',
            }));
        }
    };

    const handlePhoneNumberFetched = (phoneNumber: string) => {
        setFormData(prev => ({ ...prev, phoneNumber }));
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        clearFieldError(name);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSignatureComplete = (signatureData: string) => {
        setFormData(prev => ({ ...prev, digitalSignature: signatureData }));
        clearFieldError('digitalSignature');
    };

    const handleSignatureClear = () => {
        setFormData(prev => ({ ...prev, digitalSignature: '' }));
    };

    const handleNext = () => {
        if (step === 1) {
            if (!accountValidated) {
                showError('Please validate the account by entering the account number and clicking "Search"');
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

    const handleResend = () => {
        if (!formData.phoneNumber) {
            showError('Phone number not found for this account. Please contact support.');
            return;
        }

        resendOTP(
            () => authService.requestWithdrawalOTP(formData.phoneNumber),
            'OTP resent successfully'
        );
    };

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
                CustomerTelephone: formData.phoneNumber,
                PhoneNumber: formData.phoneNumber,
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
            <AccountSelector
                accounts={[]}
                selectedAccount={formData.orderingAccountNumber}
                onAccountChange={handleAccountChange}
                onAccountValidation={handleAccountValidation}
                onPhoneNumberFetched={handlePhoneNumberFetched}
                label="Account Number"
                error={errors.orderingAccountNumber}
                allowManualEntry={true}
            />
            {!accountValidated && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-sm font-medium text-amber-800">
                        Please validate the account by entering the account number and clicking "Search"
                    </div>
                </div>
            )}
            {accountValidated && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="orderingCustomerName"
                        value={formData.orderingCustomerName}
                        readOnly
                        className="w-full p-3 rounded-lg border border-fuchsia-300 bg-gradient-to-r from-amber-50 to-fuchsia-50"
                    />
                    {errors.orderingCustomerName && (
                        <p className="mt-1 text-sm text-red-600">{errors.orderingCustomerName}</p>
                    )}
                </div>
            )}
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Beneficiary Bank <span className="text-red-500">*</span>
                    </label>
                    <select 
                        name="beneficiaryBank" 
                        value={formData.beneficiaryBank} 
                        onChange={handleChange} 
                        className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
                    >
                        <option value="">Select a bank</option>
                        {BANKS.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                    </select>
                    {errors.beneficiaryBank && (
                        <p className="mt-1 text-sm text-red-600">{errors.beneficiaryBank}</p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Beneficiary Branch <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        name="beneficiaryBranch" 
                        value={formData.beneficiaryBranch} 
                        onChange={handleChange} 
                        className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200" 
                    />
                    {errors.beneficiaryBranch && (
                        <p className="mt-1 text-sm text-red-600">{errors.beneficiaryBranch}</p>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Beneficiary Account <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        name="beneficiaryAccountNumber" 
                        value={formData.beneficiaryAccountNumber} 
                        onChange={handleChange} 
                        className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200" 
                    />
                    {errors.beneficiaryAccountNumber && (
                        <p className="mt-1 text-sm text-red-600">{errors.beneficiaryAccountNumber}</p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Beneficiary Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text" 
                        name="beneficiaryName" 
                        value={formData.beneficiaryName} 
                        onChange={handleChange} 
                        className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200" 
                    />
                    {errors.beneficiaryName && (
                        <p className="mt-1 text-sm text-red-600">{errors.beneficiaryName}</p>
                    )}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transfer Amount (ETB) <span className="text-red-500">*</span>
                </label>
                <input 
                    type="text" 
                    name="transferAmount" 
                    value={formData.transferAmount} 
                    onChange={handleChange} 
                    className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200" 
                    placeholder="0.00" 
                />
                {errors.transferAmount && (
                    <p className="mt-1 text-sm text-red-600">{errors.transferAmount}</p>
                )}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Narrative <span className="text-red-500">*</span>
                </label>
                <textarea 
                    name="paymentNarrative" 
                    rows={3} 
                    value={formData.paymentNarrative} 
                    onChange={handleChange} 
                    className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200" 
                    maxLength={200} 
                />
                {errors.paymentNarrative && (
                    <p className="mt-1 text-sm text-red-600">{errors.paymentNarrative}</p>
                )}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-4">
            {checkApprovalStatus()}
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
                <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                    <span className="font-medium text-fuchsia-800">From Account:</span>
                    <span className="font-mono font-semibold text-fuchsia-900">{formData.orderingAccountNumber}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                    <span className="font-medium text-fuchsia-800">Beneficiary Bank:</span>
                    <span className="font-semibold text-fuchsia-900">{formData.beneficiaryBank}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                    <span className="font-medium text-fuchsia-800">Beneficiary Branch:</span>
                    <span className="font-semibold text-fuchsia-900">{formData.beneficiaryBranch}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                    <span className="font-medium text-fuchsia-800">Beneficiary Account:</span>
                    <span className="font-mono font-semibold text-fuchsia-900">{formData.beneficiaryAccountNumber}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                    <span className="font-medium text-fuchsia-800">Beneficiary Name:</span>
                    <span className="font-semibold text-fuchsia-900">{formData.beneficiaryName}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-fuchsia-800">Amount:</span>
                    <span className="text-lg font-bold text-fuchsia-700">
                        {Number(formData.transferAmount).toLocaleString()} ETB
                    </span>
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6">
            <SignatureStep 
                onSignatureComplete={handleSignatureComplete}
                onSignatureClear={handleSignatureClear}
                error={errors.digitalSignature}
            />
        </div>
    );

    const renderStep5 = () => (
        <OTPVerification
            phone={formData.phoneNumber}
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
                        disabled={!formData.digitalSignature || !formData.phoneNumber || otpLoading}
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
                totalSteps={5} 
                onNext={isLast ? handleSubmit : handleNext} 
                onBack={prev} 
                nextLabel={isLast ? 'Submit' : 'Continue'} 
                nextDisabled={
                    (step === 1 && !accountValidated) || 
                    (step === 5 && formData.otpCode.length !== 6) || 
                    isSubmitting || 
                    otpLoading
                } 
                nextLoading={isSubmitting || otpLoading} 
                hideBack={isFirst} 
            />
        );
    };

    return (
        <FormLayout title="RTGS Transfer" phone={formData.phoneNumber || phone || null} branchName={branch?.name}>
            <form onSubmit={e => e.preventDefault()} className="space-y-6">
                {getStepContent()}
                {renderCustomNavigation()}
            </form>
        </FormLayout>
    );
}