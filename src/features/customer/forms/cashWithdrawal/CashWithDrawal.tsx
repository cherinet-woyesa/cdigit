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
}

type Errors = Partial<Record<keyof FormData, string>> & { submit?: string; otp?: string };

export default function CashWithdrawalForm() {
    const { t } = useTranslation();
    const { phone, token, user } = useAuth();
    const { branch } = useBranch();
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

    // Account selection logic (consistent with deposit form)
    useEffect(() => {
        if (loadingAccounts) return;

        if (!accounts || accounts.length === 0) {
            setFormData(prev => ({ ...prev, accountNumber: '', accountHolderName: '' }));
            return;
        }

        if (accounts.length === 1) {
            const account = accounts[0];
            setFormData(prev => ({
                ...prev,
                accountNumber: account.accountNumber,
                accountHolderName: account.accountHolderName || '',
            }));
        } else if (accounts.length > 1) {
            const savedAccount = localStorage.getItem('selectedWithdrawalAccount');
            const selectedAccount = accounts.find(a => a.accountNumber === savedAccount) || accounts[0];
            setFormData(prev => ({
                ...prev,
                accountNumber: selectedAccount.accountNumber,
                accountHolderName: selectedAccount.accountHolderName || '',
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
        
        if (errors[name as keyof Errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
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
        
        if (!formData.accountNumber.trim()) {
            errs.accountNumber = t('accountNumberRequired', 'Please select an account');
        }
        
        if (!formData.accountHolderName.trim()) {
            errs.accountHolderName = t('accountHolderNameRequired', 'Account holder name is required');
        }
        
        if (!formData.amount || Number(formData.amount) <= 0) {
            errs.amount = t('validAmountRequired', 'Please enter a valid amount greater than 0');
        }
        
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep3 = (): boolean => {
        // Signature is optional for now, so always return true
        return true;
    };

    const validateStep4 = (): boolean => {
        const errs: Errors = {};
        
        if (!formData.otp || formData.otp.length !== 6) {
            errs.otp = t('validOtpRequired', 'Please enter the 6-digit OTP');
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
            // Submit withdrawal with OTP directly (no separate OTP verification)
            const withdrawalData = {
                phoneNumber: phone,
                branchId: branch.id,
                accountNumber: formData.accountNumber,
                accountHolderName: formData.accountHolderName,
                withdrawal_Amount: Number(formData.amount),
                signature: formData.signature, // Include signature in submission
                otpCode: formData.otp || '', // for type
                OtpCode: formData.otp || '' // for backend
            };
            console.log('Submitting withdrawal payload:', withdrawalData);

            const response = await submitWithdrawal(withdrawalData, token || undefined);

            // Always expect the full backend response (with success/message/data)
            if (response && response.success) {
                navigate('/form/cash-withdrawal/cashwithdrawalconfirmation', { 
                    state: { 
                        serverData: response,
                        branchName: branch?.name,
                        ui: {
                            accountNumber: formData.accountNumber,
                            accountHolderName: formData.accountHolderName,
                            amount: formData.amount,
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
            setErrors({ submit: error?.message || t('submissionFailed', 'Submission failed. Please try again.') });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading states (consistent with deposit form)
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
                    <header className="bg-fuchsia-700 text-white rounded-t-lg">
                        <div className="px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <Plane className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold">{t('cashWithdrawal', 'Cash Withdrawal')}</h1>
                                        <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>{branch?.name || t('branch', 'Branch')}</span>
                                            <span>•</span>
                                            <Calendar className="h-3 w-3" />
                                            <span>{new Date().toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <div className="bg-fuchsia-800/50 px-3 py-1 rounded-full text-xs">
                                        📱 {phone}
                                    </div>
                                    <div className="bg-white/20 rounded-lg p-1">
                                        <LanguageSwitcher />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div className="p-6">
                        {/* Progress Steps - 4 steps now with signature */}
                        <div className="flex justify-center mb-6">
                            <div className="flex items-center bg-gray-50 rounded-lg p-1">
                                <div className={`flex items-center px-4 py-2 rounded-md ${step >= 1 ? 'bg-fuchsia-700 text-white' : 'text-gray-600'}`}>
                                    <span className="font-medium text-sm">1. {t('details', 'Details')}</span>
                                </div>
                                <div className="mx-1 text-gray-400 text-sm">→</div>
                                <div className={`flex items-center px-4 py-2 rounded-md ${step >= 2 ? 'bg-fuchsia-700 text-white' : 'text-gray-600'}`}>
                                    <span className="font-medium text-sm">2. {t('confirm', 'Confirm')}</span>
                                </div>
                                <div className="mx-1 text-gray-400 text-sm">→</div>
                                <div className={`flex items-center px-4 py-2 rounded-md ${step >= 3 ? 'bg-fuchsia-700 text-white' : 'text-gray-600'}`}>
                                    <span className="font-medium text-sm">3. {t('signature', 'Signature')}</span>
                                </div>
                                <div className="mx-1 text-gray-400 text-sm">→</div>
                                <div className={`flex items-center px-4 py-2 rounded-md ${step >= 4 ? 'bg-fuchsia-700 text-white' : 'text-gray-600'}`}>
                                    <span className="font-medium text-sm">4. {t('otp', 'OTP')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Step 1: Account Details */}
                        {step === 1 && (
                            <form onSubmit={handleStep1Next} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-fuchsia-700" />
                                        {t('accountInformation', 'Account Information')}
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                    id="accountNumber"
                                                >
                                                    <option value="">{t('selectAccount', 'Select account')}</option>
                                                    {accounts.map(acc => (
                                                        <option key={acc.accountNumber} value={acc.accountNumber}>
                                                            {acc.accountNumber} - {acc.accountHolderName}
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
                                                    className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50"
                                                    id="accountNumber"
                                                />
                                            )}
                                        </Field>
                                        
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
                                                className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50"
                                                id="accountHolderName"
                                            />
                                        </Field>
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-fuchsia-700" />
                                        {t('amountInformation', 'Amount Information')}
                                    </h2>
                                    
                                    <div className="max-w-md">
                                        <Field 
                                            label={t('amount', 'Amount (ETB)')} 
                                            required 
                                            error={errors.amount}
                                        >
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="text-gray-600 font-medium">ETB</span>
                                                </div>
                                                <input 
                                                    type="text" 
                                                    name="amount" 
                                                    value={formData.amount} 
                                                    onChange={handleChange} 
                                                    className="w-full p-3 pl-16 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                    placeholder="0.00"
                                                    id="amount"
                                                />
                                            </div>
                                        </Field>
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

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

                        {/* Step 2: Confirmation */}
                        {step === 2 && (
                            <form onSubmit={handleStep2Next} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        {t('confirmWithdrawal', 'Confirm Withdrawal')}
                                    </h2>
                                    
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="font-medium text-gray-700">{t('accountHolder', 'Account Holder')}:</span>
                                            <span className="font-semibold">{formData.accountHolderName}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="font-medium text-gray-700">{t('accountNumber', 'Account Number')}:</span>
                                            <span className="font-mono font-semibold">{formData.accountNumber}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="font-medium text-gray-700">{t('amount', 'Amount')}:</span>
                                            <span className="text-lg font-bold text-fuchsia-700">
                                                {Number(formData.amount).toLocaleString()} ETB
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(1)}
                                        className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 justify-center"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
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
                <PenTool className="h-5 w-5 text-fuchsia-700" />
                {t('digitalSignature', 'Digital Signature')}
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-700">
                    {t('signatureInstructions', 'Please provide your signature using your finger or stylus. This signature will be used to authorize your withdrawal transaction.')}
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
            </div>
        </div>

        {errors.submit && <ErrorMessage message={errors.submit} />}

        <div className="grid grid-cols-2 gap-4">
            <button 
                type="button" 
                onClick={() => setStep(2)}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 justify-center"
            >
                <ChevronRight className="h-4 w-4 rotate-180" />
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
                                                className="w-full p-3 text-center text-2xl tracking-widest rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent font-mono"
                                                placeholder="000000"
                                                id="otp"
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
                                        className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 justify-center"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                        {t('back', 'Back')}
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting || formData.otp.length !== 6}
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