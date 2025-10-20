import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { useUserAccounts } from '../../../../hooks/useUserAccounts';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';
import { requestWithdrawalOtp, submitWithdrawal } from '../../../../services/withdrawalService';
import authService from '../../../../services/authService';
import Field from '../../../../components/Field';
import SignatureCanvas from 'react-signature-canvas';
import { useToast } from '../../../../context/ToastContext';
import { validateAmount, validateRequired, validateOTP } from '../../../../utils/validation';
import { useApprovalWorkflow } from '../../../../hooks/useApprovalWorkflow';
import { requiresTransactionApproval } from '../../../../config/rbacMatrix';
import { exchangeRateService } from '../../../../services/exchangeRateService';
import { isDiasporaAccount } from '../../../../services/accountTypeService';
import { 
    Loader2, 
    AlertCircle, 
    CheckCircle2, 
    ChevronRight,
    CreditCard,
    DollarSign,
    User,
    Shield,
    Plane,
    MapPin,
    Calendar,
    PenTool,
    Eraser
} from 'lucide-react';

// Error message component (consistent with deposit form)
function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{message}</span>
        </div>
    );
}

interface FormData {
    accountNumber: string;
    accountHolderName: string;
    amount: string;
    signature: string;
    otp: string;
    currency: string; // Add currency field
}

type Errors = Partial<Record<keyof FormData, string>> & { submit?: string; otp?: string };

// Define currency types
type Currency = {
    code: string;
    name: string;
    rate: number; // ETB to currency rate
};

