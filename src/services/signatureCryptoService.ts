/**
 * Cryptographic Signature Binding Service
 * Cryptographically binds digital signatures to vouchers using Web Crypto API
 */

import authorizationAuditService from './authorizationAuditService';

export interface SignatureData {
  signatureDataUrl: string; // Base64 data URL from canvas
  userId: string;
  userRole: string;
  timestamp: Date;
}

export interface VoucherData {
  voucherId: string;
  voucherType: string;
  accountNumber?: string;
  amount?: number;
  currency?: string;
  transactionType?: string;
  [key: string]: any;
}

export interface CryptographicBinding {
  signatureHash: string;
  voucherHash: string;
  bindingHash: string;
  timestamp: Date;
  algorithm: string;
}

export interface BoundSignature {
  signatureData: string;
  binding: CryptographicBinding;
  metadata: {
    userId: string;
    userRole: string;
    signatureType: 'customer' | 'teller' | 'approver';
    timestamp: Date;
  };
}

class SignatureCryptoService {
  private readonly HASH_ALGORITHM = 'SHA-256';

  /**
   * Generate SHA-256 hash of data
   */
  private async generateHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest(this.HASH_ALGORITHM, dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * Create cryptographic hash of signature data
   */
  async hashSignature(signatureData: SignatureData): Promise<string> {
    const signatureString = JSON.stringify({
      signature: signatureData.signatureDataUrl,
      userId: signatureData.userId,
      userRole: signatureData.userRole,
      timestamp: signatureData.timestamp.toISOString(),
    });

    return this.generateHash(signatureString);
  }

  /**
   * Create cryptographic hash of voucher data
   */
  async hashVoucher(voucherData: VoucherData): Promise<string> {
    // Sort keys for consistent hashing
    const sortedData: Record<string, any> = {};
    Object.keys(voucherData).sort().forEach(key => {
      sortedData[key] = voucherData[key];
    });

    const voucherString = JSON.stringify(sortedData);
    return this.generateHash(voucherString);
  }

  /**
   * Cryptographically bind signature to voucher
   * Creates a binding hash that combines signature hash and voucher hash
   */
  async bindSignatureToVoucher(
    signatureData: SignatureData,
    voucherData: VoucherData,
    signatureType: 'customer' | 'teller' | 'approver'
  ): Promise<BoundSignature> {
    // Generate individual hashes
    const signatureHash = await this.hashSignature(signatureData);
    const voucherHash = await this.hashVoucher(voucherData);

    // Create binding hash by combining both
    const bindingString = `${signatureHash}:${voucherHash}:${signatureData.timestamp.toISOString()}`;
    const bindingHash = await this.generateHash(bindingString);

    const binding: CryptographicBinding = {
      signatureHash,
      voucherHash,
      bindingHash,
      timestamp: new Date(),
      algorithm: this.HASH_ALGORITHM,
    };

    const boundSignature: BoundSignature = {
      signatureData: signatureData.signatureDataUrl,
      binding,
      metadata: {
        userId: signatureData.userId,
        userRole: signatureData.userRole,
        signatureType,
        timestamp: signatureData.timestamp,
      },
    };

    // Log signature binding to audit trail
    authorizationAuditService.logSignatureBinding({
      voucherId: voucherData.voucherId,
      voucherType: voucherData.voucherType,
      signatureType,
      userId: signatureData.userId,
      signatureHash,
      voucherHash,
      bindingHash,
      verified: true,
    });

    return boundSignature;
  }

  /**
   * Verify that a signature binding is valid
   */
  async verifyBinding(
    boundSignature: BoundSignature,
    currentVoucherData: VoucherData
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      // Recreate signature hash
      const signatureData: SignatureData = {
        signatureDataUrl: boundSignature.signatureData,
        userId: boundSignature.metadata.userId,
        userRole: boundSignature.metadata.userRole,
        timestamp: boundSignature.metadata.timestamp,
      };
      const computedSignatureHash = await this.hashSignature(signatureData);

      // Check if signature hash matches
      if (computedSignatureHash !== boundSignature.binding.signatureHash) {
        authorizationAuditService.logSignatureBinding({
          voucherId: currentVoucherData.voucherId,
          voucherType: currentVoucherData.voucherType,
          signatureType: boundSignature.metadata.signatureType,
          userId: boundSignature.metadata.userId,
          signatureHash: computedSignatureHash,
          voucherHash: boundSignature.binding.voucherHash,
          bindingHash: boundSignature.binding.bindingHash,
          verified: false,
        });

        return {
          valid: false,
          reason: 'Signature hash mismatch - signature may have been tampered with',
        };
      }

      // Recreate voucher hash
      const computedVoucherHash = await this.hashVoucher(currentVoucherData);

      // Check if voucher hash matches
      if (computedVoucherHash !== boundSignature.binding.voucherHash) {
        authorizationAuditService.logSignatureBinding({
          voucherId: currentVoucherData.voucherId,
          voucherType: currentVoucherData.voucherType,
          signatureType: boundSignature.metadata.signatureType,
          userId: boundSignature.metadata.userId,
          signatureHash: computedSignatureHash,
          voucherHash: computedVoucherHash,
          bindingHash: boundSignature.binding.bindingHash,
          verified: false,
        });

        return {
          valid: false,
          reason: 'Voucher hash mismatch - voucher data may have been modified',
        };
      }

      // Recreate binding hash
      const bindingString = `${computedSignatureHash}:${computedVoucherHash}:${boundSignature.metadata.timestamp.toISOString()}`;
      const computedBindingHash = await this.generateHash(bindingString);

      // Check if binding hash matches
      if (computedBindingHash !== boundSignature.binding.bindingHash) {
        authorizationAuditService.logSignatureBinding({
          voucherId: currentVoucherData.voucherId,
          voucherType: currentVoucherData.voucherType,
          signatureType: boundSignature.metadata.signatureType,
          userId: boundSignature.metadata.userId,
          signatureHash: computedSignatureHash,
          voucherHash: computedVoucherHash,
          bindingHash: computedBindingHash,
          verified: false,
        });

        return {
          valid: false,
          reason: 'Binding hash mismatch - cryptographic binding may have been compromised',
        };
      }

      // All checks passed
      authorizationAuditService.logSignatureBinding({
        voucherId: currentVoucherData.voucherId,
        voucherType: currentVoucherData.voucherType,
        signatureType: boundSignature.metadata.signatureType,
        userId: boundSignature.metadata.userId,
        signatureHash: computedSignatureHash,
        voucherHash: computedVoucherHash,
        bindingHash: computedBindingHash,
        verified: true,
      });

      return { valid: true };
    } catch (error) {
      console.error('Error verifying signature binding:', error);
      return {
        valid: false,
        reason: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Bind multiple signatures to a voucher (e.g., customer + teller + approver)
   */
  async bindMultipleSignatures(
    signatures: Array<{
      signatureData: SignatureData;
      signatureType: 'customer' | 'teller' | 'approver';
    }>,
    voucherData: VoucherData
  ): Promise<BoundSignature[]> {
    const boundSignatures: BoundSignature[] = [];

    for (const sig of signatures) {
      const bound = await this.bindSignatureToVoucher(
        sig.signatureData,
        voucherData,
        sig.signatureType
      );
      boundSignatures.push(bound);
    }

    return boundSignatures;
  }

  /**
   * Verify all signatures bound to a voucher
   */
  async verifyAllBindings(
    boundSignatures: BoundSignature[],
    currentVoucherData: VoucherData
  ): Promise<{
    allValid: boolean;
    results: Array<{ signatureType: string; valid: boolean; reason?: string }>;
  }> {
    const results: Array<{ signatureType: string; valid: boolean; reason?: string }> = [];

    for (const boundSig of boundSignatures) {
      const verification = await this.verifyBinding(boundSig, currentVoucherData);
      results.push({
        signatureType: boundSig.metadata.signatureType,
        valid: verification.valid,
        reason: verification.reason,
      });
    }

    const allValid = results.every(r => r.valid);

    return { allValid, results };
  }

  /**
   * Generate a tamper-proof voucher package with all signatures
   */
  async createSignedVoucherPackage(
    voucherData: VoucherData,
    signatures: Array<{
      signatureData: SignatureData;
      signatureType: 'customer' | 'teller' | 'approver';
    }>
  ): Promise<{
    voucher: VoucherData;
    signatures: BoundSignature[];
    packageHash: string;
    createdAt: Date;
  }> {
    // Bind all signatures
    const boundSignatures = await this.bindMultipleSignatures(signatures, voucherData);

    // Create package hash for the entire voucher + signatures
    const packageData = {
      voucher: voucherData,
      signatures: boundSignatures.map(bs => ({
        signatureType: bs.metadata.signatureType,
        bindingHash: bs.binding.bindingHash,
      })),
      createdAt: new Date().toISOString(),
    };

    const packageHash = await this.generateHash(JSON.stringify(packageData));

    return {
      voucher: voucherData,
      signatures: boundSignatures,
      packageHash,
      createdAt: new Date(),
    };
  }

  /**
   * Verify complete signed voucher package
   */
  async verifySignedVoucherPackage(signedPackage: {
    voucher: VoucherData;
    signatures: BoundSignature[];
    packageHash: string;
    createdAt: Date;
  }): Promise<{
    valid: boolean;
    packageHashValid: boolean;
    signaturesValid: boolean;
    details: Array<{ signatureType: string; valid: boolean; reason?: string }>;
  }> {
    // Verify package hash
    const packageData = {
      voucher: signedPackage.voucher,
      signatures: signedPackage.signatures.map(bs => ({
        signatureType: bs.metadata.signatureType,
        bindingHash: bs.binding.bindingHash,
      })),
      createdAt: signedPackage.createdAt instanceof Date 
        ? signedPackage.createdAt.toISOString() 
        : signedPackage.createdAt,
    };

    const computedPackageHash = await this.generateHash(JSON.stringify(packageData));
    const packageHashValid = computedPackageHash === signedPackage.packageHash;

    // Verify all signatures
    const signatureVerification = await this.verifyAllBindings(
      signedPackage.signatures,
      signedPackage.voucher
    );

    return {
      valid: packageHashValid && signatureVerification.allValid,
      packageHashValid,
      signaturesValid: signatureVerification.allValid,
      details: signatureVerification.results,
    };
  }
}

// Singleton instance
const signatureCryptoService = new SignatureCryptoService();
export default signatureCryptoService;
