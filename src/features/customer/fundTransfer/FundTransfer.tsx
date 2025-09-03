import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Field } from '../accountOpening/components/FormElements';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { validateAccountWithCBS, sendFundTransferOTP, submitFundTransfer } from '../../../services/fundTransferService';
import { useUserAccounts } from '../../../hooks/useUserAccounts'; // Import the new hook

const API_BASE_URL = 'http://localhost:5268/api';

// Removed numberToWords helper as amountInWords is no longer used

export default function FundTransfer() {
    const { phone } = useAuth();
    const navigate = useNavigate();
    const { accounts, accountDropdown, loadingAccounts, errorAccounts } = useUserAccounts();

    const [formData, setFormData] = useState({
        debitAccountNumber: '',
        debitAccountName: '',
        amount: '',
        creditAccountNumber: '',
        creditAccountName: '',
        otp: '',
        // remark: '', // Optional, commented out
        // amountInWords: '', // Optional, commented out
    });
    const [errors, setErrors] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);

    const branchInfo = { name: 'Ayer Tena Branch', id: 'd9b1c3f7-4b05-44d3-b58e-9c5a5b4b90f6', date: new Date().toLocaleDateString() };

    useEffect(() => {
        if (!loadingAccounts && accounts.length > 0) {
            if (accounts.length === 1) {
                setFormData(prev => ({
                    ...prev,
                    debitAccountNumber: accounts[0].accountNumber,
                    debitAccountName: accounts[0].accountHolderName,
                }));
            }
        }
    }, [accounts, loadingAccounts]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let updated = { ...formData, [name]: value };
        if (name === 'debitAccountNumber') {
            const selected = accounts.find(acc => acc.accountNumber === value);
            if (selected) updated.debitAccountName = selected.accountHolderName || '';
        }
        setFormData(updated);
    };

    const validateCreditAccount = async () => {
        if (formData.debitAccountNumber === formData.creditAccountNumber) {
            setErrors({ creditAccountNumber: 'Beneficiary account must be different.' });
            return;
        }
        setIsLoading(true);
        setErrors({});
        try {
            const resp = await fetch(`${API_BASE_URL}/Accounts/AccountNumExist/${formData.creditAccountNumber}`);
            if (resp.ok) {
                const account = await resp.json();
                setFormData(prev => ({ ...prev, creditAccountName: account.data.accountHolderName || account.data.name || '' }));
            } else {
                setErrors({ creditAccountNumber: 'Beneficiary account not found.' });
            }
        } catch (err) { setErrors({ creditAccountNumber: 'Error validating account.' }); }
        setIsLoading(false);
    };

    const validateAll = (): boolean => {
        const errs: any = {};
        if (!formData.debitAccountNumber) errs.debitAccountNumber = 'Account is required.';
        if (!formData.debitAccountName) errs.debitAccountName = 'Account holder name is required.';
        if (!formData.creditAccountNumber) errs.creditAccountNumber = 'Beneficiary account is required.';
        if (!formData.amount || Number(formData.amount) <= 0) errs.amount = 'A valid amount is required.';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleStep1Next = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!validateAll()) return;
        if (!formData.creditAccountName) {
            await validateCreditAccount();
        }
        if (formData.debitAccountNumber && formData.creditAccountNumber && formData.amount && formData.creditAccountName) {
            setIsLoading(true);
            try {
                await sendFundTransferOTP(phone || '');
                setStep(2);
            } catch (err: any) { setErrors({ otp: err?.response?.data?.message || 'Failed to send OTP' }); }
            setIsLoading(false);
        }
    };

    const verifyOTP = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (formData.otp.length !== 6) {
            setErrors({ otp: 'OTP must be 6 digits.' });
            return;
        }
        setErrors({});
        setStep(3);
    };

    const submitTransfer = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        setErrors({});
        try {
            const payload = { ...formData, phoneNumber: phone || '', branchId: branchInfo.id };
            const res = await submitFundTransfer(payload);
            navigate('/fund-transfer-confirmation', { state: { ...res, ...formData } });
        } catch (err: any) { setErrors({ submit: err?.response?.data?.message || 'Submission failed' }); }
        setIsLoading(false);
    };

    const renderStep1 = () => (
        <form onSubmit={handleStep1Next} className="space-y-6">
            <div className="p-4 border rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-fuchsia-700 mb-4">Account Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Account Number" required error={errors.debitAccountNumber}>
                        {accountDropdown ? (
                            <select name="debitAccountNumber" value={formData.debitAccountNumber} onChange={handleChange} className="form-select w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors bg-white shadow-sm">
                                <option value="">Select your account</option>
                                {accounts.map(acc => <option key={acc.accountNumber} value={acc.accountNumber}>{acc.accountNumber} - {acc.accountHolderName}</option>)}
                            </select>
                        ) : (
                            <input type="text" name="debitAccountNumber" value={formData.debitAccountNumber} onChange={handleChange} readOnly={accounts.length === 1} className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm" />
                        )}
                    </Field>
                    <Field label="Account Holder Name" required error={errors.debitAccountName}>
                        <input type="text" name="debitAccountName" value={formData.debitAccountName} readOnly className="form-input w-full p-2 rounded-lg border-2 border-gray-300 bg-gray-100 cursor-not-allowed" />
                    </Field>
                </div>
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-fuchsia-700 mb-4">Beneficiary Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Beneficiary Account Number" required error={errors.creditAccountNumber}>
                        <div className="flex">
                            <input type="text" name="creditAccountNumber" value={formData.creditAccountNumber} onChange={handleChange} onBlur={validateCreditAccount} className="form-input w-full p-2 rounded-l-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500" />
                            <button type="button" onClick={validateCreditAccount} disabled={isLoading} className="bg-fuchsia-600 text-white px-4 rounded-r-lg hover:bg-fuchsia-700 disabled:bg-fuchsia-300">{isLoading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : 'Verify'}</button>
                        </div>
                    </Field>
                    <Field label="Beneficiary Name" required error={errors.creditAccountName}>
                        <input type="text" name="creditAccountName" value={formData.creditAccountName} readOnly className="form-input w-full p-2 rounded-lg border-2 border-gray-300 bg-gray-100 cursor-not-allowed" />
                    </Field>
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
                    </Field> // Commented out */}
                </div>
            </div>
            {/* <div className="p-4 border rounded-lg shadow-sm"> // Commented out
                <h2 className="text-xl font-semibold text-fuchsia-700 mb-4">Remark</h2> // Commented out
                <Field label="Remark (Optional)"> // Commented out
                    <textarea name="remark" value={formData.remark} onChange={handleChange} rows={2} className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500" /> // Commented out
                </Field> // Commented out
            </div> // Commented out */}
            <div className="pt-4">
                <button type="submit" disabled={isLoading || !formData.creditAccountName} className="w-full bg-fuchsia-700 hover:bg-fuchsia-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition disabled:opacity-50">
                    {isLoading ? 'Verifying...' : 'Continue'}
                </button>
            </div>
        </form>
    );

    const renderStep2 = () => (
        <form onSubmit={verifyOTP} className="text-center space-y-6">
            <p className="text-gray-600">An OTP has been sent to your registered phone number: <strong className="text-fuchsia-800">{phone}</strong></p>
            <Field label="Enter 6-Digit OTP" required error={errors.otp}>
                <input type="text" name="otp" value={formData.otp} onChange={handleChange} maxLength={6} className="form-input w-full p-4 text-center text-2xl tracking-widest rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500" />
            </Field>
            <div className="flex gap-4">
                <button type="button" onClick={() => setStep(1)} className="w-full bg-gray-200 text-fuchsia-800 font-bold py-3 px-4 rounded-lg shadow-md hover:bg-gray-300 transition">Back</button>
                <button type="submit" disabled={formData.otp.length !== 6} className="w-full bg-fuchsia-700 hover:bg-fuchsia-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition disabled:opacity-50">
                    Verify & Proceed
                </button>
            </div>
        </form>
    );

    const renderStep3 = () => (
        <form onSubmit={submitTransfer} className="space-y-6">
            <h3 className="text-2xl font-bold text-fuchsia-800 text-center">Review Your Transfer</h3>
            <div className="space-y-2 text-gray-700 bg-gray-50 p-4 rounded-lg shadow-inner">
                <div className="flex justify-between"><strong className="font-medium">From:</strong> <span>{formData.debitAccountName} ({formData.debitAccountNumber})</span></div>
                <div className="flex justify-between"><strong className="font-medium">To:</strong> <span>{formData.creditAccountName} ({formData.creditAccountNumber})</span></div>
                <div className="flex justify-between items-center"><strong className="font-medium">Amount:</strong> <span className="font-bold text-2xl text-fuchsia-800">{Number(formData.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB</span></div>
                {/* Removed remark display as field is no longer present */}
            </div>
            <div className="flex gap-4">
                <button type="button" onClick={() => setStep(2)} className="w-full bg-gray-200 text-fuchsia-800 font-bold py-3 px-4 rounded-lg shadow-md hover:bg-gray-300 transition">Back</button>
                <button type="submit" disabled={isLoading} className="w-full bg-fuchsia-700 hover:bg-fuchsia-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition disabled:opacity-50">
                    {isLoading ? <><ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />Processing...</> : 'Confirm & Transfer'}
                </button>
            </div>
        </form>
    );

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <div className="text-center mb-8 bg-fuchsia-700 text-white p-4 rounded-lg shadow-lg">
                <h1 className="text-3xl font-extrabold text-white">Fund Transfer</h1>
                <p className="text-white mt-1">{branchInfo.name} - {branchInfo.date}</p>
            </div>
            {errors.submit && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{errors.submit}</div>}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
        </div>
    );
}
