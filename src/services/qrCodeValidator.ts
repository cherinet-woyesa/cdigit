/**
 * QR Code Validator Service
 * 
 * Comprehensive validation for QR codes including authenticity checks,
 * expiration validation, and branch context extraction.
 */

import type { QRCodePayload, QRValidationResult, BranchContext } from '../types/multiChannelAccess';
import { QRCodeError } from '../types/multiChannelAccess';
import { ERROR_MESSAGES, QR_CODE_EXPIRATION } from '../constants/multiChannelAccess';
import { qrCodeParser } from './qrCodeParser';
import { qrCodeGenerator } from './qrCodeGenerator';
import { getBranchById } from './branchService';

/**
 * Validation options
 */
interface ValidationOptions {
  checkExpiration?: boolean;
  checkBranchExists?: boolean;
  checkUsageStatus?: boolean;
  allowExpired?: boolean;
}

/**
 * Used QR codes tracking (in-memory for now)
 * In production, this should be stored in backend
 */
const usedQRCodes = new Set<string>();

/**
 * QR Code Validator Service
 * Provides comprehensive QR code validation
 */
class QRCodeValidatorService {
  /**
   * Validates QR code from URL parameters
   * @param branchId Branch ID from URL
   * @param sessionToken Session token from URL
   * @param options Validation options
   * @returns Validation result with branch context
   */
  async validateQRCode(
    branchId: string,
    sessionToken: string,
    options: ValidationOptions = {}
  ): Promise<QRValidationResult> {
    const {
      checkExpiration = true,
      checkBranchExists = true,
      checkUsageStatus = true,
      allowExpired = false,
    } = options;

    try {
      // 1. Validate format
      const formatValidation = qrCodeParser.validateQRCodeData(branchId, sessionToken);
      if (!formatValidation.isValid) {
        return {
          isValid: false,
          branchId,
          errorMessage: formatValidation.errorMessage || ERROR_MESSAGES.QR_CODE_INVALID,
          status: 'invalid',
        };
      }

      // 2. Check if already used
      if (checkUsageStatus && this.isQRCodeUsed(branchId, sessionToken)) {
        return {
          isValid: false,
          branchId,
          sessionToken,
          errorMessage: ERROR_MESSAGES.QR_CODE_ALREADY_USED,
          status: 'used',
        };
      }

      // 3. Validate with backend
      const backendValidation = await qrCodeGenerator.validateQRCode(branchId, sessionToken);
      if (!backendValidation.isValid) {
        return {
          isValid: false,
          branchId,
          sessionToken,
          errorMessage: backendValidation.errorMessage || ERROR_MESSAGES.QR_CODE_INVALID,
          status: backendValidation.status || 'invalid',
        };
      }

      // 4. Check branch exists
      if (checkBranchExists) {
        const branchExists = await this.validateBranchExists(branchId);
        if (!branchExists) {
          return {
            isValid: false,
            branchId,
            sessionToken,
            errorMessage: ERROR_MESSAGES.BRANCH_NOT_FOUND,
            status: 'invalid',
          };
        }
      }

      // 5. Create branch context
      const branchContext = await this.extractBranchContext(branchId, sessionToken);

      return {
        isValid: true,
        branchId,
        sessionToken,
        branchContext,
        status: 'active',
      };
    } catch (error) {
      console.error('QR code validation failed:', error);
      
      return {
        isValid: false,
        branchId,
        sessionToken,
        errorMessage: error instanceof Error ? error.message : ERROR_MESSAGES.QR_CODE_INVALID,
        status: 'invalid',
      };
    }
  }

  /**
   * Validates QR code payload
   * @param payload QR code payload
   * @param options Validation options
   * @returns Validation result
   */
  async validatePayload(
    payload: QRCodePayload,
    options: ValidationOptions = {}
  ): Promise<QRValidationResult> {
    const { checkExpiration = true, allowExpired = false } = options;

    try {
      // Validate structure
      if (!qrCodeGenerator.validatePayloadStructure(payload)) {
        return {
          isValid: false,
          errorMessage: 'Invalid QR code payload structure',
          status: 'invalid',
        };
      }

      // Check expiration
      if (checkExpiration && !allowExpired) {
        const isExpired = qrCodeParser.isPayloadExpired(payload);
        if (isExpired) {
          return {
            isValid: false,
            branchId: payload.b,
            errorMessage: ERROR_MESSAGES.QR_CODE_EXPIRED,
            status: 'expired',
          };
        }
      }

      // Decrypt token
      const sessionToken = await this.decryptToken(payload.t);

      // Validate with full validation
      return this.validateQRCode(payload.b, sessionToken, options);
    } catch (error) {
      console.error('Payload validation failed:', error);
      
      return {
        isValid: false,
        errorMessage: error instanceof Error ? error.message : 'Payload validation failed',
        status: 'invalid',
      };
    }
  }

  /**
   * Validates QR code from current URL
   * @param options Validation options
   * @returns Validation result
   */
  async validateFromCurrentURL(options?: ValidationOptions): Promise<QRValidationResult> {
    const parsed = qrCodeParser.parseQRCodeFromCurrentLocation();

    if (!parsed.isValid) {
      return {
        isValid: false,
        errorMessage: parsed.errorMessage || ERROR_MESSAGES.QR_CODE_INVALID,
        status: 'invalid',
      };
    }

    return this.validateQRCode(parsed.branchId, parsed.sessionToken, options);
  }

