import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBranch } from '../../context/BranchContext';
import { fetchBranches } from '../../services/branchService';
import type { Branch } from '../../services/branchService';
import { useAuth } from '../../context/AuthContext';
import QRCodeScanner from './QRCodeScanner';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ChevronDownIcon, MapPinIcon, ClockIcon, PhoneIcon } from '@heroicons/react/24/outline';

// Extend the Branch interface to include distance for branches with location data
interface BranchWithDistance extends Branch {
  distance?: number;
}

// Utility function to calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const BranchSelectionEnhanced: React.FC = () => {
  // Hooks - must be called unconditionally at the top level
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { setBranch } = useBranch();

  // State - must be called unconditionally
  const [branches, setBranches] = useState<BranchWithDistance[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProceeding, setIsProceeding] = useState<boolean>(false);
  const [showQRScanner, setShowQRScanner] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [locationStatus, setLocationStatus] = useState<{
    loading: boolean;
    error: string | null;
    coordinates?: { lat: number; lng: number };
  }>({ loading: false, error: null });

  // Memoized values - must be called unconditionally
  const canProceed = useMemo(() => !!selectedId && !isProceeding, [selectedId, isProceeding]);
  const selectedBranch = useMemo(
    () => branches.find(b => b.id === selectedId),
    [branches, selectedId]
  );

  // Memoized recommended branch (nearest or first available) - must be called unconditionally
  const recommendedBranch = useMemo(() => {
    if (selectedId) {
      return branches.find(b => b.id === selectedId) || null;
    }
    
    // Try to find nearest branch with distance
    const branchWithDistance = branches.find(b => b.distance !== undefined);
    if (branchWithDistance) return branchWithDistance;
    
    // Fallback to first active branch or first in the list
    return branches.find(b => b.isActive) || branches[0] || null;
  }, [branches, selectedId]);

  // Memoized other branches (excluding the recommended one) - must be called unconditionally
  const otherBranches = useMemo(() => {
    if (!recommendedBranch) return [...branches];
    return branches.filter(b => b.id !== recommendedBranch.id);
  }, [branches, recommendedBranch]);

  // Find the nearest branch to given coordinates
  const findNearestBranch = useCallback((branchesList: BranchWithDistance[], lat: number, lng: number): BranchWithDistance | null => {
    // Filter branches with valid coordinates and add distance
    const branchesWithDistance = branchesList
      .filter((branch): branch is BranchWithDistance & { latitude: number; longitude: number } => 
        branch.latitude !== undefined && 
        branch.longitude !== undefined
      )
      .map(branch => ({
        ...branch,
        distance: calculateDistance(lat, lng, branch.latitude, branch.longitude)
      }));

    // Check if we have any branches with distance
    if (branchesWithDistance.length === 0) {
      return null;
    }

    // Sort by distance and return the nearest one within 50km
    const [nearest] = [...branchesWithDistance].sort((a, b) => a.distance - b.distance);
    return nearest.distance <= 50 ? nearest : null;
  }, []);

  // Select default branch (last used or first active)
  const selectDefaultBranch = useCallback((branchesList: Branch[]) => {
    console.log('Selecting default branch from:', branchesList);
    const lastBranchId = localStorage.getItem('lastActiveBranchId');
    console.log('Last branch ID from localStorage:', lastBranchId);
    
    const defaultBranch = lastBranchId
      ? branchesList.find(b => b.id === lastBranchId)
      : branchesList.find(b => b.isActive) || branchesList[0];
    
    console.log('Selected default branch:', defaultBranch);
    
    if (defaultBranch) {
      setSelectedId(defaultBranch.id);
    } else if (branchesList.length > 0) {
      // Fallback to first branch if no default found
      setSelectedId(branchesList[0].id);
    }
  }, []);

  // Get user's current location
  const getUserLocation = useCallback(async (branchesList: Branch[]) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocationStatus({
        loading: false,
        error: 'Geolocation is not supported by your browser.'
      });
      selectDefaultBranch(branchesList);
      return;
    }

    setLocationStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });

      const { latitude, longitude } = position.coords;
      setLocationStatus({
        loading: false,
        error: null,
        coordinates: { lat: latitude, lng: longitude }
      });

      // Find nearest branch
      const nearestBranch = findNearestBranch(branchesList, latitude, longitude);
      if (nearestBranch) {
        setSelectedId(nearestBranch.id);
      } else {
        selectDefaultBranch(branchesList);
      }
    } catch (error) {
      console.warn('Geolocation error:', error);
      setLocationStatus({
        loading: false,
        error: 'Could not determine your location. Using default branch selection.'
      });
      selectDefaultBranch(branchesList);
    }
  }, [findNearestBranch, selectDefaultBranch]);

  // Fetch branches
  const loadBranches = useCallback(async () => {
    console.log('Starting to load branches...');
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Calling fetchBranches...');
      const list: BranchWithDistance[] = await fetchBranches();
      console.log('Received branches:', list);
      
      if (!Array.isArray(list)) {
        throw new Error('Invalid response format: expected an array');
      }
      
      if (list.length === 0) {
        throw new Error('No branches available');
      }
      
      // Sort branches by name for better UX
      const sortedBranches = [...list].sort((a, b) => a.name.localeCompare(b.name));
      setBranches(sortedBranches);
      
      // Try to get user's location if branches have coordinates
      const hasBranchesWithCoords = sortedBranches.some(b => b.latitude && b.longitude);
      console.log('Branches with coordinates:', hasBranchesWithCoords);
      
      if (hasBranchesWithCoords) {
        await getUserLocation(sortedBranches);
      } else {
        // Fallback to last used or first active branch
        selectDefaultBranch(sortedBranches);
      }
      
    } catch (e) {
      console.error('❌ Failed to load branches from API:', e);
      
      // Use mock data for testing
      console.log('🔄 Using mock data for testing...');
      const mockBranches: BranchWithDistance[] = [
        {
          id: 'branch-001',
        name: 'CBE Main Branch',
        code: 'MAIN',
        status: 'active',  // Add required status
        qrCode: 'qr-main-001', // Add qrCode if required, or make optional
        address: 'Addis Ababa, Ethiopia',
        phone: '+251 11 123 4567',
        workingHours: 'Mon-Fri: 8:30 AM - 4:30 PM',
        isActive: true,
        latitude: 9.0054,
        longitude: 38.7636
        },
        {
          id: 'branch-002',
        name: 'CBE Airport Branch', 
        code: 'AIRPORT',
        status: 'active',
        qrCode: 'qr-airport-002',
        address: 'Bole International Airport',
        phone: '+251 11 987 6543',
        workingHours: 'Mon-Sun: 6:00 AM - 10:00 PM',
        isActive: true,
        latitude: 8.9779,
        longitude: 38.7993
        },
        {
          id: 'branch-003',
        name: 'CBE City Center',
        code: 'CITYCENT',
        status: 'active',
        qrCode: 'qr-city-003',
        address: 'Mexico Square, Addis Ababa',
        phone: '+251 11 555 1234',
        workingHours: 'Mon-Fri: 8:00 AM - 5:00 PM',
        isActive: true,
        latitude: 9.0300,
        longitude: 38.7600
        }
      ];
      
      setBranches(mockBranches);
      
      // Set a demo branch as selected
      if (mockBranches.length > 0) {
        setSelectedId(mockBranches[0].id);
      }
      
      // Show a warning but don't block the UI
      setError('Connected to demo mode. Using sample branch data for testing.');
      toast.info('Demo mode: Using sample branch data');
      
    } finally {
      setIsLoading(false);
      console.log('✅ Finished loading branches');
    }
  }, [getUserLocation, selectDefaultBranch]);

  // Handle branch selection
  const handleProceed = useCallback(async () => {
    if (!selectedId || !selectedBranch) {
      console.log('Cannot proceed: no branch selected');
      return;
    }
    
    console.log('Proceeding with branch:', selectedBranch);
    setIsProceeding(true);

    try {
      // Save to local storage
      localStorage.setItem('selectedBranch', JSON.stringify(selectedBranch));
      localStorage.setItem('lastActiveBranchId', selectedBranch.id);
      
      // Update branch context
      await setBranch(selectedBranch);
      
      // Navigate to next page
      const nextState = { from: location.state?.from || { pathname: '/' } };
      navigate('/otp-login', { state: nextState, replace: true });
    } catch (error) {
      console.error('Branch selection failed:', error);
      const errorMessage = 'Failed to select branch. Please try again.';
      setError(errorMessage);
      toast.error('Failed to select branch');
    } finally {
      setIsProceeding(false);
    }
  }, [selectedId, selectedBranch, setBranch, navigate, location.state]);

  // Handle branch selection from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const branchId = params.get('branchId');
    
    if (branchId && branches.length > 0) {
      const match = branches.find(b => b.id === branchId || b.code === branchId);
      if (match) {
        setSelectedId(match.id);
      }
    }
  }, [location.search, branches]);

  // Initial load
  useEffect(() => {
    console.log('Component mounted, loading branches...');
    loadBranches();
  }, [loadBranches]);

  // Auto-proceed if there's only one branch
  useEffect(() => {
    if (branches.length === 1 && !selectedId && branches[0]?.id) {
      console.log('Auto-selecting single branch:', branches[0]);
      setSelectedId(branches[0].id);
    }
  }, [branches, selectedId]);

  // Debug effect to log state changes
  useEffect(() => {
    console.log('Branches state updated:', branches.length, 'branches');
    console.log('Selected ID:', selectedId);
    console.log('Is loading:', isLoading);
    console.log('Error:', error);
  }, [branches, selectedId, isLoading, error]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf6e9] px-2">
        <div className="w-full max-w-sm bg-white shadow-xl rounded-xl p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-700 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading branches...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch branch information</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf6e9] px-2">
        <div className="w-full max-w-sm bg-white shadow-xl rounded-xl p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Branches</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadBranches}
            className="px-6 py-2 bg-fuchsia-700 text-white rounded-lg hover:bg-fuchsia-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  console.log('Rendering component with:', branches.length, 'branches');
  console.log('Recommended branch:', recommendedBranch);
  console.log('Other branches:', otherBranches.length);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf6e9] px-2">
      <div className="w-full max-w-sm bg-white shadow-xl rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-fuchsia-700 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Select Your Branch</h1>
          <p className="text-fuchsia-100 mt-1">Choose the branch you want to visit</p>
        </div>

        {/* Recommended Branch */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-500 mb-3">RECOMMENDED BRANCH</h2>
          
          {recommendedBranch ? (
            <div className="bg-fuchsia-50 p-4 rounded-lg border border-fuchsia-100">
              <div className="flex items-start">
                <div className="bg-fuchsia-100 p-2 rounded-full mr-3">
                  <MapPinIcon className="h-5 w-5 text-fuchsia-700" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{recommendedBranch.name}</h3>
                  {recommendedBranch.distance !== undefined && (
                    <p className="text-xs text-fuchsia-700 mt-1">
                      {recommendedBranch.distance.toFixed(1)} km away
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-fuchsia-100 text-sm text-gray-600 space-y-2">
                {(recommendedBranch.address || recommendedBranch.location) && (
                  <div className="flex items-start">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{recommendedBranch.address || recommendedBranch.location}</span>
                  </div>
                )}
                {recommendedBranch.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <a href={`tel:${recommendedBranch.phone}`} className="hover:text-fuchsia-700">
                      {recommendedBranch.phone}
                    </a>
                  </div>
                )}
                {recommendedBranch.workingHours && (
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{recommendedBranch.workingHours}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No recommended branch found
            </div>
          )}
        </div>

        {/* Other Branches Dropdown - Only show if there are other branches */}
        {otherBranches.length > 0 && (
          <div className="p-6">
            <div className="mb-3">
              <h2 className="text-sm font-medium text-gray-500">OTHER BRANCHES</h2>
            </div>
            
            <div className="relative">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="appearance-none w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent bg-white"
              >
                <option value="">Select another branch</option>
                {otherBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} {branch.distance ? `(${branch.distance.toFixed(1)} km)` : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDownIcon className="h-5 w-5" />
              </div>
            </div>
            
            {locationStatus.loading && (
              <div className="mt-3 text-sm text-fuchsia-700 flex items-center">
                <svg
                  className="animate-spin h-4 w-4 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Finding branches near you...
              </div>
            )}
            
            {locationStatus.error && (
              <div className="mt-3 text-sm text-yellow-700">
                {locationStatus.error}
              </div>
            )}
          </div>
        )}

        {/* Show message if no branches available */}
        {branches.length === 0 && !isLoading && (
          <div className="p-6 text-center">
            <p className="text-gray-500">No branches available</p>
          </div>
        )}

        {/* Action buttons - SINGLE SECTION (removed duplicate) */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 space-y-3">
          <button
            onClick={handleProceed}
            disabled={!canProceed}
            className={`w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white ${
              canProceed
                ? 'bg-fuchsia-700 hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isProceeding ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Proceed to Login'
            )}
          </button>
          
          {/* QR Scanner button */}
          <button
            onClick={() => setShowQRScanner(true)}
            className="w-full py-3 px-4 border border-fuchsia-700 text-fuchsia-700 rounded-lg hover:bg-fuchsia-50 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h1m-6 0h1m-6 0h1M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Scan Branch QR Code
          </button>
        </div>

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QRCodeScanner onClose={() => setShowQRScanner(false)} />
        )}
      </div>
    </div>
  );
};

export default BranchSelectionEnhanced;