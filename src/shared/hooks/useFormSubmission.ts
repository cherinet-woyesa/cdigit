/**
 * Form Submission Hook
 * 
 * Custom hook that provides form submission utilities with automatic
 * access method and branch context inclusion, plus audit logging.
 */

import { useCallback } from 'react';
import { useMultiChannelBranch } from '@context/MultiChannelBranchContext';
import { sessionManager } from '@services/audit/sessionManager';
import { auditLogger } from '@services/audit/auditLogger';

/**
 * Form submission options
 */
interface FormSubmissionOptions {
  /** Form type/name for logging */
  formType: string;
  /** Whether to log the transaction */
  enableAuditLog?: boolean;
  /** Custom success callback */
  onSuccess?: (result: any) => void;
  /** Custom error callback */
  onError?: (error: Error) => void;
}

/**
 * Enhanced form data with multi-channel context
 */
export interface EnhancedFormData<T = any> {
  /** Original form data */
  formData: T;
  /** Access method used */
  accessMethod: string | null;
  /** Branch ID */
  branchId: string | null;
  /** Branch name */
  branchName: string | null;
  /** Session ID */
  sessionId: string | null;
  /** Timestamp */
  timestamp: string;
}

/**
 * Hook for form submission with multi-channel support
 */
export function useFormSubmission(options: FormSubmissionOptions) {
  const { branchContext, accessMethod } = useMultiChannelBranch();
  const { formType, enableAuditLog = true, onSuccess, onError } = options;

  /**
   * Enhances form data with multi-channel context
   */
  const enhanceFormData = useCallback(<T,>(formData: T): EnhancedFormData<T> => {
    const session = sessionManager.getCurrentSession();

    return {
      formData,
      accessMethod: accessMethod || null,
      branchId: branchContext?.branchId || null,
      branchName: branchContext?.branchName || null,
      sessionId: session?.sessionId || null,
      timestamp: new Date().toISOString(),
    };
  }, [accessMethod, branchContext]);

  /**
   * Submits form with automatic context inclusion and audit logging
   */
  const submitForm = useCallback(async <T, R>(
    formData: T,
    submitFn: (enhancedData: EnhancedFormData<T>) => Promise<R>
  ): Promise<R> => {
    const session = sessionManager.getCurrentSession();

    // Log transaction initiation
    if (enableAuditLog) {
      await auditLogger.logTransaction('transaction_initiated', {
        transactionType: formType,
        sessionId: session?.sessionId || '',
        accessMethod: accessMethod || undefined,
        branchId: branchContext?.branchId,
      });
    }

    try {
      // Enhance form data with context
      const enhancedData = enhanceFormData(formData);

      // Submit form
      const result = await submitFn(enhancedData);

      // Log success
      if (enableAuditLog) {
        await auditLogger.logTransaction('transaction_completed', {
          transactionType: formType,
          sessionId: session?.sessionId || '',
          accessMethod: accessMethod || undefined,
          branchId: branchContext?.branchId,
        });
      }

      // Increment transaction count
      sessionManager.incrementTransactionCount();

      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      // Log failure
      if (enableAuditLog) {
        await auditLogger.logTransaction('transaction_failed', {
          transactionType: formType,
          sessionId: session?.sessionId || '',
          errorReason: error instanceof Error ? error.message : 'Unknown error',
          accessMethod: accessMethod || undefined,
          branchId: branchContext?.branchId,
        });
      }

      // Call error callback
      if (onError && error instanceof Error) {
        onError(error);
      }

      throw error;
    }
  }, [formType, enableAuditLog, accessMethod, branchContext, enhanceFormData, onSuccess, onError]);

  /**
   * Gets current branch context for display
   */
  const getBranchInfo = useCallback(() => {
    return {
      branchName: branchContext?.branchName || null,
      branchCode: branchContext?.branchCode || null,
      accessMethod: accessMethod || null,
    };
  }, [branchContext, accessMethod]);

  return {
    /** Submit form with automatic context and logging */
    submitForm,
    /** Enhance form data with context (without submitting) */
    enhanceFormData,
    /** Get current branch info for display */
    getBranchInfo,
    /** Current branch context */
    branchContext,
    /** Current access method */
    accessMethod,
  };
}
