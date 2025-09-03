import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Field } from '../accountOpening/components/FormElements';
// Removed duplicate import
import { useUserAccounts } from '../../../hooks/useUserAccounts'; // Import the new hook
import authService from '../../../services/authService';

// Removed unused API_BASE_URL

type FormData = {
    accountNumber: string;
    accountHolderName: string;
    amount: string;
    otp: string;
};

type Errors = Partial<Record<keyof FormData, string>> & { message?: string; otp?: string };

export default function CashWithdrawalForm() {
    const navigate = useNavigate();
    const { phone } = useAuth();
    const { accounts, accountDropdown, loadingAccounts } = useUserAccounts();
    const [formData, setFormData] = useState<FormData>({
        accountNumber: '',
        accountHolderName: '',
        amount: '',
        otp: '',
    });
    const [errors, setErrors] = useState<Errors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState('');
    const [otpError, setOtpError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendTimer, setResendTimer] = useState<NodeJS.Timeout | null>(null);
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
    }, [accounts, loadingAccounts]); // Added dependency array for useEffect to prevent infinite loop

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
    }; // Added closing curly brace for handleChange function

    const validateAll = (): boolean => {
        const errs: Errors = {};
        if (!formData.accountNumber) errs.accountNumber = "Account number is required.";
        if (!formData.accountHolderName) errs.accountHolderName = "Account holder name is required.";
        if (!formData.amount || Number(formData.amount) <= 0) errs.amount = "A valid amount is required.";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Step 1: Request OTP from backend
    const handleStep1Next = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAll()) return;
        setOtpError('');
        setOtpMessage('');
        setOtpLoading(true);
        setErrors({});
        if (!phone) {
            setOtpError('Phone number is missing. Please log in again.');
            setOtpLoading(false);
            return;
        }
        try {
            // Use backend OTP request (like OTPLogin)
            const response = await authService.requestOtp(phone);
            setOtpMessage(response.message || 'OTP sent to your phone.');
            setStep(2);
            // Start resend cooldown
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
        } catch (err: any) {
            setOtpError(err?.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setOtpLoading(false);
        }
    };

    // Step 2: Proceed to confirmation after entering OTP (no frontend validation)
    const handleStep2Next = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.otp || formData.otp.length !== 6) {
            setErrors({ otp: 'Please enter the 6-digit OTP sent to your phone.' });
            return;
        }
        setErrors({});
        setStep(3);
    };

    // Step 3: Confirm and submit withdrawal (backend validates OTP)
    const handleSubmitWithdrawal = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});
        try {
            const withdrawalReq = {
                phoneNumber: phone,
                branchId: ABIY_BRANCH_ID,
                accountNumber: formData.accountNumber,
                accountHolderName: formData.accountHolderName,
                withdrawal_Amount: Number(formData.amount),
                OtpCode: formData.otp,
            };
            // Backend will validate OTP here
            navigate('/form/cash-withdrawal/cashwithdrawalconfirmation', { state: { pending: true, requestPayload: withdrawalReq, ui: { ...formData } } });
        } catch (err: any) {
            setErrors({ message: err?.message || 'Failed to submit withdrawal.' });
        } finally {
            setIsLoading(false);
        }
    };

    // Step 1 UI
    const renderStep1 = () => (
        <form onSubmit={handleStep1Next} className="space-y-6">
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
                    {isLoading ? 'Processing...' : 'Continue'}
                </button>
            </div>
        </form>
    ); // Removed the extra closing parenthesis that was here.

    // Step 2 UI
    const renderStep2 = () => (
        <form onSubmit={handleStep2Next} className="space-y-6 text-center">
            <div className="p-4 border rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-fuchsia-700 mb-4">OTP Verification</h2>
                <p className="text-gray-600 mb-2">An OTP has been sent to your phone number: <strong className="text-fuchsia-800">{phone}</strong></p>
                {otpMessage && <p className="text-green-600 mb-2">{otpMessage}</p>}
                {otpError && <p className="text-red-600 mb-2">{otpError}</p>}
                <Field label="Enter OTP" required error={errors.otp}>
                    <input type="text" name="otp" value={formData.otp} onChange={handleChange} maxLength={6} className="form-input w-full p-4 text-center text-2xl tracking-widest rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500" />
                </Field>
            </div>
            <div className="flex gap-4 items-center justify-between">
                <button type="button" onClick={() => setStep(1)} className="w-full bg-gray-200 text-fuchsia-800 font-bold py-3 px-4 rounded-lg shadow-md hover:bg-gray-300 transition">Back</button>
                <button type="button"
                    onClick={async () => {
                        if (resendCooldown === 0) {
                            setOtpError('');
                            setOtpMessage('');
                            setOtpLoading(true);
                            try {
                                if (!phone) {
                                    setOtpError('Phone number is missing. Please log in again.');
                                    setOtpLoading(false);
                                    return;
                                }
                                const response = await authService.requestOtp(phone);
                                setOtpMessage(response.message || 'OTP resent.');
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
                            } catch (err: any) {
                                setOtpError(err?.response?.data?.message || 'Failed to resend OTP.');
                            } finally {
                                setOtpLoading(false);
                            }
                        }
                    }}
                    disabled={resendCooldown > 0 || otpLoading}
                    className="w-full bg-fuchsia-100 text-fuchsia-700 font-bold py-3 px-4 rounded-lg shadow-md hover:bg-fuchsia-200 transition disabled:opacity-50">
                    {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
                </button>
                <button type="submit" disabled={formData.otp.length !== 6 || otpLoading} className="w-full bg-fuchsia-700 hover:bg-fuchsia-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition disabled:opacity-50">Verify & Proceed</button>
            </div>
        </form>
    );

    // Step 3 UI
    const renderStep3 = () => (
        <form onSubmit={handleSubmitWithdrawal} className="space-y-6 text-center">
            <div className="p-4 border rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-fuchsia-700 mb-4">Confirm Withdrawal</h2>
                <div className="space-y-2 text-gray-700 bg-gray-50 p-4 rounded-lg shadow-inner">
                    <div className="flex justify-between"><strong className="font-medium">Account:</strong> <span>{formData.accountHolderName} ({formData.accountNumber})</span></div>
                    <div className="flex justify-between items-center"><strong className="font-medium">Amount:</strong> <span className="font-bold text-2xl text-fuchsia-800">{Number(formData.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB</span></div>
                </div>
            </div>
            <div className="flex gap-4">
                <button type="button" onClick={() => setStep(2)} className="w-full bg-gray-200 text-fuchsia-800 font-bold py-3 px-4 rounded-lg shadow-md hover:bg-gray-300 transition">Back</button>
                <button type="submit" disabled={isLoading} className="w-full bg-fuchsia-700 hover:bg-fuchsia-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition disabled:opacity-50">{isLoading ? 'Processing...' : 'Confirm & Withdraw'}</button>
            </div>
        </form>
    );

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (resendTimer) clearInterval(resendTimer);
        };
    }, [resendTimer]);

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <div className="text-center mb-8 bg-fuchsia-700 text-white p-4 rounded-lg shadow-lg">
                <h1 className="text-3xl font-extrabold text-white">Cash Withdrawal</h1>
                <p className="text-white mt-1">Ayer Tena Branch</p>
            </div>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
        </div>
    );
}