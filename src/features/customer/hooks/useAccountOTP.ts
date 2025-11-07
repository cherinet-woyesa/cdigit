// hooks/useAccountOTP.ts
import { useState, useCallback } from 'react';
import accountService from '@services/accountsService';
import authService from '@services/auth/authService';

export function useAccountOTP() {
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [accountPhoneNumber, setAccountPhoneNumber] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<NodeJS.Timeout | null>(null);

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

  const getAccountPhoneNumber = useCallback(async (accountNumber: string, token: string) => {
    try {
      const response = await accountService.getPhoneByAccount(accountNumber, token);
      if (response.success && response.data) {
        setAccountPhoneNumber(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get account phone number');
      }
    } catch (error: any) {
      throw error;
    }
  }, []);

  const requestOTP = useCallback(async (
    accountNumber: string,
    token: string,
    successMessage: string = 'OTP sent successfully'
  ) => {
    setOtpLoading(true);
    setOtpMessage('');
    
    try {
      // First get the phone number linked to the account
      const phoneNumber = await getAccountPhoneNumber(accountNumber, token);
      
      // Then request OTP to that phone number
      const response = await authService.requestOTP(phoneNumber);
      if (response.success || response.message) {
        setOtpMessage(successMessage);
        startResendTimer();
        return { success: true, phoneNumber };
      } else {
        throw new Error(response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      setOtpMessage('');
      throw error;
    } finally {
      setOtpLoading(false);
    }
  }, [getAccountPhoneNumber, startResendTimer]);

  const resendOTP = useCallback(async (
    accountNumber: string,
    token: string,
    successMessage: string = 'OTP resent successfully'
  ) => {
    if (resendCooldown > 0) return;
    
    return requestOTP(accountNumber, token, successMessage);
  }, [requestOTP, resendCooldown]);

  return {
    otpLoading,
    otpMessage,
    resendCooldown,
    accountPhoneNumber,
    requestOTP,
    resendOTP,
    setOtpMessage,
  };
}