export default function CashWithdrawalForm() {
    const { t } = useTranslation();
    const { phone, token, user } = useAuth();
    const { branch } = useBranch();
    const { success: showSuccess, error: showError, info } = useToast();
    const { createWorkflow } = useApprovalWorkflow();
    const navigate = useNavigate();
    const location = useLocation();
    const { 
        accounts, 
        accountDropdown, 
        loadingAccounts, 
        errorAccounts, 
        refreshAccounts 
    } = useUserAccounts();

    const [formData, setFormData] = useState<FormData>({
        accountNumber: '',
        accountHolderName: '',
        amount: '',
        signature: '',
        otp: '',
        currency: 'ETB', // Default to ETB
    });
    const [errors, setErrors] = useState<Errors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<number>(1);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendTimer, setResendTimer] = useState<NodeJS.Timeout | null>(null);
    const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);
    const signaturePadRef = useRef<any>(null);
    const [exchangeRates, setExchangeRates] = useState<Currency[]>([{ code: 'ETB', name: 'Ethiopian Birr', rate: 1 }]);
    const [selectedAccount, setSelectedAccount] = useState<any>(null); // Track selected account

    // Load exchange rates
    useEffect(() => {
        const loadExchangeRates = async () => {
            try {
                const rates = await exchangeRateService.getRates();
                const currencies: Currency[] = rates.map(rate => ({
                    code: rate.currencyCode,
                    name: rate.currencyName,
                    rate: rate.cashBuying // Use cash buying rate for withdrawals
                }));
                // Add ETB as default currency
                setExchangeRates([{ code: 'ETB', name: 'Ethiopian Birr', rate: 1 }, ...currencies]);
            } catch (error) {
                console.error('Failed to load exchange rates:', error);
            }
        };
        loadExchangeRates();
    }, []);

    // Account selection logic (consistent with deposit form)
    useEffect(() => {
        if (loadingAccounts) return;

        if (!accounts || accounts.length === 0) {
            setFormData(prev => ({ ...prev, accountNumber: '', accountHolderName: '' }));
            return;
        }

        if (accounts.length === 1) {
            const account = accounts[0];
            setSelectedAccount(account);
            setFormData(prev => ({
                ...prev,
                accountNumber: account.accountNumber,
                accountHolderName: account.accountHolderName || '',
                currency: account.isDiaspora ? 'USD' : 'ETB' // Default to USD for Diaspora accounts
            }));
        } else if (accounts.length > 1) {
            const savedAccount = localStorage.getItem('selectedWithdrawalAccount');
            const selectedAccount = accounts.find(a => a.accountNumber === savedAccount) || accounts[0];
            setSelectedAccount(selectedAccount);
            setFormData(prev => ({
                ...prev,
                accountNumber: selectedAccount.accountNumber,
                accountHolderName: selectedAccount.accountHolderName || '',
                currency: selectedAccount.isDiaspora ? 'USD' : 'ETB' // Default to USD for Diaspora accounts
            }));
        }
    }, [accounts, loadingAccounts]);

    // Handle cleanup of timers
    useEffect(() => {
        return () => {
            if (resendTimer) clearInterval(resendTimer);
        };
    }, [resendTimer]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // Real-time validation
        if (name === 'accountNumber') {
            // Validate account number in real-time
            if (value.trim() === '') {
                setErrors(prev => ({ ...prev, accountNumber: t('accountNumberRequired', 'Account number is required') }));
            } else if (value.length < 10) {
                setErrors(prev => ({ ...prev, accountNumber: t('accountNumberTooShort', 'Account number is too short') }));
            } else if (value.length > 16) {
                setErrors(prev => ({ ...prev, accountNumber: t('accountNumberTooLong', 'Account number is too long') }));
            } else if (!/^\d+$/.test(value)) {
                setErrors(prev => ({ ...prev, accountNumber: t('accountNumberInvalid', 'Account number must contain only digits') }));
            } else {
                setErrors(prev => ({ ...prev, accountNumber: undefined }));
            }
            
            // Set account holder name if account is found
            const selected = accounts.find(acc => acc.accountNumber === value);
            if (selected) {
                setSelectedAccount(selected);
                setFormData(prev => ({
                    ...prev,
                    accountNumber: value,
                    accountHolderName: selected.accountHolderName || '',
                    currency: selected.isDiaspora ? 'USD' : 'ETB' // Switch currency based on account type
                }));
                localStorage.setItem('selectedWithdrawalAccount', value);
                // Clear account holder name error if account is valid
                setErrors(prev => ({ ...prev, accountHolderName: undefined }));
                return;
            } else if (value.trim() !== '') {
                // If account not found, clear account holder name but show error
                setFormData(prev => ({
                    ...prev,
                    accountNumber: value,
                    accountHolderName: ''
                }));
                setErrors(prev => ({ ...prev, accountHolderName: t('accountNotFound', 'Account not found') }));
            }
        }
        
        if (name === 'amount') {
            // Validate amount in real-time
            const sanitizedValue = value.replace(/[^\d.]/g, '');
            const parts = sanitizedValue.split('.');
            
            if (parts.length > 2) {
                setErrors(prev => ({ ...prev, amount: t('amountInvalidFormat', 'Invalid amount format') }));
                return;
            }
            
            if (sanitizedValue === '') {
                setErrors(prev => ({ ...prev, amount: t('amountRequired', 'Amount is required') }));
            } else if (parseFloat(sanitizedValue) <= 0) {
                setErrors(prev => ({ ...prev, amount: t('amountGreaterThanZero', 'Amount must be greater than 0') }));
            } else if (parseFloat(sanitizedValue) > 1000000) {
                setErrors(prev => ({ ...prev, amount: t('amountTooLarge', 'Amount is too large') }));
            } else {
                setErrors(prev => ({ ...prev, amount: undefined }));
            }
            
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }
        
        if (name === 'otp') {
            const sanitizedValue = value.replace(/\D/g, '').slice(0, 6);
            // Validate OTP in real-time
            if (sanitizedValue.length === 6 && !/^\d{6}$/.test(sanitizedValue)) {
                setErrors(prev => ({ ...prev, otp: t('validOtpRequired', 'OTP must be 6 digits') }));
            } else if (sanitizedValue.length > 0 && sanitizedValue.length < 6) {
                setErrors(prev => ({ ...prev, otp: t('otpIncomplete', 'OTP must be 6 digits') }));
            } else {
                setErrors(prev => ({ ...prev, otp: undefined }));
            }
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }

        if (name === 'accountNumber') {
            const selected = accounts.find(acc => acc.accountNumber === value);
            if (selected) {
                setFormData(prev => ({
                    ...prev,
                    accountNumber: value,
                    accountHolderName: selected.accountHolderName || ''
                }));
                localStorage.setItem('selectedWithdrawalAccount', value);
                return;
            }
        }
        
        if (name === 'amount') {
            const sanitizedValue = value.replace(/[^\d.]/g, '');
            const parts = sanitizedValue.split('.');
            if (parts.length > 2) return;
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }

        if (name === 'otp') {
            const sanitizedValue = value.replace(/\D/g, '').slice(0, 6);
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }
        
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateStep1 = (): boolean => {
        const errs: Errors = {};
        
        // Account number validation
        if (!formData.accountNumber.trim()) {
            errs.accountNumber = t('accountNumberRequired', 'Please select an account');
        } else if (formData.accountNumber.length < 10) {
            errs.accountNumber = t('accountNumberTooShort', 'Account number is too short');
        } else if (formData.accountNumber.length > 16) {
            errs.accountNumber = t('accountNumberTooLong', 'Account number is too long');
        } else if (!/^\d+$/.test(formData.accountNumber)) {
            errs.accountNumber = t('accountNumberInvalid', 'Account number must contain only digits');
        } else if (!formData.accountHolderName) {
            errs.accountHolderName = t('accountNotFound', 'Account not found');
        }
        
        // Account holder name validation
        if (!formData.accountHolderName) {
            errs.accountHolderName = t('accountHolderNameRequired', 'Account holder name is required');
        }
        
        // Amount validation
        if (!formData.amount.trim()) {
            errs.amount = t('amountRequired', 'Amount is required');
        } else {
            const amountNum = parseFloat(formData.amount);
            if (isNaN(amountNum) || amountNum <= 0) {
                errs.amount = t('validAmountRequired', 'Please enter a valid amount greater than 0');
            } else if (amountNum > 1000000) {
                errs.amount = t('amountTooLarge', 'Amount is too large');
            }
        }
        
        setErrors(errs);
        
        if (Object.keys(errs).length > 0) {
            showError(t('validationErrors', 'Please fix the errors in the form'));
        }
        
        return Object.keys(errs).length === 0;
    };

    const validateStep3 = (): boolean => {
        // Signature is optional for now, so always return true
        // In the future, we might want to require a signature
        return true;
    };

    const validateStep4 = (): boolean => {
        const errs: Errors = {};
        
        // OTP validation
        if (!formData.otp) {
            errs.otp = t('otpRequired', 'OTP is required');
        } else if (formData.otp.length !== 6) {
            errs.otp = t('validOtpRequired', 'Please enter the 6-digit OTP');
        } else if (!/^\d{6}$/.test(formData.otp)) {
            errs.otp = t('otpInvalid', 'OTP must contain only digits');
        }
        
        setErrors(errs);
        
        if (Object.keys(errs).length > 0) {
            showError(t('validationErrors', 'Please enter a valid OTP'));
        }
        
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

        // Save signature if drawn
        if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
            const signatureData = signaturePadRef.current.toDataURL();
            setFormData(prev => ({ ...prev, signature: signatureData }));
        }

        if (!phone) {
            setErrors({ submit: t('missingPhoneNumber', 'Phone number not found. Please log in again.') });
            return;
        }

        setOtpLoading(true);
        setErrors({});
        setOtpMessage('');

        try {
            const response = await requestWithdrawalOtp(phone);
            if (response.success) {
                const msg = response.message || t('otpSent', 'OTP sent to your phone.');
                setOtpMessage(msg);
                info(msg);
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
            setFormData(prev => ({ ...prev, signature: '' }));
        }
    };

    const handleSignatureEnd = () => {
        if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
            setIsSignatureEmpty(false);
        }
    };

    const handleResendOtp = async () => {
        if (!phone || resendCooldown > 0) return;

        setOtpLoading(true);
        setErrors({});
        setOtpMessage('');

        try {
            const response = await requestWithdrawalOtp(phone);
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

    // Function to convert amount based on currency
    const convertAmount = (amount: string, fromCurrency: string): string => {
        if (!amount || fromCurrency === 'ETB') return amount;
        
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum)) return amount;
        
        const rate = exchangeRates.find(c => c.code === fromCurrency)?.rate;
        if (!rate) return amount;
        
        // Convert to ETB
        return (amountNum * rate).toFixed(2);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep4()) return;
        if (!formData.otp || formData.otp.length !== 6) {
            setErrors({ otp: t('validOtpRequired', 'Please enter the 6-digit OTP') });
            return;
        }

        if (!phone || !branch?.id) {
            setErrors({ submit: t('missingInfo', 'Please ensure all information is complete.') });
            return;
        }

        setIsSubmitting(true);
        try {
            // Convert amount to ETB if needed for backend processing
            const amountInETB = convertAmount(formData.amount, formData.currency);
            
            // Submit withdrawal with OTP directly (no separate OTP verification)
            const withdrawalData = {
                phoneNumber: phone,
                branchId: branch.id,
                accountNumber: formData.accountNumber,
                accountHolderName: formData.accountHolderName,
                withdrawal_Amount: Number(amountInETB),
                signature: formData.signature, // Include signature in submission
                otpCode: formData.otp || '', // for type
                OtpCode: formData.otp || '' // for backend
            };
            console.log('Submitting withdrawal payload:', withdrawalData);

            const response = await submitWithdrawal(withdrawalData, token || undefined);

            if (response && response.success) {
                // Create approval workflow
                const workflow = await createWorkflow({
                    voucherId: response.data?.id || '',
                    voucherType: 'withdrawal',
                    transactionType: 'withdrawal',
                    amount: Number(amountInETB),
                    currency: 'ETB', // Always use ETB for internal processing
                    customerSegment: 'normal',
                    reason: 'Customer withdrawal request',
                    voucherData: withdrawalData,
                    customerSignature: formData.signature,
                });

                showSuccess(t('withdrawalSubmitted', 'Withdrawal submitted successfully!'));
                
                navigate('/form/cash-withdrawal/cashwithdrawalconfirmation', { 
                    state: { 
                        serverData: response,
                        branchName: branch?.name,
                        ui: {
                            accountNumber: formData.accountNumber,
                            accountHolderName: formData.accountHolderName,
                            amount: formData.amount,
                            currency: formData.currency,
                            telephoneNumber: phone
                        },
                        tokenNumber: response.data?.tokenNumber,
                        queueNumber: response.data?.queueNumber,
                    } 
                });
            } else {
                setErrors({ submit: response?.message || t('invalidOtp', 'Invalid or already used OTP. Please try again.') });
            }
        } catch (error: any) {
            const errorMsg = error?.message || t('submissionFailed', 'Submission failed. Please try again.');
            setErrors({ submit: errorMsg });
            showError(errorMsg);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const checkApprovalStatus = () => {
        const approvalCheck = requiresTransactionApproval(
            'withdrawal',
            Number(convertAmount(formData.amount, formData.currency)), // Convert to ETB for approval check
            'ETB', // Always use ETB for internal processing
            'normal'
        );

        if (approvalCheck.required) {
            return (
                <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 border border-fuchsia-200 rounded-lg p-4 mb-4">
                    <p className="text-amber-800 font-medium">
                        ⚠️ {t('approvalRequired', 'This transaction will require manager approval')}
                    </p>
                    <p className="text-sm text-fuchsia-700 mt-1">
                        {approvalCheck.reason}
                    </p>
                </div>
            );
        }
        return null;
    };

    // Loading states (consistent with deposit form)
    if (loadingAccounts) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-fuchsia-50 flex items-center justify-center p-4">
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
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-fuchsia-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('error', 'Error')}</h3>
                        <p className="text-gray-600 mb-4">{errorAccounts}</p>
                        <button
                            onClick={() => refreshAccounts()}
                            className="bg-gradient-to-r from-amber-500 to-fuchsia-700 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-fuchsia-800 transition-all"
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
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-fuchsia-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noAccounts', 'No Accounts')}</h3>
                        <p className="text-gray-600 mb-4">{t('noAccountsMessage', 'No accounts found for your phone number.')}</p>
                        <button
                            onClick={() => refreshAccounts()}
                            className="bg-gradient-to-r from-amber-500 to-fuchsia-700 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-fuchsia-800 transition-all"
                        >
                            {t('refresh', 'Refresh')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-fuchsia-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full mx-auto">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-fuchsia-200 focus-within:border-fuchsia-700 transition-colors duration-200">
                    {/* Header with brand gradient - no icon */}
                     <header className="bg-fuchsia-700 text-white">
                        <div className="px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <h1 className="text-lg font-bold">{t('cashWithdrawal', 'Cash Withdrawal')}</h1>
                                    <div className="flex items-center gap-2 text-amber-100 text-xs mt-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>{branch?.name || t('branch', 'Branch')}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="bg-white text-fuchsia-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-gray-100 flex items-center gap-1"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        Home
                                    </button>
                                    <div className="bg-fuchsia-800/50 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                                        <User className="h-3 w-3" />
                                        {phone}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div className="p-6">
                        {/* Step 1: Account Details */}
                        {step === 1 && (
                            <form onSubmit={handleStep1Next} className="space-y-6">
                                <div className="space-y-6">
                                    <div>
                                        <Field 
                                            label={t('accountNumber', 'Account Number')} 
                                            required 
                                            error={errors.accountNumber}
                                        >
                                            {accountDropdown ? (
                                                <select 
                                                    name="accountNumber" 
                                                    value={formData.accountNumber} 
                                                    onChange={handleChange} 
                                                    className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
                                                    id="accountNumber"
                                                >
                                                    <option value="">{t('selectAccount', 'Select account')}</option>
                                                    {accounts.map(acc => (
                                                        <option key={acc.accountNumber} value={acc.accountNumber}>
                                                            {acc.accountNumber} - {acc.accountHolderName} {acc.isDiaspora ? '(Diaspora)' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input 
                                                    type="text" 
                                                    name="accountNumber" 
                                                    value={formData.accountNumber} 
                                                    onChange={handleChange} 
                                                    readOnly={accounts.length === 1}
                                                    className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
                                                    id="accountNumber"
                                                />
                                            )}
                                        </Field>
                                    </div>
                                    
                                    <div>
                                        <Field 
                                            label={t('accountHolderName', 'Account Holder Name')} 
                                            required 
                                            error={errors.accountHolderName}
                                        >
                                            <input 
                                                type="text" 
                                                name="accountHolderName" 
                                                value={formData.accountHolderName} 
                                                readOnly 
                                                className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
                                                id="accountHolderName"
                                            />
                                        </Field>
                                    </div>

                                    <div>
                                        <Field 
                                            label={t('amount', 'Amount')} 
                                            required 
                                            error={errors.amount}
                                        >
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-fuchsia-700 font-medium">
                                                            {formData.currency}
                                                        </span>
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        name="amount" 
                                                        value={formData.amount} 
                                                        onChange={handleChange} 
                                                        className="w-full p-3 pl-16 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
                                                        placeholder="0.00"
                                                        id="amount"
                                                    />
                                                </div>
                                                
                                                {/* Currency selector for Diaspora accounts */}
                                                {selectedAccount?.isDiaspora && (
                                                    <select
                                                        name="currency"
                                                        value={formData.currency}
                                                        onChange={handleChange}
                                                        className="w-24 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
                                                    >
                                                        {exchangeRates.map(currency => (
                                                            <option key={currency.code} value={currency.code}>
                                                                {currency.code}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                            
                                            {/* Display equivalent ETB amount for Diaspora accounts */}
                                            {selectedAccount?.isDiaspora && formData.amount && formData.currency !== 'ETB' && (
                                                <div className="mt-2 text-sm text-fuchsia-700">
                                                    {t('equivalentAmount', 'Equivalent ETB Amount')}: {convertAmount(formData.amount, formData.currency)} ETB
                                                </div>
                                            )}
                                        </Field>
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="flex justify-end">
                                    <button 
                                        type="submit" 
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 font-medium flex items-center gap-2 transition-all shadow-md border-2 border-transparent hover:border-fuchsia-900"
                                    >
                                        <span>{t('continue', 'Continue')}</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 2: Confirmation */}
                        {step === 2 && (
                            <form onSubmit={handleStep2Next} className="space-y-6">
                                <div className="space-y-4">
                                    {checkApprovalStatus()}
                                    
                                    <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
                                        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                                            <span className="font-medium text-fuchsia-800">
                                                {t('accountHolder', 'Account Holder')}:
                                            </span>
                                            <span className="font-semibold text-fuchsia-900">{formData.accountHolderName}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                                            <span className="font-medium text-fuchsia-800">
                                                {t('accountNumber', 'Account Number')}:
                                            </span>
                                            <span className="font-mono font-semibold text-fuchsia-900">{formData.accountNumber}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="font-medium text-fuchsia-800">
                                                {t('amount', 'Amount')}:
                                            </span>
                                            <span className="text-lg font-bold text-fuchsia-700">
                                                {Number(formData.amount).toLocaleString()} {formData.currency}
                                                {selectedAccount?.isDiaspora && formData.currency !== 'ETB' && (
                                                    <div className="text-sm font-normal">
                                                        ({convertAmount(formData.amount, formData.currency)} ETB)
                                                    </div>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(1)}
                                        className="border border-fuchsia-300 text-fuchsia-700 px-6 py-3 rounded-lg hover:bg-fuchsia-50 flex items-center gap-2 justify-center transition-all"
                                    >
                                        <span>{t('back', 'Back')}</span>
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 font-medium flex items-center gap-2 justify-center transition-all shadow-md border-2 border-transparent hover:border-fuchsia-900"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>{t('continue', 'Continue')}</span>
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 3: Digital Signature */}
                        {step === 3 && (
                            <form onSubmit={handleStep3Next} className="space-y-6">
                                <div className="border border-fuchsia-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <PenTool className="h-5 w-5 text-fuchsia-700" />
                                        {t('digitalSignature', 'Digital Signature')}
                                    </h2>
                                    
                                    <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 border border-fuchsia-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-fuchsia-700">
                                            {t('signatureInstructions', 'Please provide your signature using your finger or stylus. This signature will be used to authorize your withdrawal transaction.')}
                                        </p>
                                    </div>

                                    <div className="bg-white border-2 border-dashed border-fuchsia-300 rounded-lg p-4">
                                        <div className="bg-gray-100 rounded-lg p-2 mb-4">
                                            <SignatureCanvas
                                                ref={signaturePadRef}
                                                onEnd={handleSignatureEnd}
                                                canvasProps={{
                                                    className: "w-full h-48 bg-white border border-fuchsia-300 rounded-md cursor-crosshair"
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
                                                className="flex items-center gap-2 px-4 py-2 text-fuchsia-700 border border-fuchsia-300 rounded-lg hover:bg-fuchsia-50 transition-all"
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
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(2)}
                                        className="border border-fuchsia-300 text-fuchsia-700 px-6 py-3 rounded-lg hover:bg-fuchsia-50 flex items-center gap-2 justify-center transition-all"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                        {t('back', 'Back')}
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={otpLoading}
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 font-medium disabled:opacity-50 flex items-center gap-2 justify-center transition-all shadow-md border-2 border-transparent hover:border-fuchsia-900"
                                    >
                                        {otpLoading ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {t('requestingOtp', 'Requesting OTP...')}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                {t('requestOtp', 'Request OTP')}
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 4: OTP Verification */}
                        {step === 4 && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="border border-fuchsia-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-fuchsia-700" />
                                        {t('otpVerification', 'OTP Verification')}
                                    </h2>
                                    
                                    <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 border border-fuchsia-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-fuchsia-700">
                                            {t('otpSentMessage', 'An OTP has been sent to your phone number:')} 
                                            <strong className="text-fuchsia-900"> {phone}</strong>
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
                                            label={t('enterOtp', 'Enter OTP')} 
                                            required 
                                            error={errors.otp}
                                        >
                                            <input 
                                                type="text" 
                                                name="otp" 
                                                value={formData.otp} 
                                                onChange={handleChange} 
                                                maxLength={6}
                                                className="w-full p-3 text-center text-2xl tracking-widest rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 font-mono bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
                                                placeholder="000000"
                                                id="otp"
                                            />
                                        </Field>
                                        
                                        <div className="mt-2 flex justify-between items-center">
                                            <button
                                                type="button"
                                                onClick={handleResendOtp}
                                                disabled={resendCooldown > 0 || otpLoading}
                                                className="text-sm text-fuchsia-700 hover:text-fuchsia-800 disabled:text-gray-400 transition-colors"
                                            >
                                                {resendCooldown > 0 
                                                    ? t('resendOtpIn', `Resend OTP in ${resendCooldown}s`) 
                                                    : t('resendOtp', 'Resend OTP')
                                                }
                                            </button>
                                            <span className="text-sm text-gray-500">
                                                {formData.otp.length}/6
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(3)}
                                        className="border border-fuchsia-300 text-fuchsia-700 px-6 py-3 rounded-lg hover:bg-fuchsia-50 flex items-center gap-2 justify-center transition-all"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                        {t('back', 'Back')}
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting || formData.otp.length !== 6}
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 font-medium disabled:opacity-50 flex items-center gap-2 justify-center transition-all shadow-md border-2 border-transparent hover:border-fuchsia-900"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {t('processing', 'Processing...')}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4" />
                                                {t('verifyAndSubmit', 'Verify & Submit')}
                                            </div>
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