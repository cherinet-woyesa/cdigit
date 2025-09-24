import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getBranchById, fetchBranches } from '../services/branchService';
import type { Branch } from '../services/branchService';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Define the shape of the context
interface BranchContextType {
  branch: Branch | null;
  branches: Branch[];
  isLoading: boolean;
  error: string | null;
  setBranch: (branch: Branch | null) => Promise<void>;
  refreshBranch: () => Promise<void>;
  clearBranch: () => void;
  loadBranches: () => Promise<void>;
}

// Create the context with a default value
const BranchContext = createContext<BranchContextType | undefined>(undefined);

// Create a provider component
interface BranchProviderProps {
  children: ReactNode;
}

export const BranchProvider: React.FC<BranchProviderProps> = ({ children }) => {
  const [branch, setBranchState] = useState<Branch | null>(() => {
    // Initialize from localStorage if available
    const savedBranch = localStorage.getItem('selectedBranch');
    return savedBranch ? JSON.parse(savedBranch) : null;
  });
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUserBranch } = useAuth();

  const clearBranch = useCallback(() => {
    setBranchState(null);
    localStorage.removeItem('selectedBranch');
    localStorage.removeItem('lastActiveBranchId');
  }, []);

  const setBranch = useCallback(async (newBranch: Branch | null) => {
    setBranchState(newBranch);
    setError(null);
    
    if (newBranch) {
      // Save the branch selection to the backend if user is authenticated
      try {
        // This would be an API call to save the user's branch preference
        // await apiService.setUserBranch(newBranch.id);
      } catch (err) {
        console.error('Failed to update user branch:', err);
        toast.error('Failed to save branch selection');
        throw err;
      }
    }
    
    return Promise.resolve();
  }, []);

  const loadBranches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedBranches = await fetchBranches();
      setBranches(fetchedBranches);
      
      // If there's only one branch, auto-select it
      if (fetchedBranches.length === 1) {
        await setBranch(fetchedBranches[0]);
      } else if (branch) {
        // If we already have a selected branch, make sure it's still valid
        const currentBranch = fetchedBranches.find(b => b.id === branch.id);
        if (!currentBranch) {
          // Current branch no longer exists, clear selection
          clearBranch();
          if (location.pathname !== '/select-branch') {
            navigate('/select-branch', { state: { from: location } });
          }
        }
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
      setError('Failed to load branches. Please try again later.');
      toast.error('Failed to load branches');
    } finally {
      setIsLoading(false);
    }
  }, [clearBranch, setBranch]);

  // Load branches on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadBranches().catch(console.error);
    }
  }, [user?.id]);

  // Update localStorage when branch changes
  useEffect(() => {
    if (branch) {
      localStorage.setItem('selectedBranch', JSON.stringify(branch));
      // Update user's branch in auth context only if changed to avoid loops
      if (user?.branchId !== branch.id) {
        updateUserBranch?.(branch.id);
      }
    } else {
      localStorage.removeItem('selectedBranch');
    }
  }, [branch, updateUserBranch, user?.branchId]);

  const refreshBranch = useCallback(async () => {
    if (!branch?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedBranch = await getBranchById(branch.id);
      setBranchState(updatedBranch);
    } catch (err) {
      console.error('Failed to refresh branch:', err);
      setError('Failed to refresh branch information');
      // If branch no longer exists, clear the selection
      if (err instanceof Error && err.message.includes('404')) {
        clearBranch();
        navigate('/select-branch');
      }
    } finally {
      setIsLoading(false);
    }
  }, [branch?.id, clearBranch, navigate]);

  const value = { 
    branch,
    branches,
    isLoading, 
    error, 
    setBranch, 
    refreshBranch, 
    clearBranch,
    loadBranches
  };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
};

// Create a custom hook for easy consumption of the context
export const useBranch = () => {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};
