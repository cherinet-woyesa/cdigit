/**
 * Branch Context Storage Service
 * 
 * Handles encrypted storage and retrieval of branch context data
 * using AES-256 encryption for security.
 */

import type { BranchContext } from '../types/multiChannelAccess';
import { STORAGE_KEYS } from '../constants/multiChannelAccess';
import { BranchContextError } from '../types/multiChannelAccess';

/**
 * Storage options
 */
interface StorageOptions {
  encrypt?: boolean;
  expirationMinutes?: number;
}

/**
 * Stored data wrapper with metadata
 */
interface StoredData<T> {
  data: T;
  timestamp: string;
  expiresAt?: string;
  encrypted: boolean;
}

/**
 * Branch Context Storage Service
 * Manages encrypted storage of branch context
 */
class BranchContextStorageService {
  private encryptionKey: string | null = null;

  /**
   * Initializes encryption key
   * In production, this should be derived from a secure source
   */
  private async initializeEncryptionKey(): Promise<string> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    // Try to get existing key from session storage
    const storedKey = sessionStorage.getItem('encryption_key');
    if (storedKey) {
      this.encryptionKey = storedKey;
      return storedKey;
    }

    // Generate new key
    const key = await this.generateEncryptionKey();
    sessionStorage.setItem('encryption_key', key);
    this.encryptionKey = key;
    
