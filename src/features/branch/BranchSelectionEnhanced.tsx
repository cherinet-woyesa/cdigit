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

// Translation mappings for common branch names
const BRANCH_TRANSLATIONS: { [key: string]: { [key: string]: string } } = {
  'CBE Main Branch': {
    am: 'ሲቢኢ ዋና ቅርንጫፍ',
    or: 'CBE Biraacha Guddaa',
    ti: 'CBE ርእሲ ቅርንጫፍ',
    so: 'CBE Laanta Waaweyn',
    en: 'CBE Main Branch'
  },
  'CBE Airport Branch': {
    am: 'ሲቢኢ አውሮፕላን ቀጠና ቅርንጫፍ',
    or: 'CBE Biraacha Xiyyaaraa',
    ti: 'CBE መዕረፊ ነፈርቲ ቅርንጫፍ',
    so: 'CBE Laanta Dayuuradaha',
    en: 'CBE Airport Branch'
  },
  'CBE City Center': {
    am: 'ሲቢኢ ማዕከላዊ ከተማ ቅርንጫፍ',
    or: 'CBE Biraacha Magaalaa',
    ti: 'CBE ማእኸላይ ከተማ ቅርንጫፍ',
    so: 'CBE Laanta Magaalada',
    en: 'CBE City Center'
  }
  
};

