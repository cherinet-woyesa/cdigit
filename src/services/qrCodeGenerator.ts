/**
 * QR Code Generator Service
 * 
 * Generates QR codes with branch and session data, handles encryption,
 * and manages QR code lifecycle (generation, validation, expiration).
 */

import type { QRCodeData, QRCodePayload, QRValidationResult, QRCodeStatus } from '../types/multiChannelAccess';
import { QRCodeError } from '../types/multiChannelAccess';
import { 
  QR_CODE_EXPIRATION, 
  QR_CODE_VERSION, 
  ERROR_MESSAGES,
  QR_CODE_RATE_LIMIT 
} from '../constants/multiChannelAccess';
import { qrService } from './qrService';

/**
 * QR Code generation options
 */
interface QRGenerationOptions {
  expirationMinutes?: number;
  includeNonce?: boolean;
  customData?: Record<string, any>;
}

/**
 * Rate limit tracking
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * QR Code Generator Service
 * Handles QR code generation, validation, and lifecycle management
 */
class QRCodeGeneratorService {
  private rateLimitMap: Map<string, RateLimitEntry> = new Map();
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

  /**
   * Generates a QR code for a branch
   * @param branchId Branch ID
   * @param options Generation options
   * @returns QR code data
   */
  async generateQRCode(
    branchId: string,
    options: QRGenerationOptions = {}
  ): Promise<QRCodeData> {
    try {
      // Check rate limit
      if (!this.checkRateLimit(branchId)) {
        throw new QRCodeError(
          'QR code generation rate limit exceeded. Please wait before generating a new code.',
          { branchId, rateLimit: QR_CODE_RATE_LIMIT }
        );
      }

      // Generate session token
      const sessionToken = this.generateSessionToken();

      // Calculate expiration
      const expirationMinutes = options.expirationMinutes || (QR_CODE_EXPIRATION / 60000);
      const timestamp = new Date().toISOString();
      const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString();

      // Create QR code payload
      const payload: QRCodePayload = {
        v: QR_CODE_VERSION,
        b: branchId,
        t: await this.encryptToken(sessionToken),
        ts: Date.now(),
        exp: expirationMinutes * 60, // Convert to seconds
      };

      // Add nonce if requested
      if (options.includeNonce !== false) {
        payload.n = this.generateNonce();
      }

      // Encode payload
      const encodedPayload = this.encodePayload(payload);

      // Call backend to generate QR code image
      const backendResponse = await qrService.generate(branchId);

      // Extract QR code image from backend response
      const qrCodeImage = this.extractQRCodeImage(backendResponse);

      const qrCodeData: QRCodeData = {
        branchId,
        sessionToken,
        timestamp,
        expiresAt,
        qrVersion: QR_CODE_VERSION,
        qrCodeImage,
        nonce: payload.n,
      };

      // Update rate limit
      this.updateRateLimit(branchId);

      console.log('QR code generated successfully', {
        branchId,
        expiresAt,
        hasNonce: !!payload.n,
      });

      return qrCodeData;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      
      if (error instanceof QRCodeError) {
        throw error;
      }

      throw new QRCodeError(
        ERROR_MESSAGES.QR_CODE_GENERATION_FAILED,
        { 
          branchId,
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      );
    }
  }

  /**
   * Validates a QR code
   * @param branchId Branch ID from QR code
   * @param sessionToken Session token from QR code
   * @returns Validation result
   */
  async validateQRCode(
    branchId: string,
    sessionToken: string
  ): Promise<QRValidationResult> {
    try {
      // Call backend validation
      const backendResponse = await qrService.validate(branchId, sessionToken);

      // Parse backend response
      const isValid = this.parseValidationResponse(backendResponse);

      if (!isValid) {
        return {
          isValid: false,
          errorMessage: ERROR_MESSAGES.QR_CODE_INVALID,
          status: 'invalid' as QRCodeStatus,
        };
      }

      // If valid, return success with branch context
      return {
        isValid: true,
        branchId,
        sessionToken,
        status: 'active' as QRCodeStatus,
      };
    } catch (error) {
      console.error('QR code validation failed:', error);

      return {
        isValid: false,
        branchId,
        errorMessage: error instanceof Error ? error.message : ERROR_MESSAGES.QR_CODE_INVALID,
        status: 'invalid' as QRCodeStatus,
      };
    }
  }

  /**
   * Generates a unique session token
   * @returns Session token string
   */
  private generateSessionToken(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback for browsers without crypto.randomUUID
    const array = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Final fallback
    return `token_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generates a nonce for replay attack prevention
   * @returns Nonce string
   */
  private generateNonce(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${random}`;
  }

  /**
   * Encrypts session token
   * Note: In production, use proper encryption (AES-256-GCM)
   * @param token Token to encrypt
   * @returns Encrypted token
   */
  private async encryptToken(token: string): Promise<string> {
    // Simple base64 encoding for now
    // In production, implement proper AES-256-GCM encryption
    try {
      return btoa(token);
    } catch (error) {
      console.error('Token encryption failed:', error);
      throw new QRCodeError('Failed to encrypt token');
    }
  }

  /**
   * Decrypts session token
   * @param encryptedToken Encrypted token
   * @returns Decrypted token
   */
  private async decryptToken(encryptedToken: string): Promise<string> {
    // Simple base64 decoding for now
    // In production, implement proper AES-256-GCM decryption
    try {
      return atob(encryptedToken);
    } catch (error) {
      console.error('Token decryption failed:', error);
      throw new QRCodeError('Failed to decrypt token');
    }
  }

  /**
   * Encodes QR code payload to base64 string
   * @param payload QR code payload
   * @returns Encoded string
   */
  private encodePayload(payload: QRCodePayload): string {
    try {
      const jsonString = JSON.stringify(payload);
      return btoa(jsonString);
    } catch (error) {
      console.error('Payload encoding failed:', error);
      throw new QRCodeError('Failed to encode QR code payload');
    }
  }

  /**
   * Decodes QR code payload from base64 string
   * @param encoded Encoded payload string
   * @returns Decoded payload
   */
  private decodePayload(encoded: string): QRCodePayload {
    try {
      const jsonString = atob(encoded);
      return JSON.parse(jsonString) as QRCodePayload;
    } catch (error) {
      console.error('Payload decoding failed:', error);
      throw new QRCodeError('Failed to decode QR code payload');
    }
  }

  /**
   * Extracts QR code image from backend response
   * @param response Backend response
   * @returns Base64 QR code image
   */
  private extractQRCodeImage(response: any): string {
    // Handle different response formats
    if (typeof response === 'string') {
      return response;
    }

    if (response && response.data && typeof response.data === 'string') {
      return response.data;
    }

    if (response && response.qrCode && typeof response.qrCode === 'string') {
      return response.qrCode;
    }

    if (response && response.qrCodeImage && typeof response.qrCodeImage === 'string') {
      return response.qrCodeImage;
    }

    // If we can't find the image, return empty string
    console.warn('Could not extract QR code image from response:', response);
    return '';
  }

  /**
   * Parses validation response from backend
   * @param response Backend response
   * @returns True if valid
   */
  private parseValidationResponse(response: any): boolean {
    // Handle different response formats
    if (typeof response === 'boolean') {
      return response;
    }

    if (response && typeof response.isValid === 'boolean') {
      return response.isValid;
    }

    if (response && typeof response.valid === 'boolean') {
      return response.valid;
    }

    if (response && typeof response.success === 'boolean') {
      return response.success;
    }

    // Default to false if we can't determine validity
    return false;
  }

  /**
   * Checks rate limit for QR code generation
   * @param branchId Branch ID
   * @returns True if within rate limit
   */
  private checkRateLimit(branchId: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitMap.get(branchId);

    if (!entry) {
      return true;
    }

    // Reset if window has passed
    if (now > entry.resetTime) {
      this.rateLimitMap.delete(branchId);
      return true;
    }

    // Check if within limit
    return entry.count < QR_CODE_RATE_LIMIT;
  }

  /**
   * Updates rate limit counter
   * @param branchId Branch ID
   */
  private updateRateLimit(branchId: string): void {
    const now = Date.now();
    const entry = this.rateLimitMap.get(branchId);

    if (!entry || now > entry.resetTime) {
      this.rateLimitMap.set(branchId, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW_MS,
      });
    } else {
      entry.count++;
    }
  }

