import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { speak } from '../../lib/speechSynthesis';
import logo from '../../assets/logo.jpg';
import React from 'react';
import authService from '../../services/authService';
import QRLogin from '../../QRLogin';

// Reusable Input component
interface FormInputProps {
  id: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  ariaLabel: string;
  ariaInvalid?: boolean;
  ariaDescribedby?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
  maxLength?: number;
}

const FormInput: React.FC<FormInputProps> = ({
  id,
  type,
  value,
  onChange,
  placeholder,
  ariaLabel,
  ariaInvalid,
  ariaDescribedby,
  autoFocus,
  disabled,
  inputMode,
  pattern,
  maxLength,
}) => {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="mt-2 block w-full rounded-lg border-gray-300 focus:border-fuchsia-500 focus:ring-fuchsia-500 text-lg p-3"
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedby}
      autoFocus={autoFocus}
      disabled={disabled}
      inputMode={inputMode}
      pattern={pattern}
      maxLength={maxLength}
    />
  );
};

// Reusable Button component
interface FormButtonProps {
  disabled?: boolean;
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
}

const FormButton: React.FC<FormButtonProps> = ({
  disabled,
  children,
  ariaLabel,
  className,
}) => {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`w-full bg-fuchsia-700 text-white py-3 rounded-lg hover:bg-fuchsia-800 disabled:opacity-50 transition text-lg font-medium flex items-center justify-center ${className || ''}`}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

