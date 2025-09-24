import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { type TFunction } from 'i18next';
import { speak } from '../../lib/speechSynthesis';
import logo from '../../assets/logo.jpg';
import React from 'react';
import authService from '../../services/authService';

// Reusable Input component (No changes)
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

const FormInput: React.FC<FormInputProps> = React.memo(({
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
});

// Reusable Button component (No changes)
interface FormButtonProps {
  disabled?: boolean;
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
}

const FormButton: React.FC<FormButtonProps> = React.memo(({
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
});

// --- Custom Hooks for Logic Encapsulation ---

/**
 * Manages the OTP resend cooldown timer.
 */
const useResendCooldown = () => {
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startResendCooldown = useCallback((durationSeconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendCooldown(durationSeconds);
    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const clearResendCooldown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendCooldown(0);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { resendCooldown, startResendCooldown, clearResendCooldown };
};

/**
 * Manages the state and interactions of the segmented OTP input.
 */
const useOtpInput = (length: number) => {
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(length).fill(''));
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    otpRefs.current = otpRefs.current.slice(0, length);
  }, [length]);

  const handleOtpChangeAt = useCallback((index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(0, 1);
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);

    if (digit && index < length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }, [otpDigits, length]);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }, [otpDigits, length]);

  const handleOtpPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!text) return;
    e.preventDefault();
    const newOtp = Array(length).fill('');
    for (let i = 0; i < text.length; i++) newOtp[i] = text[i];
    setOtpDigits(newOtp);
    const focusIndex = Math.min(text.length, length) - 1;
    if (focusIndex >= 0) otpRefs.current[focusIndex]?.focus();
  }, [length]);
  
  const resetOtp = useCallback(() => {
    setOtpDigits(Array(length).fill(''));
  }, [length]);

  return { otpDigits, otpRefs, handleOtpChangeAt, handleOtpKeyDown, handleOtpPaste, resetOtp };
};


// --- UI Components for Each Step ---

interface RequestOtpFormProps {
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  handleRequestOtp: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string;
  t: TFunction;
}

const RequestOtpForm: React.FC<RequestOtpFormProps> = React.memo(({ phoneNumber, setPhoneNumber, handleRequestOtp, loading, error, t }) => (
  <>
    <form onSubmit={handleRequestOtp} className="space-y-4">
      <label className="block" htmlFor="phone-input">
        <span className="text-gray-700 font-medium text-base">{t('phoneNumber')}</span>
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
      <FormButton disabled={!phoneNumber || loading} ariaLabel={t('requestOtp')}>
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
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
      <Link to="/form/account-opening" className="ml-2 text-fuchsia-700 font-semibold hover:underline hover:text-fuchsia-800 transition-colors text-sm">
        {t('createAccount')}
      </Link>
    </div>
  </>
));

interface VerifyOtpFormProps {
  handleLoginWithOtp: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  effectivePhone: string;
  resendCooldown: number;
  requestOtpDirect: () => void;
  handleBack: () => void;
  maskPhone: (phone: string) => string;
  t: TFunction;
  otpInput: ReturnType<typeof useOtpInput>;
}

const VerifyOtpForm: React.FC<VerifyOtpFormProps> = React.memo(({ handleLoginWithOtp, loading, effectivePhone, resendCooldown, requestOtpDirect, handleBack, maskPhone, t, otpInput }) => {
  const { otpDigits, otpRefs, handleOtpChangeAt, handleOtpKeyDown, handleOtpPaste } = otpInput;

  return (
    <form onSubmit={handleLoginWithOtp} className="space-y-4">
      <label className="block" htmlFor="otp-input">
        <span className="text-gray-700 font-medium text-base">{t('enterOtp')}</span>
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
        <p className="mt-2 text-xs text-gray-500">Code sent to: <span className="font-medium">{maskPhone(effectivePhone) || '—'}</span></p>
      </label>
      <FormButton disabled={otpDigits.join('').length !== 6 || loading} ariaLabel={t('verifyOtp')}>
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            {t('verifying')}
          </span>
        ) : (
          t('verifyOtp')
        )}
      </FormButton>
      <div className="flex justify-between items-center mt-2">
        <button type="button" onClick={handleBack} className="text-fuchsia-700 hover:underline text-xs font-medium" disabled={loading} aria-label={t('backToPhone')}>
          &larr; {t('backToPhone')}
        </button>
        <button type="button" onClick={() => { if (resendCooldown === 0) requestOtpDirect(); }} disabled={resendCooldown > 0 || loading} className="text-fuchsia-700 hover:underline text-xs font-medium disabled:opacity-50" aria-label={t('resendOtp')}>
          {resendCooldown > 0 ? t('resendTimer', { seconds: resendCooldown }) : t('resendOtp')}
        </button>
      </div>
    </form>
  );
});


// --- Main Component ---

