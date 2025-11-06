/**
 * QR Code URL Parameter Parser
 * 
 * Parses and validates QR code data from URL parameters
 * for the QR code access flow.
 */

import type { QRCodePayload } from '../types/multiChannelAccess';
import { QRCodeError, ValidationError } from '../types/multiChannelAccess';
import { QR_CODE_EXPIRATION } from '../constants/multiChannelAccess';

/**
 * Parsed QR code data from URL
 */
export interface ParsedQRData {
  branchId: string;
  sessionToken: string;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * QR Code Parser Service
 * Handles parsing and validation of QR code URL parameters
 */
class QRCodeParserService {
  /**
   * Parses QR code data from URL path
   * Expected format: /qr-login/:branchId/:token
   * 
   * @param pathname URL pathname to parse
   * @returns Parsed QR code data
   */
  parseQRCodeFromPath(pathname: string): ParsedQRData {
    try {
      // Remove leading slash and split path
      const pathParts = pathname.replace(/^\//, '').split('/');

      // Validate path structure
      if (pathParts.length < 3 || pathParts[0] !== 'qr-login') {
        return {
          branchId: '',
          sessionToken: '',
          isValid: false,
          errorMessage: 'Invalid QR code URL format',
        };
      }

      const branchId = pathParts[1];
      const sessionToken = pathParts[2];

      // Validate branch ID
      if (!this.isValidBranchId(branchId)) {
        return {
          branchId,
          sessionToken,
          isValid: false,
          errorMessage: 'Invalid branch ID format',
        };
      }

      // Validate session token
      if (!this.isValidSessionToken(sessionToken)) {
        return {
          branchId,
          sessionToken,
          isValid: false,
          errorMessage: 'Invalid session token format',
        };
      }

      return {
        branchId,
        sessionToken,
        isValid: true,
      };
    } catch (error) {
      console.error('Error parsing QR code from path:', error);
      return {
        branchId: '',
        sessionToken: '',
        isValid: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown parsing error',
      };
    }
  }

  /**
   * Parses QR code data from current window location
   * 
   * @returns Parsed QR code data
   */
  parseQRCodeFromCurrentLocation(): ParsedQRData {
    return this.parseQRCodeFromPath(window.location.pathname);
  }

  /**
   * Extracts QR code parameters from URL search params
   * Alternative format: ?branchId=xxx&token=yyy
   * 
   * @param searchParams URL search parameters
   * @returns Parsed QR code data
   */
  parseQRCodeFromSearchParams(searchParams: URLSearchParams): ParsedQRData {
    try {
      const branchId = searchParams.get('branchId') || '';
      const sessionToken = searchParams.get('token') || '';

      if (!branchId || !sessionToken) {
        return {
          branchId,
          sessionToken,
          isValid: false,
          errorMessage: 'Missing required QR code parameters',
        };
      }

      // Validate branch ID
      if (!this.isValidBranchId(branchId)) {
        return {
          branchId,
          sessionToken,
          isValid: false,
          errorMessage: 'Invalid branch ID format',
        };
      }

      // Validate session token
      if (!this.isValidSessionToken(sessionToken)) {
        return {
          branchId,
          sessionToken,
          isValid: false,
          errorMessage: 'Invalid session token format',
        };
      }

      return {
        branchId,
        sessionToken,
        isValid: true,
      };
    } catch (error) {
      console.error('Error parsing QR code from search params:', error);
      return {
        branchId: '',
        sessionToken: '',
        isValid: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown parsing error',
      };
    }
  }

  /**
   * Decodes a QR code payload from base64 encoded string
   * 
   * @param encodedPayload Base64 encoded QR code payload
   * @returns Decoded QR code payload
   */
  decodeQRCodePayload(encodedPayload: string): QRCodePayload {
    try {
      // Decode base64
      const decodedString = atob(encodedPayload);
      
      // Parse JSON
      const payload = JSON.parse(decodedString) as QRCodePayload;

      // Validate payload structure
      if (!this.isValidQRCodePayload(payload)) {
        throw new ValidationError('Invalid QR code payload structure');
      }

      return payload;
    } catch (error) {
      console.error('Error decoding QR code payload:', error);
      throw new QRCodeError(
        'Failed to decode QR code payload',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Validates QR code payload structure
   * 
   * @param payload Payload to validate
   * @returns True if payload is valid
   */
  private isValidQRCodePayload(payload: any): payload is QRCodePayload {
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
   * Validates branch ID format
   * 
   * @param branchId Branch ID to validate
   * @returns True if valid
   */
  private isValidBranchId(branchId: string): boolean {
    // Branch ID should be non-empty and alphanumeric with hyphens
    return /^[a-zA-Z0-9-_]+$/.test(branchId) && branchId.length > 0;
  }

  /**
   * Validates session token format
   * 
   * @param token Session token to validate
   * @returns True if valid
   */
  private isValidSessionToken(token: string): boolean {
    // Token should be non-empty and contain valid characters
    // Typically base64 or hex encoded
    return /^[a-zA-Z0-9+/=_-]+$/.test(token) && token.length >= 16;
  }

  /**
   * Checks if QR code has expired based on timestamp
   * 
   * @param timestamp QR code generation timestamp (Unix milliseconds)
   * @param expirationSeconds Expiration duration in seconds
   * @returns True if expired
   */
  isQRCodeExpired(timestamp: number, expirationSeconds: number): boolean {
    const now = Date.now();
    const expirationTime = timestamp + (expirationSeconds * 1000);
    return now > expirationTime;
  }

  /**
   * Checks if QR code from payload has expired
   * 
   * @param payload QR code payload
   * @returns True if expired
   */
  isPayloadExpired(payload: QRCodePayload): boolean {
    return this.isQRCodeExpired(payload.ts, payload.exp);
  }

  /**
   * Gets remaining time until QR code expires
   * 
   * @param timestamp QR code generation timestamp (Unix milliseconds)
   * @param expirationSeconds Expiration duration in seconds
   * @returns Remaining time in milliseconds (0 if expired)
   */
  getRemainingTime(timestamp: number, expirationSeconds: number): number {
    const now = Date.now();
    const expirationTime = timestamp + (expirationSeconds * 1000);
    const remaining = expirationTime - now;
    return Math.max(0, remaining);
  }

  /**
   * Validates complete QR code data including expiration
   * 
   * @param branchId Branch ID from QR code
   * @param sessionToken Session token from QR code
   * @param timestamp QR code generation timestamp (optional)
   * @returns Validation result
   */
  validateQRCodeData(
    branchId: string,
    sessionToken: string,
    timestamp?: number
  ): { isValid: boolean; errorMessage?: string } {
    // Validate branch ID
    if (!this.isValidBranchId(branchId)) {
      return {
        isValid: false,
        errorMessage: 'Invalid branch ID format',
      };
    }

    // Validate session token
    if (!this.isValidSessionToken(sessionToken)) {
      return {
        isValid: false,
        errorMessage: 'Invalid session token format',
      };
    }

    // Check expiration if timestamp provided
    if (timestamp !== undefined) {
      const expirationSeconds = QR_CODE_EXPIRATION / 1000;
      if (this.isQRCodeExpired(timestamp, expirationSeconds)) {
        return {
          isValid: false,
          errorMessage: 'QR code has expired',
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Builds QR code URL from branch ID and session token
   * 
   * @param branchId Branch ID
   * @param sessionToken Session token
   * @returns QR code URL path
   */
  buildQRCodeURL(branchId: string, sessionToken: string): string {
    return `/qr-login/${branchId}/${sessionToken}`;
  }

  /**
   * Builds full QR code URL with origin
   * 
   * @param branchId Branch ID
   * @param sessionToken Session token
   * @param origin Origin URL (defaults to window.location.origin)
   * @returns Full QR code URL
   */
  buildFullQRCodeURL(
    branchId: string,
    sessionToken: string,
    origin?: string
  ): string {
    const baseOrigin = origin || window.location.origin;
    const path = this.buildQRCodeURL(branchId, sessionToken);
    return `${baseOrigin}${path}`;
  }

  /**
   * Extracts branch ID from current URL if on QR login page
   * 
   * @returns Branch ID or null
   */
  getBranchIdFromCurrentURL(): string | null {
    const parsed = this.parseQRCodeFromCurrentLocation();
    return parsed.isValid ? parsed.branchId : null;
  }

  /**
   * Extracts session token from current URL if on QR login page
   * 
   * @returns Session token or null
   */
  getSessionTokenFromCurrentURL(): string | null {
    const parsed = this.parseQRCodeFromCurrentLocation();
    return parsed.isValid ? parsed.sessionToken : null;
  }

  /**
   * Checks if current URL is a QR code login URL
   * 
   * @returns True if on QR login page
   */
  isQRCodeLoginURL(): boolean {
    return window.location.pathname.startsWith('/qr-login/');
  }
}

// Export singleton instance
export const qrCodeParser = new QRCodeParserService();
