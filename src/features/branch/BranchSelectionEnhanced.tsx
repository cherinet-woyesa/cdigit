import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBranch } from '../../context/BranchContext';
import { fetchBranches } from '../../services/branchService';
import type { Branch } from '../../services/branchService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import QRCodeScanner from './QRCodeScanner';
import { 
  ChevronDownIcon, 
  MapPinIcon, 
  ClockIcon, 
  PhoneIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  SignalIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import logo from '../../assets/logo.jpg';
import cbeImage from '../../assets/cbe1.jpg';

// Extend the Branch interface to include translations
interface BranchWithDistance extends Branch {
  distance?: number;
  translations?: {
    [key: string]: {
      name: string;
      address?: string;
      workingHours?: string;
    };
  };
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

// Skeleton loader for branch cards
const BranchCardSkeleton: React.FC = () => (
  <div className="p-4 rounded-xl border-2 border-gray-200 bg-white animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex items-start space-x-3 flex-1">
        <div className="p-2 rounded-lg bg-gray-200">
          <div className="h-5 w-5 bg-gray-300 rounded-md"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="space-y-2 text-sm">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const BranchSelectionEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { setBranch } = useBranch();
  const { t, i18n } = useTranslation();
  const { success, error: showError, info } = useToast();
  const locationFetchedRef = useRef(false); // Prevent duplicate location fetches

  // State
  const [branches, setBranches] = useState<BranchWithDistance[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProceeding, setIsProceeding] = useState<boolean>(false);
  const [showQRScanner, setShowQRScanner] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'dropdown'>('list'); // New: view toggle
  const [locationStatus, setLocationStatus] = useState<{
    loading: boolean;
    error: string | null;
    coordinates?: { lat: number; lng: number };
  }>({ loading: false, error: null });



  // Memoized filtered branches based on search
  const filteredBranches = useMemo(() => {
    if (!searchQuery.trim()) return branches;
    const query = searchQuery.toLowerCase();
    return branches.filter(branch =>
      branch.name.toLowerCase().includes(query) ||
      branch.address?.toLowerCase().includes(query) ||
      branch.code?.toLowerCase().includes(query)
    );
  }, [branches, searchQuery]);

  // Memoized values
  const canProceed = useMemo(() => !!selectedId && !isProceeding, [selectedId, isProceeding]);
  const selectedBranch = useMemo(
    () => branches.find(b => b.id === selectedId),
    [branches, selectedId]
  );

  // Memoized nearby branches (with distance <= 50km)
  const nearbyBranches = useMemo(() => {
    const withDistance = branches.filter(branch => 
      branch.distance !== undefined && branch.distance <= 50
    );
    return withDistance
      .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
      .slice(0, 5);
  }, [branches]);

  // Find the nearest branch from a list of branches that already have distances.
  const findNearestBranch = useCallback((branchesWithDist: BranchWithDistance[]): BranchWithDistance | null => {
    const validBranches = branchesWithDist.filter(branch => branch.distance !== undefined);

    if (validBranches.length === 0) {
      return null;
    }

    // Sort to find the nearest one
    const [nearest] = [...validBranches].sort((a, b) => a.distance! - b.distance!);
    
    // Only recommend if it's within a reasonable distance
    return nearest.distance! <= 50 ? nearest : null;
  }, []);

  // Select default branch (last used or first active)
  const selectDefaultBranch = useCallback((branchesList: Branch[]) => {
    const lastBranchId = localStorage.getItem('lastActiveBranchId');
    
    const defaultBranch = lastBranchId
      ? branchesList.find(b => b.id === lastBranchId)
      : branchesList.find(b => b.isActive) || branchesList[0];
    
    if (defaultBranch) {
      setSelectedId(defaultBranch.id);
    } else if (branchesList.length > 0) {
      setSelectedId(branchesList[0].id);
    }
  }, []);

  // Get user's current location - only runs once
  const getUserLocation = useCallback(async (branchesList: BranchWithDistance[]): Promise<BranchWithDistance[]> => {
    if (locationFetchedRef.current) {
      return branchesList; // Already fetched, return as-is
    }

    if (!navigator.geolocation) {
      setLocationStatus({
        loading: false,
        error: t('branchSelection.geolocationNotSupported', 'Geolocation is not supported by your browser.')
      });
      return branchesList;
    }

    setLocationStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: false, // Changed to false for better performance
            timeout: 5000, // Reduced timeout
            maximumAge: 300000 // Cache for 5 minutes
          }
        );
      });

      const { latitude, longitude } = position.coords;
      locationFetchedRef.current = true; // Mark as fetched
      
      setLocationStatus({
        loading: false,
        error: null,
        coordinates: { lat: latitude, lng: longitude }
      });

      const branchesWithDistance = branchesList.map(branch => {
        if (branch.latitude && branch.longitude) {
          return {
            ...branch,
            distance: calculateDistance(latitude, longitude, branch.latitude, branch.longitude)
          };
        }
        return { ...branch, distance: undefined };
      });

      // Sort by distance
      return [...branchesWithDistance].sort((a, b) => 
        (a.distance || Infinity) - (b.distance || Infinity)
      );

    } catch (error) {
      console.warn('Geolocation error:', error);
      locationFetchedRef.current = true; // Mark as attempted
      
      setLocationStatus({
        loading: false,
        error: t('branchSelection.locationError', 'Could not determine your location.')
      });
      
      return branchesList; // Return unchanged
    }
  }, [t]);

  // Fetch branches
  const loadBranches = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const list: Branch[] = await fetchBranches();
      
      if (!list || list.length === 0) {
        throw new Error('No branches available');
      }

      // Get location and calculate distances
      const branchesWithDist = await getUserLocation(list);
      setBranches(branchesWithDist);
      
      // Select default: last used or nearest
      const lastBranchId = localStorage.getItem('lastActiveBranchId');
      const lastBranch = lastBranchId ? branchesWithDist.find(b => b.id === lastBranchId) : null;
      
      if (lastBranch) {
        setSelectedId(lastBranch.id);
      } else {
        // Find nearest within 50km
        const nearest = branchesWithDist.find(b => 
          b.distance !== undefined && b.distance <= 50
        );
        if (nearest) {
          setSelectedId(nearest.id);
          info(t('branchSelection.nearestSelected', `Nearest branch selected: ${nearest.name}`) + ` (${nearest.distance?.toFixed(1)} km)`);
        } else if (branchesWithDist.length > 0) {
          setSelectedId(branchesWithDist[0].id);
        }
      }
      
      setIsLoading(false);
      
    } catch (e) {
      console.error('Failed to load branches from API:', e);
      
      // Mock data fallback
      const mockBranches: BranchWithDistance[] = [
        {
          id: 'd9b1c3f7-4b05-44d3-b58e-9c5a5b4b90f6',
          name: 'CBE Main Branch',
          code: 'MAIN',
          status: 'active',
          address: 'Addis Ababa, Ethiopia',
          phone: '+251 11 123 4567',
          workingHours: 'Mon-Fri: 8:30 AM - 4:30 PM',
          isActive: true,
          latitude: 9.0054,
          longitude: 38.7636
        },
        {
          id: 'a3d3e1b5-8c9a-4c7c-a1e3-6b3d8f4a2b2c',
          name: 'CBE Ayer Tena Branch', 
          code: 'AIRPORT',
          status: 'active',
          address: 'Bole International Airport',
          phone: '+251 11 987 6543',
          workingHours: 'Mon-Sun: 6:00 AM - 10:00 PM',
          isActive: true,
          latitude: 8.9779,
          longitude: 38.7993
        },
        {
          id: 'b1d5f3a2-3c3a-4f5f-ae7b-2a1f2d3c4b5e',
          name: 'CBE Shola Branch',
          code: 'SHOLA',
          status: 'active',
          address: 'Mexico Square, Addis Ababa',
          phone: '+251 11 555 1234',
          workingHours: 'Mon-Fri: 8:00 AM - 5:00 PM',
          isActive: true,
          latitude: 9.0300,
          longitude: 38.7600
        }
      ];
      
      const branchesWithDist = await getUserLocation(mockBranches);
      setBranches(branchesWithDist);
      
      const nearest = branchesWithDist.find(b => b.distance !== undefined && b.distance <= 50);
      if (nearest) {
        setSelectedId(nearest.id);
      } else if (branchesWithDist.length > 0) {
        setSelectedId(branchesWithDist[0].id);
      }
      
      setIsLoading(false);
      setError(t('branchSelection.demoMode', 'Demo mode: Using sample branch data'));
      info(t('branchSelection.demoNotification', 'Demo mode: Using sample branch data'));
    }
  }, [getUserLocation, t, info]);

  // Handle branch selection
  const handleProceed = useCallback(async () => {
    if (!selectedId || !selectedBranch) return;
    
    setIsProceeding(true);

    try {
      localStorage.setItem('selectedBranch', JSON.stringify(selectedBranch));
      localStorage.setItem('lastActiveBranchId', selectedBranch.id);
      
      await setBranch(selectedBranch);
      
      success(t('branchSelection.branchSelected', `Branch selected: ${selectedBranch.name}`));
      
      const nextState = { from: location.state?.from || { pathname: '/' } };
      navigate('/otp-login', { state: nextState, replace: true });
    } catch (error) {
      console.error('Branch selection failed:', error);
      const errorMessage = t('branchSelection.selectionError', 'Failed to select branch. Please try again.');
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsProceeding(false);
    }
  }, [selectedId, selectedBranch, setBranch, navigate, location.state, t, success, showError]);

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
    loadBranches();
  }, [loadBranches]);

  // Auto-proceed if there's only one branch
  useEffect(() => {
    if (branches.length === 1 && !selectedId && branches[0]?.id) {
      setSelectedId(branches[0].id);
    }
  }, [branches, selectedId]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fuchsia-50 via-white to-pink-50 px-4 py-8">
        <div className="w-full max-w-4xl bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row md:h-auto max-h-[95vh]">
          {/* Left Branding Column */}
          <div className="cbe-image-section md:w-2/5 bg-gradient-to-br from-fuchsia-700 to-pink-600 p-6 md:p-8 flex flex-col justify-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="cbe-image-container w-24 h-24 md:w-40 md:h-40 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl relative z-10">
              <img 
                src={cbeImage} 
                alt="Commercial Bank of Ethiopia" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative z-10 text-center space-y-2">
              <div className="flex items-center justify-center space-x-3">
                <div className="logo-container w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                  <img 
                    src={logo} 
                    alt={t('logoAlt', 'CBE Logo')} 
                    className="h-6 w-6 object-contain rounded-full"
                  />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wide">
                  {t('bankName', 'Commercial Bank of Ethiopia')}
                </h1>
              </div>
            </div>
          </div>
          {/* Right Form Column */}
          <div className="md:w-3/5 p-4 sm:p-6 md:p-8 flex flex-col space-y-4 flex-1 min-h-0">
            {/* Skeleton Search */}
            <div className="p-6 border-b border-gray-100">
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>

            {/* Skeleton List */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
              </div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <BranchCardSkeleton key={i} />)}
              </div>
            </div>
            
            {/* Skeleton Footer */}
            <div className="bg-gray-50 px-6 py-6 border-t border-gray-100 space-y-4">
              <div className="h-14 bg-gray-300 rounded-xl animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fuchsia-50 via-white to-pink-50 p-2 sm:p-4">
      <div className="w-full max-w-4xl bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row md:h-auto max-h-[95vh]">
        {/* Left Branding Column */}
        <div className="cbe-image-section md:w-2/5 bg-gradient-to-br from-fuchsia-700 to-pink-600 p-6 md:p-8 flex flex-col justify-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="cbe-image-container w-24 h-24 md:w-40 md:h-40 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl relative z-10">
            <img 
              src={cbeImage} 
              alt="Commercial Bank of Ethiopia" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10 text-center space-y-2">
            <div className="flex items-center justify-center space-x-3">
              <div className="logo-container w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <img 
                  src={logo} 
                  alt={t('logoAlt', 'CBE Logo')} 
                  className="h-6 w-6 object-contain rounded-full"
                />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wide">
                {t('bankName', 'Commercial Bank of Ethiopia')}
              </h1>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="md:w-3/5 p-3 sm:p-4 md:p-6 flex flex-col space-y-3 flex-1 min-h-0">
          <div className="text-center space-y-2 flex-shrink-0">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {t('branchSelection.title', 'Select Your Branch')}
            </h1>
            <p className="text-gray-500 text-sm">
              {t('branchSelection.subtitle', 'Choose the branch you want to visit')}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative flex-shrink-0">
            <input
              type="text"
              placeholder={t('branchSelection.searchPlaceholder', 'Search branches...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-colors text-sm"
            />
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Nearby Branches Section */}
          {nearbyBranches.length > 0 && !searchQuery && (
            <div className="border-b border-gray-100 pb-2 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <SignalIcon className="h-3.5 w-3.5 text-fuchsia-600" />
                  {t('branchSelection.nearbyBranches', 'Nearby Branches')}
                </h2>
                <span className="text-xs text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded-full">
                  {nearbyBranches.length} {t('branchSelection.found', 'found')}
                </span>
              </div>
            </div>
          )}

          {/* Branch List - More compact to show 2+ branches */}
          <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-2">
            {filteredBranches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BuildingStorefrontIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-base font-medium">{t('branchSelection.noBranchesFound', 'No branches found')}</p>
                <p className="text-xs mt-1">{t('branchSelection.tryDifferentSearch', 'Try a different search term')}</p>
              </div>
            ) : (
              filteredBranches.map((branch) => {
                const isNearby = nearbyBranches.some(nb => nb.id === branch.id);
                const isSelected = selectedId === branch.id;
                
                return (
                  <button
                    key={branch.id}
                    onClick={() => setSelectedId(branch.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-fuchsia-600 bg-fuchsia-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-fuchsia-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2 flex-1">
                        <div className={`p-1.5 rounded-lg ${
                          isSelected ? 'bg-fuchsia-600' : 'bg-gray-100'
                        }`}>
                          <BuildingStorefrontIcon className={`h-4 w-4 ${
                            isSelected ? 'text-white' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-sm text-gray-900 truncate">
                              {branch.name}
                            </h3>
                            {isNearby && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                {branch.distance?.toFixed(1)} km
                              </span>
                            )}
                          </div>
                          <div className="space-y-0.5 text-xs">
                            {branch.address && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{branch.address}</span>
                              </div>
                            )}
                            {branch.phone && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <PhoneIcon className="h-3 w-3 flex-shrink-0" />
                                <span>{branch.phone}</span>
                              </div>
                            )}
                            {branch.workingHours && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <ClockIcon className="h-3 w-3 flex-shrink-0" />
                                <span>{branch.workingHours}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircleIcon className="h-5 w-5 text-fuchsia-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Location Status */}
          {locationStatus.loading && (
            <div className="p-2 bg-fuchsia-50 rounded-lg border border-fuchsia-200 flex-shrink-0">
              <div className="flex items-center space-x-2 text-fuchsia-700">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-fuchsia-600"></div>
                <span className="text-xs">{t('branchSelection.findingBranches', 'Finding branches near you...')}</span>
              </div>
            </div>
          )}
          
          {locationStatus.error && (
            <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200 flex-shrink-0">
              <div className="flex items-center space-x-2 text-yellow-700">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-xs">{locationStatus.error}</span>
              </div>
            </div>
          )}

          {/* Selected Branch Info - Compact */}
          {selectedBranch && (
            <div className="bg-fuchsia-50 px-3 py-2 border border-fuchsia-200 rounded-lg flex-shrink-0">
              <div className="flex items-center space-x-2 text-fuchsia-700">
                <CheckCircleIcon className="h-4 w-4" />
                <span className="text-xs font-medium">
                  {t('branchSelection.selectedBranch', 'Selected:')} {selectedBranch.name}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons - Moved to bottom with smaller size */}
          <div className="border-t border-gray-100 pt-3 space-y-2 flex-shrink-0">
            <button
              onClick={handleProceed}
              disabled={!canProceed}
              className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-300 ${
                canProceed
                  ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isProceeding ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('branchSelection.processing', 'Processing...')}
                </span>
              ) : (
                t('branchSelection.proceedToLogin', 'Proceed to Login')
              )}
            </button>
            
            {/* QR Scanner button - Smaller */}
            <button
              onClick={() => setShowQRScanner(true)}
              className="w-full py-2 px-4 border border-fuchsia-600 text-fuchsia-600 rounded-lg hover:bg-fuchsia-50 transition-all duration-300 flex items-center justify-center font-medium text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h1m-6 0h1m-6 0h1M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t('branchSelection.scanQR', 'Scan QR Code')}
            </button>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRCodeScanner onClose={() => setShowQRScanner(false)} />
      )}
    </div>
  );
};

export default BranchSelectionEnhanced;