const OTPLogin: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setPhone, login } = useAuth();

  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [effectivePhone, setEffectivePhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [resendAttempts, setResendAttempts] = useState<number>(0);

  const { resendCooldown, startResendCooldown, clearResendCooldown } = useResendCooldown();
  const otpInput = useOtpInput(6);

  useEffect(() => {
    const storedPhone = localStorage.getItem('phone');
    if (storedPhone) {
      setPhoneNumber(storedPhone);
    }
  }, []);

  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => otpInput.otpRefs.current[0]?.focus(), 0);
    }
  }, [step, otpInput.otpRefs]);

  const normalizePhone = (raw: string) => {
    const cleaned = raw.trim().replace(/[^\d+]/g, '');
    const digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
    if (/^0[79]\d{8}$/.test(digits)) return `+251${digits.slice(1)}`;
    if (/^[79]\d{8}$/.test(digits)) return `+251${digits}`;
    if (/^251[79]\d{8}$/.test(digits)) return `+${digits}`;
    return raw.trim(); // Fallback
  };

  const maskPhone = (p: string) => {
    const n = normalizePhone(p);
    return /^\+251[79]\d{8}$/.test(n) ? `${n.slice(0, 6)}****${n.slice(-2)}` : '';
  };

  const requestOtpDirect = useCallback(async () => {
    setError('');
    setMessage('');
    setLoading(true);

    const normalized = normalizePhone(phoneNumber);
    if (!/^\+251[79]\d{8}$/.test(normalized)) {
      setError('Please enter a valid Ethiopian mobile number (09XXXXXXXX or +2519XXXXXXXX).');
      setLoading(false);
      return;
    }

    let phoneToSend = normalized;
    let success = false;

    try {
      const response = await authService.requestOtp(phoneToSend);
      setMessage(response.message || t('otpSent'));
      success = true;
    } catch (err) {
      console.warn('First OTP attempt failed, trying alternative format.', err);
      phoneToSend = '0' + normalized.slice(-9);
      try {
        const response = await authService.requestOtp(phoneToSend);
        setMessage(response.message || t('otpSent'));
        success = true;
      } catch (finalErr: any) {
        const msg = finalErr?.message || finalErr?.response?.data?.message || t('otpSendError');
        setError(typeof msg === 'string' ? msg : t('otpSendError'));
        console.error('Request OTP Error (secondary attempt):', finalErr);
      }
    }

    if (success) {
      setStep('verify');
      setEffectivePhone(phoneToSend);
      const nextAttempts = step === 'request' ? 0 : resendAttempts + 1;
      setResendAttempts(nextAttempts);
      startResendCooldown(nextAttempts >= 3 ? 60 : 30);
    }
    setLoading(false);
  }, [phoneNumber, t, step, resendAttempts, startResendCooldown]);

  const handleRequestOtp = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await requestOtpDirect();
  }, [requestOtpDirect]);

  const handleLoginWithOtp = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const otpValue = otpInput.otpDigits.join('');
      const response = await authService.loginWithOtp(effectivePhone, otpValue);
      
      // Save the authentication token
      const token = response.token;
      if (!token) {
        throw new Error('No token received');
      }
      
      // Get user data from response or use defaults
      const userData = {
        id: response.userId || `temp_${Date.now()}`,
        email: response.email || `${effectivePhone}@cbe.et`,
        role: response.role || 'Customer',
        firstName: response.firstName || 'Guest',
        lastName: response.lastName || 'User',
        branchId: response.branchId
      };
      
      // Login with the token and user data
      login(token, userData);
      
      // Always navigate to Customer Dashboard after OTP login
      navigate('/customer/dashboard', { replace: true });

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || t('invalidOtp') || 'Login failed. Please try again.';
      setError(errorMessage);
      console.error('Login with OTP Error:', err);
      
      // Reset OTP on error for security
      otpInput.resetOtp();
      if (otpInput.otpRefs.current[0]) {
        otpInput.otpRefs.current[0].focus();
      }
    } finally {
      setLoading(false);
    }
  }, [effectivePhone, navigate, otpInput.otpDigits, setPhone, t]);

  const handleBackToRequest = () => {
    setStep('request');
    otpInput.resetOtp();
    setError('');
    setMessage('');
    clearResendCooldown();
    setResendAttempts(0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf6e9] px-2">
      <div className="w-full max-w-sm bg-white shadow-xl rounded-xl p-4 sm:p-6 space-y-6">
        <div>
          <div className="text-center space-y-2">
            <h1 className="text-base font-semibold text-gray-900 uppercase">{t('bankName')}</h1>
            <div className="w-20 h-20 mx-auto">
              <img src={logo} alt={t('logoAlt')} className="h-16 w-16 object-contain mx-auto rounded-full border-2 border-fuchsia-200" />
            </div>
            <h2 className="text-2xl font-extrabold text-fuchsia-700">{t('welcome')}</h2>
            <h2 className="text-base font-semibold text-gray-800">{t('enterPhonePrompt')}</h2>
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

          <div aria-live="polite" className="min-h-[1.25rem] mt-4">
            {message && <p className="text-green-600 text-center text-sm">{message}</p>}
            {error && <p className="text-red-600 text-center text-sm">{error}</p>}
          </div>

          {step === 'request' ? (
            <RequestOtpForm
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              handleRequestOtp={handleRequestOtp}
              loading={loading}
              error={error}
              t={t}
            />
          ) : (
            <VerifyOtpForm
              handleLoginWithOtp={handleLoginWithOtp}
              loading={loading}
              effectivePhone={effectivePhone}
              resendCooldown={resendCooldown}
              requestOtpDirect={requestOtpDirect}
              handleBack={handleBackToRequest}
              maskPhone={maskPhone}
              t={t}
              otpInput={otpInput}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPLogin;
