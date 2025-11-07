// features/customer/components/statementrequest/OTPStep.tsx
import React from 'react';
import OTPVerification from '@features/customer/components/OTPVerification';

interface OTPStepProps {
    otpCode: string;
    onOtpChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onResend: () => void;
    resendCooldown: number;
    otpMessage?: string;
    error?: string;
}

export default function OTPStep({ otpCode, onOtpChange, onResend, resendCooldown, otpMessage, error }: OTPStepProps) {
    return (
        <div>
            <OTPVerification 
                phone="" // Phone is shown in the message already
                otp={otpCode}
                onOtpChange={(value) => onOtpChange({ target: { value } } as React.ChangeEvent<HTMLInputElement>)}
                onResendOtp={onResend}
                resendCooldown={resendCooldown}
                message={otpMessage}
                error={error}
            />
        </div>
    );
}