const OTPLogin: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { setPhone } = useAuth();
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [resendTimer, setResendTimer] = useState<NodeJS.Timeout | null>(null);
  const [effectivePhone, setEffectivePhone] = useState<string>('');
  const [resendAttempts, setResendAttempts] = useState<number>(0); // count resends after first send
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Start cooldown timer when OTP is sent
  const startResendCooldown = (durationSeconds: number = 30) => {
    if (resendCooldown > 0) return; // prevent duplicate timers
    setResendCooldown(durationSeconds);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
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

  // Send OTP handler (for form submit)
  const handleRequestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await requestOtpDirect();
  };

  // Normalize and validate Ethiopian mobile (07/09 series)
  // Accept: 07XXXXXXXX, 09XXXXXXXX, 7XXXXXXXX, 9XXXXXXXX, 2517XXXXXXXX, 2519XXXXXXXX, +2517XXXXXXXX, +2519XXXXXXXX
  // Normalize to: +2517XXXXXXXX or +2519XXXXXXXX
  const normalizePhone = (raw: string) => {
    const trimmed = raw.trim();
    // Remove spaces, dashes, parentheses
    const cleaned = trimmed.replace(/[^\d+]/g, '');
    // Remove leading + for uniform processing, track it implicitly
    const digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;

    // Cases
    // 1) 0[7|9]XXXXXXXX (10 digits)
    if (/^0[79]\d{8}$/.test(digits)) {
      return `+251${digits.slice(1)}`;
    }
    // 2) [7|9]XXXXXXXX (9 digits)
    if (/^[79]\d{8}$/.test(digits)) {
      return `+251${digits}`;
    }
    // 3) 251[7|9]XXXXXXXX (12 digits)
    if (/^251[79]\d{8}$/.test(digits)) {
      return `+${digits}`;
    }
    // 4) + already removed, but handle '++' oddities
    // Fallback: return original trimmed (will be invalid if it doesn't match)
    return trimmed;
  };

  // Note: validation is performed inline against normalized pattern

  // Send OTP handler (no event, for button)
  const requestOtpDirect = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const normalized = normalizePhone(phoneNumber);
      if (!/^\+251[79]\d{8}$/.test(normalized)) {
        setError('Please enter a valid Ethiopian mobile number (09XXXXXXXX or +2519XXXXXXXX).');
        setLoading(false);
        return;
      }
      // Try with normalized first
      try {
        const response = await authService.requestOtp(normalized);
        setMessage(response.message || t('otpSent'));
        setStep('verify');
        setEffectivePhone(normalized);
        // first send from request step uses base cooldown and resets attempts
        if (step === 'request') {
          setResendAttempts(0);
          startResendCooldown(30);
        } else {
          const next = resendAttempts + 1;
          setResendAttempts(next);
          startResendCooldown(next >= 3 ? 60 : 30);
        }
        setLoading(false);
        return;
      } catch (primaryErr: any) {
        // If not found, retry with local 0-prefixed format
        const local = '0' + normalized.slice(-9); // 0 + last 9 digits
        try {
          const response2 = await authService.requestOtp(local);
          setMessage(response2.message || t('otpSent'));
          setStep('verify');
          setEffectivePhone(local);
          if (step === 'request') {
            setResendAttempts(0);
            startResendCooldown(30);
          } else {
            const next = resendAttempts + 1;
            setResendAttempts(next);
            startResendCooldown(next >= 3 ? 60 : 30);
          }
          setLoading(false);
          return;
        } catch (secondaryErr: any) {
          throw secondaryErr;
        }
      }
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || err?.response?.data || t('otpSendError');
      setError(typeof msg === 'string' ? msg : t('otpSendError'));
      console.error('Request OTP Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP handler
  const handleLoginWithOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // Use the phone format that succeeded during request
      const toUse = effectivePhone || normalizePhone(phoneNumber);
      const otpValue = otpDigits.join('');
      const response: { message: string; token?: string } = await authService.loginWithOtp(toUse, otpValue);
      console.log('Login with OTP Response at ui:', response);
      
      setMessage(response.message || t('loginSuccessful'));
      
      // Set the phone number in AuthContext and wait for it to be set
      await new Promise<void>((resolve) => {
        setPhone(toUse);
        // Small delay to ensure state is updated
        setTimeout(resolve, 100);
      });
      
      // Store the phone number in localStorage as well
      localStorage.setItem('phone', toUse);
      
      // Navigate after ensuring phone is set
      navigate('/customer/dashboard'); // Redirect to the customer dashboard
    } catch (err: any) {
      setError(
        err.response?.data?.message || t('invalidOtp')
      );
      console.error('Login with OTP Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Masked phone preview helper
  const maskPhone = (p: string) => {
    const n = normalizePhone(p);
    if (!/^\+251[79]\d{8}$/.test(n)) return '';
    // Keep first 6 chars, mask middle 4, keep last 2
    return `${n.slice(0, 6)}****${n.slice(-2)}`;
  };

  // OTP segmented handlers
  const handleOtpChangeAt = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(0, 1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    // move focus
    if (digit && index < otpRefs.current.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevIndex = index - 1;
      const next = [...otpDigits];
      next[prevIndex] = '';
      setOtpDigits(next);
      otpRefs.current[prevIndex]?.focus();
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
      e.preventDefault();
    }
    if (e.key === 'ArrowRight' && index < otpRefs.current.length - 1) {
      otpRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
    if (e.key === 'Escape') {
      // go back and clear
      setOtpDigits(['', '', '', '', '', '']);
      setStep('request');
      e.preventDefault();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = ['','','','','',''];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtpDigits(next);
    // focus last filled
    const last = Math.min(text.length, 6) - 1;
    if (last >= 0) otpRefs.current[last]?.focus();
    e.preventDefault();
  };

  // Focus first OTP box when entering verify step
  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 0);
    }
  }, [step]);

  // Helper: paste from clipboard button
  const pasteOtpFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const code = text.replace(/\D/g, '').slice(0, 6);
      if (!code) return;
      const next = ['','','','','',''];
      for (let i = 0; i < code.length; i++) next[i] = code[i];
      setOtpDigits(next);
      const last = Math.min(code.length, 6) - 1;
      if (last >= 0) otpRefs.current[last]?.focus();
    } catch (e) {
      // ignore clipboard errors silently
    }
  };

  useEffect(() => {
    const storedPhone = localStorage.getItem('phone');
    if (storedPhone) {
      setPhoneNumber(storedPhone);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf6e9] px-2">
      <div className="w-full max-w-sm bg-white shadow-xl rounded-xl p-4 sm:p-6 space-y-6">
        <div>
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <h1 className="text-base font-semibold text-gray-900 uppercase">
              {t('bankName')}
            </h1>
            <div className="w-20 h-20 mx-auto">
              <img
                src={logo}
                alt={t('logoAlt')}
                className="h-16 w-16 object-contain mx-auto rounded-full border-2 border-fuchsia-200"
              />
            </div>
            <h2 className="text-2xl font-extrabold text-fuchsia-700">{t('welcome')}</h2>
            <h2 className="text-base font-semibold text-gray-800">
              {t('enterPhonePrompt')}
            </h2>
            {/* Speak Button */}
            <button
              type="button"
              onClick={() => speak(`${t('bankName')}. ${t('welcome')}. ${t('enterPhonePrompt')}`, i18n.language.startsWith('am') ? 'am' : 'en')}
              className="mt-2 inline-flex items-center px-3 py-1.5 bg-fuchsia-100 text-fuchsia-700 rounded hover:bg-fuchsia-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
              aria-label="Speak bank name, welcome and prompt message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5v14m-7-7h14" /></svg>
              {i18n.language.startsWith('am') ? 'አንባብ' : 'Speak'}
            </button>
          </div>

          {/* Message and Error Display */}
          <div aria-live="polite" className="min-h-[1.25rem]">
            {message && <p className="text-green-600 text-center text-sm">{message}</p>}
            {error && <p className="text-red-600 text-center text-sm">{error}</p>}
          </div>

          {/* Step 1: Enter Phone Number */}
          {step === 'request' && (
            <>
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <label className="block" htmlFor="phone-input">
                  <span className="text-gray-700 font-medium text-base">
                    {t('phoneNumber')}
                  </span>
                  <FormInput
                    id="phone-input"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={t('phonePlaceholder')}
                    ariaLabel={t('phoneNumber')}
                    ariaInvalid={!!error}
                    ariaDescribedby="phone-error"
                    autoFocus
                    disabled={loading}
                    inputMode="numeric"
                    pattern="[+0-9 ]*"
                  />
                </label>
                <FormButton
                  disabled={!phoneNumber || loading}
                  ariaLabel={t('requestOtp')}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        ></path>
                      </svg>
                      {t('sendingOtp')}
                    </span>
                  ) : (
                    t('requestOtp')
                  )}
                </FormButton>
              </form>
              <div className="text-center mt-4">
                <span className="text-gray-700 text-sm">{t('noAccount')}</span>
                <Link
                  to="/form/account-opening"
                  className="ml-2 text-fuchsia-700 font-semibold hover:underline hover:text-fuchsia-800 transition-colors text-sm"
                >
                  {t('createAccount')}
                </Link>
              </div>
            </>
          )}

          {/* Step 2: Enter OTP */}
          {step === 'verify' && (
            <form onSubmit={handleLoginWithOtp} className="space-y-4">
              <label className="block" htmlFor="otp-input">
                <span className="text-gray-700 font-medium text-base">
                  {t('enterOtp')}
                </span>
                {/* Segmented OTP Inputs */}
                <div className="mt-2 grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
                  {otpDigits.map((d, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpRefs.current[idx] = el; }}
                      type="tel"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={1}
                      className="w-full text-center text-xl p-2 border rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500"
                      value={d}
                      onChange={(e) => handleOtpChangeAt(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      aria-label={`OTP digit ${idx + 1}`}
                      disabled={loading}
                    />
                  ))}
                </div>
                {/* Target phone info */}
                <p className="mt-2 text-xs text-gray-500">Code sent to: <span className="font-medium">{maskPhone(effectivePhone || phoneNumber) || '—'}</span></p>
              </label>
              <FormButton
                disabled={otpDigits.join('').length !== 6 || loading}
                ariaLabel={t('verifyOtp')}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      ></path>
                    </svg>
                    {t('verifying')}
                  </span>
                ) : (
                  t('verifyOtp')
                )}
              </FormButton>
              <div className="flex justify-between items-center mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('request');
                    setOtpDigits(['','','','','','']);
                    setError('');
                    setMessage('');
                    if (resendTimer) clearInterval(resendTimer);
                    setResendCooldown(0);
                    setResendAttempts(0);
                  }}
                  className="text-fuchsia-700 hover:underline text-xs font-medium"
                  disabled={loading}
                  aria-label={t('backToPhone')}
                >
                  &larr; {t('backToPhone')}
                </button>
                <button
                  type="button"
                  onClick={() => { if (resendCooldown === 0) requestOtpDirect(); }}
                  disabled={resendCooldown > 0 || loading}
                  className="text-fuchsia-700 hover:underline text-xs font-medium disabled:opacity-50"
                  aria-label={t('resendOtp')}
                >
                  {resendCooldown > 0
                    ? t('resendTimer', { seconds: resendCooldown })
                    : t('resendOtp')}
                </button>
                <button
                  type="button"
                  onClick={pasteOtpFromClipboard}
                  disabled={loading}
                  className="text-fuchsia-700 hover:underline text-xs font-medium"
                  aria-label="Paste code from clipboard"
                >
                  Paste code
                </button>
              </div>
            </form>
          )}
        <div className="mt-6">
          <hr className="border-t border-gray-300" />
          <QRLogin />
        </div>
        </div>
      </div>
    </div>
  );
};

export default OTPLogin;