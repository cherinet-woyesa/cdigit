import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.jpg';
import React from 'react';
import authService from './authService';

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
      className="mt-2 block w-full rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500 text-lg p-3"
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
      type="submit" // Set to submit type
      disabled={disabled}
      className={`w-full bg-purple-700 text-white py-3 rounded-lg hover:bg-purple-800 disabled:opacity-50 transition text-lg font-medium flex items-center justify-center ${className || ''}`}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

const OTPLogin: React.FC = () => {
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

  // Send OTP handler
  const handleRequestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await authService.requestOtp(phoneNumber);
      setMessage(response.message || 'OTP sent! Please check your phone.');
      setStep('verify');
      startResendCooldown();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please ensure the phone number is registered and valid.');
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
      const response = await authService.loginWithOtp(phoneNumber, otp);
      setMessage(response.message || 'Login successful!');
      setPhone(phoneNumber);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      console.error('Login with OTP Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf6e9] px-4">
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl p-14 space-y-12">
        {/* Brand Header */}
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900 uppercase">
            Commercial Bank of Ethiopia
          </h1>
          <div className="w-44 h-44 mx-auto">
            <img
              src={logo}
              alt="CBE Logo"
              className="h-40 w-40 object-contain mx-auto rounded-full border-2 border-purple-200"
            />
          </div>
          <h2 className="text-4xl font-extrabold text-purple-700">WELCOME</h2>
          <h2 className="text-xl font-semibold text-gray-800">
            Enter your phone number to access dashboard
          </h2>
        </div>

        {/* Message and Error Display */}
        {message && <p className="text-green-600 text-center">{message}</p>}
        {error && <p className="text-red-600 text-center">{error}</p>}
        
       
        

        {/* Step 1: Enter Phone Number */}
        {step === 'request' && (
          <form onSubmit={handleRequestOtp} className="space-y-10">
            <label className="block" htmlFor="phone-input">
              <span className="text-gray-700 font-medium text-lg">Phone Number</span>
              <FormInput
                id="phone-input"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 0976173985"
                ariaLabel="Phone Number"
                ariaInvalid={!!error}
                ariaDescribedby="phone-error"
                autoFocus
                disabled={loading}
              />
            </label>
            <FormButton
              disabled={!phoneNumber || loading}
              ariaLabel="Send OTP"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Sending OTP...
                </span>
              ) : 'Send OTP'}
            </FormButton>
          </form>
        )}

        {/* Step 2: Enter OTP */}
        {step === 'verify' && (
          <form onSubmit={handleLoginWithOtp} className="space-y-10">
            <label className="block" htmlFor="otp-input">
              <span className="text-gray-700 font-medium text-lg">Enter OTP</span>
              <FormInput
                id="otp-input"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="4-digit code"
                ariaLabel="OTP Code"
                ariaInvalid={!!error}
                ariaDescribedby="otp-error"
                autoFocus
                disabled={loading}
              />
            </label>
            <FormButton
              disabled={!otp || loading}
              ariaLabel="Verify and Continue"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : 'Verify & Login'}
            </FormButton>
            <div className="flex justify-between items-center mt-2">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-purple-700 hover:underline text-sm font-medium"
                disabled={loading}
                aria-label="Back to phone input"
              >
                &larr; Back
              </button>
              <button
                type="button"
                onClick={() => { if (resendCooldown === 0) handleRequestOtp(new Event('click')) }}
                disabled={resendCooldown > 0 || loading}
                className="text-purple-700 hover:underline text-sm font-medium disabled:opacity-50"
                aria-label="Resend OTP"
              >
                {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OTPLogin;