  /**
   * Extracts branch context from QR code data
   * @param branchId Branch ID
   * @param sessionToken Session token
   * @returns Branch context
   */
  private async extractBranchContext(
    branchId: string,
    sessionToken: string
  ): Promise<BranchContext> {
    try {
      // Fetch branch details
      const branch = await getBranchById(branchId);

      if (!branch) {
        throw new QRCodeError('Branch not found', { branchId });
      }

      // Create branch context
      const branchContext: BranchContext = {
        branchId: branch.id,
        branchName: branch.name,
        branchCode: branch.code,
        accessMethod: 'qr_code',
        timestamp: new Date().toISOString(),
        sessionToken,
        address: branch.address,
        phone: branch.phone,
        workingHours: branch.workingHours,
        latitude: branch.latitude,
        longitude: branch.longitude,
      };

      return branchContext;
    } catch (error) {
      console.error('Failed to extract branch context:', error);
      throw new QRCodeError(
        'Failed to extract branch context from QR code',
        { branchId, error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Validates branch exists
   * @param branchId Branch ID
   * @returns True if branch exists
   */
  private async validateBranchExists(branchId: string): Promise<boolean> {
    try {
      const branch = await getBranchById(branchId);
      return !!branch;
    } catch (error) {
      console.error('Branch existence check failed:', error);
      return false;
    }
  }

  /**
   * Decrypts session token from payload
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
      throw new QRCodeError('Failed to decrypt session token');
    }
  }

  /**
   * Checks if QR code has been used
   * @param branchId Branch ID
   * @param sessionToken Session token
   * @returns True if used
   */
  private isQRCodeUsed(branchId: string, sessionToken: string): boolean {
    const key = `${branchId}:${sessionToken}`;
    return usedQRCodes.has(key);
  }

  /**
   * Marks QR code as used
   * @param branchId Branch ID
   * @param sessionToken Session token
   */
  markQRCodeAsUsed(branchId: string, sessionToken: string): void {
    const key = `${branchId}:${sessionToken}`;
    usedQRCodes.add(key);
    console.log('QR code marked as used:', key);
  }

  /**
   * Clears used QR codes (for testing)
   */
  clearUsedQRCodes(): void {
    usedQRCodes.clear();
  }

  /**
   * Validates and marks QR code as used in one operation
   * @param branchId Branch ID
   * @param sessionToken Session token
   * @param options Validation options
   * @returns Validation result
   */
  async validateAndMarkUsed(
    branchId: string,
    sessionToken: string,
    options?: ValidationOptions
  ): Promise<QRValidationResult> {
    const result = await this.validateQRCode(branchId, sessionToken, options);

    if (result.isValid) {
      this.markQRCodeAsUsed(branchId, sessionToken);
    }

    return result;
  }

  /**
   * Validates QR code age
   * @param timestamp QR code generation timestamp
   * @param maxAgeMs Maximum age in milliseconds
   * @returns True if within age limit
   */
  validateAge(timestamp: number, maxAgeMs: number = QR_CODE_EXPIRATION): boolean {
    const now = Date.now();
    const age = now - timestamp;
    return age <= maxAgeMs;
  }

  /**
   * Validates nonce for replay attack prevention
   * @param nonce Nonce from QR code
   * @returns True if nonce is valid
   */
  validateNonce(nonce: string | undefined): boolean {
    if (!nonce) {
      return false;
    }

    // Check nonce format (timestamp-random)
    const parts = nonce.split('-');
    if (parts.length !== 2) {
      return false;
    }

    // Validate timestamp part
    const timestamp = parseInt(parts[0], 36);
    if (isNaN(timestamp)) {
      return false;
    }

    // Check if nonce is not too old (within 1 hour)
    const age = Date.now() - timestamp;
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    return age <= maxAge;
  }

  /**
   * Quick validation (format only, no API calls)
   * @param branchId Branch ID
   * @param sessionToken Session token
   * @returns True if format is valid
   */
  quickValidate(branchId: string, sessionToken: string): boolean {
    const result = qrCodeParser.validateQRCodeData(branchId, sessionToken);
    return result.isValid;
  }

  /**
   * Gets validation error message for display
   * @param result Validation result
   * @returns User-friendly error message
   */
  getErrorMessage(result: QRValidationResult): string {
    if (result.isValid) {
      return '';
    }

    if (result.errorMessage) {
      return result.errorMessage;
    }

    switch (result.status) {
      case 'expired':
        return ERROR_MESSAGES.QR_CODE_EXPIRED;
      case 'used':
        return ERROR_MESSAGES.QR_CODE_ALREADY_USED;
      case 'invalid':
        return ERROR_MESSAGES.QR_CODE_INVALID;
      default:
        return ERROR_MESSAGES.UNKNOWN_ERROR;
    }
  }
}

// Export singleton instance
export const qrCodeValidator = new QRCodeValidatorService();
