/**
 * useApprovalWorkflow Hook
 * Simplifies approval workflow integration in transaction forms
 */

import { useState, useCallback } from 'react';
import approvalWorkflowService, {
  type ApprovalRequest,
  type ApprovalAction,
  type ApprovalWorkflow,
} from '../services/approvalWorkflowService';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../config/rbacMatrix';

interface UseApprovalWorkflowReturn {
  /** Create approval workflow for a transaction */
  createWorkflow: (request: Omit<ApprovalRequest, 'requestedBy' | 'requestedByRole'>) => Promise<ApprovalWorkflow | null>;
  
  /** Process approval action */
  processApproval: (action: Omit<ApprovalAction, 'approvedBy' | 'approverRole' | 'timestamp'>) => Promise<{
    success: boolean;
    message: string;
    workflow?: ApprovalWorkflow;
  }>;
  
  /** Check if current workflow requires approval */
  requiresApproval: boolean;
  
  /** Current workflow */
  currentWorkflow: ApprovalWorkflow | null;
  
  /** Loading state */
  loading: boolean;
  
  /** Error message */
  error: string | null;
  
  /** Clear error */
  clearError: () => void;
}

export const useApprovalWorkflow = (): UseApprovalWorkflowReturn => {
  const { user } = useAuth();
  const [currentWorkflow, setCurrentWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWorkflow = useCallback(
    async (request: Omit<ApprovalRequest, 'requestedBy' | 'requestedByRole'>): Promise<ApprovalWorkflow | null> => {
      if (!user) {
        setError('User not authenticated');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const workflow = await approvalWorkflowService.createWorkflow({
          ...request,
          requestedBy: user.id,
          requestedByRole: user.role as UserRole,
        });

        setCurrentWorkflow(workflow);
        return workflow;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create approval workflow';
        setError(errorMsg);
        console.error('Error creating workflow:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const processApproval = useCallback(
    async (action: Omit<ApprovalAction, 'approvedBy' | 'approverRole' | 'timestamp'>) => {
      if (!user) {
        setError('User not authenticated');
        return { success: false, message: 'User not authenticated' };
      }

      setLoading(true);
      setError(null);

      try {
        const result = await approvalWorkflowService.processApproval({
          ...action,
          approvedBy: user.id,
          approverRole: user.role as UserRole,
          timestamp: new Date(),
        });

        if (result.success && result.workflow) {
          setCurrentWorkflow(result.workflow);
        } else if (!result.success) {
          setError(result.message);
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to process approval';
        setError(errorMsg);
        console.error('Error processing approval:', err);
        return { success: false, message: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createWorkflow,
    processApproval,
    requiresApproval: currentWorkflow?.requiresApproval || false,
    currentWorkflow,
    loading,
    error,
    clearError,
  };
};
