import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  exp: number; // Expiration time (Unix timestamp)
  iat?: number; // Issued at time
  [key: string]: any;
}

/**
 * Hook to automatically refresh JWT token before it expires
 * Checks token expiration and prompts refresh when needed
 */
export const useTokenRefresh = () => {
  const { token, logout, user } = useAuth();
  const navigate = useNavigate();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getTokenExpirationTime = useCallback((token: string): number | null => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.exp * 1000; // Convert to milliseconds
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }, []);

  const isTokenExpiringSoon = useCallback((expirationTime: number): boolean => {
    const now = Date.now();
    const timeUntilExpiry = expirationTime - now;
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    return timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0;
  }, []);

  const isTokenExpired = useCallback((expirationTime: number): boolean => {
    return Date.now() >= expirationTime;
  }, []);

  const handleTokenRefresh = useCallback(async () => {
    console.log('Token refresh needed - prompting user to re-authenticate');
    
    // Clear the timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // For now, we'll log out the user and ask them to login again
    // In a production app, you would call a refresh token endpoint
    // Example: await authService.refreshToken();
    
    logout();
    
    // Redirect based on user role
    // Staff roles go to staff login, customers go to OTP login
    const isStaffUser = user?.role && ['Maker', 'Admin', 'Manager', 'Auditor', 'Authorizer', 'Greeter'].includes(user.role);
    const redirectTo = isStaffUser ? '/staff-login' : '/otp-login';
    
    navigate(redirectTo, { 
      state: { message: 'Your session has expired. Please login again.' } 
    });
  }, [logout, navigate, user?.role]);

  const scheduleTokenRefresh = useCallback((expirationTime: number) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const now = Date.now();
    const timeUntilExpiry = expirationTime - now;
    const fiveMinutes = 5 * 60 * 1000;

    // Schedule refresh 5 minutes before expiration
    const refreshTime = Math.max(timeUntilExpiry - fiveMinutes, 0);

    console.log(`Token will be refreshed in ${refreshTime / 1000} seconds`);

    refreshTimerRef.current = setTimeout(() => {
      handleTokenRefresh();
    }, refreshTime);
  }, [handleTokenRefresh]);

  useEffect(() => {
    if (!token) {
      // Clear timer if no token
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      return;
    }

    const expirationTime = getTokenExpirationTime(token);
    
    if (!expirationTime) {
      console.warn('Could not determine token expiration time');
      return;
    }

    // Check if token is already expired
    if (isTokenExpired(expirationTime)) {
      console.warn('Token is already expired');
      handleTokenRefresh();
      return;
    }

    // Check if token is expiring soon
    if (isTokenExpiringSoon(expirationTime)) {
      console.warn('Token is expiring soon');
      handleTokenRefresh();
      return;
    }

    // Schedule refresh for later
    scheduleTokenRefresh(expirationTime);

    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [token, getTokenExpirationTime, isTokenExpired, isTokenExpiringSoon, scheduleTokenRefresh, handleTokenRefresh]);

  return {
    // Can expose methods if needed for manual refresh
    refreshToken: handleTokenRefresh,
  };
};