// Common address translations
const ADDRESS_TRANSLATIONS: { [key: string]: { [key: string]: string } } = {
  'Addis Ababa, Ethiopia': {
    am: 'አዲስ አበባ, ኢትዮጵያ',
    or: 'Finfinnee, Itoophiyaa',
    ti: 'ኣዲስ ኣበባ, ኢትዮጵያ',
    so: 'Addis Ababa, Itoobiya',
    en: 'Addis Ababa, Ethiopia'
  },
  'Bole International Airport': {
    am: 'ቦሌ ዓለም አቀፍ አውሮፕላን ማረፊያ',
    or: 'Xiyyaaraa Bolee',
    ti: 'መዕረፊ ነፈርτι ቦሌ',
    so: 'Garaaka Dayuuradaha Bole',
    en: 'Bole International Airport'
  },
  'Mexico Square, Addis Ababa': {
    am: 'ሜክሲኮ አደባባይ, አዲስ አበባ',
    or: 'Mexico Square, Finfinnee',
    ti: 'መጋርቦ ሜክሲኮ, ኣዲስ ኣበባ',
    so: 'Mexico Square, Addis Ababa',
    en: 'Mexico Square, Addis Ababa'
  }
};

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

  // State
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

  // Get translated branch name
  const getTranslatedBranchName = useCallback((branchName: string, currentLanguage: string): string => {
    const translation = BRANCH_TRANSLATIONS[branchName];
    if (translation && translation[currentLanguage]) {
      return translation[currentLanguage];
    }
    return branchName;
  }, []);

  // Get translated address
  const getTranslatedAddress = useCallback((address: string, currentLanguage: string): string => {
    const translation = ADDRESS_TRANSLATIONS[address];
    if (translation && translation[currentLanguage]) {
      return translation[currentLanguage];
    }
    return address;
  }, []);

  // Memoized values
  const canProceed = useMemo(() => !!selectedId && !isProceeding, [selectedId, isProceeding]);
  const selectedBranch = useMemo(
    () => branches.find(b => b.id === selectedId),
    [branches, selectedId]
  );

  // Memoized nearby branches (with distance data)
  const nearbyBranches = useMemo(() => {
    return branches
      .filter(branch => branch.distance !== undefined)
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

  // Get user's current location and return a distance-sorted branch list
  const getUserLocation = useCallback(async (branchesList: Branch[]): Promise<BranchWithDistance[] | null> => {
    if (!navigator.geolocation) {
      setLocationStatus({
        loading: false,
        error: t('branchSelection.geolocationNotSupported', 'Geolocation is not supported by your browser.')
      });
      return null;
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

      const branchesWithDistance = branchesList.map(branch => {
        if (branch.latitude && branch.longitude) {
          return {
            ...branch,
            distance: calculateDistance(latitude, longitude, branch.latitude, branch.longitude)
          };
        }
        return { ...branch, distance: Infinity }; // Assign a large distance if no coords
      });

      // Sort all branches by distance, creating a new array
      const sortedByDistance = [...branchesWithDistance].sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      
      return sortedByDistance;

    } catch (error) {
      console.warn('Geolocation error:', error);
      setLocationStatus({
        loading: false,
        error: t('branchSelection.locationError', 'Could not determine your location. Using default branch selection.')
      });
      return null;
    }
  }, [t]);

  // Fetch branches
  const loadBranches = useCallback(async () => {
    setIsLoading(true);
    setError('');

    const handleLocationAndUpdate = (branches: BranchWithDistance[]) => {
      const hasCoords = branches.some(b => b.latitude && b.longitude);
      if (hasCoords) {
        getUserLocation(branches).then(distanceSorted => {
          if (distanceSorted) {
            setBranches(distanceSorted);

            const lastBranchId = localStorage.getItem('lastActiveBranchId');
            const lastBranchIsNearby = lastBranchId ? distanceSorted.find(b => b.id === lastBranchId) : null;

            if (lastBranchIsNearby) {
              setSelectedId(lastBranchIsNearby.id);
            } else {
              const nearest = findNearestBranch(distanceSorted);
              if (nearest) {
                setSelectedId(nearest.id);
              }
            }
          }
        });
      }
    };
    
    try {
      // const list: BranchWithDistance[] = await fetchBranches();
      throw new Error("Forcing mock data for development");
      
    } catch (e) {
      console.error('Failed to load branches from API:', e);
      
      // Mock data fallback
      const mockBranches: BranchWithDistance[] = [
        {
          id: 'd9b1c3f7-4b05-44d3-b58e-9c5a5b4b90f6',
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
          id: 'a3d3e1b5-8c9a-4c7c-a1e3-6b3d8f4a2b2c',
          name: 'CBE Ayer tena Branch', 
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
          id: 'b1d5f3a2-3c3a-4f5f-ae7b-2a1f2d3c4b5e',
          name: 'Shola branch',
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
      
      // Set mock branches for immediate render
      setBranches(mockBranches);
      selectDefaultBranch(mockBranches);
      setIsLoading(false);

      // Then, get location and distances in the background for the mock data
      handleLocationAndUpdate(mockBranches);
      
      setError(t('branchSelection.demoMode', 'Connected to demo mode. Using sample branch data for testing.'));
      toast.info(t('branchSelection.demoNotification', 'Demo mode: Using sample branch data'));
    }
  }, [getUserLocation, selectDefaultBranch, findNearestBranch, t]);

  // Handle branch selection
  const handleProceed = useCallback(async () => {
    if (!selectedId || !selectedBranch) {
      return;
    }
    
    setIsProceeding(true);

    try {
      localStorage.setItem('selectedBranch', JSON.stringify(selectedBranch));
      localStorage.setItem('lastActiveBranchId', selectedBranch.id);
      
      await setBranch(selectedBranch);
      
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
        <div className="md:w-3/5 p-4 sm:p-6 md:p-8 flex flex-col space-y-4 flex-1 min-h-0">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold mb-2">
              {t('branchSelection.title', 'Select Your Branch')}
            </h1>
            <p className="text-gray-500">
              {t('branchSelection.subtitle', 'Choose the branch you want to visit')}
            </p>
          </div>

          {/* Nearby Branches Dropdown */}
          {nearbyBranches.length > 0 && (
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
                      {getTranslatedBranchName(branch.name, i18n.language)} - {branch.distance?.toFixed(1)} km away
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
                      {getTranslatedAddress(selectedBranch.address || '', i18n.language)}
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
                  {t('branchSelection.selectedBranch', 'Selected:')} {getTranslatedBranchName(selectedBranch.name, i18n.language)}
                </span>
              </div>
            </div>
          )}
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