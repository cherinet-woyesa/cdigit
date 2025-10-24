// components/OTPVerification.tsx
import { Shield, CheckCircle2, Loader2 } from 'lucide-react';

interface OTPVerificationProps {
  phone: string;
  otp: string;
  onOtpChange: (otp: string) => void;
  onResendOtp: () => void;
  resendCooldown: number;
  loading?: boolean;
  error?: string;
  message?: string;
}

export function OTPVerification({
  phone,
  otp,
  onOtpChange,
  onResendOtp,
  resendCooldown,
  loading = false,
  error,
  message
}: OTPVerificationProps) {
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = e.target.value.replace(/\D/g, '').slice(0, 6);
    onOtpChange(sanitizedValue);
  };

  return (
    <div className="border border-fuchsia-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-fuchsia-700" />
        OTP Verification
      </h2>
      
      <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 border border-fuchsia-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-fuchsia-700">
          An OTP has been sent to your phone number: 
          <strong className="text-fuchsia-900"> {phone}</strong>
        </p>
        {message && (
          <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {message}
          </p>
        )}
      </div>

      <div className="max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter OTP <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={otp}
          onChange={handleOtpChange}
          maxLength={6}
          className="w-full p-3 text-center text-2xl tracking-widest rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 font-mono bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
          placeholder="000000"
        />
        
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        
        <div className="mt-2 flex justify-between items-center">
          <button
            type="button"
            onClick={onResendOtp}
            disabled={resendCooldown > 0 || loading}
            className="text-sm text-fuchsia-700 hover:text-fuchsia-800 disabled:text-gray-400 transition-colors"
          >
            {resendCooldown > 0 
              ? `Resend OTP in ${resendCooldown}s` 
              : 'Resend OTP'
            }
          </button>
          <span className="text-sm text-gray-500">
            {otp.length}/6
          </span>
        </div>
      </div>
    </div>
  );
}
export default OTPVerification;