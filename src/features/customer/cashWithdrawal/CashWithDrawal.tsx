// If you use windowService here, use type-only import for Window
// import type { Window as WindowType } from '../../../services/windowService';
import React, { useState, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import authService from '../../../services/authService';
import { submitWithdrawal } from '../../../services/withdrawalService';



export default function CashWithdrawalForm() {
  // Get phone number from AuthContext (set at login)
  const { phone, user } = useAuth();
  
  // Load persisted fields from localStorage if present
  const persistedAccountNumber = localStorage.getItem('cw_accountNumber') || '';
  const persistedAccountHolderName = localStorage.getItem('cw_accountHolderName') || '';
  const persistedTelephoneNumber = localStorage.getItem('cw_telephoneNumber') || (phone || '');

  const [step, setStep] = useState<'request' | 'verify' | 'confirm'>('request');
  // For account selection
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountDropdown, setAccountDropdown] = useState(false);
  
  const [formData, setFormData] = useState<{
    accountNumber: string;
    accountHolderName: string;
    amount: string;
    otp: string;
    telephoneNumber: string;
  }>({
    accountNumber: persistedAccountNumber,
    accountHolderName: persistedAccountHolderName,
    amount: '',
    otp: '',
    telephoneNumber: persistedTelephoneNumber
  });
  const [errors, setErrors] = useState<{
    accountNumber?: string;
    amount?: string;
    otp?: string;
    message?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [resendTimer, setResendTimer] = useState<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // Auto-fill branch info from QR/link (as per FSD)
  // For now, always use Abiy Branch for demo, but this can be dynamic
  const ABIY_BRANCH_ID = 'd9b1c3f7-4b05-44d3-b58e-9c5a5b4b90f6';
  const branchInfo = {
    name: 'Abiy Branch',
    id: 'AB-1',
    date: new Date().toLocaleDateString()
  };

  // Start cooldown timer when OTP is sent
  const startResendCooldown = () => {
    setResendCooldown(30);
    const timer = setInterval(() => {
      setResendCooldown((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setResendTimer(timer);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (resendTimer) clearInterval(resendTimer);
    };
  }, [resendTimer]);

  // Fetch accounts for customer (OTPLogin) or staff (StaffLogin)
  useEffect(() => {
    const fetchAccounts = async () => {
      let resp;
      try {
        if (phone) {
          // Customer flow (OTPLogin)
          resp = await fetch(`/api/Accounts/by-phone/${phone}`);
        } else if (user && user.role && user.role.toLowerCase() !== 'customer') {
          // Staff/Admin flow (StaffLogin)
          resp = await fetch(`/api/Accounts/my-accounts`);
        } else {
          setAccounts([]);
          setAccountDropdown(false);
          return;
        }
        if (resp.status === 200) {
          const data = await resp.json();
          setAccounts(data);
          if (data.length === 1) {
            setFormData((prev) => {
              const updated = {
                ...prev,
                accountNumber: data[0].accountNumber,
                accountHolderName: data[0].accountHolderName || data[0].name || '',
                telephoneNumber: phone || ''
              };
              // Persist
              localStorage.setItem('cw_accountNumber', updated.accountNumber);
              localStorage.setItem('cw_accountHolderName', updated.accountHolderName);
              localStorage.setItem('cw_telephoneNumber', updated.telephoneNumber);
              return updated;
            });
            setAccountDropdown(false);
          } else if (data.length > 1) {
            setAccountDropdown(true);
            // Optionally clear fields until user selects
            setFormData((prev) => {
              const updated = {
                ...prev,
                accountNumber: '',
                accountHolderName: '',
                telephoneNumber: phone || ''
              };
              // Clear persisted fields until selection
              localStorage.setItem('cw_accountNumber', '');
              localStorage.setItem('cw_accountHolderName', '');
              localStorage.setItem('cw_telephoneNumber', updated.telephoneNumber);
              return updated;
            });
          }
        } else {
          setAccounts([]);
          setAccountDropdown(false);
        }
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setAccounts([]);
        setAccountDropdown(false);
      }
    };
    fetchAccounts();
  }, [phone, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Persist relevant fields
      if (["accountNumber", "accountHolderName", "telephoneNumber"].includes(name)) {
        localStorage.setItem(`cw_${name}`, value);
      }
      return updated;
    });
    
    // If accountNumber is changed via dropdown, update holder name
    if (name === "accountNumber" && accounts.length > 0) {
      const selected = accounts.find(acc => acc.accountNumber === value);
      if (selected) {
        setFormData((prev) => {
          const updated = {
            ...prev,
            accountHolderName: selected.accountHolderName || selected.name || '',
            telephoneNumber: phone || ''
          };
          // Persist
          localStorage.setItem('cw_accountHolderName', updated.accountHolderName);
          localStorage.setItem('cw_telephoneNumber', updated.telephoneNumber);
          return updated;
        });
      }
    }
  }

  // Simple validators
  const isDigitsOnly = (value: string) => /^\d+$/.test(value);
  const isValidEthiopianMobile = (value: string) => /^09\d{8}$|^\+2519\d{8}$/.test(value);

  const validateAccount = () => {
    if (!formData.accountNumber) {
      setErrors({ accountNumber: 'Account number is required' });
      return false;
    }
    if (!isDigitsOnly(formData.accountNumber)) {
      setErrors({ accountNumber: 'Account number must contain only digits' });
      return false;
    }
    if (formData.accountNumber.length < 7) {
      setErrors({ accountNumber: 'Account number must be at least 7 digits' });
      return false;
    }
    setErrors((prev) => ({ ...prev, accountNumber: undefined }));
    return true;
  };

  const sendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrors({});
    setOtpMessage('');
    setIsLoading(true);
    try {
      // Validate required fields
      if (!formData.accountNumber) {
        setErrors({ accountNumber: 'Account number is required' });
        setIsLoading(false);
        return;
      }
      if (!isDigitsOnly(formData.accountNumber)) {
        setErrors({ accountNumber: 'Account number must contain only digits' });
        setIsLoading(false);
        return;
      }
      if (!formData.amount) {
        setErrors({ amount: 'Please enter withdrawal amount' });
        setIsLoading(false);
        return;
      }
      if (Number(formData.amount) <= 0) {
        setErrors({ amount: 'Amount must be greater than zero' });
        setIsLoading(false);
        return;
      }
      if (Number(formData.amount) > 50000) {
        setErrors({ amount: 'Daily withdrawal limit is ETB 50,000' });
        setIsLoading(false);
        return;
      }
      // Validate phone availability and format for OTP delivery
      const targetPhone = phone || formData.telephoneNumber;
      if (!targetPhone) {
        setErrors({ message: 'No phone number available for OTP. Please login again.' });
        setIsLoading(false);
        return;
      }
      if (!isValidEthiopianMobile(targetPhone)) {
        setErrors({ message: 'Invalid phone format for OTP.' });
        setIsLoading(false);
        return;
      }
      // Call the OTP sending API
      const response = await authService.requestOtp(targetPhone);
      setOtpMessage(response.message || 'OTP has been sent to your registered phone number');
      setStep('verify');
      startResendCooldown();
    } catch (err: any) {
      setErrors({
        message: err.response?.data?.message || err.message || 'Failed to send OTP. Please try again.'
      });
      console.error('Send OTP Error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrors({});
    setOtpMessage('');
    setIsLoading(true);
    try {
      const response = await authService.requestOtp(phone || formData.telephoneNumber);
      setOtpMessage(response.message || 'New OTP has been sent');
      startResendCooldown();
    } catch (err: any) {
      setErrors({
        message: err.response?.data?.message || 'Failed to resend OTP. Please try again.'
      });
      console.error('Resend OTP Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.otp) {
      setErrors({ otp: 'OTP is required' });
      return;
    }
    if (!/^[0-9]{6}$/.test(formData.otp)) {
      setErrors({ otp: 'Please enter a valid 6-digit OTP' });
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      const targetPhone = phone || formData.telephoneNumber;
      if (!targetPhone) {
        setErrors({ otp: 'No phone number available for OTP verification.' });
        setIsLoading(false);
        return;
      }
      const verification = await authService.verifyOtp(targetPhone, formData.otp);
      if (verification && verification.verified) {
        setStep('confirm');
      } else {
        setErrors({ otp: verification?.message || 'OTP verification failed' });
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'OTP verification failed';
      setErrors({ otp: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitWithdrawal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrors({});
    // Validate before submit
    if (!formData.accountNumber) {
      setErrors({ accountNumber: 'Account number is required' });
      setIsLoading(false);
      return;
    }
    if (!isDigitsOnly(formData.accountNumber)) {
      setErrors({ accountNumber: 'Account number must contain only digits' });
      setIsLoading(false);
      return;
    }
    if (!formData.accountHolderName) {
      setErrors({ accountNumber: undefined, message: 'Account holder name is required' });
      setIsLoading(false);
      return;
    }
    if (!formData.amount) {
      setErrors({ amount: 'Please enter withdrawal amount' });
      setIsLoading(false);
      return;
    }
    if (Number(formData.amount) <= 0) {
      setErrors({ amount: 'Amount must be greater than zero' });
      setIsLoading(false);
      return;
    }
    if (Number(formData.amount) > 50000) {
      setErrors({ amount: 'Daily withdrawal limit is ETB 50,000' });
      setIsLoading(false);
      return;
    }
    if (!formData.otp) {
      setErrors({ otp: 'OTP is required' });
      setIsLoading(false);
      return;
    }
    if (!/^[0-9]{6}$/.test(formData.otp)) {
      setErrors({ otp: 'Please enter a valid 6-digit OTP' });
      setIsLoading(false);
      return;
    }
    try {
      // Prepare request for backend (aligns with WithdrawalRequestDto)
      const withdrawalReq = {
        phoneNumber: (phone || formData.telephoneNumber) as string,
        accountNumber: parseInt(formData.accountNumber, 10),
        withdrawa_Amount: Number(formData.amount),
        remark: '',
        code: parseInt(formData.otp, 10),
      } as any;
      // Immediately navigate to confirmation, and let that screen submit to backend
      // Clear persisted fields now
      localStorage.removeItem('cw_accountNumber');
      localStorage.removeItem('cw_accountHolderName');
      localStorage.removeItem('cw_telephoneNumber');

      navigate('/form/cash-withdrawal/cashwithdrawalconfirmation', {
        state: {
          pending: true,
          requestPayload: withdrawalReq,
          ui: {
            accountNumber: formData.accountNumber,
            amount: `${Number(formData.amount).toLocaleString()}.00 ETB`,
            branch: branchInfo.name,
          },
        },
      });
    } catch (err: any) {
      const backendMsg = err?.message || 'Failed to submit withdrawal. Please try again.';
      setErrors({ message: backendMsg });
      // If OTP is invalid/used, bounce user back to verify step to re-enter OTP
      if (/invalid\s*or\s*used\s*otp/i.test(backendMsg)) {
        setStep('verify');
        setOtpMessage('The OTP is invalid or already used. Please request a new one.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 to-white p-4 md:p-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-fuchsia-100">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-fuchsia-700 to-fuchsia-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">Cash Withdrawal</h1>
          <div className="flex justify-between items-center mt-3 text-fuchsia-100 text-sm">
            <span>Branch: {branchInfo.name}</span>
            <span>{branchInfo.date}</span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-4">
          <div className="flex justify-between max-w-md mx-auto mb-8 relative">
            {['request', 'verify', 'confirm'].map((stepKey, idx) => (
              <div key={stepKey} className="flex flex-col items-center z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                  ${step === stepKey || (step === 'verify' && idx < 2) || (step === 'confirm' && idx < 3) ? 'bg-fuchsia-600 text-white' : 'bg-fuchsia-100 text-fuchsia-600'} 
                  ${step === stepKey ? 'ring-4 ring-fuchsia-300' : ''}`}>
                  {idx + 1}
                </div>
                <div className={`text-xs mt-1 ${step === stepKey || (step === 'verify' && idx < 2) || (step === 'confirm' && idx < 3) ? 'text-fuchsia-700 font-medium' : 'text-gray-400'}`}>
                  {['Account', 'OTP', 'Confirm'][idx]}
                </div>
              </div>
            ))}
            <div className="absolute h-1 bg-fuchsia-100 top-4 left-8 right-8">
              <div 
                className="h-1 bg-fuchsia-600 transition-all duration-500" 
                style={{ width: step === 'request' ? '0%' : step === 'verify' ? '50%' : '100%' }}
              ></div>
            </div>
          </div>
        </div>

        {/* Form Body */}
  <div className="p-6 space-y-6">
        <div className="p-6 space-y-6">
          {step === 'request' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-fuchsia-700 mb-2">
                          Account Number *
                        </label>
                        {accountDropdown && accounts.length > 0 ? (
                          <select
                            name="accountNumber"
                            value={formData.accountNumber}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 p-3"
                          >
                            <option value="">Select an account</option>
                            {accounts.map((account) => (
                              <option key={account.accountNumber} value={account.accountNumber}>
                                {account.accountNumber} - {account.accountHolderName || account.name || 'No Name'}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex">
                            <input
                              type="text"
                              name="accountNumber"
                              value={formData.accountNumber}
                              onChange={handleChange}
                              className="flex-1 rounded-l-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 p-3"
                              placeholder="Enter account number"
                            />
                            <button
                              type="button"
                              onClick={validateAccount}
                              disabled={!formData.accountNumber}
                              className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-4 rounded-r-lg transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : 'Search'}
                            </button>
                          </div>
                        )}
                        {errors.accountNumber && (
                          <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
                        )}
                      </div>

                      {formData.accountHolderName && (
                        <div className="bg-fuchsia-50 p-4 rounded-lg border border-fuchsia-100">
                          <p className="text-sm text-fuchsia-600">Account Holder</p>
                          <p className="font-medium">{formData.accountHolderName}</p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-fuchsia-700 mb-2">
                          Withdrawal Amount (ETB) *
                        </label>
                        <input
                          type="number"
                          name="amount"
                          value={formData.amount}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 p-3"
                          placeholder="Enter amount"
                          min={0}
                          step={1}
                        />
                        {errors.amount && (
                          <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                        )}
                      </div>

                      <button
                        onClick={sendOTP}
                        disabled={isLoading || !formData.accountHolderName || !formData.amount || Number(formData.amount) > 50000}
                        className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium py-3 px-4 rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Sending OTP...' : 'Continue to OTP Verification'}
                      </button>
                    </div>
                  )}

                  {step === 'verify' && (
                    <div className="space-y-5 animate-fadeIn">
                      <div className="bg-fuchsia-50 p-4 rounded-lg border border-fuchsia-100">
                        <p className="text-sm text-fuchsia-600">OTP Sent to your registered phone</p>
                        <p className="font-medium">•••• {phone || formData.telephoneNumber?.slice(-3) || '•••'}</p>
                        {otpMessage && <p className="text-sm text-green-600 mt-1">{otpMessage}</p>}
                        <div className="mt-2 flex justify-between items-center">
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendCooldown > 0 || isLoading}
                            className="text-sm text-fuchsia-700 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setStep('request')}
                            className="text-sm text-fuchsia-700 hover:underline"
                            disabled={isLoading}
                          >
                            &larr; Back
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-fuchsia-700 mb-2">
                          Enter 6-digit OTP *
                        </label>
                        <input
                          type="text"
                          name="otp"
                          value={formData.otp}
                          onChange={handleChange}
                          maxLength={6}
                          className="w-full rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 p-3 text-center text-xl tracking-widest"
                          placeholder="------"
                          inputMode="numeric"
                          pattern="^[0-9]{6}$"
                        />
                        {errors.otp && (
                          <p className="mt-1 text-sm text-red-600">{errors.otp}</p>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => setStep('request')}
                          className="text-fuchsia-600 hover:text-fuchsia-800 text-sm font-medium"
                        >
                          Back
                        </button>
                        <button
                          onClick={verifyOTP}
                          disabled={isLoading || !formData.otp || !/^[0-9]{6}$/.test(formData.otp)}
                          className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium py-2 px-6 rounded-lg shadow-md transition disabled:opacity-50 flex items-center justify-center min-w-24"
                        >
                          Verify OTP
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 'confirm' && (
                    <div className="space-y-5 animate-fadeIn">
                      <div className="bg-fuchsia-50 p-4 rounded-lg border border-fuchsia-100">
                        <p className="text-sm text-fuchsia-600">Review Your Withdrawal</p>
                        <p className="font-medium">Please confirm details before submission</p>
                    </div>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Account Number:</span>
                          <span className="font-medium">{formData.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Account Holder:</span>
                          <span className="font-medium">{formData.accountHolderName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-medium">{formData.amount} ETB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Branch:</span>
                          <span className="font-medium">{branchInfo.name}</span>
                        </div>
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-700">
                          Note: You will need to present valid ID at the counter to complete this withdrawal.
                        </p>
                      </div>

                      <button
                        onClick={handleSubmitWithdrawal}
                        disabled={isLoading}
                        className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium py-3 px-4 rounded-lg shadow-md transition disabled:opacity-70 flex items-center justify-center"
                      >
                        {isLoading ? (
                          <>
                            <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Submit Withdrawal Request'
                        )}
                      </button>
                    </div>
                  )}
        </div>
      </div>
    </div>
    </div>
    );
}