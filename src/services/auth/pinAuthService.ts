/**
 * PIN Authentication Service
 * Handles PIN-based authentication and verification
 */

import authorizationAuditService from '@services/audit/authorizationAuditService';
import api from '@services/http';

export interface PINVerificationRequest {
  userId?: string;
  phoneNumber?: string;
  accountNumber?: string;
  pin: string;
}

export interface PINVerificationResponse {
  verified: boolean;
  message: string;
  sessionToken?: string;
  requiresOTP?: boolean;
}

export interface PINSetupRequest {
  userId: string;
  phoneNumber: string;
  newPIN: string;
  confirmPIN: string;
  otpCode?: string; // For verification
}

export interface PINSetupResponse {
  success: boolean;
  message: string;
}

class PINAuthService {
  private readonly MAX_PIN_ATTEMPTS = 3;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private failedAttempts: Map<string, { count: number; lockoutUntil?: number }> = new Map();

  /**
   * Hash PIN before sending to backend (never send plain PIN)
   */
  private async hashPIN(pin: string, salt?: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + (salt || ''));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate PIN format (4-6 digits)
   */
  validatePINFormat(pin: string): { valid: boolean; error?: string } {
    if (!pin || pin.trim() === '') {
      return { valid: false, error: 'PIN is required' };
    }

    if (!/^\d{4,6}$/.test(pin)) {
      return { valid: false, error: 'PIN must be 4-6 digits' };
    }

    // Check for sequential digits
    if (/0123|1234|2345|3456|4567|5678|6789/.test(pin)) {
      return { valid: false, error: 'PIN cannot contain sequential digits' };
    }

    // Check for repeated digits
    if (/(\d)\1{3,}/.test(pin)) {
      return { valid: false, error: 'PIN cannot contain repeated digits' };
    }

    return { valid: true };
  }

  /**
   * Check if user is locked out due to failed attempts
   */
  private isLockedOut(identifier: string): boolean {
    const record = this.failedAttempts.get(identifier);
    if (!record || !record.lockoutUntil) return false;

    if (Date.now() < record.lockoutUntil) {
      return true;
    }

    // Lockout expired, reset
    this.failedAttempts.delete(identifier);
    return false;
  }

  /**
   * Record failed PIN attempt
   */
  private recordFailedAttempt(identifier: string): void {
    const record = this.failedAttempts.get(identifier) || { count: 0 };
    record.count += 1;

    if (record.count >= this.MAX_PIN_ATTEMPTS) {
      record.lockoutUntil = Date.now() + this.LOCKOUT_DURATION_MS;
    }

    this.failedAttempts.set(identifier, record);
  }

  /**
   * Clear failed attempts on successful authentication
   */
  private clearFailedAttempts(identifier: string): void {
    this.failedAttempts.delete(identifier);
  }

  /**
   * Verify PIN for authentication
   */
  async verifyPIN(request: PINVerificationRequest): Promise<PINVerificationResponse> {
    const identifier = request.userId || request.phoneNumber || request.accountNumber;
    
    if (!identifier) {
      authorizationAuditService.logAuthentication({
        authenticationType: 'PIN',
        success: false,
        failureReason: 'No identifier provided',
      });

      return {
        verified: false,
        message: 'User identification required',
      };
    }

    // Check lockout status
    if (this.isLockedOut(identifier)) {
      const record = this.failedAttempts.get(identifier);
      const remainingTime = record?.lockoutUntil ? Math.ceil((record.lockoutUntil - Date.now()) / 60000) : 0;

      authorizationAuditService.logAuthentication({
        userId: request.userId,
        phoneNumber: request.phoneNumber,
        authenticationType: 'PIN',
        success: false,
        failureReason: 'Account locked due to multiple failed attempts',
      });

      return {
        verified: false,
        message: `Account temporarily locked. Please try again in ${remainingTime} minutes.`,
      };
    }

    // Validate PIN format
    const validation = this.validatePINFormat(request.pin);
    if (!validation.valid) {
      authorizationAuditService.logAuthentication({
        userId: request.userId,
        phoneNumber: request.phoneNumber,
        authenticationType: 'PIN',
        success: false,
        failureReason: validation.error,
      });

      return {
        verified: false,
        message: validation.error || 'Invalid PIN format',
      };
    }

    try {
      // Hash PIN before sending
      const hashedPIN = await this.hashPIN(request.pin);

      // Call backend API for verification
      const response = await api.post<PINVerificationResponse>('/auth/verify-pin', {
        userId: request.userId,
        phoneNumber: request.phoneNumber,
        accountNumber: request.accountNumber,
        pinHash: hashedPIN,
      });

      if (response.data.verified) {
        // Success - clear failed attempts
        this.clearFailedAttempts(identifier);

        authorizationAuditService.logAuthentication({
          userId: request.userId,
          phoneNumber: request.phoneNumber,
          authenticationType: 'PIN',
          success: true,
        });

        return response.data;
      } else {
        // Failed verification - record attempt
        this.recordFailedAttempt(identifier);
        const record = this.failedAttempts.get(identifier);
        const attemptsLeft = this.MAX_PIN_ATTEMPTS - (record?.count || 0);

        authorizationAuditService.logAuthentication({
          userId: request.userId,
          phoneNumber: request.phoneNumber,
          authenticationType: 'PIN',
          success: false,
          failureReason: 'Incorrect PIN',
        });

        return {
          verified: false,
          message: attemptsLeft > 0 
            ? `Incorrect PIN. ${attemptsLeft} attempts remaining.`
            : 'Account locked due to multiple failed attempts.',
        };
      }
    } catch (error: any) {
      this.recordFailedAttempt(identifier);

      authorizationAuditService.logAuthentication({
        userId: request.userId,
        phoneNumber: request.phoneNumber,
        authenticationType: 'PIN',
        success: false,
        failureReason: error.message || 'PIN verification failed',
      });

      return {
        verified: false,
        message: error.response?.data?.message || 'PIN verification failed. Please try again.',
      };
    }
  }

