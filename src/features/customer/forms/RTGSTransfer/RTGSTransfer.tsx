import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { useUserAccounts } from '../../../../hooks/useUserAccounts';
import { submitRtgsTransfer, requestRtgsTransferOtp } from '../../../../services/rtgsTransferService';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';
import Field from '../../../../components/Field';
import SignatureCanvas from 'react-signature-canvas';
import { useApprovalWorkflow } from '../../../../hooks/useApprovalWorkflow';
import { requiresTransactionApproval } from '../../../../config/rbacMatrix';
import { 
    Loader2, 
    AlertCircle, 
    CheckCircle2, 
    ChevronRight,
    ChevronLeft,
    CreditCard,
    User,
    FileText,
    Shield,
    Plane,
    MapPin,
    Calendar,
    PenTool,
    Eraser,
    Building,
    Signature
} from 'lucide-react';

// Error message component (consistent with withdrawal form)
function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{message}</span>
        </div>
    );
}

// Ethiopian banks list
const BANKS = [
    'Commercial Bank of Ethiopia',
    'Awash International Bank',
    'Dashen Bank',
    'Abyssinia Bank',
    'Nib International Bank',
    'Bank of Abyssinia',
    'Wegagen Bank',
    'United Bank',
    'Berhan Bank',
    'Abay Bank',
    'Bunna Bank',
    'Addis International Bank',
    'ZamZam Bank',
    'Shabelle Bank',
    'Tsedey Bank',
    'Enat Bank',
    'Lion International Bank',
    'Oromia International Bank',
    'Zemen Bank',
    'Cooperative Bank of Oromia'
];

type FormData = {
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
};

type Errors = Partial<Record<keyof FormData | 'submit' | 'otp', string>>;

