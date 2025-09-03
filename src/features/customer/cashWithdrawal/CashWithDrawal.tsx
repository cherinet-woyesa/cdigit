import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Field } from '../accountOpening/components/FormElements';
import { useUserAccounts } from '../../../hooks/useUserAccounts'; // Import the new hook

const API_BASE_URL = 'http://localhost:5268/api';

type FormData = {
    accountNumber: string;
    accountHolderName: string;
    amount: string;
};

type Errors = Partial<Record<keyof FormData, string>> & { message?: string; };

export default function CashWithdrawalForm() {
    const { phone } = useAuth();
    const navigate = useNavigate();
    const { accounts, accountDropdown, loadingAccounts, errorAccounts } = useUserAccounts();

    const [formData, setFormData] = useState<FormData>({
        accountNumber: '',
        accountHolderName: '',
        amount: '',
        // amountInWords: '', // Optional, commented out
    });
    const [errors, setErrors] = useState<Errors>({});
    const [isLoading, setIsLoading] = useState(false);
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };
        if (name === "accountNumber") {
            const selected = accounts.find(acc => acc.accountNumber === value);
            if (selected) {
                newFormData.accountHolderName = selected.accountHolderName || selected.name || '';
            }
        }
        setFormData(newFormData);
    };

    const validateAll = (): boolean => {
        const errs: Errors = {};
        if (!formData.accountNumber) errs.accountNumber = "Account number is required.";
        if (!formData.accountHolderName) errs.accountHolderName = "Account holder name is required.";
        if (!formData.amount || Number(formData.amount) <= 0) errs.amount = "A valid amount is required.";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmitWithdrawal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAll()) return;
        setIsLoading(true);
        setErrors({});
        try {
            const withdrawalReq = {
                phoneNumber: phone as string,
                branchId: ABIY_BRANCH_ID,
                accountNumber: formData.accountNumber,
                accountHolderName: formData.accountHolderName,
                withdrawal_Amount: Number(formData.amount),
            };
            navigate('/form/cash-withdrawal/cashwithdrawalconfirmation', { state: { pending: true, requestPayload: withdrawalReq, ui: { ...formData } } });
        } catch (err: any) {
            setErrors({ message: err?.message || 'Failed to submit withdrawal.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <div className="text-center mb-8 bg-fuchsia-700 text-white p-4 rounded-lg shadow-lg">
                <h1 className="text-3xl font-extrabold text-white">Cash Withdrawal</h1>
                <p className="text-white mt-1">Ayer Tena Branch</p>
            </div>
            <form onSubmit={handleSubmitWithdrawal} className="space-y-6">
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
                    </div>
                </div>
                <div className="p-4 border rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold text-fuchsia-700 mb-4">Amount Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Amount" required error={errors.amount}>
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm" />
                        </Field>
                    </div>
                </div>
                <div className="pt-4">
                    <button type="submit" disabled={isLoading} className="w-full bg-fuchsia-700 hover:bg-fuchsia-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition transform duration-200 hover:scale-105 disabled:opacity-50">
                        {isLoading ? 'Processing...' : 'Submit Withdrawal'}
                    </button>
                </div>
            </form>
        </div>
    );
}
