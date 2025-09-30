import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { speak } from '../../lib/speechSynthesis';
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
  autoFocus?: boolean;
  disabled?: boolean;
}

const FormInput: React.FC<FormInputProps> = React.memo(({
  id,
  type,
  value,
  onChange,
  placeholder,
  ariaLabel,
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
      className="mt-2 block w-full rounded-lg border-gray-300 focus:border-fuchsia-500 focus:ring-fuchsia-500 text-lg p-3 transition-all duration-200 ease-in-out hover:border-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      disabled={disabled}
    />
  );
});

// Reusable Button component
interface FormButtonProps {
  disabled?: boolean;
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
  onClick?: () => void;
}

const FormButton: React.FC<FormButtonProps> = React.memo(({
  disabled,
  children,
  ariaLabel,
  className,
  onClick,
}) => {
  return (
    <button
      type={onClick ? "button" : "submit"}
      disabled={disabled}
      onClick={onClick}
      className={`w-full bg-fuchsia-600 text-white py-3 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] text-lg font-medium flex items-center justify-center shadow-md hover:shadow-lg ${className || ''}`}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
});

// Loading Spinner Component
const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 5 }) => (
  <div className="flex items-center justify-center">
    <div 
      className="animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
      style={{ width: `${size * 0.25}rem`, height: `${size * 0.25}rem` }}
    />
    <span className="ml-2">Processing...</span>
  </div>
);

const PasswordLogin: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleLogin = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.customerLogin(email, password);
      
      const token = response.data?.token;
      if (!token) {
        throw new Error('No token received');
      }
      
      login(token);
      navigate('/dashboard', { replace: true });

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      console.error('Login with password Error:', err);
    } finally {
      setLoading(false);
    }
  }, [email, password, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fuchsia-50 via-white to-pink-50 px-4 py-8">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6 border border-fuchsia-100">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
              <img src={logo} alt={t('logoAlt')} className="h-8 w-8 object-contain rounded-full" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide">{t('bankName')}</h1>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
              {t('welcome')}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-fuchsia-400 to-pink-400 rounded-full mx-auto"></div>
          </div>

          <button
            type="button"
            onClick={() => speak(`${t('bankName')}. ${t('welcome')}. ${t('loginWithPassword')}`, i18n.language.startsWith('am') ? 'am' : 'en')}
            className="inline-flex items-center px-4 py-2 bg-white border border-fuchsia-200 text-fuchsia-700 rounded-full hover:bg-fuchsia-50 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
            aria-label="Speak welcome message"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            {i18n.language.startsWith('am') ? 'አንባብ' : 'Speak'}
          </button>
        </div>

        {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

        <form onSubmit={handleLogin} className="space-y-6">
          <FormInput
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('email')}
            ariaLabel={t('email')}
            autoFocus
            disabled={loading}
          />
          <FormInput
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('password')}
            ariaLabel={t('password')}
            disabled={loading}
          />
          <FormButton 
            disabled={!email.trim() || !password.trim() || loading} 
            ariaLabel={t('login')}
            className="mt-4"
          >
            {loading ? <LoadingSpinner /> : t('login')}
          </FormButton>
        </form>
        
        <div className="text-center mt-6 pt-4 border-t border-gray-200">
          <span className="text-gray-600 text-sm">{t('or_login_with_otp')}</span>
          <Link 
            to="/otp-login" 
            className="ml-2 text-fuchsia-600 font-semibold hover:text-fuchsia-700 transition-colors text-sm inline-flex items-center"
          >
            {t('login_with_otp')}
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        <div className="text-center pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Secure authentication • {new Date().getFullYear()} • CBE Digital Services
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordLogin;