export default function RTGSTransferForm() {
    const { t } = useTranslation();
    const { phone } = useAuth();
    const { branch } = useBranch();
    const navigate = useNavigate();
    const { createWorkflow } = useApprovalWorkflow();
    const { 
        accounts, 
        accountDropdown, 
        loadingAccounts, 
        errorAccounts, 
        refreshAccounts 
    } = useUserAccounts();

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
    });

    const [errors, setErrors] = useState<Errors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<number>(1); // 1: Details, 2: Review, 3: Signature, 4: OTP
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendTimer, setResendTimer] = useState<NodeJS.Timeout | null>(null);
    const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);
    const signaturePadRef = useRef<any>(null);

    // Load customer accounts - consistent with withdrawal
    useEffect(() => {
        if (loadingAccounts) return;
        
        if (!accounts || accounts.length === 0) {
            setFormData(prev => ({ ...prev, orderingAccountNumber: '', orderingCustomerName: '' }));
            return;
        }

        if (accounts.length === 1) {
            const account = accounts[0];
            setFormData(prev => ({ 
                ...prev, 
                orderingAccountNumber: account.accountNumber, 
                orderingCustomerName: account.accountHolderName || '' 
            }));
        } else if (accounts.length > 1) {
            const savedAccount = localStorage.getItem('selectedRtgsAccount');
            const selectedAccount = accounts.find(a => a.accountNumber === savedAccount) || accounts[0];
            setFormData(prev => ({
                ...prev,
                orderingAccountNumber: selectedAccount.accountNumber,
                orderingCustomerName: selectedAccount.accountHolderName || ''
            }));
        }
    }, [accounts, loadingAccounts]);

    // Handle cleanup of timers
    useEffect(() => {
        return () => {
            if (resendTimer) clearInterval(resendTimer);
        };
    }, [resendTimer]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (errors[name as keyof Errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }

        if (name === 'orderingAccountNumber') {
            const selected = accounts.find(acc => acc.accountNumber === value);
            if (selected) {
                setFormData(prev => ({
                    ...prev,
                    orderingAccountNumber: value,
                    orderingCustomerName: selected.accountHolderName || ''
                }));
                localStorage.setItem('selectedRtgsAccount', value);
                return;
            }
        } else if (name === 'otpCode') {
            const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
            setFormData(prev => ({ ...prev, [name]: digitsOnly }));
        } else if (name === 'transferAmount') {
            const sanitizedValue = value.replace(/[^\d.]/g, '');
            const parts = sanitizedValue.split('.');
            if (parts.length > 2) return;
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const validateStep1 = (): boolean => {
        const errs: Errors = {};
        
        if (!formData.orderingAccountNumber.trim()) {
            errs.orderingAccountNumber = t('accountNumberRequired', 'Account number is required');
        }
        
        if (!formData.orderingCustomerName.trim()) {
            errs.orderingCustomerName = t('customerNameRequired', 'Customer name is required');
        }
        
        if (!formData.beneficiaryBank.trim()) {
            errs.beneficiaryBank = t('beneficiaryBankRequired', 'Beneficiary bank is required');
        }
        
        if (!formData.beneficiaryBranch.trim()) {
            errs.beneficiaryBranch = t('beneficiaryBranchRequired', 'Beneficiary branch is required');
        }
        
        if (!formData.beneficiaryAccountNumber.trim()) {
            errs.beneficiaryAccountNumber = t('beneficiaryAccountRequired', 'Beneficiary account is required');
        }
        
        if (!formData.beneficiaryName.trim()) {
            errs.beneficiaryName = t('beneficiaryNameRequired', 'Beneficiary name is required');
        }
        
        if (!formData.transferAmount || Number(formData.transferAmount) <= 0) {
            errs.transferAmount = t('validAmountRequired', 'Please enter a valid amount greater than 0');
        }
        
        if (!formData.paymentNarrative.trim()) {
            errs.paymentNarrative = t('narrativeRequired', 'Payment narrative is required');
        } else if (formData.paymentNarrative.length < 10 || formData.paymentNarrative.length > 200) {
            errs.paymentNarrative = t('narrativeLength', 'Narrative must be 10-200 characters');
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep3 = (): boolean => {
        // Signature validation - similar to withdrawal
        if (signaturePadRef.current && signaturePadRef.current.isEmpty()) {
            setErrors({ digitalSignature: t('signatureRequired', 'Digital signature is required') });
            return false;
        }
        return true;
    };

    const validateStep4 = (): boolean => {
        const errs: Errors = {};
        
        if (!formData.otpCode || formData.otpCode.length !== 6) {
            errs.otpCode = t('validOtpRequired', 'Please enter the 6-digit OTP');
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleStep1Next = (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep1()) {
            const firstError = Object.keys(errors)[0];
            if (firstError) {
                document.getElementById(firstError)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        setStep(2);
    };

    const handleStep2Next = (e: FormEvent) => {
        e.preventDefault();
        setStep(3);
    };

    const handleStep3Next = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep3()) return;

        // Save signature
        if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
            const signatureData = signaturePadRef.current.toDataURL();
            setFormData(prev => ({ ...prev, digitalSignature: signatureData }));
        }

        if (!phone) {
            setErrors({ submit: t('missingPhoneNumber', 'Phone number not found. Please log in again.') });
            return;
        }

        setOtpLoading(true);
        setErrors({});
        setOtpMessage('');

        try {
            const response = await requestRtgsTransferOtp(phone);
            if (response.success) {
                setOtpMessage(response.message || t('otpSent', 'OTP sent to your phone.'));
                setStep(4);
                setResendCooldown(30);
                
                const timer = setInterval(() => {
                    setResendCooldown(prev => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
                setResendTimer(timer);
            } else {
                setErrors({ submit: response.message || t('otpRequestFailed', 'Failed to send OTP.') });
            }
        } catch (error: any) {
            setErrors({ submit: error?.message || t('otpRequestFailed', 'Failed to send OTP.') });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSignatureClear = () => {
        if (signaturePadRef.current) {
            signaturePadRef.current.clear();
            setIsSignatureEmpty(true);
            setFormData(prev => ({ ...prev, digitalSignature: '' }));
        }
    };

    const handleSignatureEnd = () => {
        if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
            setIsSignatureEmpty(false);
            if (errors.digitalSignature) {
                setErrors(prev => ({ ...prev, digitalSignature: undefined }));
            }
        }
    };

    const handleResendOtp = async () => {
        if (!phone || resendCooldown > 0) return;

        setOtpLoading(true);
        setErrors({});
        setOtpMessage('');

        try {
            const response = await requestRtgsTransferOtp(phone);
            if (response.success) {
                setOtpMessage(t('otpResent', 'OTP resent successfully.'));
                setResendCooldown(30);
                
                const timer = setInterval(() => {
                    setResendCooldown(prev => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
                setResendTimer(timer);
            } else {
                setErrors({ submit: response.message || t('otpRequestFailed', 'Failed to send OTP.') });
            }
        } catch (error: any) {
            setErrors({ submit: error?.message || t('otpRequestFailed', 'Failed to send OTP.') });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep4()) return;

        if (!phone || !branch?.id) {
            setErrors({ submit: t('missingInfo', 'Please ensure all information is complete.') });
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const rawPhone = (phone || '').toString();
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
                CustomerTelephone: rawPhone.slice(0, 12),
                PhoneNumber: rawPhone,
                DigitalSignature: formData.digitalSignature,
                OtpCode: formData.otpCode,
            };

            console.log('Submitting RTGS payload:', payload);

            const response = await submitRtgsTransfer(payload);
            
            if (response.success) {
                // Create approval workflow
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
                
                navigate('/form/rtgs-transfer/confirmation', { 
                    state: { 
                        api: response.data,
                        branchName: branch.name
                    } 
                });
            } else {
                throw new Error(response.message || t('submissionFailed', 'Submission failed'));
            }
        } catch (error: any) {
            const errorMessage = error?.message || t('submissionFailed', 'Submission failed');
            if (errorMessage.toLowerCase().includes('otp') || errorMessage.toLowerCase().includes('invalid')) {
                setErrors({ otpCode: errorMessage });
            } else {
                setErrors({ submit: errorMessage });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const checkApprovalStatus = () => {
        const approvalCheck = requiresTransactionApproval(
            'rtgs',
            Number(formData.transferAmount),
            'ETB',
            'normal'
        );

        if (approvalCheck.required) {
            return (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <p className="text-orange-800 font-medium">
                        ⚠️ {t('approvalRequired', 'This transaction will require manager approval')}
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                        {approvalCheck.reason}
                    </p>
                </div>
            );
        }
        return null;
    };

    // Loading states (consistent with withdrawal form)
    if (loadingAccounts) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <Loader2 className="h-12 w-12 text-fuchsia-700 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">{t('loading', 'Loading...')}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (errorAccounts) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('error', 'Error')}</h3>
                        <p className="text-gray-600 mb-4">{errorAccounts}</p>
                        <button
                            onClick={() => refreshAccounts()}
                            className="bg-fuchsia-700 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-800"
                        >
                            {t('tryAgain', 'Try Again')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!loadingAccounts && accounts.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noAccounts', 'No Accounts')}</h3>
                        <p className="text-gray-600 mb-4">{t('noAccountsMessage', 'No accounts found for your phone number.')}</p>
                        <button
                            onClick={() => refreshAccounts()}
                            className="bg-fuchsia-700 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-800"
                        >
                            {t('refresh', 'Refresh')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full mx-auto">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Header with Language Switcher */}
                    <header className="bg-gradient-to-r from-amber-500 to-fuchsia-700 text-white rounded-t-lg">
                        <div className="px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <h1 className="text-lg font-bold">{t('rtgsTransfer', 'RTGS Transfer')}</h1>
                                    <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>{branch?.name || t('branch', 'Branch')}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <div className="bg-fuchsia-800/50 px-3 py-1 rounded-full text-xs">
                                        📱 {phone}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div className="p-6">
                        {errors.submit && <ErrorMessage message={errors.submit} />}

                        {/* Step 1: Transfer Details */}
                        {step === 1 && (
                            <form onSubmit={handleStep1Next} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-fuchsia-700" />
                                        {t('customerInformation', 'Customer Information')}
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field 
                                            label={t('phoneNumber', 'Phone Number')} 
                                            required
                                        >
                                            <input
                                                type="tel"
                                                value={phone || ''} 
                                                disabled
                                                className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50"
                                            />
                                        </Field>

                                        <Field 
                                            label={t('accountNumber', 'Account Number')} 
                                            required 
                                            error={errors.orderingAccountNumber}
                                        >
                                            {accountDropdown ? (
                                                <select
                                                    name="orderingAccountNumber"
                                                    value={formData.orderingAccountNumber}
                                                    onChange={handleChange}
                                                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                    id="orderingAccountNumber"
                                                >
                                                    <option value="">{t('chooseAccount', 'Choose your account')}</option>
                                                    {accounts.map(acc => (
                                                        <option key={acc.accountNumber} value={acc.accountNumber}>
                                                            {acc.accountNumber} - {acc.accountHolderName}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    name="orderingAccountNumber"
                                                    value={formData.orderingAccountNumber}
                                                    onChange={handleChange}
                                                    disabled={accounts.length === 1}
                                                    className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50"
                                                    id="orderingAccountNumber"
                                                />
                                            )}
                                        </Field>

                                        <Field 
                                            label={t('customerName', 'Customer Name')} 
                                            required 
                                            error={errors.orderingCustomerName}
                                        >
                                            <input
                                                type="text"
                                                name="orderingCustomerName"
                                                value={formData.orderingCustomerName}
                                                onChange={handleChange}
                                                disabled
                                                className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50"
                                                id="orderingCustomerName"
                                            />
                                        </Field>

                                        <Field 
                                            label={t('transferAmount', 'Transfer Amount (ETB)')} 
                                            required 
                                            error={errors.transferAmount}
                                        >
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="text-gray-600 font-medium">ETB</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    name="transferAmount"
                                                    value={formData.transferAmount}
                                                    onChange={handleChange}
                                                    className="w-full p-3 pl-16 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                    placeholder="0.00"
                                                    id="transferAmount"
                                                />
                                            </div>
                                        </Field>
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Building className="h-5 w-5 text-fuchsia-700" />
                                        {t('beneficiaryInformation', 'Beneficiary Information')}
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field 
                                            label={t('beneficiaryBank', 'Beneficiary Bank')} 
                                            required 
                                            error={errors.beneficiaryBank}
                                        >
                                            <select
                                                name="beneficiaryBank"
                                                value={formData.beneficiaryBank}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="beneficiaryBank"
                                            >
                                                <option value="">{t('selectBank', 'Select a bank')}</option>
                                                {BANKS.map(bank => (
                                                    <option key={bank} value={bank}>{bank}</option>
                                                ))}
                                            </select>
                                        </Field>

                                        <Field 
                                            label={t('beneficiaryBranch', 'Beneficiary Branch')} 
                                            required 
                                            error={errors.beneficiaryBranch}
                                        >
                                            <input
                                                type="text"
                                                name="beneficiaryBranch"
                                                value={formData.beneficiaryBranch}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="beneficiaryBranch"
                                            />
                                        </Field>

                                        <Field 
                                            label={t('beneficiaryAccount', 'Beneficiary Account')} 
                                            required 
                                            error={errors.beneficiaryAccountNumber}
                                        >
                                            <input
                                                type="text"
                                                name="beneficiaryAccountNumber"
                                                value={formData.beneficiaryAccountNumber}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="beneficiaryAccountNumber"
                                            />
                                        </Field>

                                        <Field 
                                            label={t('beneficiaryName', 'Beneficiary Name')} 
                                            required 
                                            error={errors.beneficiaryName}
                                        >
                                            <input
                                                type="text"
                                                name="beneficiaryName"
                                                value={formData.beneficiaryName}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="beneficiaryName"
                                            />
                                        </Field>

                                        <div className="md:col-span-2">
                                            <Field 
                                                label={t('paymentNarrative', 'Payment Narrative')} 
                                                required 
                                                error={errors.paymentNarrative}
                                            >
                                                <textarea
                                                    name="paymentNarrative"
                                                    rows={3}
                                                    value={formData.paymentNarrative}
                                                    onChange={handleChange}
                                                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                    placeholder={t('narrativePlaceholder', 'Describe the purpose of this transfer (10-200 characters)')}
                                                    maxLength={200}
                                                    id="paymentNarrative"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                    <span>{formData.paymentNarrative.length}/200</span>
                                                    {errors.paymentNarrative && (
                                                        <span className="text-red-500">{errors.paymentNarrative}</span>
                                                    )}
                                                </div>
                                            </Field>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button 
                                        type="submit" 
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 flex items-center gap-2"
                                    >
                                        <span>{t('continue', 'Continue')}</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 2: Review */}
                        {step === 2 && (
                            <form onSubmit={handleStep2Next} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-green-600" />
                                        {t('reviewTransfer', 'Review Transfer')}
                                    </h2>
                                    
                                    {checkApprovalStatus()}
                                    
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="font-medium text-gray-700">{t('accountNumber', 'Account Number')}:</span>
                                            <span className="font-mono font-semibold">{formData.orderingAccountNumber}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="font-medium text-gray-700">{t('customerName', 'Customer Name')}:</span>
                                            <span className="font-semibold">{formData.orderingCustomerName}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="font-medium text-gray-700">{t('beneficiaryBank', 'Beneficiary Bank')}:</span>
                                            <span className="font-semibold">{formData.beneficiaryBank}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="font-medium text-gray-700">{t('beneficiaryBranch', 'Beneficiary Branch')}:</span>
                                            <span className="font-semibold">{formData.beneficiaryBranch}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="font-medium text-gray-700">{t('beneficiaryAccount', 'Beneficiary Account')}:</span>
                                            <span className="font-mono font-semibold">{formData.beneficiaryAccountNumber}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="font-medium text-gray-700">{t('beneficiaryName', 'Beneficiary Name')}:</span>
                                            <span className="font-semibold">{formData.beneficiaryName}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="font-medium text-gray-700">{t('transferAmount', 'Transfer Amount')}:</span>
                                            <span className="text-lg font-bold text-fuchsia-700">
                                                {parseFloat(formData.transferAmount).toLocaleString()} ETB
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-start py-2">
                                            <span className="font-medium text-gray-700">{t('paymentNarrative', 'Payment Narrative')}:</span>
                                            <span className="text-right max-w-xs">{formData.paymentNarrative}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(1)}
                                        className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 justify-center"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        {t('back', 'Back')}
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 flex items-center gap-2 justify-center"
                                    >
                                        <PenTool className="h-4 w-4" />
                                        {t('addSignature', 'Add Signature')}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 3: Digital Signature */}
                        {step === 3 && (
                            <form onSubmit={handleStep3Next} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Signature className="h-5 w-5 text-fuchsia-700" />
                                        {t('digitalSignature', 'Digital Signature')}
                                    </h2>
                                    
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-blue-700">
                                            {t('signatureInstructions', 'Please provide your signature using your finger or stylus. This signature will be used to authorize your RTGS transfer transaction.')}
                                        </p>
                                    </div>

                                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4">
                                        <div className="bg-gray-100 rounded-lg p-2 mb-4">
                                            <SignatureCanvas
                                                ref={signaturePadRef}
                                                onEnd={handleSignatureEnd}
                                                canvasProps={{
                                                    className: "w-full h-48 bg-white border border-gray-300 rounded-md cursor-crosshair"
                                                }}
                                                penColor="black"
                                                backgroundColor="white"
                                                clearOnResize={false}
                                            />
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <button
                                                type="button"
                                                onClick={handleSignatureClear}
                                                className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                            >
                                                <Eraser className="h-4 w-4" />
                                                {t('clearSignature', 'Clear Signature')}
                                            </button>
                                            
                                            <div className="text-sm text-gray-500">
                                                {!isSignatureEmpty ? (
                                                    <span className="text-green-600 flex items-center gap-1">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        {t('signatureProvided', 'Signature provided')}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        {t('noSignature', 'No signature provided')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {errors.digitalSignature && (
                                            <span className="text-red-500 text-xs mt-2">{errors.digitalSignature}</span>
                                        )}
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(2)}
                                        className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 justify-center"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        {t('back', 'Back')}
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={otpLoading}
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 disabled:opacity-50 flex items-center gap-2 justify-center"
                                    >
                                        {otpLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {t('requestingOtp', 'Requesting OTP...')}
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="h-4 w-4" />
                                                {t('requestOtp', 'Request OTP')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 4: OTP Verification */}
                        {step === 4 && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-fuchsia-700" />
                                        {t('otpVerification', 'OTP Verification')}
                                    </h2>
                                    
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-blue-700">
                                            {t('otpSentMessage', 'An OTP has been sent to your phone number:')} 
                                            <strong className="text-blue-900"> {phone}</strong>
                                        </p>
                                        {otpMessage && (
                                            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                {otpMessage}
                                            </p>
                                        )}
                                    </div>

                                    <div className="max-w-md">
                                        <Field 
                                            label={t('enterOtp', 'Enter OTP Code')} 
                                            required 
                                            error={errors.otpCode}
                                        >
                                            <input 
                                                type="text" 
                                                name="otpCode" 
                                                value={formData.otpCode} 
                                                onChange={handleChange} 
                                                maxLength={6}
                                                className="w-full p-3 text-center text-2xl tracking-widest rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent font-mono"
                                                placeholder="000000"
                                                id="otpCode"
                                            />
                                        </Field>
                                        
                                        <div className="mt-2 flex justify-between items-center">
                                            <button
                                                type="button"
                                                onClick={handleResendOtp}
                                                disabled={resendCooldown > 0 || otpLoading}
                                                className="text-sm text-fuchsia-700 hover:text-fuchsia-800 disabled:text-gray-400"
                                            >
                                                {resendCooldown > 0 
                                                    ? t('resendOtpIn', `Resend OTP in ${resendCooldown}s`) 
                                                    : t('resendOtp', 'Resend OTP')
                                                }
                                            </button>
                                            <span className="text-sm text-gray-500">
                                                {formData.otpCode.length}/6
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(3)}
                                        className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 justify-center"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        {t('back', 'Back')}
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting || formData.otpCode.length !== 6}
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 disabled:opacity-50 flex items-center gap-2 justify-center"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {t('processing', 'Processing...')}
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" />
                                                {t('verifyAndSubmit', 'Verify & Submit')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}