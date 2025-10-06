import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { type TFunction } from 'i18next';
import speechService from '../../services/speechService';
import logo from '../../assets/logo.jpg';
import React from 'react';
import authService from '../../services/authService';

// --- Constants ---
const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_RESEND_COOLDOWN_SECONDS = 60;

// --- Reusable UI Components ---

interface FormInputProps {
  id: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  ariaLabel: string;
  autoFocus?: boolean;
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}

const FormInput: React.FC<FormInputProps> = React.memo((props) => {
  return (
    <input
      {...props}
      className="mt-1 block w-full rounded-md border-gray-300 focus:border-fuchsia-500 focus:ring-fuchsia-500 text-base p-2.5 transition-all duration-200 ease-in-out hover:border-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
    />
  );
});

interface FormButtonProps {
  disabled?: boolean;
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
  onClick?: () => void;
}

const FormButton: React.FC<FormButtonProps> = React.memo(({ disabled, children, ariaLabel, className, onClick }) => {
  return (
    <button
      type={onClick ? "button" : "submit"}
      disabled={disabled}
      onClick={onClick}
      className={`w-full bg-fuchsia-600 text-white py-2.5 rounded-md hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] text-base font-medium flex items-center justify-center shadow-sm hover:shadow-md ${className || ''}`}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
});

const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 4 }) => (
  <div className="flex items-center justify-center">
    <div 
      className="animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
      style={{ width: `${size * 0.25}rem`, height: `${size * 0.25}rem` }}
    />
    <span className="ml-2 text-sm">Processing...</span>
  </div>
);

// --- Custom Hooks for Logic Encapsulation ---

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
      setTimeout(() => otpRefs.current[index + 1]?.focus(), 10);
    }
  }, [otpDigits, length]);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        setTimeout(() => otpRefs.current[index - 1]?.focus(), 10);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }, [otpDigits, length]);

  const handleOtpPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!text) return;
    
    const newOtp = Array(length).fill('');
    for (let i = 0; i < text.length; i++) newOtp[i] = text[i];
    setOtpDigits(newOtp);
    
    const focusIndex = Math.min(text.length, length - 1);
    setTimeout(() => otpRefs.current[focusIndex]?.focus(), 10);
  }, [length]);
  
  const resetOtp = useCallback(() => {
    setOtpDigits(Array(length).fill(''));
  }, [length]);

  const isOtpComplete = useMemo(() => otpDigits.every(digit => digit !== ''), [otpDigits]);

  return { otpDigits, otpRefs, handleOtpChangeAt, handleOtpKeyDown, handleOtpPaste, resetOtp, isOtpComplete };
};

// --- UI Components for Each Step ---

interface RequestOtpFormProps {
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  handleRequestOtp: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  t: TFunction;
}

const RequestOtpForm: React.FC<RequestOtpFormProps> = React.memo(({ phoneNumber, setPhoneNumber, handleRequestOtp, loading, t }) => (
  <>
    <form onSubmit={handleRequestOtp} className="space-y-4">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-fuchsia-100 to-pink-100 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <p className="text-gray-600 text-sm">{t('enterPhonePrompt')}</p>
      </div>

      <div>
        <label htmlFor="phone-input" className="text-gray-700 font-medium text-sm block mb-1">{t('phoneNumber')}</label>
        <FormInput
          id="phone-input"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder={t('phonePlaceholder')}
          ariaLabel={t('phoneNumber')}
          autoFocus
          disabled={loading}
          inputMode="numeric"
        />
      </div>
      
      <FormButton disabled={!phoneNumber.trim() || loading} ariaLabel={t('requestOtp')}>
        {loading ? <LoadingSpinner /> : (
          <span className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            {t('requestOtp')}
          </span>
        )}
      </FormButton>
    </form>
    
    <div className="text-center pt-3 border-t border-gray-200">
      <span className="text-gray-600 text-sm">{t('noAccount')}</span>
      <Link to="/form/account-opening" className="ml-1.5 text-fuchsia-600 font-semibold hover:text-fuchsia-700 transition-colors text-sm inline-flex items-center">
        {t('createAccount')}
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </Link>
    </div>
  </>
));

interface VerifyOtpFormProps {
  submitOtp: () => void;
  loading: boolean;
  effectivePhone: string;
  resendCooldown: number;
  requestOtpDirect: () => void;
  handleBack: () => void;
  maskPhone: (phone: string) => string;
  t: TFunction;
  otpInput: ReturnType<typeof useOtpInput>;
}

