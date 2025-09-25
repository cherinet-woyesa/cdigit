import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import Field from '../../../../components/Field';
import { useUserAccounts } from '../../../../hooks/useUserAccounts';
import { requestWithdrawalOtp, submitWithdrawal } from '../../../../services/withdrawalService';
import authService from '../../../../services/authService';
import { useTranslation } from 'react-i18next';
import { SpeakerWaveIcon } from '@heroicons/react/24/solid';

type FormData = {
    accountNumber: string;
    accountHolderName: string;
    amount: string;
    otp: string;
};

type Errors = Partial<Record<keyof FormData, string>> & { message?: string; otp?: string };

export default function CashWithdrawalForm() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { state } = useLocation() as { state?: any };
    const { phone, token } = useAuth();
    const { accounts, accountDropdown, loadingAccounts } = useUserAccounts();
    const [formData, setFormData] = useState<FormData>({
        accountNumber: '',
        accountHolderName: '',
        amount: '',
        otp: '',
    });
    const [errors, setErrors] = useState<Errors>({});
    const [step, setStep] = useState(1);
    const [updateId, setUpdateId] = useState<string | null>(null);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState('');
    const [otpError, setOtpError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendTimer, setResendTimer] = useState<NodeJS.Timeout | null>(null);
    const ABIY_BRANCH_ID = 'a3d3e1b5-8c9a-4c7c-a1e3-6b3d8f4a2b2c';

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new window.SpeechSynthesisUtterance(text);
            utterance.lang = i18n.language === 'am' ? 'am-ET' : 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    };

    useEffect(() => {
        if (state?.updateId) {
            setUpdateId(state.updateId as string);
            const fd = state.formData || {};
            setFormData(prev => ({
                ...prev,
                accountNumber: fd.accountNumber || prev.accountNumber,
                accountHolderName: fd.accountHolderName || prev.accountHolderName,
                amount: String(fd.amount ?? prev.amount),
            }));
            setStep(2); 
        }
        if (!loadingAccounts && accounts.length > 0) {
            const saved = localStorage.getItem('selectedWithdrawalAccount');
            if (saved) {
                const acc = accounts.find(a => a.accountNumber === saved);
                if (acc) {
                    setFormData(prev => ({
                        ...prev,
                        accountNumber: acc.accountNumber,
                        accountHolderName: acc.accountHolderName,
                    }));
                    return;
                }
            }
            if (accounts.length === 1) {
                setFormData(prev => ({
                    ...prev,
                    accountNumber: accounts[0].accountNumber,
                    accountHolderName: accounts[0].accountHolderName,
                }));
            }
        }
    }, [accounts, loadingAccounts, state?.updateId, state?.formData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };
        if (name === "accountNumber") {
            const selected = accounts.find(acc => acc.accountNumber === value);
            if (selected) {
                newFormData.accountHolderName = selected.accountHolderName || selected.name || '';
                localStorage.setItem('selectedWithdrawalAccount', value);
            }
        }
        setFormData(newFormData);
    };

    const validateAll = (): boolean => {
        const errs: Errors = {};
        if (!formData.accountNumber) errs.accountNumber = t('accountNumberRequired', 'Account number is required.');
        if (!formData.accountHolderName) errs.accountHolderName = t('accountHolderNameRequired', 'Account holder name is required.');
        if (!formData.amount || Number(formData.amount) <= 0) errs.amount = t('validAmountRequired', 'A valid amount is required.');
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleStep1Next = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAll()) return;
        setStep(2);
    };

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
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
            const response = await requestWithdrawalOtp(phone);
            if (response.success) {
                setOtpMessage(response.message || 'OTP sent to your phone.');
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
                setOtpError(response.message || 'Failed to send OTP.');
            }
        } catch (err: any) {
            setOtpError(err?.message || 'Failed to send OTP.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmitWithOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.otp || formData.otp.length !== 6) {
            setErrors({ otp: 'Please enter the 6-digit OTP sent to your phone.' });
            return;
        }
        setOtpLoading(true);
        setErrors({});

        if (!phone) {
            setErrors({ message: 'Phone number not found. Please log in again.' });
            setOtpLoading(false);
            return;
        }

        const otpResponse = await authService.verifyOtp(phone, formData.otp, token || undefined);

        if (otpResponse.verified) {
            const withdrawalReq = {
                phoneNumber: phone,
                branchId: ABIY_BRANCH_ID,
                accountNumber: formData.accountNumber,
                accountHolderName: formData.accountHolderName,
                withdrawal_Amount: Number(formData.amount),
            };

            try {
                const submissionResponse = await submitWithdrawal(withdrawalReq, token || undefined);
                if (submissionResponse.success) {
                    navigate('/form/cash-withdrawal/cashwithdrawalconfirmation', { state: { serverData: submissionResponse } });
                } else {
                    setErrors({ message: submissionResponse.message || 'Withdrawal failed after OTP verification.' });
                }
            } catch (error: any) {
                setErrors({ message: error.message || 'An unexpected error occurred during submission.' });
            }

        } else {
            setErrors({ otp: otpResponse.message || 'Invalid OTP. Please try again.' });
        }
        setOtpLoading(false);
    };

    const renderStep1 = () => (
        <form onSubmit={handleStep1Next} className="space-y-6">
            <div className="p-4 border rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-fuchsia-700">{t('accountInformation', 'Account Information')}</h2>
                    <button type="button" onClick={() => speak(t('accountInformation', 'Account Information'))} className="ml-2 p-1 rounded-full bg-fuchsia-100 hover:bg-fuchsia-200">
                        <SpeakerWaveIcon className="h-5 w-5 text-fuchsia-700" />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label={t('accountNumber', 'Account Number')} required error={errors.accountNumber}>
                        {accountDropdown ? (
                            <select name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="form-select w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors bg-white shadow-sm">
                                <option value="">{t('selectAccount', 'Select your account')}</option>
                                {accounts.map(acc => <option key={acc.accountNumber} value={acc.accountNumber}>{acc.accountNumber} - {acc.accountHolderName}</option>)}
                            </select>
                        ) : (
                            <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} readOnly={accounts.length === 1} className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm" />
                        )}
                    </Field>
                    <Field label={t('accountHolderName', 'Account Holder Name')} required error={errors.accountHolderName}>
                        <input type="text" name="accountHolderName" value={formData.accountHolderName} readOnly className="form-input w-full p-2 rounded-lg border-2 border-gray-300 bg-gray-100 cursor-not-allowed" />
                    </Field>
                </div>
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-fuchsia-700">{t('amountInformation', 'Amount Information')}</h2>
                    <button type="button" onClick={() => speak(t('amountInformation', 'Amount Information'))} className="ml-2 p-1 rounded-full bg-fuchsia-100 hover:bg-fuchsia-200">
                        <SpeakerWaveIcon className="h-5 w-5 text-fuchsia-700" />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label={t('amount', 'Amount')} required error={errors.amount}>
                        <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm" />
                    </Field>
                </div>
            </div>
            <div className="pt-4">
                <button type="submit" className="w-full bg-fuchsia-700 hover:bg-fuchsia-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition transform duration-200 hover:scale-105 disabled:opacity-50">
                    {t('continue', 'Continue')}
                </button>
            </div>
        </form>
    );

    const renderReviewStep = () => (
        <form onSubmit={handleRequestOtp} className="space-y-6 text-center">
            <div className="p-4 border rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-fuchsia-700 mb-4">Confirm Withdrawal</h2>
                <div className="space-y-2 text-gray-700 bg-gray-50 p-4 rounded-lg shadow-inner">
                    <div className="flex justify-between"><strong className="font-medium">Account:</strong> <span>{formData.accountHolderName} ({formData.accountNumber})</span></div>
                    <div className="flex justify-between items-center"><strong className="font-medium">Amount:</strong> <span className="font-bold text-2xl text-fuchsia-800">{Number(formData.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB</span></div>
                </div>
            </div>
            <div className="flex gap-4">
                <button type="button" onClick={() => setStep(1)} className="w-full bg-gray-200 text-fuchsia-800 font-bold py-3 px-4 rounded-lg shadow-md hover:bg-gray-300 transition">Back</button>
                <button type="submit" disabled={otpLoading} className="w-full bg-fuchsia-700 hover:bg-fuchsia-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition transform duration-200 hover:scale-105 disabled:opacity-50">
                    {otpLoading ? t('processing', 'Processing...') : t('requestOtp', 'Request OTP')}
                </button>
            </div>
        </form>
    );

    const renderOtpStep = () => (
        <form onSubmit={handleSubmitWithOtp} className="space-y-6 text-center">
            <div className="p-4 border rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-fuchsia-700 mb-4">OTP Verification</h2>
                <p className="text-gray-600 mb-2">An OTP has been sent to your phone number: <strong className="text-fuchsia-800">{phone}</strong></p>
                {otpMessage && <p className="text-green-600 mb-2">{otpMessage}</p>}
                {otpError && <p className="text-red-600 mb-2">{otpError}</p>}
                {errors.otp && <p className="text-red-600 mb-2">{errors.otp}</p>}
                <Field label="Enter OTP" required error={errors.otp}>
                    <input type="text" name="otp" value={formData.otp} onChange={handleChange} maxLength={6} className="form-input w-full p-4 text-center text-2xl tracking-widest rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500" />
                </Field>
            </div>
            <div className="flex gap-4 items-center justify-between">
                <button type="button" onClick={() => setStep(2)} className="w-full bg-gray-200 text-fuchsia-800 font-bold py-3 px-4 rounded-lg shadow-md hover:bg-gray-300 transition">Back</button>
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
                            const response = await requestWithdrawalOtp(phone);
                            if (response.success) {
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
                            } else {
                                setOtpError(response.message || 'Failed to resend OTP.');
                            }
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
            {step === 2 && renderReviewStep()}
            {step === 3 && renderOtpStep()}
        </div>
    );
}
