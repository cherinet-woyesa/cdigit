// If you use windowService here, use type-only import for Window
// import type { Window as WindowType } from '../../../services/windowService';
import React, { useState, useEffect, useRef } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import authService from '../../../services/authService';

const API_BASE_URL = 'http://localhost:5268/api';




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
  const errorRefs = useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | null }>({});
  
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
        if (resp?.status === 200) {
          const payload = await resp.json();
          const data = payload.data ?? payload;
          const normalized = (data || []).map((acc: any) => ({
            accountNumber: acc.accountNumber || acc.AccountNumber,
            accountHolderName: acc.accountHolderName || acc.AccountHolderName || acc.name,
          }));
          setAccounts(normalized);
          if (normalized.length === 1) {
            const a = normalized[0];
            setFormData((prev) => {
              const updated = {
                ...prev,
                accountNumber: a.accountNumber,
                accountHolderName: a.accountHolderName || '',
                telephoneNumber: phone || ''
              };
              localStorage.setItem('cw_accountNumber', updated.accountNumber);
              localStorage.setItem('cw_accountHolderName', updated.accountHolderName);
              localStorage.setItem('cw_telephoneNumber', updated.telephoneNumber);
              return updated;
            });
            setAccountDropdown(false);
          } else if (normalized.length > 1) {
            setAccountDropdown(true);
            setFormData((prev) => {
              const updated = {
                ...prev,
                accountNumber: '',
                accountHolderName: '',
                telephoneNumber: phone || ''
              };
              localStorage.setItem('cw_accountNumber', '');
              localStorage.setItem('cw_accountHolderName', '');
              localStorage.setItem('cw_telephoneNumber', updated.telephoneNumber);
              return updated;
            });
          }
        } else {
          // 1) Try localStorage accounts from OTP login
          const cached = localStorage.getItem('customerAccounts');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              const normalized = (parsed || []).map((acc: any) => ({
                accountNumber: acc.accountNumber || acc.AccountNumber,
                accountHolderName: acc.accountHolderName || acc.AccountHolderName || acc.name,
              }));
              setAccounts(normalized);
              if (normalized.length === 1) {
                const a = normalized[0];
                setFormData((prev) => ({
                  ...prev,
                  accountNumber: a.accountNumber,
                  accountHolderName: a.accountHolderName || '',
                  telephoneNumber: phone || ''
                }));
                setAccountDropdown(false);
              } else if (normalized.length > 1) {
                setAccountDropdown(true);
              }
              return;
            } catch {}
          }

          // 2) Fallback absolute URL fetch
          if (phone) {
            const resp2 = await fetch(`${API_BASE_URL}/Accounts/by-phone/${phone}`);
            if (resp2.status === 200) {
              const payload2 = await resp2.json();
              const data2 = payload2.data ?? payload2;
              const normalized2 = (data2 || []).map((acc: any) => ({
                accountNumber: acc.accountNumber || acc.AccountNumber,
                accountHolderName: acc.accountHolderName || acc.AccountHolderName || acc.name,
              }));
              setAccounts(normalized2);
              if (normalized2.length === 1) {
                const a = normalized2[0];
                setFormData((prev) => ({
                  ...prev,
                  accountNumber: a.accountNumber,
                  accountHolderName: a.accountHolderName || '',
                  telephoneNumber: phone || ''
                }));
                setAccountDropdown(false);
              } else if (normalized2.length > 1) {
                setAccountDropdown(true);
              }
            }
          } else {
            setAccounts([]);
            setAccountDropdown(false);
          }
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
  // Scroll to first error field when errors change
  useEffect(() => {
    const firstErrorKey = (Object.keys(errors) as Array<keyof typeof errors>).find(k => errors[k]);
    if (firstErrorKey && errorRefs.current[firstErrorKey]) {
      errorRefs.current[firstErrorKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      errorRefs.current[firstErrorKey]?.focus();
    }
  }, [errors]);

  // Simple validators
  const isDigitsOnly = (value: string) => /^\d+$/.test(value);
  const isValidEthiopianMobile = (value: string) => /^09\d{8}$|^\+2519\d{8}$/.test(value);

  // Removed manual account validation/search; we rely on fetched accounts

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

  const verifyOTP = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.otp) {
      setErrors({ otp: 'OTP is required' });
      return;
    }
    if (!/^[0-9]{6}$/.test(formData.otp)) {
      setErrors({ otp: 'Please enter a valid 6-digit OTP' });
      return;
    }
    // Do not call backend verify here to avoid consuming OTP before submission
    setErrors({});
    setStep('confirm');
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
        branchId: ABIY_BRANCH_ID,
        accountNumber: parseInt(formData.accountNumber, 10),
        accountHolderName: formData.accountHolderName,
        withdrawal_Amount: Number(formData.amount),
        remark: '',
        code: parseInt(formData.otp, 10),
      };
      // Do NOT clear persisted fields here; keep them until transaction is fully complete
      navigate('/form/cash-withdrawal/cashwithdrawalconfirmation', {
        state: {
          pending: true,
          requestPayload: withdrawalReq,
          branch: branchInfo.name,
          // referenceId will be set by backend response, but pass UI branch for fallback
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
                            className={`w-full rounded-lg border focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 p-3 ${errors.accountNumber ? 'border-red-500' : 'border-fuchsia-300'}`}
                            ref={el => { errorRefs.current.accountNumber = el; }}
                            aria-invalid={!!errors.accountNumber}
                            aria-describedby={errors.accountNumber ? 'accountNumber-error' : undefined}
                          >
                            <option value="">Select an account</option>
                            {accounts.map((account) => (
                              <option key={account.accountNumber} value={account.accountNumber}>
                                {account.accountNumber} - {account.accountHolderName || account.name || 'No Name'}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            name="accountNumber"
                            value={formData.accountNumber}
                            onChange={handleChange}
                            className={`w-full rounded-lg border focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 p-3 ${errors.accountNumber ? 'border-red-500' : 'border-fuchsia-300'}`}
                            placeholder="Account number"
                            readOnly={accounts.length === 1}
                            ref={el => { errorRefs.current.accountNumber = el; }}
                            aria-invalid={!!errors.accountNumber}
                            aria-describedby={errors.accountNumber ? 'accountNumber-error' : undefined}
                          />
                        )}
                        {errors.accountNumber && (
                          <p className="mt-1 text-sm text-red-600" id="accountNumber-error">{errors.accountNumber}</p>
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
                          onChange={e => {
                            handleChange(e);
                            const value = e.target.value;
                            let errorMsg = undefined;
                            if (!value) {
                              errorMsg = 'Please enter withdrawal amount';
                            } else if (Number(value) <= 0) {
                              errorMsg = 'Amount must be greater than zero';
                            } else if (Number(value) > 50000) {
                              errorMsg = 'Daily withdrawal limit is ETB 50,000';
                            }
                            setErrors(prev => ({ ...prev, amount: errorMsg }));
                          }}
                          onBlur={e => {
                            const value = e.target.value;
                            let errorMsg = undefined;
                            if (!value) {
                              errorMsg = 'Please enter withdrawal amount';
                            } else if (Number(value) <= 0) {
                              errorMsg = 'Amount must be greater than zero';
                            } else if (Number(value) > 50000) {
                              errorMsg = 'Daily withdrawal limit is ETB 50,000';
                            }
                            setErrors(prev => ({ ...prev, amount: errorMsg }));
                          }}
                          className={`w-full rounded-lg border focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 p-3 ${errors.amount ? 'border-red-500' : 'border-fuchsia-300'}`}
                          placeholder="Enter amount"
                          min={0}
                          step={1}
                          ref={el => { errorRefs.current.amount = el; }}
                          aria-invalid={!!errors.amount}
                          aria-describedby={errors.amount ? 'amount-error' : undefined}
                        />
                        {errors.amount && (
                          <p className="mt-1 text-sm text-red-600" id="amount-error">{errors.amount}</p>
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
                    <div className="space-y-6 animate-fadeIn">
                      <div className="bg-fuchsia-50 p-6 rounded-xl border border-fuchsia-100 text-center">
                        <div className="mb-2 text-fuchsia-700 font-semibold text-lg">OTP Verification</div>
                        <div className="mb-2 text-sm text-fuchsia-600 flex flex-col items-center">
                          <span>We sent a 6-digit code to your phone:</span>
                          <span className="font-mono text-base mt-1 bg-fuchsia-100 px-3 py-1 rounded-lg tracking-widest">
                            {(() => {
                              const raw = phone || formData.telephoneNumber || '';
                              if (!raw) return '••••••••••';
                              // Show first 2 and last 2 digits, mask the rest
                              if (raw.length >= 7) {
                                return raw.slice(0, 2) + '••••••' + raw.slice(-2);
                              } else if (raw.length >= 4) {
                                return raw.slice(0, 2) + '••' + raw.slice(-2);
                              } else {
                                return '••••';
                              }
                            })()}
                          </span>
                        </div>
                        {otpMessage && <p className="text-green-600 text-sm mb-2">{otpMessage}</p>}
                        <div className="flex justify-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendCooldown > 0 || isLoading}
                            className="text-sm text-fuchsia-700 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                          </button>
                          <span className="text-gray-300">|</span>
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

                      <div className="flex flex-col items-center space-y-2">
                        <label className="block text-sm font-medium text-fuchsia-700 mb-1">
                          Enter 6-digit OTP
                        </label>
                        <input
                          type="text"
                          name="otp"
                          value={formData.otp}
                          onChange={handleChange}
                          maxLength={6}
                          className={`w-40 rounded-lg border focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 p-3 text-center text-2xl tracking-widest ${errors.otp ? 'border-red-500' : 'border-fuchsia-300'}`}
                          placeholder="------"
                          inputMode="numeric"
                          pattern="^[0-9]{6}$"
                          ref={el => { errorRefs.current.otp = el; }}
                          aria-invalid={!!errors.otp}
                          aria-describedby={errors.otp ? 'otp-error' : undefined}
                        />
                        {errors.otp && (
                          <p className="text-sm text-red-600" id="otp-error">{errors.otp}</p>
                        )}
                      </div>

                      <button
                        onClick={verifyOTP}
                        disabled={isLoading || !formData.otp || !/^[0-9]{6}$/.test(formData.otp)}
                        className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium py-3 px-4 rounded-lg shadow-md transition disabled:opacity-50 flex items-center justify-center min-w-24 mt-2"
                      >
                        Verify OTP
                      </button>
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