  /**
   * Set up new PIN (requires OTP verification first)
   */
  async setupPIN(request: PINSetupRequest): Promise<PINSetupResponse> {
    // Validate new PIN
    const validation = this.validatePINFormat(request.newPIN);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || 'Invalid PIN format',
      };
    }

    // Check PIN confirmation matches
    if (request.newPIN !== request.confirmPIN) {
      return {
        success: false,
        message: 'PIN confirmation does not match',
      };
    }

    try {
      // Hash PIN before sending
      const hashedPIN = await this.hashPIN(request.newPIN);

      // Call backend API to set PIN
      const response = await api.post<PINSetupResponse>('/auth/setup-pin', {
        userId: request.userId,
        phoneNumber: request.phoneNumber,
        pinHash: hashedPIN,
        otpCode: request.otpCode,
      });

      if (response.data.success) {
        authorizationAuditService.logAuthentication({
          userId: request.userId,
          phoneNumber: request.phoneNumber,
          authenticationType: 'PIN',
          success: true,
        });
      }

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to setup PIN. Please try again.',
      };
    }
  }

  /**
   * Change existing PIN (requires old PIN verification)
   */
  async changePIN(request: {
    userId: string;
    phoneNumber: string;
    oldPIN: string;
    newPIN: string;
    confirmPIN: string;
  }): Promise<PINSetupResponse> {
    // Verify old PIN first
    const verification = await this.verifyPIN({
      userId: request.userId,
      phoneNumber: request.phoneNumber,
      pin: request.oldPIN,
    });

    if (!verification.verified) {
      return {
        success: false,
        message: 'Current PIN is incorrect',
      };
    }

    // Validate new PIN
    const validation = this.validatePINFormat(request.newPIN);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || 'Invalid PIN format',
      };
    }

    // Check new PIN is different from old
    if (request.oldPIN === request.newPIN) {
      return {
        success: false,
        message: 'New PIN must be different from current PIN',
      };
    }

    // Check PIN confirmation matches
    if (request.newPIN !== request.confirmPIN) {
      return {
        success: false,
        message: 'PIN confirmation does not match',
      };
    }

    try {
      // Hash new PIN
      const hashedPIN = await this.hashPIN(request.newPIN);

      // Call backend API to change PIN
      const response = await api.post<PINSetupResponse>('/auth/change-pin', {
        userId: request.userId,
        phoneNumber: request.phoneNumber,
        pinHash: hashedPIN,
      });

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to change PIN. Please try again.',
      };
    }
  }

  /**
   * Reset PIN (requires OTP verification)
   */
  async resetPIN(request: {
    phoneNumber: string;
    otpCode: string;
    newPIN: string;
    confirmPIN: string;
  }): Promise<PINSetupResponse> {
    // Validate new PIN
    const validation = this.validatePINFormat(request.newPIN);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || 'Invalid PIN format',
      };
    }

    // Check PIN confirmation matches
    if (request.newPIN !== request.confirmPIN) {
      return {
        success: false,
        message: 'PIN confirmation does not match',
      };
    }

    try {
      // Hash PIN
      const hashedPIN = await this.hashPIN(request.newPIN);

      // Call backend API to reset PIN
      const response = await api.post<PINSetupResponse>('/auth/reset-pin', {
        phoneNumber: request.phoneNumber,
        otpCode: request.otpCode,
        pinHash: hashedPIN,
      });

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reset PIN. Please try again.',
      };
    }
  }
}

// Singleton instance
const pinAuthService = new PINAuthService();
export default pinAuthService;
