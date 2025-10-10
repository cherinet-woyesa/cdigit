import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { useUserAccounts } from '../../../../hooks/useUserAccounts';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';
import { sendFundTransferOTP, submitFundTransfer, updateFundTransfer } from '../../../../services/fundTransferService';
import Field from '../../../../components/Field';
import { useToast } from '../../../../context/ToastContext';
import { validateAmount, validateRequired, validateOTP, validateAccountNumber } from '../../../../utils/validation';
import { 
    Loader2, 
    AlertCircle, 
    CheckCircle2, 
    ChevronRight,
    CreditCard,
    DollarSign,
    User,
    Shield,
    MapPin,
    Calendar,
    Users
} from 'lucide-react';

// Consistent error message component
function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{message}</span>
        </div>
    );
}

interface FormData {
    debitAccountNumber: string;
    debitAccountName: string;
    amount: string;
    creditAccountNumber: string;
    creditAccountName: string;
    otp: string;
}

type Errors = Partial<Record<keyof FormData, string>> & { submit?: string; otp?: string };

export default function FundTransfer() {
    const { t } = useTranslation();
    const { phone, token, user } = useAuth();
    const { branch } = useBranch();
    const { success: showSuccess, error: showError, info } = useToast();
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
        debitAccountNumber: '',
        debitAccountName: '',
        amount: '',
        creditAccountNumber: '',
        creditAccountName: '',
        otp: '',
    });
    const [errors, setErrors] = useState<Errors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<number>(1);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendTimer, setResendTimer] = useState<NodeJS.Timeout | null>(null);
    const [updateId, setUpdateId] = useState<string | null>(null);

    // Check authentication
    useEffect(() => {
        if (!token) {
            setErrors({ submit: t('authenticationRequired', 'Authentication required. Please log in again.') });
        }
    }, [token, t]);

    // Account selection logic
    useEffect(() => {
        if (loadingAccounts) return;

        const saved = localStorage.getItem('selectedDebitAccount');
        const selectedAccount = saved ? accounts.find(a => a.accountNumber === saved) : null;
        
        if (accounts.length === 1 || selectedAccount) {
            const account = selectedAccount || accounts[0];
            setFormData(prev => ({
                ...prev,
                debitAccountNumber: account.accountNumber,
                debitAccountName: account.accountHolderName || '',
            }));
            if (!selectedAccount) {
                localStorage.setItem('selectedDebitAccount', account.accountNumber);
            }
        }
        
        // Handle update scenario
        if (location.state?.updateId) {
            setUpdateId(location.state.updateId);
            const fd = location.state.formData || {};
            setFormData(prev => ({
                ...prev,
                debitAccountNumber: fd.debitAccountNumber || prev.debitAccountNumber,
                debitAccountName: fd.debitAccountName || prev.debitAccountName,
                creditAccountNumber: fd.creditAccountNumber || prev.creditAccountNumber,
                creditAccountName: fd.creditAccountName || prev.creditAccountName,
                amount: fd.amount ? String(fd.amount) : prev.amount,
            }));
            setStep(3); // Skip to OTP step for updates
        }
    }, [accounts, loadingAccounts, location.state]);

    // Cleanup timers
    useEffect(() => {
        return () => {
            if (resendTimer) clearInterval(resendTimer);
        };
    }, [resendTimer]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // Real-time validation
        if (name === 'creditAccountNumber' && value) {
            const validation = validateAccountNumber(value);
            if (!validation.isValid) {
                setErrors(prev => ({ ...prev, creditAccountNumber: validation.error }));
            } else if (value === formData.debitAccountNumber) {
                setErrors(prev => ({ ...prev, creditAccountNumber: t('differentAccountRequired', 'Beneficiary account must be different') }));
            } else {
                setErrors(prev => ({ ...prev, creditAccountNumber: undefined }));
            }
        }
        
        if (name === 'amount' && value) {
            const validation = validateAmount(value, { min: 0.01, max: 10000000 });
            if (!validation.isValid) {
                setErrors(prev => ({ ...prev, amount: validation.error }));
            } else {
                setErrors(prev => ({ ...prev, amount: undefined }));
            }
        }
        
        if (name === 'otp' && value) {
            const validation = validateOTP(value);
            if (!validation.isValid && value.length === 6) {
                setErrors(prev => ({ ...prev, otp: validation.error }));
            } else {
                setErrors(prev => ({ ...prev, otp: undefined }));
            }
        }

        if (name === 'debitAccountNumber') {
            const selected = accounts.find(acc => acc.accountNumber === value);
            if (selected) {
                setFormData(prev => ({
                    ...prev,
                    debitAccountNumber: value,
                    debitAccountName: selected.accountHolderName || ''
                }));
                localStorage.setItem('selectedDebitAccount', value);
                return;
            }
        }
        
        if (name === 'amount') {
            const sanitizedValue = value.replace(/[^\d.]/g, '');
            const parts = sanitizedValue.split('.');
            if (parts.length > 2) return;
            if (parts[1] && parts[1].length > 2) return;
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

    const validateCreditAccount = async (): Promise<boolean> => {
        if (formData.debitAccountNumber === formData.creditAccountNumber) {
            setErrors({ creditAccountNumber: t('differentAccountRequired', 'Beneficiary account must be different from debit account.') });
            return false;
        }
        
        if (!formData.creditAccountNumber.trim()) {
            setErrors({ creditAccountNumber: t('beneficiaryAccountRequired', 'Beneficiary account is required.') });
            return false;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`http://localhost:5268/api/Accounts/AccountNumExist/${formData.creditAccountNumber.trim()}`);
            if (response.ok) {
                const result = await response.json();
                setFormData(prev => ({ 
                    ...prev, 
                    creditAccountName: result.data?.accountHolderName || result.data?.name || '' 
                }));
                setErrors(prev => ({ ...prev, creditAccountNumber: undefined }));
                return true;
            } else {
                setErrors({ creditAccountNumber: t('accountNotFound', 'Beneficiary account not found.') });
                return false;
            }
        } catch (error) {
            setErrors({ creditAccountNumber: t('validationError', 'Error validating account.') });
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const validateStep1 = (): boolean => {
        const errs: Errors = {};
        
        const debitValidation = validateRequired(formData.debitAccountNumber);
        if (!debitValidation.isValid) {
            errs.debitAccountNumber = debitValidation.error || t('accountNumberRequired', 'Please select an account');
        }
        
        const creditValidation = validateAccountNumber(formData.creditAccountNumber);
        if (!creditValidation.isValid) {
            errs.creditAccountNumber = creditValidation.error || t('beneficiaryAccountRequired', 'Beneficiary account is required');
        } else if (formData.debitAccountNumber === formData.creditAccountNumber) {
            errs.creditAccountNumber = t('differentAccountRequired', 'Beneficiary account must be different from debit account.');
        }
        
        const amountValidation = validateAmount(formData.amount, { min: 0.01, max: 10000000 });
        if (!amountValidation.isValid) {
            errs.amount = amountValidation.error || t('validAmountRequired', 'Please enter a valid amount greater than 0');
        }
        
        setErrors(errs);
        
        if (Object.keys(errs).length > 0) {
            showError(t('validationErrors', 'Please fix the errors in the form'));
        }
        
        return Object.keys(errs).length === 0;
    };

    const validateStep3 = (): boolean => {
        const errs: Errors = {};
        
        const otpValidation = validateOTP(formData.otp);
        if (!otpValidation.isValid) {
            errs.otp = otpValidation.error || t('validOtpRequired', 'Please enter a valid 6-digit OTP');
        }
        
        setErrors(errs);
        
        if (Object.keys(errs).length > 0) {
            showError(t('validationErrors', 'Please enter a valid OTP'));
        }
        
        return Object.keys(errs).length === 0;
    };

    const handleStep1Next = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep1()) return;
        
        const creditValid = await validateCreditAccount();
        if (!creditValid) return;
        
        setStep(2);
    };

    const handleStep2Next = async (e: FormEvent) => {
        e.preventDefault();
        if (!phone || !token) {
            setErrors({ submit: t('missingPhoneNumber', 'Phone number or authentication token not found. Please log in again.') });
            return;
        }

        setOtpLoading(true);
        setErrors({});
        setOtpMessage('');

        try {
            const response = await sendFundTransferOTP(phone.trim());
            if (response.success || response.message) {
                const msg = response.message || t('otpSent', 'OTP sent to your phone.');
                setOtpMessage(msg);
                info(msg);
                setStep(3);
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
            console.error('OTP request error:', error);
            setErrors({ submit: error?.response?.data?.message || t('otpRequestFailed', 'Failed to send OTP.') });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!phone || !token || resendCooldown > 0) return;

        setOtpLoading(true);
        setErrors({});
        setOtpMessage('');

        try {
            const response = await sendFundTransferOTP(phone.trim());
            if (response.success || response.message) {
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
            console.error('OTP resend error:', error);
            setErrors({ submit: error?.response?.data?.message || t('otpRequestFailed', 'Failed to send OTP.') });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep3()) return;

        if (!phone || !branch?.id || !token) {
            setErrors({ submit: t('missingInfo', 'Please ensure all information is complete.') });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                phoneNumber: phone.trim(),
                branchId: branch.id,
                debitAccountNumber: formData.debitAccountNumber.trim(),
                creditAccountNumber: formData.creditAccountNumber.trim(),
                amount: parseFloat(formData.amount),
                otp: formData.otp.trim(),
                remark: '', // Add if you want to support remarks
            };

            // Validate that all required fields have values
            if (!payload.phoneNumber || !payload.otp || !payload.debitAccountNumber || 
                !payload.creditAccountNumber || !payload.amount || isNaN(payload.amount)) {
                setErrors({ submit: t('missingRequiredFields', 'Please fill in all required fields.') });
                setIsSubmitting(false);
                return;
            }

            let response;
            if (updateId) {
                response = await updateFundTransfer(updateId, payload);
            } else {
                response = await submitFundTransfer(payload);
            }

            if (response && (response.success || response.data)) {
                showSuccess(updateId 
                    ? t('transferUpdated', 'Transfer updated successfully!') 
                    : t('transferSubmitted', 'Transfer submitted successfully!')
                );
                
                navigate('/fund-transfer-confirmation', { 
                    state: { 
                        serverData: response,
                        branchName: branch?.name,
                        ui: {
                            debitAccountNumber: formData.debitAccountNumber,
                            debitAccountName: formData.debitAccountName,
                            creditAccountNumber: formData.creditAccountNumber,
                            creditAccountName: formData.creditAccountName,
                            amount: formData.amount,
                        }
                    } 
                });
            } else {
                setErrors({ submit: response?.message || t('invalidOtp', 'Invalid or already used OTP. Please try again.') });
            }
        } catch (error: any) {
            console.error('Submission error:', error);
            let errorMsg = t('submissionFailed', 'Submission failed. Please try again.');
            
            if (error?.response?.data?.errors) {
                const backendErrors = error.response.data.errors;
                errorMsg = Object.values(backendErrors).flat().join(', ');
            } else if (error?.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error?.message) {
                errorMsg = error.message;
            }
            
            setErrors({ submit: errorMsg });
            showError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
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
                                        <Users className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold">{t('fundTransfer', 'Fund Transfer')}</h1>
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
                        {/* Progress Steps */}
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
                                    <span className="font-medium text-sm">3. {t('otp', 'OTP')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Step 1: Transfer Details */}
                        {step === 1 && (
                            <form onSubmit={handleStep1Next} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-fuchsia-700" />
                                        {t('accountInformation', 'Account Information')}
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field 
                                            label={t('debitAccount', 'Debit Account')} 
                                            required 
                                            error={errors.debitAccountNumber}
                                        >
                                            {accountDropdown ? (
                                                <select 
                                                    name="debitAccountNumber" 
                                                    value={formData.debitAccountNumber} 
                                                    onChange={handleChange} 
                                                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
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
                                                    name="debitAccountNumber" 
                                                    value={formData.debitAccountNumber} 
                                                    onChange={handleChange} 
                                                    readOnly={accounts.length === 1}
                                                    className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50"
                                                />
                                            )}
                                        </Field>
                                        
                                        <Field 
                                            label={t('accountHolderName', 'Account Holder Name')} 
                                            required 
                                            error={errors.debitAccountName}
                                        >
                                            <input 
                                                type="text" 
                                                name="debitAccountName" 
                                                value={formData.debitAccountName} 
                                                readOnly 
                                                className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50"
                                            />
                                        </Field>
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <User className="h-5 w-5 text-fuchsia-700" />
                                        {t('beneficiaryInformation', 'Beneficiary Information')}
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field 
                                            label={t('beneficiaryAccount', 'Beneficiary Account')} 
                                            required 
                                            error={errors.creditAccountNumber}
                                        >
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    name="creditAccountNumber" 
                                                    value={formData.creditAccountNumber} 
                                                    onChange={handleChange} 
                                                    className="flex-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                    placeholder={t('enterAccountNumber', 'Enter account number')}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => validateCreditAccount()}
                                                    disabled={isSubmitting}
                                                    className="bg-fuchsia-600 text-white px-4 rounded-lg hover:bg-fuchsia-700 disabled:bg-fuchsia-300 flex items-center"
                                                >
                                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('verify', 'Verify')}
                                                </button>
                                            </div>
                                        </Field>
                                        
                                        <Field 
                                            label={t('beneficiaryName', 'Beneficiary Name')} 
                                            required 
                                            error={errors.creditAccountName}
                                        >
                                            <input 
                                                type="text" 
                                                name="creditAccountName" 
                                                value={formData.creditAccountName} 
                                                readOnly 
                                                className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50"
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
                                        {t('confirmTransfer', 'Confirm Transfer')}
                                    </h2>
                                    
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="font-medium text-gray-700">{t('fromAccount', 'From Account')}:</span>
                                            <span className="font-semibold">{formData.debitAccountName} ({formData.debitAccountNumber})</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="font-medium text-gray-700">{t('toAccount', 'To Account')}:</span>
                                            <span className="font-semibold">{formData.creditAccountName} ({formData.creditAccountNumber})</span>
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

                        {/* Step 3: OTP Verification */}
                        {step === 3 && (
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
                                        onClick={() => setStep(2)}
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
                                                {updateId ? t('updateTransfer', 'Update Transfer') : t('verifyAndSubmit', 'Verify & Submit')}
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