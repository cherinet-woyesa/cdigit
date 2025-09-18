import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/logo.jpg';
import React from 'react';
import authService from '../../services/authService';

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
  const { t } = useTranslation();
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { setPhone } = useAuth();
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [resendTimer, setResendTimer] = useState<NodeJS.Timeout | null>(null);

  // Start cooldown timer when OTP is sent
  const startResendCooldown = () => {
    setResendCooldown(30);
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

  // Normalize and validate Ethiopian mobile
  // Accept both 09XXXXXXXX and +2519XXXXXXXX without forcing conversion
  const normalizePhone = (raw: string) => raw.trim();
  const isValidEthMobile = (p: string) => /^09\d{8}$|^\+2519\d{8}$/.test(p.trim());

  // Send OTP handler (no event, for button)
  const requestOtpDirect = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const normalized = normalizePhone(phoneNumber);
      if (!isValidEthMobile(normalized)) {
        setError('Please enter a valid Ethiopian mobile number (09XXXXXXXX or +2519XXXXXXXX).');
        setLoading(false);
        return;
      }
      const response = await authService.requestOtp(normalized);
      setMessage(response.message || t('otpSent'));
      setStep('verify');
      startResendCooldown();
    } catch (err: any) {
      setError(
        err.response?.data?.message || t('otpSendError')
      );
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
      const normalized = normalizePhone(phoneNumber);
      const response: { message: string; token?: string } = await authService.loginWithOtp(normalized, otp);
      setMessage(response.message || t('loginSuccessful'));
      
      // Set the phone number in AuthContext and wait for it to be set
      await new Promise<void>((resolve) => {
        setPhone(normalized);
        // Small delay to ensure state is updated
        setTimeout(resolve, 100);
      });
      
      // Store the phone number in localStorage as well
      localStorage.setItem('phone', normalized);
      
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
          </div>

          {/* Message and Error Display */}
          {message && <p className="text-green-600 text-center text-sm">{message}</p>}
          {error && <p className="text-red-600 text-center text-sm">{error}</p>}

          {/* Step 1: Enter Phone Number */}
          {step === 'request' && (
            <>
              <form onSubmit={handleRequestOtp} className="space-y-6">
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
            <form onSubmit={handleLoginWithOtp} className="space-y-6">
              <label className="block" htmlFor="otp-input">
                <span className="text-gray-700 font-medium text-base">
                  {t('enterOtp')}
                </span>
                <FormInput
                  id="otp-input"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder={t('otpPlaceholder')}
                  ariaLabel={t('otpLabel')}
                  ariaInvalid={!!error}
                  ariaDescribedby="otp-error"
                  autoFocus
                  disabled={loading}
                />
              </label>
              <FormButton
                disabled={!otp || loading}
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
                  onClick={() => setStep('request')}
                  className="text-fuchsia-700 hover:underline text-xs font-medium"
                  disabled={loading}
                  aria-label={t('backToPhone')}
                >
                  &larr; {t('backToPhone')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (resendCooldown === 0) requestOtpDirect();
                  }}
                  disabled={resendCooldown > 0 || loading}
                  className="text-fuchsia-700 hover:underline text-xs font-medium disabled:opacity-50"
                  aria-label={t('resendOtp')}
                >
                  {resendCooldown > 0
                    ? t('resendTimer', { seconds: resendCooldown })
                    : t('resendOtp')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPLogin;