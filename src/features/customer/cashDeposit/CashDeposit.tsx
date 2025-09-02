import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import depositService from '../../../services/depositService';
import { getAccountTypes, type AccountType } from '../../../services/accountTypeService';
import { Field } from '../accountOpening/components/FormElements'; // Adjusted path
import { useUserAccounts } from '../../../hooks/useUserAccounts'; // Import the new hook
import { fetchWindowsByBranch } from '../../../services/windowService';
import type { Window as WindowType } from '../../../services/windowService';

const API_BASE_URL = 'http://localhost:5268/api';

// Helper: simple number to words
// function numberToWords(num: number): string {
//     const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
//     const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
//     if (isNaN(num) || num === 0) return '';
//     if (num < 20) return a[num];
//     if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '');
//     if (num < 1000) return a[Math.floor(num / 100)] + ' hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
//     if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
//     return num.toString();
// }

type FormData = {
    accountNumber: string;
    accountHolderName: string;
    amount: string;
};

type Errors = Partial<Record<keyof FormData, string>>;

export default function CashDepositForm() {
    const { phone, user } = useAuth();
    const navigate = useNavigate();

    const { accounts, accountDropdown, loadingAccounts, errorAccounts } = useUserAccounts();

    const [formData, setFormData] = useState<FormData>({
        accountNumber: '',
        accountHolderName: '',
        amount: '',
    });

    // const [accountTypes, setAccountTypes] = useState<AccountType[]>([]); // Commented out
    const [errors, setErrors] = useState<Errors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    // const [windowNumber, setWindowNumber] = useState<string>(''); // Commented out

    const ABIY_BRANCH_ID = 'a3d3e1b5-8c9a-4c7c-a1e3-6b3d8f4a2b2c';

    useEffect(() => {
        if (!loadingAccounts && accounts.length > 0) {
            if (accounts.length === 1) {
                setFormData(prev => ({
                    ...prev,
                    accountNumber: accounts[0].accountNumber,
                    accountHolderName: accounts[0].accountHolderName,
                }));
            }
        }
    }, [accounts, loadingAccounts]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };

        // if (name === 'amount') { // Commented out
        //     newFormData.amountInWords = numberToWords(Number(value)); // Commented out
        // } // Commented out

        if (name === "accountNumber") {
            const selected = accounts.find(acc => acc.accountNumber === value);
            if (selected) {
                newFormData.accountHolderName = selected.accountHolderName || selected.name || '';
                // newFormData.accountType = selected.typeOfAccount || selected.TypeOfAccount || formData.accountType; // Commented out
                // newFormData.depositedBy = selected.accountHolderName || selected.name || ''; // Commented out
            }
        }

        setFormData(newFormData);

        // if (["accountNumber", "accountHolderName", "depositedBy", "telephoneNumber"].includes(name)) { // Commented out
        //     localStorage.setItem(`cd_${name}`, newFormData[name as keyof FormData]); // Commented out
        // } // Commented out
    };

    const validateAll = (): boolean => {
        const errs: Errors = {};
        if (!formData.accountNumber) errs.accountNumber = "Account number is required.";
        if (!formData.accountHolderName) errs.accountHolderName = "Account holder name is required.";
        if (!formData.amount || Number(formData.amount) <= 0) errs.amount = "A valid amount is required.";
        // if (!formData.sourceOfProceeds) errs.sourceOfProceeds = "Source of proceeds is required."; // Commented out
        // if (!formData.depositedBy) errs.depositedBy = "Depositor name is required."; // Commented out
        // if (!formData.telephoneNumber) errs.telephoneNumber = "Phone number is required."; // Commented out
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
                // typeOfAccount: formData.accountType, // Commented out
                amount: Number(formData.amount),
                // amountInWords: formData.amountInWords, // Commented out
                // DepositedBy: formData.depositedBy, // Commented out
                // sourceOfProceeds: formData.sourceOfProceeds, // Commented out
                // telephoneNumber: formData.telephoneNumber, // Commented out
            };

            const response = await depositService.submitDeposit(depositData);
            navigate('/form/cash-deposit/cashdepositconfirmation', { state: { serverData: response, ...formData, branchName: "Ayer Tena Branch" } });
        } catch (error: any) {
            alert(error?.message || 'Submission failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <div className="text-center mb-8 bg-fuchsia-700 text-white p-4 rounded-lg shadow-lg">
                <h1 className="text-3xl font-extrabold text-white">Cash Deposit</h1>
                <p className="text-white mt-1">Ayer Tena Branch</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-4 border rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-fuchsia-700 mb-4">Account Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Account Number" required error={errors.accountNumber}>
                            {accountDropdown ? (
                                <select name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="form-select w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors bg-white shadow-sm">
                                    <option value="">Select your account</option>
                                    {accounts.map(acc => <option key={acc.accountNumber} value={acc.accountNumber}>{acc.accountNumber} - {acc.accountHolderName}</option>)}
                                </select>
                            ) : (
                                <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} readOnly={accounts.length === 1} className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm" />
                            )}
                        </Field>
                        <Field label="Account Holder Name" required error={errors.accountHolderName}>
                            <input type="text" name="accountHolderName" value={formData.accountHolderName} readOnly className="form-input w-full p-2 rounded-lg border-2 border-gray-300 bg-gray-100 cursor-not-allowed" />
                        </Field>
                        {/* <Field label="Type of Account" required error={errors.accountType}> // Commented out
                            <select name="accountType" value={formData.accountType} onChange={handleChange} className="form-select w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors bg-white shadow-sm"> // Commented out
                                {accountTypes.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)} // Commented out
                            </select> // Commented out
                        </Field> */}
                    </div>
                </div>

                <div className="p-4 border rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-fuchsia-700 mb-4">Amount Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Amount" required error={errors.amount}>
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm" />
                        </Field>
                        {/* <Field label="Amount in Words"> // Commented out
                            <input type="text" name="amountInWords" value={formData.amountInWords} readOnly className="form-input w-full p-2 rounded-lg border-2 border-gray-300 bg-gray-100 cursor-not-allowed" /> // Commented out
                        </Field> // Commented out
                        <Field label="Source of Proceeds" required error={errors.sourceOfProceeds}> // Commented out
                            <input type="text" name="sourceOfProceeds" value={formData.sourceOfProceeds} onChange={handleChange} className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm" /> // Commented out
                        </Field> // Commented out */}
                    </div>
                </div>

                {/* <div className="p-4 border rounded-lg shadow-sm"> // Commented out
                    <h2 className="text-xl font-semibold text-fuchsia-700 mb-4">Depositor Information</h2> // Commented out
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> // Commented out
                        <Field label="Deposited By" required error={errors.depositedBy}> // Commented out
                            <input type="text" name="depositedBy" value={formData.depositedBy} onChange={handleChange} className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm" /> // Commented out
                        </Field> // Commented out
                        <Field label="Telephone Number" required error={errors.telephoneNumber}> // Commented out
                            <input type="tel" name="telephoneNumber" value={formData.telephoneNumber} readOnly className="form-input w-full p-2 rounded-lg border-2 border-gray-300 bg-gray-100 cursor-not-allowed" /> // Commented out
                        </Field> // Commented out
                    </div> // Commented out
                </div> // Commented out */}

                <div className="pt-4">
                    <button type="submit" disabled={isSubmitting} className="w-full bg-fuchsia-700 hover:bg-fuchsia-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition transform duration-200 hover:scale-105 disabled:opacity-50">
                        {isSubmitting ? 'Processing...' : 'Submit Deposit'}
                    </button>
                </div>
            </form>
        </div>
    );
}
