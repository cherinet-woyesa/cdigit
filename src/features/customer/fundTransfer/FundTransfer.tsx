import { useState, useEffect } from 'react';

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
import { useNavigate } from 'react-router-dom';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import {
  validateAccountWithCBS,
  sendFundTransferOTP,
  verifyFundTransferOTP,
  submitFundTransfer
} from '../../../services/fundTransferService';

export default function FundTransfer() {
  const { phone, user } = useAuth();
  const API_BASE_URL = 'http://localhost:5268/api';
  const [formData, setFormData] = useState({
    debitAccountNumber: localStorage.getItem('ft_debitAccountNumber') || '',
    debitAccountName: localStorage.getItem('ft_debitAccountName') || '',
    amount: '',
    amountInWords: '',
    creditAccountNumber: '',
    creditAccountName: '',
    remark: '',
    otp: '',
  });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountDropdown, setAccountDropdown] = useState(false);
  // Auto-fill debit account from user accounts (like CashDeposit)
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        // 1) Prefer cached accounts from OTP login
        const cached = localStorage.getItem('customerAccounts');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const normalized = parsed.map((acc: any) => ({
                accountNumber: acc.accountNumber || acc.AccountNumber,
                accountHolderName: acc.accountHolderName || acc.AccountHolderName || acc.name,
              }));
              const valid = normalized.filter(a => !!a.accountNumber);
              if (valid.length > 0) {
                setAccounts(valid);
                if (valid.length === 1) {
                  const a = valid[0];
                  setFormData(prev => ({
                    ...prev,
                    debitAccountNumber: a.accountNumber,
                    debitAccountName: a.accountHolderName || ''
                  }));
                  localStorage.setItem('ft_debitAccountNumber', a.accountNumber);
                  localStorage.setItem('ft_debitAccountName', a.accountHolderName || '');
                  setAccountDropdown(false);
                } else {
                  setAccountDropdown(true);
                  // Try to preselect from persisted
                  const persisted = localStorage.getItem('ft_debitAccountNumber') || '';
                  const pre = valid.find(v => v.accountNumber === persisted);
                  if (pre) {
                    setFormData(prev => ({
                      ...prev,
                      debitAccountNumber: pre.accountNumber,
                      debitAccountName: pre.accountHolderName || ''
                    }));
                  } else {
                    setFormData(prev => ({ ...prev, debitAccountNumber: '', debitAccountName: '' }));
                  }
                }
                return;
              }
            }
          } catch {}
        }

        // 2) Fallback to backend by phone
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
          }));
          const valid = normalized.filter((a: any) => !!a.accountNumber);
          setAccounts(valid);
          if (valid.length === 1) {
            const a = valid[0];
            setFormData(prev => ({
              ...prev,
              debitAccountNumber: a.accountNumber,
              debitAccountName: a.accountHolderName || ''
            }));
            localStorage.setItem('ft_debitAccountNumber', a.accountNumber);
            localStorage.setItem('ft_debitAccountName', a.accountHolderName || '');
            setAccountDropdown(false);
          } else if (valid.length > 1) {
            setAccountDropdown(true);
            const persisted = localStorage.getItem('ft_debitAccountNumber') || '';
            const pre = valid.find(v => v.accountNumber === persisted);
            if (pre) {
              setFormData(prev => ({ ...prev, debitAccountNumber: pre.accountNumber, debitAccountName: pre.accountHolderName || '' }));
            } else {
              setFormData(prev => ({ ...prev, debitAccountNumber: '', debitAccountName: '' }));
            }
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
  const [errors, setErrors] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1) // 1 = Account, 2 = OTP, 3 = Confirm
  const [otpSent, setOtpSent] = useState(false)
  const navigate = useNavigate()

  // Auto-fill branch info from QR/link (as per FSD)
  const branchInfo = {
    name: 'Abiy Branch',
    id: 'd9b1c3f7-4b05-44d3-b58e-9c5a5b4b90f6',
    date: new Date().toLocaleDateString()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      let updated = { ...prev, [name]: value };
      if (name === 'amount') {
        updated.amountInWords = numberToWords(Number(value));
      }
      return updated;
    });
  }

  const validateDebitAccount = async () => {
    setIsLoading(true)
    setErrors({})
    try {
      const res = await validateAccountWithCBS(formData.debitAccountNumber)
      if (res && res.accountName) {
        setFormData(prev => ({ ...prev, debitAccountName: res.accountName }))
        setErrors((e: any) => ({ ...e, debitAccountNumber: undefined }))
      } else {
        setErrors((e: any) => ({ ...e, debitAccountNumber: 'Account not found or invalid' }))
        setFormData(prev => ({ ...prev, debitAccountName: '' }))
      }
    } catch (err: any) {
      setErrors((e: any) => ({ ...e, debitAccountNumber: err?.response?.data?.message || 'CBS validation failed' }))
      setFormData(prev => ({ ...prev, debitAccountName: '' }))
    }
    setIsLoading(false)
  }

  const validateCreditAccount = async () => {
    setIsLoading(true)
    setErrors({})
    try {
      // Ensure beneficiary differs from sender
      if (formData.debitAccountNumber && formData.creditAccountNumber === formData.debitAccountNumber) {
        setFormData(prev => ({ ...prev, creditAccountName: '' }));
        setErrors((e: any) => ({ ...e, creditAccountNumber: 'Beneficiary account must be different from sender account.' }));
        setIsLoading(false);
        return;
      }
      const resp = await fetch(`${API_BASE_URL}/Accounts/AccountNumExist/${formData.creditAccountNumber}`);
      if (resp.status === 200) {
        const payload = await resp.json();
        const account = payload.data ?? payload;
        setFormData(prev => ({ ...prev, creditAccountName: account.accountHolderName || account.name || '' }));
        setErrors((e: any) => ({ ...e, creditAccountNumber: undefined }));
      } else if (resp.status === 404) {
        setFormData(prev => ({ ...prev, creditAccountName: '' }));
        setErrors((e: any) => ({ ...e, creditAccountNumber: 'Beneficiary account not found.' }));
      } else {
        setFormData(prev => ({ ...prev, creditAccountName: '' }));
        setErrors((e: any) => ({ ...e, creditAccountNumber: `Account check failed: ${resp.status}` }));
      }
    } catch (err) {
      setFormData(prev => ({ ...prev, creditAccountName: '' }));
      setErrors((e: any) => ({ ...e, creditAccountNumber: 'An error occurred during account check.' }));
    }
    setIsLoading(false);
  }

  const [testOtp, setTestOtp] = useState<string | null>(null);
  const sendOTP = async () => {
    setIsLoading(true);
    setErrors({});
    try {
      if (!phone) {
        setErrors((e: any) => ({ ...e, otp: 'Phone number not found in session.' }));
        setIsLoading(false);
        return;
      }
      const resp = await sendFundTransferOTP(phone);
      // Try to extract OTP from backend response for testing
      if (resp && (resp.otp || resp.OTP || resp.testOtp)) {
        setTestOtp(resp.otp || resp.OTP || resp.testOtp);
      } else if (resp && resp.message && /\d{6}/.test(resp.message)) {
        setTestOtp(resp.message.match(/\d{6}/)[0]);
      } else {
        setTestOtp(null);
      }
      setOtpSent(true);
      setStep(2);
    } catch (err: any) {
      setErrors((e: any) => ({ ...e, otp: err?.response?.data?.message || 'Failed to send OTP' }));
    }
    setIsLoading(false);
  }

  const verifyOTP = () => {
    if (formData.otp.length !== 6 || !/^\d{6}$/.test(formData.otp)) {
      setErrors((e: any) => ({ ...e, otp: 'OTP must be a valid 6-digit code' }));
      return;
    }
    // Do not call backend verify here to avoid consuming OTP before submission
    setErrors({});
    setStep(3);
  }

  // Placeholder for selfie capture (should use real camera capture in production)


  const submitTransfer = async () => {
    setIsLoading(true)
    setErrors({})
    try {
      const payload = {
        phoneNumber: (phone || '') as string,
        branchId: branchInfo.id,
        debitAccountNumber: formData.debitAccountNumber,
        amount: formData.amount,
        creditAccountNumber: formData.creditAccountNumber,
        remark: formData.remark,
        otp: formData.otp
      };
      const res = await submitFundTransfer(payload)
      navigate('/fund-transfer-confirmation', {
        state: {
          referenceId: res?.referenceId || `FT-${Date.now()}`,
          debitAccount: formData.debitAccountNumber.replace(/.(?=.{4})/g, 'X'),
          creditAccount: formData.creditAccountNumber.replace(/.(?=.{4})/g, 'X'),
          amount: formData.amount,
          branch: branchInfo.name,
          token: (res?.tokenNumber || res?.TokenNumber) || Math.floor(1000 + Math.random() * 9000),
          window: (res?.windowNumber || res?.QueueNumber) || Math.floor(1 + Math.random() * 5)
        }
      })
    } catch (err: any) {
      setErrors((e: any) => ({ ...e, submit: err?.response?.data?.message || 'Submission failed' }))
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 to-white p-4 md:p-8">
  <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-fuchsia-100">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-fuchsia-700 to-fuchsia-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">Fund Transfer</h1>
          <div className="flex justify-between items-center mt-3 text-fuchsia-100 text-sm">
            <span>Branch: {branchInfo.name}</span>
            <span>{branchInfo.date}</span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-4">
          <div className="flex justify-between relative">
      {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex flex-col items-center z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                  ${step >= stepNum ? 'bg-fuchsia-600 text-white' : 'bg-fuchsia-100 text-fuchsia-600'} 
                  ${step === stepNum ? 'ring-4 ring-fuchsia-300' : ''}`}>
                  {stepNum}
                </div>
                <div className={`text-xs mt-1 ${step >= stepNum ? 'text-fuchsia-700 font-medium' : 'text-gray-400'}`}>
        {['Details', 'OTP', 'Confirm'][stepNum - 1]}
                </div>
              </div>
            ))}
            <div className="absolute h-1 bg-fuchsia-100 top-4 left-8 right-8">
              <div 
                className="h-1 bg-fuchsia-600 transition-all duration-500" 
                style={{ width: `${(step - 1) * 33.33}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              {/* Debit Account Section (auto-filled) */}
              <div className="bg-fuchsia-50 p-4 rounded-lg border border-fuchsia-100">
                <h2 className="text-lg font-semibold text-fuchsia-800 mb-3">From Account</h2>
                <div>
                  <label className="block text-sm font-medium text-fuchsia-700 mb-1">
                    Account Number *
                  </label>
                  <div className="flex">
                    {accountDropdown ? (
                      <select
                        name="debitAccountNumber"
                        value={formData.debitAccountNumber}
                        onChange={e => {
                          const value = e.target.value;
                          const selected = accounts.find((acc: any) => acc.accountNumber === value);
                          setFormData(prev => ({
                            ...prev,
                            debitAccountNumber: value,
                            debitAccountName: selected?.accountHolderName || ''
                          }));
                          localStorage.setItem('ft_debitAccountNumber', value);
                          localStorage.setItem('ft_debitAccountName', selected?.accountHolderName || '');
                        }}
                        className="flex-1 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 p-3"
                      >
                        <option value="">Select account</option>
                        {accounts.map((acc: any, idx: number) => (
                          <option key={(acc.accountNumber || idx).toString()} value={acc.accountNumber}>
                            {acc.accountNumber} - {acc.accountHolderName || acc.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        name="debitAccountNumber"
                        value={formData.debitAccountNumber}
                        readOnly
                        className="flex-1 rounded-lg border border-fuchsia-300 bg-fuchsia-50 p-3"
                        placeholder="Auto-filled"
                      />
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-fuchsia-700 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    name="debitAccountName"
                    value={formData.debitAccountName}
                    readOnly
                    className="w-full rounded-lg border border-fuchsia-300 bg-fuchsia-50 p-2"
                  />
                </div>
              </div>

              {/* Credit Account Section */}
              <div className="bg-fuchsia-50 p-4 rounded-lg border border-fuchsia-100">
                <h2 className="text-lg font-semibold text-fuchsia-800 mb-3">To Account</h2>
                
                <div>
                  <label className="block text-sm font-medium text-fuchsia-700 mb-1">
                    Beneficiary Account Number *
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      name="creditAccountNumber"
                      value={formData.creditAccountNumber}
                      onChange={handleChange}
                      className="flex-1 rounded-l-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 p-3"
                      placeholder="Enter account number"
                    />
                    <button
                      type="button"
                      onClick={validateCreditAccount}
                      className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-4 rounded-r-lg transition flex items-center"
                    >
                      {isLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : 'Verify'}
                    </button>
                  </div>
                  {errors.creditAccountNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.creditAccountNumber}</p>
                  )}
                </div>

                {formData.creditAccountName && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-fuchsia-700 mb-1">
                      Beneficiary Name
                    </label>
                    <input
                      type="text"
                      name="creditAccountName"
                      value={formData.creditAccountName}
                      readOnly
                      className="w-full rounded-lg border border-fuchsia-300 bg-fuchsia-50 p-2"
                    />
                  </div>
                )}
              </div>

              {/* Transfer Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-fuchsia-700 mb-1">
                    Amount (ETB) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 p-3"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-fuchsia-700 mb-1">
                    Amount in Words
                  </label>
                  <input
                    type="text"
                    name="amountInWords"
                    value={formData.amountInWords}
                    readOnly
                    className="w-full rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-3 text-gray-700"
                    placeholder="Auto-filled"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-fuchsia-700 mb-1">
                    Remark (Optional)
                  </label>
                  <textarea
                    name="remark"
                    value={formData.remark}
                    onChange={handleChange}
                    rows={2}
                    className="w-full rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 p-2"
                    placeholder="Purpose of transfer"
                  />
                </div>
              </div>

              <button
                onClick={async () => {
                  // Validate beneficiary account if not already validated
                  if (!formData.creditAccountName) {
                    await validateCreditAccount();
                    if (!formData.creditAccountName) return;
                  }
                  // Validate required fields
                  if (!formData.debitAccountName || !formData.creditAccountName || !formData.amount) return;
                  // Ensure beneficiary and sender accounts are different
                  if (formData.debitAccountNumber === formData.creditAccountNumber) {
                    setErrors((e: any) => ({ ...e, creditAccountNumber: 'Beneficiary account must be different from sender account' }));
                    return;
                  }
                  await sendOTP();
                }}
                disabled={!formData.debitAccountName || !formData.creditAccountNumber || !formData.amount}
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium py-3 px-4 rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending OTP...' : 'Continue to Verification'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-fuchsia-50 p-4 rounded-lg border border-fuchsia-100">
                <p className="text-sm text-fuchsia-600">OTP Sent to your registered phone</p>
                {testOtp && (
                  <p className="font-medium text-fuchsia-700">Test OTP: <span className="tracking-widest">{testOtp}</span></p>
                )}
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
                />
                {errors.otp && (
                  <p className="mt-1 text-sm text-red-600">{errors.otp}</p>
                )}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => setStep(1)}
                  className="text-fuchsia-600 hover:text-fuchsia-800 text-sm font-medium"
                >
                  Back
                </button>
                <button
                  onClick={verifyOTP}
                  disabled={formData.otp.length !== 6}
                  className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium py-2 px-6 rounded-lg shadow-md transition disabled:opacity-50"
                >
                  Verify OTP
                </button>
              </div>
            </div>
          )}



          {step === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-fuchsia-50 p-4 rounded-lg border border-fuchsia-100">
                <p className="text-sm text-fuchsia-600">Review Your Transfer</p>
                <p className="font-medium">Please confirm details before submission</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">From Account:</span>
                  <span className="font-medium">{formData.debitAccountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Holder:</span>
                  <span className="font-medium">{formData.debitAccountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To Account:</span>
                  <span className="font-medium">{formData.creditAccountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Beneficiary:</span>
                  <span className="font-medium">{formData.creditAccountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{formData.amount} ETB</span>
                </div>
                {formData.remark && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remark:</span>
                    <span className="font-medium">{formData.remark}</span>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-700">
                  Note: You will need to present valid ID at the counter to complete this transfer.
                </p>
              </div>

              <button
                onClick={submitTransfer}
                disabled={isLoading}
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium py-3 px-4 rounded-lg shadow-md transition disabled:opacity-70 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Submit Transfer Request'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}