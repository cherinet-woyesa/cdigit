import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import depositService from '../../../../services/depositService';
import Field from '../../../../components/Field';
import { useUserAccounts } from '../../../../hooks/useUserAccounts';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';
import { useToast } from '../../../../context/ToastContext';
import { validateAmount, validateRequired } from '../../../../utils/validation';
import { useApprovalWorkflow } from '../../../../hooks/useApprovalWorkflow';
import { requiresTransactionApproval } from '../../../../config/rbacMatrix';
import { exchangeRateService } from '../../../../services/exchangeRateService';
import { isDiasporaAccount } from '../../../../services/accountTypeService';
import { 
    Loader2, 
    AlertCircle, 
    RefreshCw, 
    CheckCircle2, 
    ChevronRight, 
    CreditCard,
    DollarSign,
    User,
    MapPin,
    Calendar,
    Plane
} from 'lucide-react';

// Enhanced error message component
function ErrorMessage({ id, message }: { id?: string; message: string }) {
    return (
        <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span id={id} className="text-sm text-red-700">{message}</span>
        </div>
    );
}

// Success message component
function SuccessMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-green-700">{message}</span>
        </div>
    );
}

interface FormData {
    accountNumber: string;
    accountHolderName: string;
    amount: string;
    currency: string; // Add currency field
}

type Errors = Partial<Record<keyof FormData, string>> & { submit?: string };

// Define currency types
type Currency = {
    code: string;
    name: string;
    rate: number; // ETB to currency rate
};

