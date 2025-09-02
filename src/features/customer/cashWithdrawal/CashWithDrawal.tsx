import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import authService from '../../../services/authService';
import { Field } from '../accountOpening/components/FormElements';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = 'http://localhost:5268/api';

function numberToWords(num: number): string {
    const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    if (isNaN(num) || num === 0) return '';
    if (num < 20) return a[num];
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '');
    if (num < 1000) return a[Math.floor(num / 100)] + ' hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
    if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
    return num.toString();
}

export default function CashWithdrawalForm() {
    const { phone, user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState<'request' | 'verify' | 'confirm'>('request');
    const [accounts, setAccounts] = useState<any[]>([]);
    const [accountDropdown, setAccountDropdown] = useState(false);
    const [formData, setFormData] = useState({
        accountNumber: localStorage.getItem('cw_accountNumber') || '',
        accountHolderName: localStorage.getItem('cw_accountHolderName') || '',
        amount: '',
        amountInWords: '',
        otp: '',
        telephoneNumber: localStorage.getItem('cw_telephoneNumber') || phone || ''
    });
    const [errors, setErrors] = useState<{[key: string]: string | undefined}>({});
    const [isLoading, setIsLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState<number>(0);
    const resendTimer = useRef<NodeJS.Timeout | null>(null);

    const ABIY_BRANCH_ID = 'a3d3e1b5-8c9a-4c7c-a1e3-6b3d8f4a2b2c';
    const branchInfo = { name: 'Ayer Tena Branch', id: 'AT-1', date: new Date().toLocaleDateString() };

    useEffect(() => {
        return () => { if (resendTimer.current) clearInterval(resendTimer.current); };
    }, []);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const cached = localStorage.getItem('customerAccounts');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setAccounts(parsed.map((acc: any) => ({ ...acc, accountNumber: acc.accountNumber || acc.AccountNumber, accountHolderName: acc.accountHolderName || acc.AccountHolderName || acc.name })))
                        setAccountDropdown(parsed.length > 1);
                        return;
                    }
                }
                if (phone) {
                    const resp = await fetch(`${API_BASE_URL}/Accounts/by-phone/${phone}`);
                    if (resp.ok) {
                        const payload = await resp.json();
                        const data = payload.data ?? payload;
                        setAccounts(data || []);
                        setAccountDropdown(data.length > 1);
                    }
                }
            } catch (err) { console.error("Failed to fetch accounts", err); }
        };
        fetchAccounts();
    }, [phone]);

    const startResendCooldown = () => {
        if (resendTimer.current) clearInterval(resendTimer.current);
        setResendCooldown(30);
        resendTimer.current = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) {
                    if (resendTimer.current) clearInterval(resendTimer.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };
        if (name === 'amount') newFormData.amountInWords = numberToWords(Number(value));
        if (name === "accountNumber") {
            const selected = accounts.find(acc => acc.accountNumber === value);
            if (selected) {
                newFormData.accountHolderName = selected.accountHolderName || selected.name || '';
            }
        }
        setFormData(newFormData);
        if (["accountNumber", "accountHolderName", "telephoneNumber"].includes(name)) {
            localStorage.setItem(`cw_${name}`, newFormData[name as keyof typeof newFormData]);
        }
    };

    const sendOTP = async () => {
        setErrors({});
        if (!formData.accountNumber || !formData.amount || Number(formData.amount) <= 0) {
            setErrors({ amount: 'A valid account and amount are required.' });
            return;
        }
        setIsLoading(true);
        try {
            const targetPhone = phone || formData.telephoneNumber;
            const response = await authService.requestOtp(targetPhone);
            setOtpMessage(response.message || 'OTP sent successfully');
            setStep('verify');
            startResendCooldown();
        } catch (err: any) {
            setErrors({ message: err.response?.data?.message || 'Failed to send OTP.' });
        } finally {
            setIsLoading(false);
        }
    };

    const verifyOTP = () => {
        if (!formData.otp || !/^[0-9]{6}$/.test(formData.otp)) {
            setErrors({ otp: 'Please enter a valid 6-digit OTP' });
            return;
        }
        setErrors({});
        setStep('confirm');
    };

    const handleSubmitWithdrawal = async () => {
        setIsLoading(true);
        setErrors({});
        try {
            const withdrawalReq = {
                phoneNumber: (phone || formData.telephoneNumber) as string,
                branchId: ABIY_BRANCH_ID,
                accountNumber: parseInt(formData.accountNumber, 10),
                accountHolderName: formData.accountHolderName,
                withdrawal_Amount: Number(formData.amount),
                remark: '',
                code: parseInt(formData.otp, 10),
            };
            navigate('/form/cash-withdrawal/cashwithdrawalconfirmation', { state: { pending: true, requestPayload: withdrawalReq, ui: { ...formData, branch: branchInfo.name } } });
        } catch (err: any) {
            setErrors({ message: err?.message || 'Failed to submit withdrawal.' });
        } finally {
            setIsLoading(false);
        }
    };

    const renderRequestStep = () => (
        <div className="space-y-6">
            <Field label="Account Number" required error={errors.accountNumber}>
                {accountDropdown ? (
                    <select name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="form-select w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500">
                        <option value="">Select your account</option>
                        {accounts.map(acc => <option key={acc.accountNumber} value={acc.accountNumber}>{acc.accountNumber} - {acc.accountHolderName}</option>)}
                    </select>
                ) : (
                    <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} readOnly={accounts.length === 1} className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500" />
                )}
            </Field>
            {formData.accountHolderName && <p className="text-gray-600">Welcome, <span className="font-semibold text-fuchsia-800">{formData.accountHolderName}</span></p>}
            <Field label="Amount" required error={errors.amount}>
                <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500" />
            </Field>
            <Field label="Amount in Words">
                <input type="text" name="amountInWords" value={formData.amountInWords} readOnly className="form-input w-full p-2 rounded-lg border-2 border-gray-300 bg-gray-100" />
            </Field>
            <button onClick={sendOTP} disabled={isLoading || !formData.accountHolderName || !formData.amount} className="w-full bg-fuchsia-700 hover:bg-fuchsia-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition transform duration-200 hover:scale-105 disabled:opacity-50">
                {isLoading ? 'Sending OTP...' : 'Request OTP'}
            </button>
        </div>
    );

    const renderVerifyStep = () => (
        <div className="text-center space-y-6">
            <p className="text-gray-600">An OTP has been sent to your registered phone number: <strong className="text-fuchsia-800">{phone || formData.telephoneNumber}</strong></p>
            <Field label="Enter 6-Digit OTP" required error={errors.otp}>
                <input type="text" name="otp" value={formData.otp} onChange={handleChange} maxLength={6} className="form-input w-full p-4 text-center text-2xl tracking-widest rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500" />
            </Field>
            <button onClick={verifyOTP} disabled={isLoading || formData.otp.length !== 6} className="w-full bg-fuchsia-700 hover:bg-fuchsia-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition transform duration-200 hover:scale-105 disabled:opacity-50">
                Verify & Proceed
            </button>
            <button onClick={startResendCooldown} disabled={resendCooldown > 0} className="text-sm text-fuchsia-600 hover:underline disabled:text-gray-400">
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
            </button>
        </div>
    );

    const renderConfirmStep = () => (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-fuchsia-700">Review Your Withdrawal</h3>
            <div className="space-y-2 text-gray-700 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between"><strong className="font-medium">Account:</strong> <span>{formData.accountHolderName} ({formData.accountNumber})</span></div>
                <div className="flex justify-between"><strong className="font-medium">Amount:</strong> <span className="font-bold text-fuchsia-800">{Number(formData.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB</span></div>
                <div className="flex justify-between"><strong className="font-medium">Branch:</strong> <span>{branchInfo.name}</span></div>
            </div>
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg text-sm">Please present a valid ID at the counter to complete this withdrawal.</div>
            <button onClick={handleSubmitWithdrawal} disabled={isLoading} className="w-full bg-fuchsia-700 hover:bg-fuchsia-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition transform duration-200 hover:scale-105 disabled:opacity-50">
                {isLoading ? <><ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />Processing...</> : 'Confirm & Submit Withdrawal'}
            </button>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-fuchsia-800">Cash Withdrawal</h1>
                <p className="text-gray-600 mt-1">{branchInfo.name} - {branchInfo.date}</p>
            </div>
            {errors.message && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center">{errors.message}</div>}
            {step === 'request' && renderRequestStep()}
            {step === 'verify' && renderVerifyStep()}
            {step === 'confirm' && renderConfirmStep()}
        </div>
    );
}