  /**
   * Clears rate limit for a branch (for testing)
   * @param branchId Branch ID
   */
  clearRateLimit(branchId: string): void {
    this.rateLimitMap.delete(branchId);
  }

  /**
   * Clears all rate limits (for testing)
   */
  clearAllRateLimits(): void {
    this.rateLimitMap.clear();
  }

  /**
   * Checks if QR code has expired
   * @param qrCodeData QR code data
   * @returns True if expired
   */
  isQRCodeExpired(qrCodeData: QRCodeData): boolean {
    const expirationDate = new Date(qrCodeData.expiresAt);
    const now = new Date();
    return now > expirationDate;
  }

  /**
   * Gets remaining time until QR code expires
   * @param qrCodeData QR code data
   * @returns Remaining time in milliseconds
   */
  getRemainingTime(qrCodeData: QRCodeData): number {
    const expirationDate = new Date(qrCodeData.expiresAt);
    const now = new Date();
    const remaining = expirationDate.getTime() - now.getTime();
    return Math.max(0, remaining);
  }

  /**
   * Gets remaining time as formatted string
   * @param qrCodeData QR code data
   * @returns Formatted time string (e.g., "4:32")
   */
  getRemainingTimeFormatted(qrCodeData: QRCodeData): string {
    const remainingMs = this.getRemainingTime(qrCodeData);
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Refreshes an existing QR code (generates new one for same branch)
   * @param branchId Branch ID
   * @returns New QR code data
   */
  async refreshQRCode(branchId: string): Promise<QRCodeData> {
    console.log('Refreshing QR code for branch:', branchId);
    return this.generateQRCode(branchId);
  }

  /**
   * Validates QR code payload structure
   * @param payload Payload to validate
   * @returns True if valid structure
   */
  validatePayloadStructure(payload: any): boolean {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      typeof payload.v === 'string' &&
      typeof payload.b === 'string' &&
      typeof payload.t === 'string' &&
      typeof payload.ts === 'number' &&
      typeof payload.exp === 'number'
    );
  }

  /**
   * Creates a QR code URL for scanning
   * @param branchId Branch ID
   * @param sessionToken Session token
   * @returns QR code URL
   */
  createQRCodeURL(branchId: string, sessionToken: string): string {
    const origin = window.location.origin;
    return `${origin}/qr-login/${branchId}/${sessionToken}`;
  }
}

// Export singleton instance
export const qrCodeGenerator = new QRCodeGeneratorService();