export default function CashDepositForm() {
    const { t } = useTranslation();
    const { phone, user } = useAuth();
    const { branch } = useBranch();
    const { success: showSuccess, error: showError } = useToast();
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
        currency: 'ETB', // Default to ETB
    });
    const [errors, setErrors] = useState<Errors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [updateId, setUpdateId] = useState<string | null>(null);
    const [tokenNumber, setTokenNumber] = useState<string | null>(null);
    const [queueNumber, setQueueNumber] = useState<number | null>(null);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [step, setStep] = useState<number>(1);
    const [successMessage, setSuccessMessage] = useState('');
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
                    rate: rate.cashSelling // Use cash selling rate for deposits
                }));
                // Add ETB as default currency
                setExchangeRates([{ code: 'ETB', name: 'Ethiopian Birr', rate: 1 }, ...currencies]);
            } catch (error) {
                console.error('Failed to load exchange rates:', error);
            }
        };
        loadExchangeRates();
    }, []);

    // Show success message from navigation state
    useEffect(() => {
        if (location.state?.showSuccess) {
            setSuccessMessage(location.state.successMessage || t('depositSubmittedSuccessfully', 'Deposit submitted successfully!'));
            setTimeout(() => {
                setSuccessMessage('');
                navigate(location.pathname, { replace: true, state: {} });
            }, 5000);
        }
    }, [location.state, navigate, location.pathname, t]);

    // Account selection logic
    useEffect(() => {
        if (loadingAccounts || updateId) return;

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
            const savedAccount = localStorage.getItem('selectedDepositAccount');
            const selectedAccount = accounts.find(a => a.accountNumber === savedAccount) || accounts[0];
            setSelectedAccount(selectedAccount);
            setFormData(prev => ({
                ...prev,
                accountNumber: selectedAccount.accountNumber,
                accountHolderName: selectedAccount.accountHolderName || '',
                currency: selectedAccount.isDiaspora ? 'USD' : 'ETB' // Default to USD for Diaspora accounts
            }));
        }
    }, [accounts, loadingAccounts, updateId]);

    // Update mode detection
    useEffect(() => {
        const id = location.state?.updateId as string | undefined;
        if (!id) return;
        
        setUpdateId(id);
        setTokenNumber(location.state?.tokenNumber);
        setQueueNumber(location.state?.queueNumber);
        
        (async () => {
            try {
                setLoadingUpdate(true);
                const res = await depositService.getDepositById(id);
                const d: any = res?.data || {};
                setFormData(prev => ({
                    ...prev,
                    accountNumber: d.accountNumber || prev.accountNumber,
                    accountHolderName: d.accountHolderName || prev.accountHolderName,
                    amount: d.amount != null ? String(d.amount) : prev.amount,
                }));
            } catch (e) {
                console.error('Failed to load deposit for update:', e);
            } finally {
                setLoadingUpdate(false);
            }
        })();
    }, [location.state]);

    const handleRefreshAccounts = async () => {
        if (!phone) return;
        try {
            setIsRefreshing(true);
            await refreshAccounts();
        } catch (error) {
            console.error('Failed to refresh accounts:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // Real-time validation feedback for all fields
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
                    accountHolderName: selected.accountHolderName,
                    currency: selected.isDiaspora ? 'USD' : 'ETB' // Switch currency based on account type
                }));
                localStorage.setItem('selectedDepositAccount', value);
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
        
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateAll = (): boolean => {
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

    const checkApprovalStatus = () => {
        const approvalCheck = requiresTransactionApproval(
            'deposit',
            Number(formData.amount),
            formData.currency,
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

    const handleNext = (e: FormEvent) => {
        e.preventDefault();
        if (!validateAll()) {
            const firstError = Object.keys(errors)[0];
            if (firstError) {
                document.getElementById(firstError)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        setStep(2);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateAll()) return;

        if (!phone || !branch?.id) {
            setErrors({ submit: t('missingInfo', 'Please ensure all information is complete.') });
            return;
        }

        setIsSubmitting(true);
        try {
            // Convert amount to ETB if needed for backend processing
            const amountInETB = convertAmount(formData.amount, formData.currency);
            
            const depositData = {
                id: updateId || undefined,
                formKey: Date.now().toString(),
                branchId: branch.id,
                accountHolderName: formData.accountHolderName,
                accountNumber: formData.accountNumber,
                amount: Number(amountInETB),
                telephoneNumber: phone,
                amountInWords: 'N/A',
                sourceOfProceeds: 'N/A',
                typeOfAccount: selectedAccount?.accountType || 'N/A',
                DepositedBy: 'N/A',
                transactionType: `Cash Deposit (${formData.currency})`,
                status: 'Pending',
                tokenNumber: tokenNumber || '',
                queueNumber: queueNumber || undefined,
                formReferenceId: updateId || `dep-${Date.now()}`
            };
            
            const response = updateId
                ? await depositService.updateDeposit(updateId, depositData)
                : await depositService.submitDeposit(depositData);
            
            // Create approval workflow for new deposits
            if (!updateId && response.success) {
                await createWorkflow({
                    voucherId: response.data?.id || '',
                    voucherType: 'deposit',
                    transactionType: 'deposit',
                    amount: Number(amountInETB),
                    currency: 'ETB', // Always use ETB for internal processing
                    customerSegment: 'normal',
                    reason: 'Customer deposit request',
                    voucherData: depositData,
                });
            }
            
            showSuccess(updateId 
                ? t('depositUpdated', 'Deposit updated successfully!')
                : t('depositSubmitted', 'Deposit submitted successfully!')
            );
                
            navigate('/form/cash-deposit/cashdepositconfirmation', { 
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
                    tokenNumber: response.data?.tokenNumber || tokenNumber,
                    queueNumber: response.data?.queueNumber || queueNumber,
                } 
            });
        } catch (error: any) {
            const errorMsg = error?.message || t('submissionFailed', 'Submission failed. Please try again.');
            setErrors({ submit: errorMsg });
            showError(errorMsg);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading states
    if (loadingAccounts || loadingUpdate) {
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
                            onClick={handleRefreshAccounts}
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
                            onClick={handleRefreshAccounts}
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
                    <header className="bg-gradient-to-r from-fuchsia-700 to-amber-400 text-white">
                        <div className="px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <h1 className="text-lg font-bold">{t('cashDeposit', 'Cash Deposit')}</h1>
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
                        {successMessage && (
                            <div className="mb-6">
                                <SuccessMessage message={successMessage} />
                            </div>
                        )}

                        {/* Step 1: Account Details */}
                        {step === 1 && (
                            <form onSubmit={handleNext} className="space-y-6">
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
                            <form onSubmit={handleSubmit} className="space-y-6">
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
                                        disabled={isSubmitting}
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center transition-all shadow-md border-2 border-transparent hover:border-fuchsia-900"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>{t('submitting', 'Submitting...')}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4" />
                                                <span>{t('submit', 'Submit')}</span>
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