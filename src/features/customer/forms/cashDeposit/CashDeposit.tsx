
import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import depositService from '../../../../services/depositService';
import Field from '../../../../components/Field';
import { useUserAccounts } from '../../../../hooks/useUserAccounts';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const ABIY_BRANCH_ID = 'a3d3e1b5-8c9a-4c7c-a1e3-6b3d8f4a2b2c';

interface FormData {
    accountNumber: string;
    accountHolderName: string;
    amount: string;
}

type Errors = Partial<Record<keyof FormData, string>>;

export default function CashDepositForm() {
    const { t } = useTranslation();
    const { phone } = useAuth();
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
        amount: '',
    });
    const [errors, setErrors] = useState<Errors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Handle account selection when accounts are loaded or changed
    useEffect(() => {
        console.log('Accounts changed:', { loadingAccounts, accounts });
        
        if (loadingAccounts) return;
        
        if (!accounts || accounts.length === 0) {
            console.log('No accounts available');
            setFormData(prev => ({
                ...prev,
                accountNumber: '',
                accountHolderName: ''
            }));
            return;
        }

        // If there's only one account, auto-select it
        if (accounts.length === 1) {
            console.log('Auto-selecting single account:', accounts[0]);
            const account = accounts[0];
            setFormData(prev => ({
                ...prev,
                accountNumber: account.accountNumber,
                accountHolderName: account.accountHolderName || '',
                amount: prev.amount
            }));
        } else if (accounts.length > 1) {
            console.log('Multiple accounts available:', accounts.length);
            // If multiple accounts, check for previously selected account
            const savedAccount = localStorage.getItem('selectedDepositAccount');
            const selectedAccount = accounts.find(a => a.accountNumber === savedAccount) || accounts[0];
            
            console.log('Selected account:', selectedAccount);
            setFormData(prev => ({
                ...prev,
                accountNumber: selectedAccount.accountNumber,
                accountHolderName: selectedAccount.accountHolderName || '',
                amount: prev.amount
            }));
        }
    }, [accounts, loadingAccounts]);

    const handleRefreshAccounts = async () => {
        if (!phone) {
            console.error('Cannot refresh: No phone number available');
            return;
        }
        
        try {
            setIsRefreshing(true);
            await refreshAccounts();
        } catch (error) {
            console.error('Failed to refresh accounts:', error);
            // We'll let the error be handled by the error state in the hook
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        console.log('Field changed:', { name, value });
        
        // Clear any previous errors for this field
        if (errors[name as keyof Errors]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof Errors];
                return newErrors;
            });
        }

        if (name === 'accountNumber') {
            const selected = accounts.find(acc => acc.accountNumber === value);
            if (selected) {
                setFormData(prev => ({
                    ...prev,
                    accountNumber: value,
                    accountHolderName: selected.accountHolderName
                }));
                // Save the selected account for future use
                localStorage.setItem('selectedDepositAccount', value);
                return;
            }
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateAll = (): boolean => {
        const errs: Errors = {};
        if (!formData.accountNumber) errs.accountNumber = t('accountNumberRequired', 'Account number is required.');
        if (!formData.accountHolderName) errs.accountHolderName = t('accountHolderNameRequired', 'Account holder name is required.');
        if (!formData.amount || Number(formData.amount) <= 0) errs.amount = t('validAmountRequired', 'A valid amount is required.');
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateAll()) return;
        setIsSubmitting(true);
        try {
            const depositData = {
                formKey: Date.now().toString(),
                branchId: ABIY_BRANCH_ID,
                accountHolderName: formData.accountHolderName,
                accountNumber: formData.accountNumber,
                amount: Number(formData.amount),
                telephoneNumber: phone || '',
            };
            const response = await depositService.submitDeposit(depositData);
            navigate('/form/cash-deposit/cashdepositconfirmation', { 
                state: { 
                    serverData: response,
                    branchName: t('ayerTenaBranch', 'Ayer Tena Branch'),
                    ui: {
                        accountNumber: formData.accountNumber,
                        accountHolderName: formData.accountHolderName,
                        amount: formData.amount,
                        telephoneNumber: phone || ''
                    }
                } 
            });
        } catch (error: any) {
            alert(error?.message || t('submissionFailed', 'Submission failed. Please try again.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show loading state
    if (loadingAccounts) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <Loader2 className="h-12 w-12 text-fuchsia-700 animate-spin" />
                <p className="text-lg text-gray-600">Loading your accounts...</p>
            </div>
        );
    }

    // Show error state
    if (errorAccounts) {
        return (
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
                <div className="text-center p-6 space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Unable to load accounts</h2>
                    <p className="text-gray-600">{errorAccounts}</p>
                    <button
                        onClick={handleRefreshAccounts}
                        disabled={isRefreshing}
                        className="mt-4 px-6 py-2 bg-fuchsia-700 text-white rounded-lg hover:bg-fuchsia-800 disabled:opacity-50 flex items-center justify-center mx-auto"
                    >
                        {isRefreshing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Refreshing...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Try Again
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Show empty state
    if (!loadingAccounts && accounts.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
                <div className="text-center p-6 space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">No Accounts Found</h2>
                    <p className="text-gray-600">We couldn't find any accounts associated with your phone number.</p>
                    <button
                        onClick={handleRefreshAccounts}
                        disabled={isRefreshing}
                        className="mt-4 px-6 py-2 bg-fuchsia-700 text-white rounded-lg hover:bg-fuchsia-800 disabled:opacity-50 flex items-center justify-center mx-auto"
                    >
                        {isRefreshing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Refreshing...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Refresh Accounts
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white shadow-lg rounded-lg">
            <div className="mb-4 sm:mb-6 bg-fuchsia-700 text-white p-3 sm:p-4 rounded-lg shadow-lg text-center">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{t('cashDeposit', 'Cash Deposit')}</h1>
                <p className="text-white text-sm sm:text-base mt-1">{t('ayerTenaBranch', 'Ayer Tena Branch')}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="p-3 sm:p-4 border rounded-lg shadow-sm">
                    <h2 className="text-lg sm:text-xl font-semibold text-fuchsia-700 mb-3 sm:mb-4">{t('accountInformation', 'Account Information')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                                    className="form-select w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors bg-white shadow-sm"
                                    disabled={isRefreshing}
                                    aria-invalid={!!errors.accountNumber}
                                    aria-describedby={errors.accountNumber ? 'accountNumber-error' : undefined}
                                >
                                    <option value="">{t('selectYourAccount', 'Select your account')}</option>
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
                                    disabled={isRefreshing}
                                    className="form-input w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                                    aria-invalid={!!errors.accountNumber}
                                    aria-describedby={errors.accountNumber ? 'accountNumber-error' : undefined}
                                />
                            )}
                            {errors.accountNumber && (
                                <p id="accountNumber-error" className="mt-1 text-sm text-red-600">
                                    {errors.accountNumber}
                                </p>
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
                                className="form-input w-full p-3 rounded-lg border-2 border-gray-300 bg-gray-100 cursor-not-allowed"
                                aria-invalid={!!errors.accountHolderName}
                                aria-describedby={errors.accountHolderName ? 'accountHolderName-error' : undefined}
                            />
                            {errors.accountHolderName && (
                                <p id="accountHolderName-error" className="mt-1 text-sm text-red-600">
                                    {errors.accountHolderName}
                                </p>
                            )}
                        </Field>
                    </div>
                </div>
                <div className="p-3 sm:p-4 border rounded-lg shadow-sm mt-4 sm:mt-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-fuchsia-700 mb-3 sm:mb-4">{t('amountInformation', 'Amount Information')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <Field 
                            label={t('amount', 'Amount')} 
                            required 
                            error={errors.amount}
                        >
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500">ETB</span>
                                </div>
                                <input 
                                    type="number" 
                                    name="amount" 
                                    value={formData.amount} 
                                    onChange={handleChange} 
                                    className="form-input w-full p-3 pl-16 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                                    placeholder="0.00"
                                    min="1"
                                    step="0.01"
                                    disabled={isRefreshing}
                                    aria-invalid={!!errors.amount}
                                    aria-describedby={errors.amount ? 'amount-error' : undefined}
                                />
                            </div>
                            {errors.amount && (
                                <p id="amount-error" className="mt-1 text-sm text-red-600">
                                    {errors.amount}
                                </p>
                            )}
                        </Field>
                    </div>
                </div>
                <div className="pt-3 sm:pt-4">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-fuchsia-700 hover:bg-fuchsia-800 text-white font-bold py-2 sm:py-3 px-4 rounded-lg shadow-lg transition transform duration-200 hover:scale-105 disabled:opacity-50 text-sm sm:text-base"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                                {t('processing', 'Processing...')}
                            </>
                        ) : (
                            t('submitDeposit', 'Submit Deposit')
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