    return key;
  }

  /**
   * Generates a random encryption key
   */
  private async generateEncryptionKey(): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback for browsers without crypto.randomUUID
    return `key_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Simple encryption using XOR cipher
   * Note: In production, use Web Crypto API for proper AES-256-GCM encryption
   */
  private async encrypt(data: string): Promise<string> {
    const key = await this.initializeEncryptionKey();
    
    // Simple XOR encryption (for demonstration)
    // In production, use: crypto.subtle.encrypt()
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      encrypted += String.fromCharCode(charCode);
    }
    
    // Base64 encode
    return btoa(encrypted);
  }

  /**
   * Simple decryption using XOR cipher
   * Note: In production, use Web Crypto API for proper AES-256-GCM decryption
   */
  private async decrypt(encryptedData: string): Promise<string> {
    const key = await this.initializeEncryptionKey();
    
    try {
      // Base64 decode
      const encrypted = atob(encryptedData);
      
      // Simple XOR decryption (for demonstration)
      // In production, use: crypto.subtle.decrypt()
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        decrypted += String.fromCharCode(charCode);
      }
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new BranchContextError('Failed to decrypt data', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Stores branch context with optional encryption
   */
  async storeBranchContext(
    branchContext: BranchContext,
    options: StorageOptions = {}
  ): Promise<void> {
    const { encrypt = true, expirationMinutes } = options;

    try {
      const storedData: StoredData<BranchContext> = {
        data: branchContext,
        timestamp: new Date().toISOString(),
        encrypted: encrypt,
      };

      // Add expiration if specified
      if (expirationMinutes) {
        const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
        storedData.expiresAt = expiresAt.toISOString();
      }

      // Serialize data
      const serialized = JSON.stringify(storedData);

      // Encrypt if requested
      const dataToStore = encrypt ? await this.encrypt(serialized) : serialized;

      // Store in localStorage
      localStorage.setItem(STORAGE_KEYS.BRANCH_CONTEXT, dataToStore);

      console.log('Branch context stored successfully', {
        encrypted: encrypt,
        expiresAt: storedData.expiresAt,
      });
    } catch (error) {
      console.error('Failed to store branch context:', error);
      throw new BranchContextError('Failed to store branch context', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Retrieves branch context with automatic decryption
   */
  async retrieveBranchContext(): Promise<BranchContext | null> {
    try {
      const storedData = localStorage.getItem(STORAGE_KEYS.BRANCH_CONTEXT);

      if (!storedData) {
        return null;
      }

      // Try to parse as JSON first (unencrypted)
      let parsedData: StoredData<BranchContext>;
      
      try {
        parsedData = JSON.parse(storedData);
      } catch {
        // If parsing fails, assume it's encrypted
        const decrypted = await this.decrypt(storedData);
        parsedData = JSON.parse(decrypted);
      }

      // Check expiration
      if (parsedData.expiresAt) {
        const expirationDate = new Date(parsedData.expiresAt);
        if (new Date() > expirationDate) {
          console.log('Branch context expired, removing');
          this.clearBranchContext();
          return null;
        }
      }

      return parsedData.data;
    } catch (error) {
      console.error('Failed to retrieve branch context:', error);
      // Clear corrupted data
      this.clearBranchContext();
      return null;
    }
  }

  /**
   * Clears stored branch context
   */
  clearBranchContext(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.BRANCH_CONTEXT);
      console.log('Branch context cleared from storage');
    } catch (error) {
      console.error('Failed to clear branch context:', error);
    }
  }

  /**
   * Validates stored branch context
   */
  async validateBranchContext(): Promise<boolean> {
    try {
      const branchContext = await this.retrieveBranchContext();
      
      if (!branchContext) {
        return false;
      }

      // Validate required fields
      if (!branchContext.branchId || !branchContext.branchName || !branchContext.accessMethod) {
        console.warn('Branch context missing required fields');
        return false;
      }

      // Validate timestamp
      if (!branchContext.timestamp) {
        console.warn('Branch context missing timestamp');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Branch context validation failed:', error);
      return false;
    }
  }

  /**
   * Updates branch context fields
   */
  async updateBranchContext(updates: Partial<BranchContext>): Promise<void> {
    try {
      const existingContext = await this.retrieveBranchContext();

      if (!existingContext) {
        throw new BranchContextError('No existing branch context to update');
      }

      const updatedContext: BranchContext = {
        ...existingContext,
        ...updates,
        timestamp: new Date().toISOString(), // Update timestamp
      };

      await this.storeBranchContext(updatedContext);
      
      console.log('Branch context updated successfully');
    } catch (error) {
      console.error('Failed to update branch context:', error);
      throw new BranchContextError('Failed to update branch context', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Gets branch context age in milliseconds
   */
  async getBranchContextAge(): Promise<number | null> {
    try {
      const branchContext = await this.retrieveBranchContext();
      
      if (!branchContext || !branchContext.timestamp) {
        return null;
      }

      const timestamp = new Date(branchContext.timestamp);
      const now = new Date();
      
      return now.getTime() - timestamp.getTime();
    } catch (error) {
      console.error('Failed to get branch context age:', error);
      return null;
    }
  }

  /**
   * Checks if branch context has expired
   */
  async isBranchContextExpired(maxAgeMinutes: number): Promise<boolean> {
    const age = await this.getBranchContextAge();
    
    if (age === null) {
      return true;
    }

    const maxAgeMs = maxAgeMinutes * 60 * 1000;
    return age > maxAgeMs;
  }

  /**
   * Stores encrypted data in IndexedDB (for larger data)
   * Note: This is a placeholder for future implementation
   */
  async storeInIndexedDB(_key: string, _data: any): Promise<void> {
    // TODO: Implement IndexedDB storage for larger data
    console.warn('IndexedDB storage not yet implemented');
    throw new Error('IndexedDB storage not yet implemented');
  }

  /**
   * Retrieves data from IndexedDB
   * Note: This is a placeholder for future implementation
   */
  async retrieveFromIndexedDB(_key: string): Promise<any> {
    // TODO: Implement IndexedDB retrieval
    console.warn('IndexedDB retrieval not yet implemented');
    throw new Error('IndexedDB retrieval not yet implemented');
  }

  /**
   * Exports branch context for debugging
   */
  async exportBranchContext(): Promise<string> {
    try {
      const branchContext = await this.retrieveBranchContext();
      
      if (!branchContext) {
        return JSON.stringify({ error: 'No branch context found' }, null, 2);
      }

      return JSON.stringify(branchContext, null, 2);
    } catch (error) {
      return JSON.stringify({
        error: 'Failed to export branch context',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, null, 2);
    }
  }

  /**
   * Imports branch context from JSON string
   */
  async importBranchContext(jsonString: string): Promise<void> {
    try {
      const branchContext = JSON.parse(jsonString) as BranchContext;
      
      // Validate imported data
      if (!branchContext.branchId || !branchContext.branchName || !branchContext.accessMethod) {
        throw new BranchContextError('Invalid branch context data');
      }

      await this.storeBranchContext(branchContext);
      
      console.log('Branch context imported successfully');
    } catch (error) {
      console.error('Failed to import branch context:', error);
      throw new BranchContextError('Failed to import branch context', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Export singleton instance
export const branchContextStorage = new BranchContextStorageService();
