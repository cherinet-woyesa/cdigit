import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBranch } from '../../context/BranchContext';
import { fetchBranches } from '../../services/branchService';
import type { Branch } from '../../services/branchService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.jpg';
import 'react-toastify/dist/ReactToastify.css';

const BranchSelection: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setBranch, isLoading } = useBranch();
  const { user } = useAuth();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadBranches = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch branches from the API
        const fetchedBranches = await fetchBranches();
        
        if (fetchedBranches.length === 0) {
          setError('No branches available. Please contact support.');
          return;
        }
        
        setBranches(fetchedBranches);

        // Check local storage for a previously selected branch
        const lastSelectedBranch = localStorage.getItem('lastActiveBranchId');
        if (lastSelectedBranch && fetchedBranches.some(b => b.id === lastSelectedBranch)) {
          setSelectedBranch(lastSelectedBranch);
        } else if (fetchedBranches.length > 0) {
          // Default to the first active branch if none is stored
          const activeBranch = fetchedBranches.find(b => b.isActive) || fetchedBranches[0];
          setSelectedBranch(activeBranch.id);
        }
      } catch (err) {
        console.error('Error loading branches:', err);
        setError('Failed to load branches. Please try again later.');
        toast.error('Failed to load branches. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    loadBranches();
  }, []);

  const handleProceed = async () => {
    if (!selectedBranch) {
      setError('Please select a branch to continue.');
      return;
    }
    
    const branch = branches.find(b => b.id === selectedBranch);
    if (!branch) {
      setError('Invalid branch selected');
      return;
    }

    // Always navigate; do not let branch update block route change
    setLoading(true);
    const nextState = { from: location.state?.from || { pathname: '/' } };
    try {
      await setBranch(branch);
      localStorage.setItem('lastActiveBranchId', branch.id);
    } catch (err) {
      console.warn('Proceed: setBranch failed, continuing to navigate', err);
    } finally {
      if (user) {
        const from = location.state?.from?.pathname || '/';
        console.debug('Navigating authenticated user to:', from);
        navigate(from, { replace: true });
      } else {
        console.debug('Navigating unauthenticated user to /otp-login with state:', nextState);
        try {
          navigate('/otp-login', { state: nextState, replace: true });
        } catch (e) {
          console.warn('SPA navigate failed, forcing hard navigation to /otp-login');
          window.location.assign('/otp-login');
        }
      }
      setLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading branches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Branches</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf6e9] px-2">
      <div className="w-full max-w-sm bg-white shadow-xl rounded-xl p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto">
            <img src={logo} alt="CBE Logo" className="h-16 w-16 object-contain mx-auto rounded-full border-2 border-fuchsia-200" />
          </div>
          <h1 className="text-2xl font-extrabold text-fuchsia-700">Select Your Branch</h1>
          <p className="text-gray-600 text-sm">Choose the branch you are currently at.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="branch-select" className="block text-sm font-medium text-gray-700">
            Branch Name
          </label>
          <select
            id="branch-select"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm rounded-md"
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            onClick={handleProceed}
            disabled={!selectedBranch || loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-fuchsia-700 hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Processing
              </span>
            ) : (
              'Proceed'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BranchSelection;
