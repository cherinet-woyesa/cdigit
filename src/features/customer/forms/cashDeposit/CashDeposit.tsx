import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import depositService from '../../../../services/depositService';
import Field from '../../../../components/Field';
import { useUserAccounts } from '../../../../hooks/useUserAccounts';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';
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
}

type Errors = Partial<Record<keyof FormData, string>> & { submit?: string };

export default function CashDepositForm() {
    const { t } = useTranslation();
    const { phone, user } = useAuth();
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
            setFormData(prev => ({
                ...prev,
                accountNumber: account.accountNumber,
                accountHolderName: account.accountHolderName || '',
            }));
        } else if (accounts.length > 1) {
            const savedAccount = localStorage.getItem('selectedDepositAccount');
            const selectedAccount = accounts.find(a => a.accountNumber === savedAccount) || accounts[0];
            setFormData(prev => ({
                ...prev,
                accountNumber: selectedAccount.accountNumber,
                accountHolderName: selectedAccount.accountHolderName || '',
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
        
        if (errors[name as keyof Errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }

        if (name === 'accountNumber') {
            const selected = accounts.find(acc => acc.accountNumber === value);
            if (selected) {
                setFormData(prev => ({
                    ...prev,
                    accountNumber: value,
                    accountHolderName: selected.accountHolderName
                }));
                localStorage.setItem('selectedDepositAccount', value);
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
        
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateAll = (): boolean => {
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
            const depositData = {
                id: updateId || undefined,
                formKey: Date.now().toString(),
                branchId: branch.id,
                accountHolderName: formData.accountHolderName,
                accountNumber: formData.accountNumber,
                amount: Number(formData.amount),
                telephoneNumber: phone,
                amountInWords: 'N/A',
                sourceOfProceeds: 'N/A',
                typeOfAccount: 'N/A',
                DepositedBy: 'N/A',
                transactionType: 'Cash Deposit',
                status: 'Pending',
                tokenNumber: tokenNumber || '',
                queueNumber: queueNumber || undefined,
                formReferenceId: updateId || `dep-${Date.now()}`
            };
            
            const response = updateId
                ? await depositService.updateDeposit(updateId, depositData)
                : await depositService.submitDeposit(depositData);
                
            navigate('/form/cash-deposit/cashdepositconfirmation', { 
                state: { 
                    serverData: response,
                    branchName: branch?.name,
                    ui: {
                        accountNumber: formData.accountNumber,
                        accountHolderName: formData.accountHolderName,
                        amount: formData.amount,
                        telephoneNumber: phone
                    },
                    tokenNumber: response.data?.tokenNumber || tokenNumber,
                    queueNumber: response.data?.queueNumber || queueNumber,
                } 
            });
        } catch (error: any) {
            setErrors({ submit: error?.message || t('submissionFailed', 'Submission failed. Please try again.') });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading states
    if (loadingAccounts || loadingUpdate) {
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
                            onClick={handleRefreshAccounts}
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
                            onClick={handleRefreshAccounts}
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
                                        <h1 className="text-lg font-bold">{t('cashDeposit', 'Cash Deposit')}</h1>
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
                        {successMessage && (
                            <div className="mb-6">
                                <SuccessMessage message={successMessage} />
                            </div>
                        )}

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
                            </div>
                        </div>

                        {/* Step 1: Account Details */}
                        {step === 1 && (
                            <form onSubmit={handleNext} className="space-y-6">
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
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        {t('confirmDeposit', 'Confirm Deposit')}
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
                                        disabled={isSubmitting}
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
                                                {t('submit', 'Submit')}
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