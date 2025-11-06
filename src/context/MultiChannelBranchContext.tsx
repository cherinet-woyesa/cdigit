/**
 * Multi-Channel Branch Context
 * 
 * Enhanced branch context that includes access method tracking
 * and branch context management for multi-channel access.
 */

import { createContext, useState, useContext, useEffect, useCallback, type ReactNode } from 'react';
import type { BranchContext as BranchContextType, AccessMethod } from '../types/multiChannelAccess';
import { useBranch } from './BranchContext';
import { accessMethodDetector } from '../services/accessMethodDetector';
import { STORAGE_KEYS } from '../constants/multiChannelAccess';
import { BranchContextError } from '../types/multiChannelAccess';

/**
 * Multi-channel branch context interface
 */
interface MultiChannelBranchContextType {
  branchContext: BranchContextType | null;
  accessMethod: AccessMethod | null;
  isLoading: boolean;
  error: string | null;
  setBranchContext: (branchId: string, accessMethod: AccessMethod) => Promise<void>;
  updateAccessMethod: (accessMethod: AccessMethod) => void;
  clearBranchContext: () => void;
  refreshBranchContext: () => Promise<void>;
  getBranchContext: () => BranchContextType | null;
}

// Create the context
const MultiChannelBranchContext = createContext<MultiChannelBranchContextType | undefined>(undefined);

/**
 * Multi-Channel Branch Provider Props
 */
interface MultiChannelBranchProviderProps {
  children: ReactNode;
}

/**
 * Multi-Channel Branch Provider Component
 * Manages branch context with access method tracking
 */
export const MultiChannelBranchProvider: React.FC<MultiChannelBranchProviderProps> = ({ children }) => {
  const { branch, setBranch, clearBranch } = useBranch();
  const [branchContext, setBranchContextState] = useState<BranchContextType | null>(() => {
    // Try to restore from localStorage
    const stored = localStorage.getItem(STORAGE_KEYS.BRANCH_CONTEXT);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse stored branch context:', error);
        return null;
      }
    }
    return null;
  });

  const [accessMethod, setAccessMethodState] = useState<AccessMethod | null>(() => {
    // Detect access method on initialization
    try {
      return accessMethodDetector.detectAccessMethod();
    } catch (error) {
      console.error('Failed to detect access method:', error);
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Creates branch context from branch data and access method
   */
  const createBranchContext = useCallback((
    branchId: string,
    branchName: string,
    branchCode: string,
    method: AccessMethod,
    sessionToken?: string
  ): BranchContextType => {
    return {
      branchId,
      branchName,
      branchCode,
      accessMethod: method,
      timestamp: new Date().toISOString(),
      sessionToken,
    };
  }, []);

  /**
   * Sets branch context with access method
   */
  const setBranchContext = useCallback(async (branchId: string, method: AccessMethod) => {
    setIsLoading(true);
    setError(null);

    try {
      // Find the branch from the existing branch list
      const { branches } = useBranch();
      const selectedBranch = branches.find(b => b.id === branchId);

      if (!selectedBranch) {
        throw new BranchContextError('Branch not found', { branchId });
      }

      // Create branch context
      const context = createBranchContext(
        selectedBranch.id,
        selectedBranch.name,
        selectedBranch.code,
        method
      );

      // Update state
      setBranchContextState(context);
      setAccessMethodState(method);

      // Store in localStorage
      localStorage.setItem(STORAGE_KEYS.BRANCH_CONTEXT, JSON.stringify(context));
      localStorage.setItem(STORAGE_KEYS.ACCESS_METHOD, method);

      // Update the original branch context
      await setBranch(selectedBranch);

      console.log('Branch context set:', context);
    } catch (err) {
      console.error('Failed to set branch context:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to set branch context';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [createBranchContext, setBranch]);

  /**
   * Updates the access method
   */
  const updateAccessMethod = useCallback((method: AccessMethod) => {
    // Only update if method is different
    if (accessMethod === method) {
      return;
    }

    setAccessMethodState(method);
    localStorage.setItem(STORAGE_KEYS.ACCESS_METHOD, method);

    // Update branch context if it exists
    if (branchContext) {
      const updatedContext: BranchContextType = {
        ...branchContext,
        accessMethod: method,
        timestamp: new Date().toISOString(),
      };
      setBranchContextState(updatedContext);
      localStorage.setItem(STORAGE_KEYS.BRANCH_CONTEXT, JSON.stringify(updatedContext));
    }
  }, [accessMethod, branchContext]);

  /**
   * Clears branch context
   */
  const clearBranchContext = useCallback(() => {
    setBranchContextState(null);
    setAccessMethodState(null);
    setError(null);
    
    localStorage.removeItem(STORAGE_KEYS.BRANCH_CONTEXT);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_METHOD);
    
    clearBranch();
    
    console.log('Branch context cleared');
  }, [clearBranch]);

  /**
   * Refreshes branch context from current branch
   */
  const refreshBranchContext = useCallback(async () => {
    if (!branch || !accessMethod) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const context = createBranchContext(
        branch.id,
        branch.name,
        branch.code,
        accessMethod
      );

      setBranchContextState(context);
      localStorage.setItem(STORAGE_KEYS.BRANCH_CONTEXT, JSON.stringify(context));

      console.log('Branch context refreshed:', context);
    } catch (err) {
      console.error('Failed to refresh branch context:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh branch context';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [branch, accessMethod, createBranchContext]);

  /**
   * Gets current branch context
   */
  const getBranchContext = useCallback((): BranchContextType | null => {
    return branchContext;
  }, [branchContext]);

  // Sync with branch changes
  useEffect(() => {
    if (branch && accessMethod && !branchContext) {
      // Create branch context if branch is set but context doesn't exist
      const context = createBranchContext(
        branch.id,
        branch.name,
        branch.code,
        accessMethod
      );
      setBranchContextState(context);
      localStorage.setItem(STORAGE_KEYS.BRANCH_CONTEXT, JSON.stringify(context));
    }
    // Note: Removed automatic clearing to prevent infinite loop
    // Branch context should be cleared manually when needed
  }, [branch, accessMethod, branchContext, createBranchContext]);

  const value: MultiChannelBranchContextType = {
    branchContext,
    accessMethod,
    isLoading,
    error,
    setBranchContext,
    updateAccessMethod,
    clearBranchContext,
    refreshBranchContext,
    getBranchContext,
  };

  return (
    <MultiChannelBranchContext.Provider value={value}>
      {children}
    </MultiChannelBranchContext.Provider>
  );
};

/**
 * Hook to use multi-channel branch context
 */
export const useMultiChannelBranch = (): MultiChannelBranchContextType => {
  const context = useContext(MultiChannelBranchContext);
  if (context === undefined) {
    throw new Error('useMultiChannelBranch must be used within a MultiChannelBranchProvider');
  }
  return context;
};

/**
 * Hook to get branch context with validation
 */
export const useValidatedBranchContext = (): BranchContextType => {
  const { branchContext } = useMultiChannelBranch();
  
  if (!branchContext) {
    throw new BranchContextError('Branch context is required but not set');
  }
  
  return branchContext;
};

/**
 * Hook to get access method with validation
 */
export const useValidatedAccessMethod = (): AccessMethod => {
  const { accessMethod } = useMultiChannelBranch();
  
  if (!accessMethod) {
    throw new BranchContextError('Access method is required but not set');
  }
  
  return accessMethod;
};
