import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import depositService from '../../../services/depositService';
import { getAccountTypes, type AccountType } from '../../../services/accountTypeService';

const API_BASE_URL = 'http://localhost:5268/api';
import { fetchWindowsByBranch } from '../../../services/windowService';
import type { Window as WindowType } from '../../../services/windowService';

// Helper: simple number to words (English, for demo)
function numberToWords(num: number): string {
    const a = [
        '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
        'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
        'seventeen', 'eighteen', 'nineteen'
    ];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    if (isNaN(num) || num === 0) return '';
    if (num < 20) return a[num];
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '');
    if (num < 1000) return a[Math.floor(num / 100)] + ' hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
    if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
    return num.toString();
}

// TypeScript types matching your backend DTO
type DepositFormDto = {
    formKey: string;
    branchId: number;
    accountHolderName: string;
    accountNumber: string;
    typeOfAccount: 'Savings' | 'Current' | 'Special Demand';
    amount: number;
    amountInWords: string;
    DepositedBy: string;
    sourceOfProceeds: string;
    telephoneNumber: string;
};

type FormData = {
    accountNumber: string;
    accountHolderName: string;
    accountType: 'Savings' | 'Current' | 'Special Demand';
    amount: string;
    amountInWords: string;
    sourceOfProceeds: string;
    denominations: string;
    depositedBy: string;
    telephoneNumber: string;
};

