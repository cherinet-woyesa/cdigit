import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { useUserAccounts } from '../../../../hooks/useUserAccounts';
import { submitRtgsTransfer } from '../../../../services/rtgsTransferService';
import authService from '../../../../services/authService';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';
import { 
    Loader2, 
    AlertCircle, 
    CheckCircle2, 
    ChevronRight,
    ChevronLeft,
    CreditCard,
    Building,
    User,
    Banknote,
    FileText,
    Shield,
    Plane,
    MapPin,
    Calendar,
    Landmark,
    Signature
} from 'lucide-react';

// Error message component (consistent with withdrawal form)
function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
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
    customerTelephone: string;
    digitalSignature: string;
    otpCode: string;
};

type Errors = Partial<Record<keyof FormData | 'submit' | 'otp', string>>;

export default function RTGSTransferForm() {
    const { t } = useTranslation();
    const { phone } = useAuth();
    const { branch } = useBranch();
    const navigate = useNavigate();
    const { accounts, loadingAccounts } = useUserAccounts();

    const [formData, setFormData] = useState<FormData>({
        orderingAccountNumber: '',
        orderingCustomerName: '',
        beneficiaryBank: '',
        beneficiaryBranch: '',
        beneficiaryAccountNumber: '',
        beneficiaryName: '',
        transferAmount: '',
        paymentNarrative: '',
        customerTelephone: phone || '',
        digitalSignature: '',
        otpCode: '',
    });

    const [errors, setErrors] = useState<Errors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<number>(1); // 1: Details, 2: Review, 3: OTP & Submit
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendTimer, setResendTimer] = useState<NodeJS.Timeout | null>(null);
    const [customerAccounts, setCustomerAccounts] = useState<Array<{ accountNumber: string; accountName: string }>>([]);
    const [showAccountSelection, setShowAccountSelection] = useState(false);
    const [otpRequested, setOtpRequested] = useState(false);

    // Phone normalization for backend (max 12 characters)
    const normalizePhoneForBackend = (phoneNumber: string): string => {
        const digitsOnly = phoneNumber.replace(/\D/g, '');
        return digitsOnly.slice(0, 12);
    };

    // Load customer accounts
    useEffect(() => {
        if (loadingAccounts) return;
        
        const mapped = (accounts || []).map(a => ({ 
            accountNumber: a.accountNumber, 
            accountName: a.accountHolderName || '' 
        }));
        setCustomerAccounts(mapped);

        if (!accounts || accounts.length === 0) {
            setShowAccountSelection(false);
            setFormData(prev => ({ ...prev, orderingAccountNumber: '', orderingCustomerName: '' }));
            return;
        }

        if (accounts.length === 1) {
            const acc = accounts[0];
            setShowAccountSelection(false);
            setFormData(prev => ({ 
                ...prev, 
                orderingAccountNumber: acc.accountNumber, 
                orderingCustomerName: acc.accountHolderName || '' 
            }));
        } else {
            setShowAccountSelection(true);
        }
    }, [accounts, loadingAccounts]);

    // Prefill phone and normalize it
    useEffect(() => {
        if (phone) {
            const normalizedPhone = normalizePhoneForBackend(phone);
            setFormData(prev => ({ ...prev, customerTelephone: normalizedPhone }));
        }
    }, [phone]);

    // Handle cleanup of timers
    useEffect(() => {
        return () => {
            if (resendTimer) clearInterval(resendTimer);
        };
    }, [resendTimer]);

    // Step validation
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
        const errs: Errors = {};
        
        if (!formData.digitalSignature.trim()) {
            errs.digitalSignature = t('signatureRequired', 'Digital signature is required');
        }
        
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

    const handleRequestOtp = async () => {
        if (!phone) {
            setErrors({ submit: t('missingPhoneNumber', 'Phone number not found. Please log in again.') });
            return;
        }

        setOtpLoading(true);
        setErrors({});
        setOtpMessage('');

        try {
            const response = await authService.requestOtp(phone);
            if (response.success) {
                setOtpMessage(response.message || t('otpSent', 'OTP sent to your phone.'));
                setOtpRequested(true);
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

    const handleResendOtp = async () => {
        if (!phone || resendCooldown > 0) return;

        setOtpLoading(true);
        setErrors({});
        setOtpMessage('');

        try {
            const response = await authService.requestOtp(phone);
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
        if (!validateStep3()) return;

        if (!phone || !branch?.id) {
            setErrors({ submit: t('missingInfo', 'Please ensure all information is complete.') });
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const payload = {
                BranchId: branch.id,
                OrderingAccountNumber: formData.orderingAccountNumber,
                BeneficiaryBank: formData.beneficiaryBank,
                BeneficiaryBranch: formData.beneficiaryBranch,
                BeneficiaryAccountNumber: formData.beneficiaryAccountNumber,
                BeneficiaryName: formData.beneficiaryName,
                TransferAmount: parseFloat(formData.transferAmount),
                PaymentNarrative: formData.paymentNarrative,
                CustomerTelephone: normalizePhoneForBackend(formData.customerTelephone || phone),
                DigitalSignature: formData.digitalSignature,
                OtpCode: formData.otpCode,
            };

            console.log('Submitting RTGS payload:', payload);

            const response = await submitRtgsTransfer(payload);
            
            if (response.success) {
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
            setErrors({ 
                submit: error?.message || t('submissionError', 'An error occurred during submission') 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'otpCode') {
            const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
            setFormData(prev => ({ ...prev, [name]: digitsOnly }));
        } else if (name === 'customerTelephone') {
            const normalized = normalizePhoneForBackend(value);
            setFormData(prev => ({ ...prev, [name]: normalized }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        
        if (errors[name as keyof Errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleAccountSelect = (account: { accountNumber: string; accountName: string }) => {
        setFormData(prev => ({
            ...prev,
            orderingAccountNumber: account.accountNumber,
            orderingCustomerName: account.accountName
        }));
    };

    // Loading states
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

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Header with Language Switcher */}
                    <header className="bg-fuchsia-700 text-white rounded-t-lg">
                        <div className="px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <Plane className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold">{t('rtgsTransfer', 'RTGS Transfer')}</h1>
                                        <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>{branch?.name || t('branch', 'Branch')}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <div className="bg-fuchsia-800/50 px-3 py-1 rounded-full text-xs">
                                        📱 {phone}
                                    </div>
                                    <div className="bg-white/20 rounded p-1">
                                        <LanguageSwitcher />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div className="p-6">
                        {/* Progress Steps */}
                        <div className="flex justify-center mb-6">
                            <div className="flex items-center bg-gray-50 rounded-lg p-1">
                                <div className={`flex items-center px-4 py-2 rounded-md ${step >= 1 ? 'bg-fuchsia-700 text-white' : 'text-gray-600'}`}>
                                    <span className="font-medium text-sm">1. {t('details', 'Details')}</span>
                                </div>
                                <div className="mx-1 text-gray-400 text-sm">→</div>
                                <div className={`flex items-center px-4 py-2 rounded-md ${step >= 2 ? 'bg-fuchsia-700 text-white' : 'text-gray-600'}`}>
                                    <span className="font-medium text-sm">2. {t('review', 'Review')}</span>
                                </div>
                                <div className="mx-1 text-gray-400 text-sm">→</div>
                                <div className={`flex items-center px-4 py-2 rounded-md ${step >= 3 ? 'bg-fuchsia-700 text-white' : 'text-gray-600'}`}>
                                    <span className="font-medium text-sm">3. {t('otp', 'OTP & Submit')}</span>
                                </div>
                            </div>
                        </div>

                        {errors.submit && <ErrorMessage message={errors.submit} />}

                        {/* Step 1: Transfer Details */}
                        {step === 1 && (
                            <form onSubmit={handleStep1Next} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-fuchsia-700" />
                                        {t('customerInformation', 'Customer Information')}
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('phoneNumber', 'Phone Number')}
                                            </label>
                                            <input
                                                type="tel"
                                                name="customerTelephone"
                                                value={formData.customerTelephone}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                placeholder="0912345678"
                                                maxLength={12}
                                            />
                                        </div>

                                        {showAccountSelection && (
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {t('selectAccount', 'Select Account')}
                                                </label>
                                                <select
                                                    value={formData.orderingAccountNumber}
                                                    onChange={(e) => {
                                                        const acc = customerAccounts.find(a => a.accountNumber === e.target.value);
                                                        if (acc) handleAccountSelect(acc);
                                                    }}
                                                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                >
                                                    <option value="">{t('chooseAccount', 'Choose your account')}</option>
                                                    {customerAccounts.map(acc => (
                                                        <option key={acc.accountNumber} value={acc.accountNumber}>
                                                            {acc.accountNumber} - {acc.accountName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('accountNumber', 'Account Number')}
                                            </label>
                                            <input
                                                type="text"
                                                name="orderingAccountNumber"
                                                value={formData.orderingAccountNumber}
                                                onChange={handleChange}
                                                disabled={showAccountSelection}
                                                className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50"
                                            />
                                            {errors.orderingAccountNumber && (
                                                <span className="text-red-500 text-xs">{errors.orderingAccountNumber}</span>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('customerName', 'Customer Name')}
                                            </label>
                                            <input
                                                type="text"
                                                name="orderingCustomerName"
                                                value={formData.orderingCustomerName}
                                                onChange={handleChange}
                                                disabled
                                                className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50"
                                            />
                                            {errors.orderingCustomerName && (
                                                <span className="text-red-500 text-xs">{errors.orderingCustomerName}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <User className="h-5 w-5 text-fuchsia-700" />
                                        {t('beneficiaryInformation', 'Beneficiary Information')}
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('beneficiaryBank', 'Beneficiary Bank')}
                                            </label>
                                            <select
                                                name="beneficiaryBank"
                                                value={formData.beneficiaryBank}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                            >
                                                <option value="">{t('selectBank', 'Select a bank')}</option>
                                                {BANKS.map(bank => (
                                                    <option key={bank} value={bank}>{bank}</option>
                                                ))}
                                            </select>
                                            {errors.beneficiaryBank && (
                                                <span className="text-red-500 text-xs">{errors.beneficiaryBank}</span>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('beneficiaryBranch', 'Beneficiary Branch')}
                                            </label>
                                            <input
                                                type="text"
                                                name="beneficiaryBranch"
                                                value={formData.beneficiaryBranch}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                            />
                                            {errors.beneficiaryBranch && (
                                                <span className="text-red-500 text-xs">{errors.beneficiaryBranch}</span>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('beneficiaryAccount', 'Beneficiary Account')}
                                            </label>
                                            <input
                                                type="text"
                                                name="beneficiaryAccountNumber"
                                                value={formData.beneficiaryAccountNumber}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                            />
                                            {errors.beneficiaryAccountNumber && (
                                                <span className="text-red-500 text-xs">{errors.beneficiaryAccountNumber}</span>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('beneficiaryName', 'Beneficiary Name')}
                                            </label>
                                            <input
                                                type="text"
                                                name="beneficiaryName"
                                                value={formData.beneficiaryName}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                            />
                                            {errors.beneficiaryName && (
                                                <span className="text-red-500 text-xs">{errors.beneficiaryName}</span>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('transferAmount', 'Transfer Amount (ETB)')}
                                            </label>
                                            <input
                                                type="number"
                                                name="transferAmount"
                                                value={formData.transferAmount}
                                                onChange={handleChange}
                                                min="0.01"
                                                step="0.01"
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                            />
                                            {errors.transferAmount && (
                                                <span className="text-red-500 text-xs">{errors.transferAmount}</span>
                                            )}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('paymentNarrative', 'Payment Narrative')}
                                            </label>
                                            <textarea
                                                name="paymentNarrative"
                                                rows={3}
                                                value={formData.paymentNarrative}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                placeholder={t('narrativePlaceholder', 'Describe the purpose of this transfer (10-200 characters)')}
                                                maxLength={200}
                                            />
                                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                <span>{formData.paymentNarrative.length}/200</span>
                                                {errors.paymentNarrative && (
                                                    <span className="text-red-500">{errors.paymentNarrative}</span>
                                                )}
                                            </div>
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

                        {/* Step 2: Review Only (Just Next button) */}
                        {step === 2 && (
                            <form onSubmit={handleStep2Next} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-fuchsia-700" />
                                        {t('reviewTransfer', 'Review Transfer')}
                                    </h2>
                                    
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="font-medium text-gray-700">{t('accountNumber', 'Account Number')}:</div>
                                            <div>{formData.orderingAccountNumber}</div>
                                            
                                            <div className="font-medium text-gray-700">{t('customerName', 'Customer Name')}:</div>
                                            <div>{formData.orderingCustomerName}</div>
                                            
                                            <div className="font-medium text-gray-700">{t('beneficiaryBank', 'Beneficiary Bank')}:</div>
                                            <div>{formData.beneficiaryBank}</div>
                                            
                                            <div className="font-medium text-gray-700">{t('beneficiaryBranch', 'Beneficiary Branch')}:</div>
                                            <div>{formData.beneficiaryBranch}</div>
                                            
                                            <div className="font-medium text-gray-700">{t('beneficiaryAccount', 'Beneficiary Account')}:</div>
                                            <div>{formData.beneficiaryAccountNumber}</div>
                                            
                                            <div className="font-medium text-gray-700">{t('beneficiaryName', 'Beneficiary Name')}:</div>
                                            <div>{formData.beneficiaryName}</div>
                                            
                                            <div className="font-medium text-gray-700">{t('transferAmount', 'Transfer Amount')}:</div>
                                            <div className="text-lg font-bold text-fuchsia-700">
                                                {parseFloat(formData.transferAmount).toLocaleString()} ETB
                                            </div>
                                            
                                            <div className="font-medium text-gray-700">{t('paymentNarrative', 'Payment Narrative')}:</div>
                                            <div>{formData.paymentNarrative}</div>
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
                                        <span>{t('next', 'Next')}</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 3: OTP Request, Verification & Digital Signature */}
                        {step === 3 && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-fuchsia-700" />
                                        {t('securityVerification', 'Security Verification')}
                                    </h2>
                                    
                                    {/* Digital Signature Section */}
                                    <div className="mb-6">
                                        <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <Signature className="h-4 w-4 text-fuchsia-700" />
                                            {t('digitalSignature', 'Digital Signature')}
                                        </h3>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                            <p className="text-sm text-gray-500 mb-3">
                                                {t('signatureInstructions', 'Enter your digital signature in the field below')}
                                            </p>
                                            <input
                                                type="text"
                                                name="digitalSignature"
                                                value={formData.digitalSignature}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                placeholder={t('signaturePlaceholder', 'Type your signature here')}
                                            />
                                            {errors.digitalSignature && (
                                                <span className="text-red-500 text-xs mt-1">{errors.digitalSignature}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* OTP Section */}
                                    <div>
                                        <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-fuchsia-700" />
                                            {t('otpVerification', 'OTP Verification')}
                                        </h3>
                                        
                                        {!otpRequested ? (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                                <p className="text-sm text-blue-700">
                                                    {t('otpRequestMessage', 'Click the button below to request an OTP to your phone number:')} 
                                                    <strong className="text-blue-900"> {phone}</strong>
                                                </p>
                                            </div>
                                        ) : (
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
                                        )}

                                        {!otpRequested ? (
                                            <div className="flex justify-center mb-4">
                                                <button 
                                                    type="button"
                                                    onClick={handleRequestOtp}
                                                    disabled={otpLoading}
                                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
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
                                        ) : (
                                            <div className="max-w-md">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {t('enterOtp', 'Enter OTP Code')}
                                                </label>
                                                <input 
                                                    type="text" 
                                                    name="otpCode" 
                                                    value={formData.otpCode} 
                                                    onChange={handleChange} 
                                                    maxLength={6}
                                                    className="w-full p-3 text-center text-2xl tracking-widest rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent font-mono"
                                                    placeholder="000000"
                                                />
                                                {errors.otpCode && (
                                                    <span className="text-red-500 text-xs mt-1">{errors.otpCode}</span>
                                                )}
                                                
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
                                        disabled={isSubmitting || !otpRequested || formData.otpCode.length !== 6 || !formData.digitalSignature.trim()}
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