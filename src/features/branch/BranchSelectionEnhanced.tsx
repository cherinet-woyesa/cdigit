import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBranch } from '../../context/BranchContext';
import { fetchBranches } from '../../services/branchService';
import type { Branch } from '../../services/branchService';
import { useAuth } from '../../context/AuthContext';
import QRCodeScanner from './QRCodeScanner';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  ChevronDownIcon, 
  MapPinIcon, 
  ClockIcon, 
  PhoneIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  SignalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

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
  const { t, i18n } = useTranslation();

  // State - must be called unconditionally
  const [branches, setBranches] = useState<BranchWithDistance[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProceeding, setIsProceeding] = useState<boolean>(false);
  const [showQRScanner, setShowQRScanner] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
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

  // Filter branches based on search term
  const filteredBranches = useMemo(() => {
    if (!searchTerm) return branches;
    return branches.filter(branch =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [branches, searchTerm]);

  // Memoized nearby branches (with distance data)
  const nearbyBranches = useMemo(() => {
    return branches
      .filter(branch => branch.distance !== undefined)
      .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
      .slice(0, 5); // Show top 5 nearest branches
  }, [branches]);

  // Memoized other branches (without distance data or farther away)
  const otherBranches = useMemo(() => {
    return branches.filter(branch => 
      branch.distance === undefined || 
      !nearbyBranches.some(nb => nb.id === branch.id)
    );
  }, [branches, nearbyBranches]);

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
        error: t('branchSelection.geolocationNotSupported', 'Geolocation is not supported by your browser.')
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

      // Find nearest branch and calculate distances for all branches
      const branchesWithDistance = branchesList.map(branch => {
        if (branch.latitude && branch.longitude) {
          return {
            ...branch,
            distance: calculateDistance(latitude, longitude, branch.latitude, branch.longitude)
          };
        }
        return branch;
      });

      setBranches(branchesWithDistance);

      // Auto-select the nearest branch
      const nearestBranch = findNearestBranch(branchesWithDistance, latitude, longitude);
      if (nearestBranch) {
        setSelectedId(nearestBranch.id);
      } else {
        selectDefaultBranch(branchesList);
      }
    } catch (error) {
      console.warn('Geolocation error:', error);
      setLocationStatus({
        loading: false,
        error: t('branchSelection.locationError', 'Could not determine your location. Using default branch selection.')
      });
      selectDefaultBranch(branchesList);
    }
  }, [findNearestBranch, selectDefaultBranch, t]);

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
      
      // Try to get user's location if branches have coordinates
      const hasBranchesWithCoords = sortedBranches.some(b => b.latitude && b.longitude);
      console.log('Branches with coordinates:', hasBranchesWithCoords);
      
      if (hasBranchesWithCoords) {
        await getUserLocation(sortedBranches);
      } else {
        setBranches(sortedBranches);
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
          status: 'active',
          qrCode: 'qr-main-001',
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
      setError(t('branchSelection.demoMode', 'Connected to demo mode. Using sample branch data for testing.'));
      toast.info(t('branchSelection.demoNotification', 'Demo mode: Using sample branch data'));
      
    } finally {
      setIsLoading(false);
      console.log('✅ Finished loading branches');
    }
  }, [getUserLocation, selectDefaultBranch, t]);

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
      const errorMessage = t('branchSelection.selectionError', 'Failed to select branch. Please try again.');
      setError(errorMessage);
      toast.error(t('branchSelection.selectionError', 'Failed to select branch'));
    } finally {
      setIsProceeding(false);
    }
  }, [selectedId, selectedBranch, setBranch, navigate, location.state, t]);

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

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fuchsia-50 via-white to-pink-50 px-4 py-8">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-fuchsia-700 mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {t('branchSelection.loading', 'Loading Branches')}
          </h3>
          <p className="text-gray-600">
            {t('branchSelection.loadingDescription', 'Please wait while we fetch branch information')}
          </p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && branches.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fuchsia-50 via-white to-pink-50 px-4 py-8">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl p-8 text-center">
          <div className="text-red-500 mb-6">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {t('branchSelection.errorTitle', 'Error Loading Branches')}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadBranches}
            className="px-8 py-3 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white rounded-xl hover:from-fuchsia-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {t('branchSelection.retry', 'Try Again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fuchsia-50 via-white to-pink-50 px-4 py-8">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-fuchsia-600 to-pink-600 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <BuildingStorefrontIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {t('branchSelection.title', 'Select Your Branch')}
          </h1>
          <p className="text-fuchsia-100 opacity-90">
            {t('branchSelection.subtitle', 'Choose the branch you want to visit')}
          </p>
        </div>

        {/* Search Bar */}
        {branches.length > 3 && (
          <div className="p-6 border-b border-gray-100">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('branchSelection.searchPlaceholder', 'Search branches...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all duration-200"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Nearby Branches Dropdown */}
        {nearbyBranches.length > 0 && !searchTerm && (
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {t('branchSelection.nearbyBranches', 'NEARBY BRANCHES')}
              </h2>
              <div className="flex items-center text-fuchsia-600 text-sm">
                <SignalIcon className="h-4 w-4 mr-1" />
                {t('branchSelection.nearYou', 'Near you')}
              </div>
            </div>
            
            <div className="relative">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="appearance-none w-full px-4 py-3 pr-10 border-2 border-fuchsia-200 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 bg-white text-gray-900 font-medium"
              >
                <option value="">{t('branchSelection.selectNearby', 'Select a nearby branch')}</option>
                {nearbyBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} - {branch.distance?.toFixed(1)} km away
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-fuchsia-600">
                <ChevronDownIcon className="h-5 w-5" />
              </div>
            </div>

            {selectedBranch && nearbyBranches.some(b => b.id === selectedId) && (
              <div className="mt-3 p-3 bg-fuchsia-50 rounded-lg border border-fuchsia-200">
                <div className="flex items-center space-x-2 text-fuchsia-700">
                  <MapPinIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {selectedBranch.address}
                  </span>
                </div>
                {selectedBranch.phone && (
                  <div className="flex items-center space-x-2 text-fuchsia-600 mt-1">
                    <PhoneIcon className="h-4 w-4" />
                    <span className="text-sm">{selectedBranch.phone}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* All Branches List */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              {searchTerm 
                ? t('branchSelection.searchResults', 'SEARCH RESULTS')
                : t('branchSelection.allBranches', 'ALL BRANCHES')
              }
            </h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {filteredBranches.length} {t('branchSelection.branches', 'branches')}
            </span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {filteredBranches
              .filter(branch => !searchTerm || !nearbyBranches.some(nb => nb.id === branch.id))
              .map((branch) => (
                <div
                  key={branch.id}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                    selectedId === branch.id
                      ? 'border-fuchsia-500 bg-fuchsia-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-fuchsia-300 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedId(branch.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        selectedId === branch.id ? 'bg-fuchsia-100' : 'bg-gray-100'
                      }`}>
                        <BuildingStorefrontIcon className={`h-5 w-5 ${
                          selectedId === branch.id ? 'text-fuchsia-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {branch.name}
                          </h3>
                          {selectedId === branch.id && (
                            <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          {branch.distance !== undefined && (
                            <p className="text-fuchsia-600 font-medium">
                              {t('branchSelection.distanceAway', '{{distance}} km away', { distance: branch.distance.toFixed(1) })}
                            </p>
                          )}
                          {branch.address && (
                            <p className="truncate">{branch.address}</p>
                          )}
                          {branch.workingHours && (
                            <p className="text-xs text-gray-500">{branch.workingHours}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            
            {filteredBranches.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MagnifyingGlassIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>{t('branchSelection.noBranchesFound', 'No branches found matching your search')}</p>
              </div>
            )}
          </div>

          {/* Location Status */}
          {locationStatus.loading && (
            <div className="mt-4 p-3 bg-fuchsia-50 rounded-lg border border-fuchsia-200">
              <div className="flex items-center space-x-2 text-fuchsia-700">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-fuchsia-600"></div>
                <span className="text-sm">{t('branchSelection.findingBranches', 'Finding branches near you...')}</span>
              </div>
            </div>
          )}
          
          {locationStatus.error && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2 text-yellow-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm">{locationStatus.error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 px-6 py-6 border-t border-gray-100 space-y-4">
          <button
            onClick={handleProceed}
            disabled={!canProceed}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform ${
              canProceed
                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProceeding ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                {t('branchSelection.processing', 'Processing...')}
              </span>
            ) : (
              t('branchSelection.proceedToLogin', 'Proceed to Login')
            )}
          </button>
          
          {/* QR Scanner button */}
          <button
            onClick={() => setShowQRScanner(true)}
            className="w-full py-3 px-6 border-2 border-fuchsia-600 text-fuchsia-600 rounded-xl hover:bg-fuchsia-50 transition-all duration-300 flex items-center justify-center font-medium"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h1m-6 0h1m-6 0h1M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {t('branchSelection.scanQR', 'Scan Branch QR Code')}
          </button>
        </div>

        {/* Selected Branch Info */}
        {selectedBranch && (
          <div className="bg-fuchsia-50 px-6 py-4 border-t border-fuchsia-200">
            <div className="flex items-center space-x-2 text-fuchsia-700">
              <CheckCircleIcon className="h-5 w-5" />
              <span className="text-sm font-medium">
                {t('branchSelection.selectedBranch', 'Selected:')} {selectedBranch.name}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRCodeScanner onClose={() => setShowQRScanner(false)} />
      )}
    </div>
  );
};

export default BranchSelectionEnhanced;