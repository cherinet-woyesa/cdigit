import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBranch } from '../../context/BranchContext';
import { fetchBranches, type Branch } from '../../services/branchService';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.jpg';
import { toast } from 'react-toastify';

const BranchSelectionEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { /* user */ } = useAuth();
  const { setBranch } = useBranch();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [proceeding, setProceeding] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [/* recommendation */, setRecommendation] = useState<Branch | null>(null);
  const [showQr, setShowQr] = useState<boolean>(false);
 

  const canProceed = useMemo(() => !!selectedId && !proceeding, [selectedId, proceeding]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await fetchBranches();
      if (!Array.isArray(list) || list.length === 0) {
        setError('No branches available. Please contact support.');
        setBranches([]);
        return;
      }
      setBranches(list);

      const last = localStorage.getItem('lastActiveBranchId');
      const preferred = list.find(b => b.id === last) || list.find(b => b.isActive) || list[0];
      setSelectedId(preferred?.id || list[0].id);
      setRecommendation(preferred || list[0]);
    } catch (e) {
      console.error('Branch load failed', e);
      setError('Failed to load branches. Please try again later.');
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Preselect from query param if provided (e.g., scanned link)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bid = params.get('branchId');
    if (bid && branches.length > 0) {
      const match = branches.find(b => b.id === bid || b.code === bid);
      if (match) {
        setSelectedId(match.id);
      }
    }
  }, [location.search, branches]);

  const handleProceed = async () => {
    if (!selectedId) return;
    const branch = branches.find(b => b.id === selectedId);
    if (!branch) {
      setError('Invalid branch selected');
      return;
    }

    setProceeding(true);

    // Persist branch immediately for context rehydration after OTP
    try {
      localStorage.setItem('selectedBranch', JSON.stringify(branch));
      localStorage.setItem('lastActiveBranchId', branch.id);
    } catch {}

    // Always navigate to OTP login immediately
    const nextState = { from: location.state?.from || { pathname: '/' } };
    try {
      navigate('/otp-login', { state: nextState, replace: true });
    } catch {
      window.location.assign('/otp-login');
    }

    // Update branch context in the background; do not block navigation
    setTimeout(() => {
      Promise.resolve()
        .then(async () => {
          try {
            await setBranch(branch);
          } catch (e) {
            console.warn('Background setBranch failed', e);
          }
        })
        .finally(() => setProceeding(false));
    }, 0);
  };

  // QR scanning removed

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf6e9] px-2">
        <div className="w-full max-w-sm bg-white shadow-xl rounded-xl p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-700 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading branches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf6e9] px-2">
        <div className="w-full max-w-sm bg-white shadow-xl rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Branches</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={load} className="px-4 py-2 bg-fuchsia-700 text-white rounded-lg hover:bg-fuchsia-800">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf6e9] px-2">
      <div className="w-full max-w-sm sm:max-w-md bg-white shadow-xl rounded-xl p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto">
            <img src={logo} alt="CBE Logo" className="h-16 w-16 object-contain mx-auto rounded-full border-2 border-fuchsia-200" />
          </div>
          <h1 className="text-2xl font-extrabold text-fuchsia-700">Select Your Branch</h1>
          <p className="text-gray-600 text-sm">Choose the branch you are currently at.</p>
        </div>

        {/* Recommendation is applied by default selection; no banner needed */}

        <div className="space-y-2">
          <label htmlFor="branch-select" className="block text-sm font-medium text-gray-700">Branch Name</label>
          <select
            id="branch-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm rounded-md"
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {/* Generate QR for testing on mobile */}
          <button
            onClick={() => setShowQr(v => !v)}
            className="w-full py-2 px-4 border border-fuchsia-200 rounded-lg text-sm bg-white text-fuchsia-800 hover:bg-fuchsia-50"
            disabled={!selectedId}
          >
            {showQr ? 'Hide' : 'Show'} QR for this Branch
          </button>
          {showQr && selectedId && (
            <div className="flex justify-center">
              {(() => {
                const configuredBase = (import.meta as any).env?.VITE_PUBLIC_BASE_URL as string | undefined;
                const baseUrl = configuredBase && configuredBase.trim().length > 0 ? configuredBase : window.location.origin;
                const qrUrl = `${baseUrl}/select-branch?branchId=${selectedId}`;
                return (
                  <img
                alt="Branch QR"
                className="border rounded-lg"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrl)}`}
              />
                );
              })()}
            </div>
          )}
        </div>

        <button
          onClick={handleProceed}
          disabled={!canProceed}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-fuchsia-700 hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 disabled:opacity-50"
        >
          {proceeding ? (
            <span className="flex items-center">
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              Processing
            </span>
          ) : 'Proceed'}
        </button>
      </div>
    </div>
  );
};

export default BranchSelectionEnhanced;


