// hooks/useOTPHandling.ts
import { useState, useCallback, useEffect } from 'react';

export function useOTPHandling() {
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendTimer, setResendTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (resendTimer) clearInterval(resendTimer);
    };
  }, [resendTimer]);

  const startResendTimer = useCallback(() => {
    setResendCooldown(30);
    
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setResendTimer(timer);
  }, []);

  const requestOTP = useCallback(async (
    requestFunction: () => Promise<any>,
    successMessage: string = 'OTP sent successfully'
  ) => {
    setOtpLoading(true);
    setOtpMessage('');
    
    try {
      const response = await requestFunction();
      if (response.success || response.message) {
        setOtpMessage(successMessage);
        startResendTimer();
        return true;
      } else {
        throw new Error(response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      setOtpMessage('');
      throw error;
    } finally {
      setOtpLoading(false);
    }
  }, [startResendTimer]);

  const resendOTP = useCallback(async (
    requestFunction: () => Promise<any>,
    successMessage: string = 'OTP resent successfully'
  ) => {
    if (resendCooldown > 0) return;
    
    return requestOTP(requestFunction, successMessage);
  }, [requestOTP, resendCooldown]);

  return {
    otpLoading,
    otpMessage,
    resendCooldown,
    requestOTP,
    resendOTP,
    setOtpMessage,
  };
}