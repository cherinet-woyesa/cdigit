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
      localStorage.setItem('selectedBranch', JSON.stringify(newBranch));
      // Update user's branch in auth context only if changed to avoid loops
      if (user?.branchId !== newBranch.id) {
        updateUserBranch?.(newBranch.id);
      }
    } else {
      localStorage.removeItem('selectedBranch');
    }
    
    return Promise.resolve();
  }, [user?.branchId, updateUserBranch]);

  const loadBranches = useCallback(async () => {
    // FIXED: Prevent multiple simultaneous calls
    if (isLoading) {
      console.log('BranchContext: loadBranches already in progress, skipping');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedBranches = await fetchBranches();
      
      console.log('BranchContext: Fetched branches:', fetchedBranches);
      
      setBranches(fetchedBranches);
      
      // For staff users, get branch from JWT token and auto-select it
      const isStaffRole = user?.role && ['Maker', 'Admin', 'Manager'].includes(user.role);
      console.log('BranchContext: User role:', user?.role, 'Is staff:', isStaffRole);
      
      if (isStaffRole && user?.branchId) {
        console.log('BranchContext: Staff user with branch ID:', user.branchId);
        const staffBranch = fetchedBranches.find(b => b.id === user.branchId);
        if (staffBranch) {
          console.log('BranchContext: Auto-selecting staff branch:', staffBranch);
          await setBranch(staffBranch);
          
          // FIXED: Return early to prevent further processing for staff users
          console.log('BranchContext: Staff branch selection complete, returning early');
          return;
        } else {
          console.warn('BranchContext: Staff branch not found in branches list:', user.branchId);
          // FIXED: Even if branch not found, don't redirect staff to branch selection
          // Staff should continue without a branch selection
          return;
        }
      } 
      // For customers, if there's only one branch, auto-select it
      else if (fetchedBranches.length === 1 && !isStaffRole) {
        console.log('BranchContext: Auto-selecting single branch for customer');
        await setBranch(fetchedBranches[0]);
      } 
      // If we already have a selected branch, make sure it's still valid
      else if (branch) {
        const currentBranch = fetchedBranches.find(b => b.id === branch.id);
        if (!currentBranch) {
          // Current branch no longer exists, clear selection
          console.log('BranchContext: Current branch no longer exists, clearing');
          clearBranch();
          // FIXED: Only redirect customers to branch selection, not staff
          if (location.pathname !== '/select-branch' && !isStaffRole) {
            navigate('/select-branch', { state: { from: location } });
          }
        }
      }
      
      // FIXED: Additional check for staff users who might have ended up on branch selection
      if (isStaffRole && location.pathname === '/select-branch') {
        console.log('BranchContext: Staff user detected on branch selection page - should be redirected by StaffRouteGuard');
        // The StaffRouteGuard will handle the actual redirection
      }
    } catch (err) {
      console.error('BranchContext: Failed to load branches:', err);
      setError('Failed to load branches. Please try again later.');
      toast.error('Failed to load branches');
    } finally {
      setIsLoading(false);
    }
  }, [branch, clearBranch, setBranch, navigate, location, user?.role, user?.branchId, isLoading]); // FIXED: Added isLoading to dependencies

  // Load branches on mount and when user changes
  useEffect(() => {
    // FIXED: Only load branches if we have a user and branches aren't already loaded
    if (user?.id && branches.length === 0 && !isLoading) {
      console.log('BranchContext: Initializing branches for user:', user.id);
      loadBranches().catch(console.error);
    }
  }, [user?.id, loadBranches, branches.length, isLoading]); // FIXED: Added branches.length and isLoading to dependencies

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
        const isStaffRole = user?.role && ['Maker', 'Admin', 'Manager'].includes(user.role);
        // FIXED: Only redirect customers to branch selection, not staff
        if (!isStaffRole) {
          navigate('/select-branch');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [branch?.id, clearBranch, navigate, user?.role]);

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