
// features/customer/components/stoppayment/OTPStep.tsx
import React from 'react';
import OTPVerification from '../OTPVerification';

export default function OTPStep({ otpCode, onOtpChange, onResend, resendCooldown, otpMessage, error }) {
    return (
        <div>
            <OTPVerification 
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
