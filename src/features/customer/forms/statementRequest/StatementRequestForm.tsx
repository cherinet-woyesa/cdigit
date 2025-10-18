import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { useUserAccounts } from '../../../../hooks/useUserAccounts';
import { statementService } from '../../../../services/statementService';
import Field from '../../../../components/Field';
import SignatureCanvas from 'react-signature-canvas';
import { useToast } from '../../../../context/ToastContext';
import { 
    Loader2, 
    AlertCircle, 
    CheckCircle2, 
    ChevronRight,
    CreditCard,
    User,
    Shield,
    MapPin,
    PenTool,
    Eraser
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

// Statement frequency options
const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

interface FormData {
    accountNumber: string;
    accountHolderName: string;
    emailAddresses: string[];
    statementFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    signature: string;
    otp: string;
}

type Errors = Partial<Record<keyof FormData, string>> & { submit?: string; otp?: string };

export default function StatementRequestForm() {
    const { t } = useTranslation();
    const { phone, user } = useAuth();
    const { branch } = useBranch();
    const { success: showSuccess, error: showError } = useToast();
    const navigate = useNavigate();
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
        emailAddresses: [''],
        statementFrequency: 'monthly',
        signature: '',
        otp: '',
    });
    const [errors, setErrors] = useState<Errors>({});
    const [step, setStep] = useState<number>(1);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendTimer, setResendTimer] = useState<NodeJS.Timeout | null>(null);
    const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);
    const signaturePadRef = useRef<any>(null);

    // Account selection logic (consistent with withdrawal form)
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
            const savedAccount = localStorage.getItem('selectedStatementAccount');
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
                localStorage.setItem('selectedStatementAccount', value);
                return;
            }
        }
        
        if (name === 'otp') {
            const sanitizedValue = value.replace(/\D/g, '').slice(0, 6);
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }
        
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle email input changes
    const handleEmailChange = (index: number, value: string) => {
        const newEmails = [...formData.emailAddresses];
        newEmails[index] = value;
        setFormData(prev => ({
            ...prev,
            emailAddresses: newEmails
        }));
    };

    // Add new email field
    const addEmailField = () => {
        setFormData(prev => ({
            ...prev,
            emailAddresses: [...prev.emailAddresses, '']
        }));
    };

    // Remove email field
    const removeEmailField = (index: number) => {
        if (formData.emailAddresses.length <= 1) return;
        
        const newEmails = formData.emailAddresses.filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            emailAddresses: newEmails
        }));
    };

    const validateStep1 = (): boolean => {
        const errs: Errors = {};
        
        if (!formData.accountNumber.trim()) {
            errs.accountNumber = t('accountNumberRequired', 'Please select an account');
        }
        
        if (!formData.accountHolderName.trim()) {
            errs.accountHolderName = t('accountHolderNameRequired', 'Account holder name is required');
        }
        
        // Email validation
        const emailValidation = statementService.validateEmails(
            formData.emailAddresses.filter(email => email.trim() !== '')
        );
        if (!emailValidation.valid) {
            errs.emailAddresses = `Invalid email format: ${emailValidation.invalidEmails.join(', ')}`;
        }
        
        if (formData.emailAddresses.filter(email => email.trim() !== '').length === 0) {
            errs.emailAddresses = t('emailRequired', 'At least one email address is required');
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep2 = (): boolean => {
        // Signature validation - similar to withdrawal
        if (signaturePadRef.current && signaturePadRef.current.isEmpty()) {
            setErrors({ signature: t('signatureRequired', 'Digital signature is required') });
            return false;
        }
        return true;
    };

    const validateStep3 = (): boolean => {
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
            if (errors.signature) {
                setErrors(prev => ({ ...prev, signature: undefined }));
            }
        }
    };

    const handleStep2Next = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep2()) return;

        // Save signature
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
            const response = await statementService.requestStatementOtp(phone);
            if (response.success) {
                const msg = response.message || t('otpSent', 'OTP sent to your phone.');
                setOtpMessage(msg);
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
            const response = await statementService.requestStatementOtp(phone);
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

        // Submit statement request
        try {
            const result = await statementService.submitStatementRequest({
                branchName: branch?.name || '',
                branchCode: branch?.id || '',
                customerId: user?.id || 'CUSTOMER_ID',
                customerName: formData.accountHolderName,
                accountNumbers: [formData.accountNumber],
                emailAddresses: formData.emailAddresses.filter(email => email.trim() !== ''),
                statementFrequency: formData.statementFrequency,
                termsAccepted: true, // Always accepted when we reach this step
                signature: formData.signature,
                makerId: user?.id || 'SYSTEM',
                makerName: formData.accountHolderName,
                makerDate: new Date().toISOString(),
                phoneNumber: phone || '',
                branchId: branch?.id || '',
                otpCode: formData.otp // Pass the actual OTP entered by the user
            });
            
            if (result.success) {
                showSuccess(t('statementRequestSubmitted', 'Statement request submitted successfully!'));
                
                // Navigate to confirmation with the response data
                navigate('/form/statement-request/confirmation', {
                    state: { 
                        request: {
                            id: result.data?.id || '',
                            formRefId: result.data?.formReferenceId || result.data?.id || '',
                            date: result.data?.submittedAt || new Date().toISOString(),
                            branchName: result.data?.branch?.name || branch?.name,
                            branchCode: branch?.id || '',
                            customerId: user?.id || 'CUSTOMER_ID',
                            customerName: result.data?.accountHolderName || formData.accountHolderName,
                            accountNumbers: [result.data?.accountNumber || formData.accountNumber],
                            emailAddresses: result.data?.emailAddress ? result.data.emailAddress.split(',') : formData.emailAddresses.filter(email => email.trim() !== ''),
                            statementFrequency: result.data?.statementFrequency || formData.statementFrequency,
                            termsAccepted: result.data?.termsAccepted || true,
                            signature: result.data?.digitalSignature || formData.signature,
                            status: 'pending',
                            makerId: result.data?.frontMakerId || user?.id || 'SYSTEM',
                            makerName: result.data?.frontMaker?.userName || formData.accountHolderName,
                            makerDate: result.data?.submittedAt || new Date().toISOString(),
                            queueNumber: result.data?.queueNumber,
                            tokenNumber: result.data?.tokenNumber,
                        }
                    }
                });
            } else {
                throw new Error(result.message || t('submissionFailed', 'Submission failed'));
            }
        } catch (error: any) {
            const errorMessage = error?.message || t('submissionFailed', 'Submission failed');
            setErrors({ submit: errorMessage });
            showError(errorMessage);
        }
    };

    // Format frequency
    const formatFrequency = (freq: string) => {
        switch (freq) {
            case 'daily':
                return t('daily', 'Daily');
            case 'weekly':
                return t('weekly', 'Weekly');
            case 'monthly':
                return t('monthly', 'Monthly');
            case 'quarterly':
                return t('quarterly', 'Quarterly');
            default:
                return freq;
        }
    };

    // Loading states (consistent with withdrawal form)
    if (loadingAccounts) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-fuchsia-50 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full">
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
                <div className="max-w-2xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('error', 'Error')}</h3>
                        <p className="text-gray-600 mb-4">{errorAccounts}</p>
                        <button
                            onClick={() => refreshAccounts()}
                            className="bg-gradient-to-r from-amber-500 to-fuchsia-700 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-fuchsia-800"
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
                <div className="max-w-2xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noAccounts', 'No Accounts')}</h3>
                        <p className="text-gray-600 mb-4">{t('noAccountsMessage', 'No accounts found for your phone number.')}</p>
                        <button
                            onClick={() => refreshAccounts()}
                            className="bg-gradient-to-r from-amber-500 to-fuchsia-700 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-fuchsia-800"
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
                    {/* Header with brand gradient */}
                     <header className="bg-gradient-to-r from-fuchsia-700 to-amber-400 text-white">
                        <div className="px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <h1 className="text-lg font-bold">{t('statementRequest', 'Statement Request')}</h1>
                                    <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
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
                                    <button 
                                        onClick={() => navigate('/form/statement-request/list')}
                                        className="text-xs text-fuchsia-100 hover:text-white underline"
                                    >
                                        {t('viewHistory', 'View History')}
                                    </button>
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

                        {/* Step 1: Account Details & Email */}
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
                                                    name="accountNumber"
                                                    value={formData.accountNumber}
                                                    onChange={handleChange}
                                                    disabled={accounts.length === 1}
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
                                                onChange={handleChange}
                                                disabled
                                                className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
                                                id="accountHolderName"
                                            />
                                        </Field>
                                    </div>

                                    <div>
                                        <Field 
                                            label={t('emailAddresses', 'Email Address(es)')} 
                                            required 
                                            error={errors.emailAddresses}
                                        >
                                            <div className="space-y-3">
                                                {formData.emailAddresses.map((email, index) => (
                                                    <div key={index} className="flex items-center space-x-2">
                                                        <div className="flex-1">
                                                            <input
                                                                type="email"
                                                                value={email}
                                                                onChange={(e) => handleEmailChange(index, e.target.value)}
                                                                className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
                                                                placeholder={t('enterEmail', 'Enter email address')}
                                                                required={index === 0}
                                                            />
                                                            {email && !statementService.validateEmail(email) && (
                                                                <p className="mt-1 text-sm text-red-600">
                                                                    {t('invalidEmail', 'Please enter a valid email address')}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {formData.emailAddresses.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeEmailField(index)}
                                                                className="p-2 text-red-500 hover:text-red-700"
                                                                aria-label={t('removeEmail', 'Remove email')}
                                                            >
                                                                <Eraser className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={addEmailField}
                                                    className="inline-flex items-center text-sm text-fuchsia-700 hover:text-fuchsia-800"
                                                >
                                                    <ChevronRight className="h-4 w-4 mr-1" />
                                                    {t('addAnotherEmail', 'Add another email')}
                                                </button>
                                            </div>
                                        </Field>
                                    </div>

                                    <div>
                                        <Field 
                                            label={t('statementFrequency', 'Statement Frequency')} 
                                            required
                                        >
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {FREQUENCY_OPTIONS.map((option) => (
                                                    <div
                                                        key={option.value}
                                                        className={`border rounded-lg p-3 cursor-pointer text-center ${
                                                            formData.statementFrequency === option.value
                                                                ? 'border-fuchsia-500 bg-fuchsia-50'
                                                                : 'border-fuchsia-300 hover:border-fuchsia-400'
                                                        }`}
                                                        onClick={() => setFormData(prev => ({ ...prev, statementFrequency: option.value as any }))}
                                                    >
                                                        <input
                                                            type="radio"
                                                            id={option.value}
                                                            name="statementFrequency"
                                                            value={option.value}
                                                            checked={formData.statementFrequency === option.value}
                                                            onChange={() => setFormData(prev => ({ ...prev, statementFrequency: option.value as any }))}
                                                            className="sr-only"
                                                        />
                                                        <label htmlFor={option.value} className="block cursor-pointer">
                                                            <span className="block text-sm font-medium text-gray-700">{t(option.value, option.label)}</span>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </Field>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button 
                                        type="submit" 
                                        className="bg-gradient-to-r from-amber-500 to-fuchsia-700 text-white px-6 py-3 rounded-lg hover:from-amber-600 hover:to-fuchsia-800 font-medium flex items-center gap-2 transition-all shadow-md border-2 border-transparent hover:border-fuchsia-900"
                                    >
                                        <span>{t('continue', 'Continue')}</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 2: Digital Signature */}
                        {step === 2 && (
                            <form onSubmit={handleStep2Next} className="space-y-6">
                                <div className="border border-fuchsia-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <PenTool className="h-5 w-5 text-fuchsia-700" />
                                        {t('digitalSignature', 'Digital Signature')}
                                    </h2>
                                    
                                    <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 border border-fuchsia-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-fuchsia-700">
                                            {t('signatureInstructions', 'Please provide your signature using your finger or stylus. This signature will be used to authorize your statement request transaction.')}
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
                                        {errors.signature && (
                                            <span className="text-red-500 text-xs mt-2">{errors.signature}</span>
                                        )}
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(1)}
                                        className="border border-fuchsia-300 text-fuchsia-700 px-6 py-3 rounded-lg hover:bg-fuchsia-50 flex items-center gap-2 justify-center transition-all"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                        {t('back', 'Back')}
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={otpLoading}
                                        className="bg-gradient-to-r from-amber-500 to-fuchsia-700 text-white px-6 py-3 rounded-lg hover:from-amber-600 hover:to-fuchsia-800 font-medium disabled:opacity-50 flex items-center gap-2 justify-center transition-all shadow-md border-2 border-transparent hover:border-fuchsia-900"
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
                                        onClick={() => setStep(2)}
                                        className="border border-fuchsia-300 text-fuchsia-700 px-6 py-3 rounded-lg hover:bg-fuchsia-50 flex items-center gap-2 justify-center transition-all"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                        {t('back', 'Back')}
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={formData.otp.length !== 6}
                                        className="bg-gradient-to-r from-amber-500 to-fuchsia-700 text-white px-6 py-3 rounded-lg hover:from-amber-600 hover:to-fuchsia-800 font-medium disabled:opacity-50 flex items-center gap-2 justify-center transition-all shadow-md border-2 border-transparent hover:border-fuchsia-900"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        {t('submit', 'Submit')}
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