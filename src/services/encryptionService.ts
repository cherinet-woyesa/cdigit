/**
 * Encryption Service
 * 
 * Provides AES-256-GCM encryption/decryption utilities for securing
 * sensitive data including session tokens, configuration data, and QR codes.
 */

import { ENCRYPTION_ALGORITHM, TOKEN_LENGTH } from '../constants/multiChannelAccess';

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  algorithm: string;
}

/**
 * Encryption Service
 * Handles all encryption and decryption operations
 */
class EncryptionService {
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private readonly IV_LENGTH = 12; // 96 bits for GCM
  private readonly SALT_LENGTH = 16;
  private readonly ITERATIONS = 100000;

  /**
   * Encrypts data using AES-256-GCM
   */
  async encrypt(data: string, password?: string): Promise<EncryptedData> {
    try {
      // Generate or use provided password
      const encryptionPassword = password || await this.generatePassword();

      // Generate salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

      // Derive key from password
      const key = await this.deriveKey(encryptionPassword, salt);

      // Encrypt data
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      const ciphertext = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        key,
        dataBuffer
      );

      // Convert to base64 for storage
      return {
        ciphertext: this.arrayBufferToBase64(ciphertext),
        iv: this.arrayBufferToBase64(iv.buffer),
        salt: this.arrayBufferToBase64(salt.buffer),
        algorithm: ENCRYPTION_ALGORITHM,
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypts data using AES-256-GCM
   */
  async decrypt(encryptedData: EncryptedData, password?: string): Promise<string> {
    try {
      // Get or generate password
      const decryptionPassword = password || await this.generatePassword();

      // Convert from base64
      const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);
      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      const salt = this.base64ToArrayBuffer(encryptedData.salt);

      // Derive key from password
      const key = await this.deriveKey(decryptionPassword, new Uint8Array(salt));

      // Decrypt data
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: new Uint8Array(iv),
        },
        key,
        ciphertext
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Derives encryption key from password using PBKDF2
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive key using PBKDF2
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: this.ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generates a secure random password
   */
  private async generatePassword(): Promise<string> {
    // Get device-specific password from storage or generate new one
    let password = sessionStorage.getItem('encryption_password');
    
    if (!password) {
      const randomBytes = crypto.getRandomValues(new Uint8Array(TOKEN_LENGTH));
      password = this.arrayBufferToBase64(randomBytes.buffer as ArrayBuffer);
      sessionStorage.setItem('encryption_password', password);
    }

    return password;
  }

  /**
   * Generates device-specific encryption key
   */
  async generateDeviceKey(): Promise<string> {
    const deviceId = localStorage.getItem('device_id') || 'default';
    const timestamp = Date.now().toString();
    const randomData = new Uint8Array(16);
    crypto.getRandomValues(randomData);
    
    const combined = `${deviceId}-${timestamp}-${this.arrayBufferToBase64(randomData.buffer as ArrayBuffer)}`;
    return this.hashString(combined);
  }

  /**
   * Hashes a string using SHA-256
   */
  async hashString(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Generates a secure random token
   */
  generateSecureToken(length: number = TOKEN_LENGTH): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(length));
    return this.arrayBufferToBase64(randomBytes.buffer);
  }

  /**
   * Generates a nonce for replay attack prevention
   */
  generateNonce(): string {
    const timestamp = Date.now();
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    return `${timestamp}-${this.arrayBufferToBase64(randomBytes.buffer as ArrayBuffer)}`;
  }

  /**
   * Validates nonce freshness
   */
  validateNonce(nonce: string, maxAgeMs: number = 300000): boolean {
    try {
      const parts = nonce.split('-');
      if (parts.length < 2) {
        return false;
      }

      const timestamp = parseInt(parts[0], 10);
      if (isNaN(timestamp)) {
        return false;
      }

      const age = Date.now() - timestamp;
      return age <= maxAgeMs;
    } catch (error) {
      return false;
    }
  }

  /**
   * Creates HMAC signature for data integrity
   */
  async createHMAC(data: string, key: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyBuffer = encoder.encode(key);
    const dataBuffer = encoder.encode(data);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: 'HMAC',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
    return this.arrayBufferToBase64(signature);
  }

  /**
   * Verifies HMAC signature
   */
  async verifyHMAC(data: string, signature: string, key: string): Promise<boolean> {
    try {
      const expectedSignature = await this.createHMAC(data, key);
      return this.constantTimeCompare(signature, expectedSignature);
    } catch (error) {
      return false;
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Converts ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Converts base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Encrypts object to JSON string
   */
  async encryptObject(obj: any, password?: string): Promise<EncryptedData> {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString, password);
  }

  /**
   * Decrypts JSON string to object
   */
  async decryptObject<T>(encryptedData: EncryptedData, password?: string): Promise<T> {
    const jsonString = await this.decrypt(encryptedData, password);
    return JSON.parse(jsonString) as T;
  }

  /**
   * Simple XOR encryption for lightweight use cases
   * Note: Not cryptographically secure, use only for obfuscation
   */
  xorEncrypt(data: string, key: string): string {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
  }

  /**
   * Simple XOR decryption
   */
  xorDecrypt(encrypted: string, key: string): string {
    const data = atob(encrypted);
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  /**
   * Checks if Web Crypto API is available
   */
  isWebCryptoAvailable(): boolean {
    return typeof crypto !== 'undefined' && 
           typeof crypto.subtle !== 'undefined' &&
           typeof crypto.getRandomValues !== 'undefined';
  }

  /**
   * Clears encryption password from session
   */
  clearEncryptionPassword(): void {
    sessionStorage.removeItem('encryption_password');
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