export default function CashDepositForm() {
// Type for errors (move to top level)
type Errors = Partial<Record<keyof FormData, string>>;

    // Get phone number from AuthContext (set at login)
    const { phone, user } = useAuth();

    // Load persisted fields from localStorage if present
    const persistedAccountNumber = localStorage.getItem('cd_accountNumber') || '';
    const persistedAccountHolderName = localStorage.getItem('cd_accountHolderName') || '';
    const persistedDepositedBy = localStorage.getItem('cd_depositedBy') || '';
    const persistedTelephoneNumber = localStorage.getItem('cd_telephoneNumber') || (phone || '');

    const [formData, setFormData] = useState<FormData>({
        accountNumber: persistedAccountNumber,
        accountHolderName: persistedAccountHolderName,
        accountType: 'Savings',
        amount: '',
        amountInWords: '',
        sourceOfProceeds: '',
        denominations: '',
        depositedBy: persistedDepositedBy,
        telephoneNumber: persistedTelephoneNumber
    });

    // For account selection
    const [accounts, setAccounts] = useState<any[]>([]);
    const [accountDropdown, setAccountDropdown] = useState(false);
    const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);

    // Fetch accounts for customer (OTPLogin) or staff (StaffLogin)
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                // 1) Prefer accounts from OTP login (localStorage)
                const cached = localStorage.getItem('customerAccounts');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const hasUnmasked = parsed.every((acc: any) => acc.accountNumber || acc.AccountNumber);
                        if (hasUnmasked) {
                            const normalized = parsed.map((acc: any) => ({
                                accountNumber: acc.accountNumber || acc.AccountNumber,
                                accountHolderName: acc.accountHolderName || acc.AccountHolderName || acc.name,
                                typeOfAccount: acc.typeOfAccount || acc.TypeOfAccount,
                            }));
                            setAccounts(normalized);
                            if (normalized.length === 1 && normalized[0].accountNumber) {
                                const a = normalized[0];
                                setFormData((prev: FormData) => {
                                    const updated = {
                                        ...prev,
                                        accountNumber: a.accountNumber,
                                        accountHolderName: a.accountHolderName || '',
                                        accountType: (a.typeOfAccount || prev.accountType) as any,
                                        depositedBy: a.accountHolderName || '',
                                        telephoneNumber: phone || ''
                                    };
                                    localStorage.setItem('cd_accountNumber', updated.accountNumber);
                                    localStorage.setItem('cd_accountHolderName', updated.accountHolderName);
                                    localStorage.setItem('cd_accountType', updated.accountType);
                                    localStorage.setItem('cd_depositedBy', updated.depositedBy);
                                    localStorage.setItem('cd_telephoneNumber', updated.telephoneNumber);
                                    return updated;
                                });
                                setAccountDropdown(false);
                            } else if (normalized.length > 1) {
                                setAccountDropdown(true);
                                setFormData((prev: FormData) => ({
                                    ...prev,
                                    accountNumber: '',
                                    accountHolderName: '',
                                    depositedBy: '',
                                    telephoneNumber: phone || ''
                                }));
                            }
                            return;
                        }
                        // If cached accounts are masked (AccountNumberMasked), fall through to backend fetch
                    }
                }

                // 2) Fallback to backend fetch by phone
                if (!phone) {
                    setAccounts([]);
                    setAccountDropdown(false);
                    return;
                }
                const resp = await fetch(`${API_BASE_URL}/Accounts/by-phone/${phone}`);
                if (resp.status === 200) {
                    const payload = await resp.json();
                    const data = payload.data ?? payload;
                    const normalized = (data || []).map((acc: any) => ({
                        accountNumber: acc.accountNumber || acc.AccountNumber,
                        accountHolderName: acc.accountHolderName || acc.AccountHolderName || acc.name,
                        typeOfAccount: acc.typeOfAccount || acc.TypeOfAccount,
                        accountNumberMasked: acc.accountNumberMasked || acc.AccountNumberMasked,
                    }));
                    setAccounts(normalized);
                    if (normalized.length === 1) {
                        const a = normalized[0];
                        setFormData((prev: FormData) => {
                            const updated = {
                                ...prev,
                                accountNumber: a.accountNumber,
                                accountHolderName: a.accountHolderName || '',
                                accountType: (a.typeOfAccount || prev.accountType) as any,
                                depositedBy: a.accountHolderName || '',
                                telephoneNumber: phone || ''
                            };
                            localStorage.setItem('cd_accountNumber', updated.accountNumber);
                            localStorage.setItem('cd_accountHolderName', updated.accountHolderName);
                            localStorage.setItem('cd_accountType', updated.accountType);
                            localStorage.setItem('cd_depositedBy', updated.depositedBy);
                            localStorage.setItem('cd_telephoneNumber', updated.telephoneNumber);
                            return updated;
                        });
                        setAccountDropdown(false);
                    } else if (normalized.length > 1) {
                        setAccountDropdown(true);
                        setFormData((prev: FormData) => ({
                            ...prev,
                            accountNumber: '',
                            accountHolderName: '',
                            depositedBy: '',
                            telephoneNumber: phone || ''
                        }));
                    }
                } else {
                    setAccounts([]);
                    setAccountDropdown(false);
                }
            } catch (err) {
                setAccounts([]);
                setAccountDropdown(false);
            }
        };
        fetchAccounts();
    }, [phone, user]);

    // Fetch account types once
    useEffect(() => {
        getAccountTypes()
            .then((types) => setAccountTypes(types))
            .catch(() => setAccountTypes([]));
    }, []);

    const [errors, setErrors] = useState<Errors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const navigate = useNavigate();


    // For now, always use Abiy Branch for demo, but this can be dynamic
    const ABIY_BRANCH_ID = 'a3d3e1b5-8c9a-4c7c-a1e3-6b3d8f4a2b2c';
    const branchInfo = {
        name: 'Ayer Tena',
        id: 'AB-1',
        date: new Date().toLocaleDateString(),
    };

    // Window state
    const [windowNumber, setWindowNumber] = useState<string>('');

    useEffect(() => {
        // Fetch windows for the branch (Abiy Branch for now)
        fetchWindowsByBranch(ABIY_BRANCH_ID)
            .then((windows: WindowType[]) => {
                if (windows && windows.length > 0) {
                    setWindowNumber(windows[0].windowNumber.toString());
                } else {
                    setWindowNumber('');
                }
            })
            .catch(() => setWindowNumber(''));
    }, []);

    // Handle input changes
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: FormData) => {
            const updated = { ...prev, [name]: value };
            // Persist relevant fields
            if (["accountNumber", "accountHolderName", "depositedBy", "telephoneNumber"].includes(name)) {
                localStorage.setItem(`cd_${name}`, value);
            }
            return updated;
        });
        // Auto-fill amount in words
        if (name === "amount") {
            setFormData((prev: FormData) => ({
                ...prev,
                amount: value,
                amountInWords: numberToWords(Number(value))
            }));
        }
        // If accountNumber is changed via dropdown, update holder name and depositedBy
        if (name === "accountNumber" && accounts.length > 0) {
            const selected = accounts.find(acc => acc.accountNumber === value);
            setFormData((prev: FormData) => {
                const updated = {
                    ...prev,
                    accountHolderName: selected ? (selected.accountHolderName || selected.name || '') : '',
                    accountType: selected ? ((selected.typeOfAccount || selected.TypeOfAccount || prev.accountType) as any) : prev.accountType,
                    depositedBy: selected ? (selected.accountHolderName || selected.name || '') : '',
                    telephoneNumber: phone || ''
                };
                // Persist
                localStorage.setItem('cd_accountHolderName', updated.accountHolderName);
                localStorage.setItem('cd_accountType', updated.accountType);
                localStorage.setItem('cd_depositedBy', updated.depositedBy);
                localStorage.setItem('cd_telephoneNumber', updated.telephoneNumber);
                return updated;
            });
        }
    };

    // Backend account validation (calls your API)
    const validateAccount = async () => {
        if (!formData.accountNumber || formData.accountNumber.length < 7) {
            setErrors((prev: Errors) => ({ ...prev, accountNumber: 'Account number must be at least 7 digits.' }));
            setFormData((prev: FormData) => ({ ...prev, accountHolderName: '' }));
            return false;
        }
        setIsSearching(true);
        try {
            const resp = await fetch(`/api/Accounts/AccountNumExist/${formData.accountNumber}`);
            console.log('Account check response status:', resp.status);
            if (resp.status === 200) {
                let account;
                try {
                    account = await resp.json();
                } catch (jsonErr) {
                    console.error('JSON parse error:', jsonErr);
                    setErrors((prev: Errors) => ({ ...prev, accountNumber: 'Invalid server response.' }));
                    setIsSearching(false);
                    return false;
                }
                setFormData((prev: FormData) => ({
                    ...prev,
                    accountHolderName: account.accountHolderName || account.name || ''
                }));
                setErrors((prev: Errors) => ({ ...prev, accountNumber: undefined }));
                setIsSearching(false);
                return true;
            } else if (resp.status === 404) {
                setFormData((prev: FormData) => ({ ...prev, accountHolderName: '' }));
                setErrors((prev: Errors) => ({ ...prev, accountNumber: 'Account not found.' }));
                setIsSearching(false);
                return false;
            } else {
                // Log the response text for debugging
                const errorText = await resp.text();
                console.error('Unexpected response:', resp.status, errorText);
                setFormData((prev: FormData) => ({ ...prev, accountHolderName: '' }));
                setErrors((prev: Errors) => ({ ...prev, accountNumber: `Account check failed: ${resp.status}` }));
                setIsSearching(false);
                return false;
            }
        } catch (err) {
            console.error('Network or processing error:', err);
            setFormData((prev: FormData) => ({ ...prev, accountHolderName: '' }));
            setErrors((prev: Errors) => ({ ...prev, accountNumber: 'An error occurred during account check.' }));
            setIsSearching(false);
            return false;
        }
    };

    // Validate all required fields
    const validateAll = (): boolean => {
        let errs: Errors = {};
        if (!formData.accountNumber) errs.accountNumber = "Account number is required.";
        if (!formData.accountHolderName) errs.accountHolderName = "Validate account number.";
        if (!formData.amount) errs.amount = "Amount is required.";
        if (formData.amount && Number(formData.amount) <= 0) errs.amount = "Amount must be positive.";
        if (!formData.sourceOfProceeds) errs.sourceOfProceeds = "Source of proceeds is required.";
        if (!formData.depositedBy) errs.depositedBy = "Depositor name required.";
        if (!formData.telephoneNumber) errs.telephoneNumber = "Phone number required.";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateAll()) return;

        setIsSubmitting(true);

        try {
            // Always use Abiy Branch for now
            const branchGuid = ABIY_BRANCH_ID;
            // Generate a unique formKey for each submission
            const depositData = {
                formKey: Date.now().toString(),
                branchId: branchGuid,
                accountHolderName: formData.accountHolderName,
                accountNumber: formData.accountNumber,
                typeOfAccount: formData.accountType,
                amount: Number(formData.amount),
                amountInWords: formData.amountInWords,
                DepositedBy: formData.depositedBy,
                sourceOfProceeds: formData.sourceOfProceeds,
                telephoneNumber: formData.telephoneNumber,
            };

            const response = await depositService.submitDeposit(depositData);
            setIsSubmitting(false);

            navigate('/form/cash-deposit/cashdepositconfirmation', {
                state: {
                    serverData: response,
                    // Optionally, keep UI fallback fields if needed:
                    formType: 'Cash Deposit',
                    referenceId: response.depositId ? `CD-${response.depositId}` : `CD-${Date.now()}`,
                    accountNumber: formData.accountNumber,
                    amount: formData.amount,
                    branch: branchInfo.name,
                    token: Math.floor(1000 + Math.random() * 9000),
                    window: windowNumber || 'N/A',
                    message: response.message,
                }
            });
        } catch (error: any) {
            setIsSubmitting(false);
            alert(error?.message || error?.Message || error);
        }
    };

    return (
        <div className="min-h-screen bg-[#faf6e9] p-4 md:p-8">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-fuchsia-200">
                <div className="bg-fuchsia-700 p-6 text-white">
                    <h1 className="text-2xl font-bold">Cash Deposit Form</h1>
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-fuchsia-100">Branch: {branchInfo.name} ({branchInfo.id})</p>
                        <p className="text-fuchsia-100">{branchInfo.date}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-7">
                    {/* Branch Selection hidden for testing; always uses Abiy Branch */}
                    {/* Account Section */}
                    <div className="space-y-4 p-4 bg-fuchsia-100 rounded-lg border border-fuchsia-200">
                        <h2 className="text-lg font-semibold text-fuchsia-800">Account Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-fuchsia-700 mb-1">
                                    Account Number <span className="text-red-500">*</span>
                                </label>
                                <div className="flex">
                                    {accountDropdown ? (
                                        <select
                                            name="accountNumber"
                                            value={formData.accountNumber}
                                            onChange={handleChange}
                                            className={`flex-1 rounded-lg border ${errors.accountNumber ? "border-red-400" : "border-fuchsia-300"} focus:ring-2 focus:ring-fuchsia-700 p-2`}
                                        >
                                            <option value="">Select account</option>
                                            {accounts.map(acc => (
                                                <option key={acc.accountNumber} value={acc.accountNumber}>
                                                    {acc.accountNumber} - {acc.accountHolderName || acc.name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            name="accountNumber"
                                            value={formData.accountNumber}
                                            onChange={handleChange}
                                            className={`flex-1 rounded-lg border ${errors.accountNumber ? "border-red-400" : "border-fuchsia-300"} focus:ring-2 focus:ring-fuchsia-700 p-2`}
                                            placeholder="Enter account number"
                                            readOnly={accounts.length === 1}
                                        />
                                    )}
                                </div>
                                {errors.accountNumber &&
                                    <p className="mt-1 text-xs text-red-600">{errors.accountNumber}</p>
                                }
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-fuchsia-700 mb-1">
                                    Account Holder Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="accountHolderName"
                                    value={formData.accountHolderName}
                                    readOnly
                                    className="w-full rounded-lg border border-fuchsia-300 bg-fuchsia-50 p-2"
                                    placeholder="Auto-filled after CBS validation"
                                />
                                {errors.accountHolderName &&
                                    <p className="mt-1 text-xs text-red-600">{errors.accountHolderName}</p>
                                }
                            </div>
                        </div>
                        {/* Account type */}
                        <div>
                            <label className="block text-sm font-medium text-fuchsia-700 mb-1">Type of Account <span className="text-red-500">*</span></label>
                            <div>
                                <select
                                    name="accountType"
                                    value={formData.accountType}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 p-2"
                                >
                                    <option value="">Search or select type...</option>
                                    {accountTypes.map((t) => (
                                        <option key={t.id} value={t.name}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Amount Info */}
                    <div className="space-y-4 p-4 bg-fuchsia-100 rounded-lg border border-fuchsia-200">
                        <h2 className="text-lg font-semibold text-fuchsia-800">Amount Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-fuchsia-700 mb-1">
                                    Amount in Figure <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className={`w-full rounded-lg border ${errors.amount ? "border-red-400" : "border-fuchsia-300"} focus:ring-2 focus:ring-fuchsia-500 p-2`}
                                    placeholder="Enter amount"
                                />
                                {errors.amount &&
                                    <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
                                }
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-fuchsia-700 mb-1">
                                    Amount in Words
                                </label>
                                <input
                                    type="text"
                                    name="amountInWords"
                                    value={formData.amountInWords}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 p-2"
                                    placeholder="Auto-filled"
                                    readOnly
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-fuchsia-700 mb-1">
                                Source of Proceeds <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="sourceOfProceeds"
                                value={formData.sourceOfProceeds}
                                onChange={handleChange}
                                className={`w-full rounded-lg border ${errors.sourceOfProceeds ? "border-red-400" : "border-fuchsia-300"} focus:ring-2 focus:ring-fuchsia-500 p-2`}
                                placeholder="Source of funds"
                            />
                            {errors.sourceOfProceeds &&
                                <p className="mt-1 text-xs text-red-600">{errors.sourceOfProceeds}</p>
                            }
                        </div>
                        {/* Denomination removed for customer-facing form */}
                    </div>

                    {/* Depositor Info */}
                    <div className="space-y-4 p-4 bg-fuchsia-100 rounded-lg border border-fuchsia-200">
                        <h2 className="text-lg font-semibold text-fuchsia-800">Depositor Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-fuchsia-700 mb-1">
                                    Deposited By <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="depositedBy"
                                    value={formData.depositedBy}
                                    onChange={handleChange}
                                    className={`w-full rounded-lg border ${errors.depositedBy ? "border-red-400" : "border-fuchsia-300"} focus:ring-2 focus:ring-fuchsia-500 p-2`}
                                    placeholder="Name of depositor"
                                />
                                {errors.depositedBy &&
                                    <p className="mt-1 text-xs text-red-600">{errors.depositedBy}</p>
                                }
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-fuchsia-700 mb-1">
                                    Telephone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="telephoneNumber"
                                    value={formData.telephoneNumber}
                                    readOnly
                                    className={`w-full rounded-lg border ${errors.telephoneNumber ? "border-red-400" : "border-fuchsia-300"} focus:ring-2 focus:ring-fuchsia-500 p-2 bg-fuchsia-50`}
                                    placeholder="Phone number"
                                />
                                {errors.telephoneNumber &&
                                    <p className="mt-1 text-xs text-red-600">{errors.telephoneNumber}</p>
                                }
                            </div>
                        </div>
                    </div>

                    {/* Note & Submit */}
                    <div className="pt-4 border-t border-fuchsia-200">
                        <div className="bg-fuchsia-100 p-4 rounded-lg mb-4">
                            <p className="text-sm text-fuchsia-700">
                                <strong>Note:</strong> This deposit form is not a receipt. Please collect an official receipt or check for digital receipt sent via SMS after transaction processing.
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-fuchsia-700 hover:bg-fuchsia-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-200 disabled:opacity-70"
                        >
                            {isSubmitting ? 'Processing...' : 'Submit Deposit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}