const VerifyOtpForm: React.FC<VerifyOtpFormProps> = React.memo(({ submitOtp, loading, effectivePhone, resendCooldown, requestOtpDirect, handleBack, maskPhone, t, otpInput }) => {
  const { otpDigits, otpRefs, handleOtpChangeAt, handleOtpKeyDown, handleOtpPaste, isOtpComplete } = otpInput;

  return (
    <form onSubmit={(e) => { e.preventDefault(); submitOtp(); }} className="space-y-4">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <p className="text-gray-600 text-sm">{t('enterOtp')}</p>
        <p className="text-xs text-gray-500 mt-1">Code sent to: <span className="font-medium text-gray-700">{maskPhone(effectivePhone) || '—'}</span></p>
      </div>

      <fieldset>
        <legend className="sr-only">{t('enterOtp')}</legend>
        <div className="grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
          {otpDigits.map((d, idx) => (
            <input
              key={idx}
              ref={(el) => { otpRefs.current[idx] = el; }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              className={`w-full text-center text-lg p-2.5 border-2 rounded-md transition-all duration-200 focus:ring-2 focus:border-fuchsia-500 focus:ring-fuchsia-200 ${d ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-gray-300 hover:border-gray-400'} ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              value={d}
              onChange={(e) => handleOtpChangeAt(idx, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
              aria-label={`OTP digit ${idx + 1}`}
              disabled={loading}
            />
          ))}
        </div>
      </fieldset>
      
      <FormButton disabled={!isOtpComplete || loading} ariaLabel={t('verifyOtp')}>
        {loading ? <LoadingSpinner /> : (
          <span className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('verifyOtp')}
          </span>
        )}
      </FormButton>
      
      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <button type="button" onClick={handleBack} disabled={loading} className="text-fuchsia-600 hover:text-fuchsia-700 text-sm font-medium inline-flex items-center transition-colors disabled:opacity-50" aria-label={t('backToPhone')}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('backToPhone')}
        </button>
        
        <button type="button" onClick={() => { if (resendCooldown === 0) requestOtpDirect(); }} disabled={resendCooldown > 0 || loading} className="text-fuchsia-600 hover:text-fuchsia-700 text-sm font-medium inline-flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label={t('resendOtp')}>
          {resendCooldown > 0 ? (
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('resendTimer', { seconds: resendCooldown })}
            </span>
          ) : (
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('resendOtp')}
            </span>
          )}
        </button>
      </div>
    </form>
  );
});

// --- Main Component ---

const OTPLogin: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login, setPhone } = useAuth();

  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [effectivePhone, setEffectivePhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [resendAttempts, setResendAttempts] = useState<number>(0);

  const { resendCooldown, startResendCooldown, clearResendCooldown } = useResendCooldown();
  const otpInput = useOtpInput(OTP_LENGTH);

  useEffect(() => {
    const storedPhone = localStorage.getItem('phone');
    const urlParamPhone = new URLSearchParams(window.location.search).get('phone');
    const initial = urlParamPhone || storedPhone;
    if (initial) setPhoneNumber(initial);
  }, []);

  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => otpInput.otpRefs.current[0]?.focus(), 100);
    }
  }, [step, otpInput.otpRefs]);

  const normalizePhone = (raw: string) => {
    const cleaned = raw.trim().replace(/[^\d+]/g, '');
    const digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
    if (/^0[79]\d{8}$/.test(digits)) return `+251${digits.slice(1)}`;
    if (/^[79]\d{8}$/.test(digits)) return `+251${digits}`;
    if (/^251[79]\d{8}$/.test(digits)) return `+${digits}`;
    return raw.trim();
  };

  const maskPhone = (p: string) => {
    const n = normalizePhone(p);
    return /^\+251[79]\d{8}$/.test(n) ? `${n.slice(0, 6)}****${n.slice(-2)}` : '';
  };

  const handleAuthError = useCallback((error: any): string => {
    if (error?.response?.status === 429) return t('rateLimitExceeded');
    if (error?.response?.status >= 500) return t('serverError');
    return error?.response?.data?.message || error?.message || t('unexpectedError');
  }, [t]);

  const validatePhoneNumber = (phone: string): boolean => {
    const normalized = normalizePhone(phone);
    return /^\+251[79]\d{8}$/.test(normalized);
  };

  const requestOtpDirect = useCallback(async () => {
    setError('');
    setMessage('');

    if (!phoneNumber.trim()) {
      setError(t('phoneRequired'));
      return;
    }
    if (!validatePhoneNumber(phoneNumber)) {
      setError(t('invalidEthiopianNumber'));
      return;
    }

    setLoading(true);
    let phoneToSend = normalizePhone(phoneNumber);
    let success = false;

    try {
      const response = await authService.requestOtp(phoneToSend);
      setMessage(response.message || t('otpSent'));
      success = true;
    } catch (err: any) {
      console.warn('First OTP attempt failed, trying alternative format.', err);
      phoneToSend = phoneToSend.startsWith('+251') ? '0' + phoneToSend.slice(-9) : '+251' + phoneToSend.slice(-9);
      try {
        const response = await authService.requestOtp(phoneToSend);
        setMessage(response.message || t('otpSent'));
        success = true;
      } catch (finalErr: any) {
        setError(handleAuthError(finalErr));
        console.error('Request OTP Error (secondary attempt):', finalErr);
      }
    }

    if (success) {
      setStep('verify');
      setEffectivePhone(phoneToSend);
      setPhone(phoneToSend);
      const nextAttempts = step === 'request' ? 0 : resendAttempts + 1;
      setResendAttempts(nextAttempts);
      startResendCooldown(nextAttempts >= 3 ? MAX_RESEND_COOLDOWN_SECONDS : RESEND_COOLDOWN_SECONDS);
    }
    setLoading(false);
  }, [phoneNumber, t, step, resendAttempts, startResendCooldown, handleAuthError, setPhone]);

  const handleRequestOtp = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await requestOtpDirect();
  }, [requestOtpDirect]);

  const submitOtp = useCallback(async () => {
    if (loading) return;
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const otpValue = otpInput.otpDigits.join('');
      const response = await authService.loginWithOtp(effectivePhone, otpValue);
      
      const token = response.data?.token;
      if (!token) throw new Error('No token received');
      
      login(token);
      navigate('/dashboard', { replace: true });

    } catch (err: any) {
      setError(handleAuthError(err));
      console.error('Login with OTP Error:', err);
      otpInput.resetOtp();
      setTimeout(() => otpInput.otpRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  }, [effectivePhone, navigate, otpInput, login, handleAuthError, loading]);

  useEffect(() => {
    if (otpInput.isOtpComplete) {
      submitOtp();
    }
  }, [otpInput.isOtpComplete, submitOtp]);

  const handleBackToRequest = () => {
    setStep('request');
    otpInput.resetOtp();
    setError('');
    setMessage('');
    clearResendCooldown();
    setResendAttempts(0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fuchsia-50 via-white to-pink-50 px-4 py-8">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl p-6 sm:p-8 space-y-4 border border-fuchsia-100">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
              <img src={logo} alt={t('logoAlt')} className="h-8 w-8 object-contain rounded-full" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide">{t('bankName')}</h1>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              {t('welcome')}
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-fuchsia-400 to-pink-400 rounded-full mx-auto"></div>
          </div>

          {/* Speech Button */}
          <button
            type="button"
            onClick={() => speechService.speak(`${t('bankName')}. ${t('welcome')}. ${t('enterPhonePrompt')}`, i18n.language.startsWith('am') ? 'am' : 'en')}
            className="inline-flex items-center px-3 py-1.5 bg-white border border-fuchsia-200 text-fuchsia-700 rounded-full hover:bg-fuchsia-50 transition-all duration-200 text-xs font-medium shadow-sm hover:shadow-md"
            aria-label={t('speakWelcome', 'Speak welcome message')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            {t('speakButton', 'Speak')}
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center space-x-2 pt-2">
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step === 'request' ? 'bg-fuchsia-600 scale-110' : 'bg-gray-300'}`}></div>
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step === 'verify' ? 'bg-fuchsia-600 scale-110' : 'bg-gray-300'}`}></div>
        </div>

        {/* Messages */}
        <div aria-live="polite" className="!mt-4 space-y-2">
          {message && (
            <div className="p-2.5 bg-green-50 border border-green-200 rounded-md flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-800 text-sm font-medium">{message}</p>
            </div>
          )}
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-md flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Form Content */}
        <div className="!mt-4">
          {step === 'request' ? (
            <RequestOtpForm
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              handleRequestOtp={handleRequestOtp}
              loading={loading}
              t={t}
            />
          ) : (
            <VerifyOtpForm
              submitOtp={submitOtp}
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

        {/* Footer */}
        <div className="text-center pt-3 !mt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            Secure authentication • {new Date().getFullYear()} • CBE Digital Services
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPLogin;