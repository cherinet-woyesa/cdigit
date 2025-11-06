/**
 * Branch Context Validator Service
 * 
 * Validates branch context data including branch existence,
 * status, and expiration checks.
 */

import type { BranchContext } from '../types/multiChannelAccess';
import { BranchContextError, ValidationError } from '../types/multiChannelAccess';
import { fetchBranches, getBranchById } from './branchService';
import type { Branch } from './branchService';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Branch validation options
 */
export interface BranchValidationOptions {
  checkExistence?: boolean;
  checkStatus?: boolean;
  checkExpiration?: boolean;
  maxAgeMinutes?: number;
}

/**
 * Branch Context Validator Service
 * Provides comprehensive validation for branch context
 */
class BranchContextValidatorService {
  private branchCache: Map<string, Branch> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Validates branch context structure
   */
  validateStructure(branchContext: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if branchContext exists
    if (!branchContext) {
      errors.push('Branch context is null or undefined');
      return { isValid: false, errors, warnings };
    }

    // Validate required fields
    if (!branchContext.branchId || typeof branchContext.branchId !== 'string') {
      errors.push('Branch ID is missing or invalid');
    }

    if (!branchContext.branchName || typeof branchContext.branchName !== 'string') {
      errors.push('Branch name is missing or invalid');
    }

    if (!branchContext.branchCode || typeof branchContext.branchCode !== 'string') {
      errors.push('Branch code is missing or invalid');
    }

    if (!branchContext.accessMethod || typeof branchContext.accessMethod !== 'string') {
      errors.push('Access method is missing or invalid');
    }

    if (!branchContext.timestamp || typeof branchContext.timestamp !== 'string') {
      errors.push('Timestamp is missing or invalid');
    }

    // Validate access method value
    const validAccessMethods = ['mobile_app', 'branch_tablet', 'qr_code'];
    if (branchContext.accessMethod && !validAccessMethods.includes(branchContext.accessMethod)) {
      errors.push(`Invalid access method: ${branchContext.accessMethod}`);
    }

    // Validate timestamp format
    if (branchContext.timestamp) {
      const timestamp = new Date(branchContext.timestamp);
      if (isNaN(timestamp.getTime())) {
        errors.push('Invalid timestamp format');
      }
    }

    // Check for optional fields
    if (branchContext.sessionToken && typeof branchContext.sessionToken !== 'string') {
      warnings.push('Session token is present but invalid');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates branch exists in database
   */
  async validateBranchExists(branchId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check cache first
      if (this.branchCache.has(branchId) && this.isCacheValid()) {
        return { isValid: true, errors, warnings };
      }

      // Fetch branch from API
      const branch = await getBranchById(branchId);

      if (!branch) {
        errors.push(`Branch with ID ${branchId} not found`);
        return { isValid: false, errors, warnings };
      }

      // Update cache
      this.branchCache.set(branchId, branch);
      this.cacheTimestamp = Date.now();

      return { isValid: true, errors, warnings };
    } catch (error) {
      console.error('Error validating branch existence:', error);
      errors.push(`Failed to validate branch existence: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Validates branch is active and available
   */
  async validateBranchStatus(branchId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get branch from cache or API
      let branch = this.branchCache.get(branchId);

      if (!branch || !this.isCacheValid()) {
        branch = await getBranchById(branchId);
        this.branchCache.set(branchId, branch);
        this.cacheTimestamp = Date.now();
      }

      if (!branch) {
        errors.push(`Branch with ID ${branchId} not found`);
        return { isValid: false, errors, warnings };
      }

      // Check branch status
      if (branch.status !== 'active') {
        errors.push(`Branch is not active. Current status: ${branch.status}`);
      }

      // Check if branch is active (if field exists)
      if (branch.isActive !== undefined && !branch.isActive) {
        errors.push('Branch is not active');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      console.error('Error validating branch status:', error);
      errors.push(`Failed to validate branch status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Validates branch context hasn't expired
   */
  validateExpiration(branchContext: BranchContext, maxAgeMinutes: number = 60): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!branchContext.timestamp) {
      errors.push('Branch context timestamp is missing');
      return { isValid: false, errors, warnings };
    }

    try {
      const timestamp = new Date(branchContext.timestamp);
      const now = new Date();
      const ageMs = now.getTime() - timestamp.getTime();
      const ageMinutes = ageMs / (60 * 1000);

      if (ageMinutes > maxAgeMinutes) {
        errors.push(`Branch context has expired. Age: ${Math.round(ageMinutes)} minutes, Max: ${maxAgeMinutes} minutes`);
      } else if (ageMinutes > maxAgeMinutes * 0.8) {
        warnings.push(`Branch context is nearing expiration. Age: ${Math.round(ageMinutes)} minutes`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      console.error('Error validating expiration:', error);
      errors.push('Failed to validate expiration');
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Comprehensive validation of branch context
   */
  async validateBranchContext(
    branchContext: BranchContext,
    options: BranchValidationOptions = {}
  ): Promise<ValidationResult> {
    const {
      checkExistence = true,
      checkStatus = true,
      checkExpiration = true,
      maxAgeMinutes = 60,
    } = options;

    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // 1. Validate structure
    const structureResult = this.validateStructure(branchContext);
    allErrors.push(...structureResult.errors);
    allWarnings.push(...structureResult.warnings);

    if (!structureResult.isValid) {
      return {
        isValid: false,
        errors: allErrors,
        warnings: allWarnings,
      };
    }

    // 2. Validate branch exists
    if (checkExistence) {
      const existenceResult = await this.validateBranchExists(branchContext.branchId);
      allErrors.push(...existenceResult.errors);
      allWarnings.push(...existenceResult.warnings);

      if (!existenceResult.isValid) {
        return {
          isValid: false,
          errors: allErrors,
          warnings: allWarnings,
        };
      }
    }

    // 3. Validate branch status
    if (checkStatus) {
      const statusResult = await this.validateBranchStatus(branchContext.branchId);
      allErrors.push(...statusResult.errors);
      allWarnings.push(...statusResult.warnings);
    }

    // 4. Validate expiration
    if (checkExpiration) {
      const expirationResult = this.validateExpiration(branchContext, maxAgeMinutes);
      allErrors.push(...expirationResult.errors);
      allWarnings.push(...expirationResult.warnings);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  /**
   * Validates branch context and throws error if invalid
   */
  async validateOrThrow(
    branchContext: BranchContext,
    options?: BranchValidationOptions
  ): Promise<void> {
    const result = await this.validateBranchContext(branchContext, options);

    if (!result.isValid) {
      throw new ValidationError(
        `Branch context validation failed: ${result.errors.join(', ')}`,
        { errors: result.errors, warnings: result.warnings }
      );
    }

    // Log warnings if any
    if (result.warnings.length > 0) {
      console.warn('Branch context validation warnings:', result.warnings);
    }
  }

  /**
   * Checks if branch cache is still valid
   */
  private isCacheValid(): boolean {
    const now = Date.now();
    return (now - this.cacheTimestamp) < this.CACHE_DURATION_MS;
  }

  /**
   * Clears branch cache
   */
  clearCache(): void {
    this.branchCache.clear();
    this.cacheTimestamp = 0;
  }

  /**
   * Refreshes branch cache
   */
  async refreshCache(): Promise<void> {
    try {
      const branches = await fetchBranches();
      this.branchCache.clear();
      
      for (const branch of branches) {
        this.branchCache.set(branch.id, branch);
      }
      
      this.cacheTimestamp = Date.now();
      console.log(`Branch cache refreshed with ${branches.length} branches`);
    } catch (error) {
      console.error('Failed to refresh branch cache:', error);
      throw new BranchContextError('Failed to refresh branch cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Gets cached branch
   */
  getCachedBranch(branchId: string): Branch | undefined {
    if (!this.isCacheValid()) {
      return undefined;
    }
    return this.branchCache.get(branchId);
  }

  /**
   * Validates multiple branch contexts
   */
  async validateMultiple(
    branchContexts: BranchContext[],
    options?: BranchValidationOptions
  ): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();

    for (const context of branchContexts) {
      const result = await this.validateBranchContext(context, options);
      results.set(context.branchId, result);
    }

    return results;
  }

  /**
   * Quick validation (structure only, no API calls)
   */
  quickValidate(branchContext: BranchContext): boolean {
    const result = this.validateStructure(branchContext);
    return result.isValid;
  }
}

// Export singleton instance
export const branchContextValidator = new BranchContextValidatorService();
