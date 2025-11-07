
// features/customer/components/stoppayment/OTPStep.tsx
import OTPVerification from '@features/customer/components/OTPVerification';

interface OTPStepProps {
    otpCode: string;
    onOtpChange: (value: string) => void;
    onResend: () => void;
    resendCooldown: number;
    otpMessage?: string;
    error?: string;
}

export default function OTPStep({ otpCode, onOtpChange, onResend, resendCooldown, otpMessage, error }: OTPStepProps) {
    // OTPVerification expects onOtpChange to receive a string value, not an event
    // So we pass it directly
    return (
        <div>
            <OTPVerification 
                phone="" // Phone is shown in the message already
                otp={otpCode}
                onOtpChange={onOtpChange}
                onResendOtp={onResend}
                resendCooldown={resendCooldown}
                message={otpMessage}
                error={error}
            />
        </div>
    );
}
