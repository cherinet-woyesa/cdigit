import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { type TFunction } from 'i18next';
import speechService from '../../services/speechService';
import logo from '../../assets/logo.jpg';
import React from 'react';
import authService from '../../services/authService';
import { 
    Loader2, 
    AlertCircle, 
    CheckCircle2, 
    ChevronRight,
    Phone,
    Shield,
    ArrowLeft,
    RefreshCw,
    Volume2
} from 'lucide-react';

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
      className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
    />
  );
});

interface FormButtonProps {
  disabled?: boolean;
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

const FormButton: React.FC<FormButtonProps> = React.memo(({ disabled, children, ariaLabel, className, onClick, type = "button" }) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`w-full bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center ${className || ''}`}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
});

// --- Error and Success Message Components ---

function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{message}</span>
        </div>
    );
}

function SuccessMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-green-700">{message}</span>
        </div>
    );
}

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
    <form onSubmit={handleRequestOtp} className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-amber-400 to-fuchsia-600 rounded-lg flex items-center justify-center">
          <Phone className="w-6 h-6 text-white" />
        </div>
        <p className="text-gray-600">{t('enterPhonePrompt')}</p>
      </div>

      <div>
        <label htmlFor="phone-input" className="block text-sm font-medium text-gray-700 mb-2">
          {t('phoneNumber')}
        </label>
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
      
      <FormButton 
        disabled={!phoneNumber.trim() || loading} 
        ariaLabel={t('requestOtp')}
        type="submit"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('requestingOtp')}
          </>
        ) : (
          <>
            <Shield className="h-4 w-4" />
            {t('requestOtp')}
          </>
        )}
      </FormButton>
    </form>
    
    <div className="text-center pt-4 border-t border-gray-200 mt-6">
      <span className="text-gray-600 text-sm">{t('noAccount')}</span>
      <Link to="/form/account-opening" className="ml-2 text-fuchsia-700 font-semibold hover:text-fuchsia-800 transition-colors text-sm">
        {t('createAccount')}
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
    <form onSubmit={(e) => { e.preventDefault(); submitOtp(); }} className="space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-amber-400 to-fuchsia-600 rounded-lg flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <p className="text-gray-600">{t('enterOtp')}</p>
        <p className="text-xs text-gray-500 mt-1">
          {t('codeSentTo')} <span className="font-medium text-gray-700">{maskPhone(effectivePhone) || '—'}</span>
        </p>
      </div>

      <fieldset>
        <legend className="sr-only">{t('enterOtp')}</legend>
        <div className="grid grid-cols-6 gap-3" onPaste={handleOtpPaste}>
          {otpDigits.map((d, idx) => (
            <input
              key={idx}
              ref={(el) => { otpRefs.current[idx] = el; }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              className={`w-full text-center text-lg p-3 border-2 rounded-lg transition-all ${d ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-gray-300 hover:border-gray-400'} ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              value={d}
              onChange={(e) => handleOtpChangeAt(idx, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
              aria-label={`${t('otpDigit')} ${idx + 1}`}
              disabled={loading}
            />
          ))}
        </div>
      </fieldset>
      
      <FormButton 
        disabled={!isOtpComplete || loading} 
        ariaLabel={t('verifyOtp')}
        type="submit"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('verifyingOtp')}
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" />
            {t('verifyOtp')}
          </>
        )}
      </FormButton>
      
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-6">
        <button 
          type="button" 
          onClick={handleBack} 
          disabled={loading}
          className="text-fuchsia-700 hover:text-fuchsia-800 text-sm font-medium flex items-center gap-1 disabled:opacity-50"
          aria-label={t('backToPhone')}
        >
          <ArrowLeft className="h-4 w-4" />
          {t('back')}
        </button>
        
        <button 
          type="button" 
          onClick={() => { if (resendCooldown === 0) requestOtpDirect(); }} 
          disabled={resendCooldown > 0 || loading}
          className="text-fuchsia-700 hover:text-fuchsia-800 text-sm font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={t('resendOtp')}
        >
          {resendCooldown > 0 ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              {t('resendTimer', { seconds: resendCooldown })}
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              {t('resendOtp')}
            </>
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
  const location = useLocation();
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
      
      const token = response.token;
      if (!token) throw new Error('No token received');
      
      login(token);
      
      // Decode token to get role for redirection
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = JSON.parse(window.atob(base64));
      
      const roles = decodedPayload.role || decodedPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      const userRole = Array.isArray(roles) ? roles[0] : roles || 'Customer';
      
      console.log('User role detected:', userRole);
      
      // Check if we have branch information from previous steps
      // This handles QR code flow, in-branch tablet flow, and language selection flow
      const branchIdFromQR = location.state?.branchId;
      const branchIdFromWelcome = localStorage.getItem('branchIdFromWelcome');
      const branchIdFromLanguageSelection = localStorage.getItem('branchIdFromLanguageSelection');
      const branchId = branchIdFromQR || branchIdFromWelcome || branchIdFromLanguageSelection;
      
      // Clean up the localStorage items as we've used them
      if (branchIdFromWelcome) {
        localStorage.removeItem('branchIdFromWelcome');
      }
      if (branchIdFromLanguageSelection) {
        localStorage.removeItem('branchIdFromLanguageSelection');
      }
      
      // If we have a branch ID, save it to localStorage for use in the application
      if (branchId) {
        localStorage.setItem('lastActiveBranchId', branchId);
      }
      
      // Role-based redirection
      switch (userRole.toLowerCase()) {
        case 'maker':
          navigate('/maker-dashboard');
          break;
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'manager':
          navigate('/manager-dashboard');
          break;
        default:
          navigate('/dashboard'); // fallback for customers or other roles
      }

    } catch (err: any) {
      setError(handleAuthError(err));
      console.error('Login with OTP Error:', err);
      otpInput.resetOtp();
      setTimeout(() => otpInput.otpRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  }, [effectivePhone, navigate, otpInput, login, handleAuthError, loading, location.state]);

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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-fuchsia-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <header className="bg-fuchsia-700 text-white">
            <div className="px-6 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <img src={logo} alt={t('logoAlt')} className="h-6 w-6 object-contain rounded-full" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold">{t('bankName')}</h1>
                    {/* <p className="text-fuchsia-100 text-xs">{t('otpLogin')}</p> */}
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => speechService.speak(`${t('bankName')}. ${t('otpLogin')}. ${t('enterPhonePrompt')}`, i18n.language.startsWith('am') ? 'am' : 'en')}
                  className="bg-fuchsia-800/50 px-3 py-1.5 rounded-full text-xs flex items-center gap-1 hover:bg-fuchsia-900/50 transition-colors"
                  aria-label={t('speakWelcome')}
                >
                  <Volume2 className="h-3 w-3" />
                  {t('voice')}
                </button>
              </div>
            </div>
          </header>

          {/* Progress Indicator */}
          <div className="flex justify-center space-x-2 py-4 bg-gray-50">
            <div className={`w-3 h-3 rounded-full transition-all ${step === 'request' ? 'bg-fuchsia-600' : 'bg-gray-300'}`}></div>
            <div className={`w-3 h-3 rounded-full transition-all ${step === 'verify' ? 'bg-fuchsia-600' : 'bg-gray-300'}`}></div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            {/* Messages */}
            <div className="mb-6">
              {message && <SuccessMessage message={message} />}
              {error && <ErrorMessage message={error} />}
            </div>

            {/* Form Content */}
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
        </div>
      </div>
    </div>
  );
};

export default OTPLogin;