import React from 'react';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  UserPlusIcon,
  BanknotesIcon,
  BuildingStorefrontIcon,
  DocumentChartBarIcon,
  NoSymbolIcon,
  LinkIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import NearbyBranchesModal from '@components/modals/NearbyBranchesModal';
import TransactionSearchModal from '@components/modals/TransactionSearchModal';
import clsx from 'clsx';
import { DashboardErrorBoundary } from '@components/dashboard/ErrorBoundary';
import { fetchBranches } from '@services/branch/branchService';
import { getQueueCount } from '@services/branch/queueService';
import { AccessMethodIndicatorWithContext } from '@components/multiChannel/AccessMethodIndicator';
import { BranchWatermarkWithContext } from '@components/multiChannel/BranchWatermark';
// Import the logo
import logo from '@assets/logo.jpg';

type FormName =
  | 'accountOpening'
  | 'cashDeposit'
  | 'cashWithdrawal'
  | 'fundTransfer'
  | 'history'
  | 'mobileBanking'

  | 'cbeBirr'
  | 'rtgsTransfer'
  | 'ebankingApplication'
  | 'otherServices'
  | 'cbeBirrRegistration'
  | 'otherForms'
  | 'posRequest'
  | 'statementRequest'
  | 'stopPayment'
  | 'cbeBirrLink'
  | 'lostPassbookReplacement'
  | 'merchantAccountOpening'
  | 'fixedTimeDeposit'
  | 'agentAccountOpening'
  | 'additionalPOSRequest'
  | 'chequeReturnSlip'
  | 'balanceConfirmation'
  | 'checkDeposit'
  | 'checkWithdrawal'
  | 'chequeBookRequest'
  | 'cashDiscrepancyReport'
  | 'corporateCustomer'
  | 'customerIdMerge'
  | 'customerProfileChange'
  | 'pettyCashForm'
  | 'phoneBlock'
  | 'posDeliveryForm'
  | 'specialChequeClearance'
  | 'ticketMandateRequest';

type FormCategory = 
  | 'personal-banking'
  | 'business-banking'
  | 'specialized-services'
  | 'account-services'
  | 'transactions'
  | 'cards-digital'
  | 'requests-enquiries'
  | 'merchant-services'
  | 'cbe-birr'
  | 'pos-services';

interface Form {
  name: FormName;
  route: string;
  icon: React.ElementType;
  category: FormCategory;
  subcategory?: string; // New field for hierarchical organization
}

const forms: Form[] = [
  // Personal Banking - Account Services
  { name: 'accountOpening', route: '/form/account-opening', icon: UserPlusIcon, category: 'account-services', subcategory: 'personal-banking' },
  { name: 'customerProfileChange', route: '/form/customer-profile-change', icon: UserPlusIcon, category: 'account-services', subcategory: 'personal-banking' },
  
  // Personal Banking - Transactions
  { name: 'cashDeposit', route: '/form/cash-deposit', icon: ArrowDownTrayIcon, category: 'transactions', subcategory: 'personal-banking' },
  { name: 'cashWithdrawal', route: '/form/cash-withdrawal', icon: ArrowUpTrayIcon, category: 'transactions', subcategory: 'personal-banking' },
  { name: 'fundTransfer', route: '/form/fund-transfer', icon: ArrowsRightLeftIcon, category: 'transactions', subcategory: 'personal-banking' },
  { name: 'rtgsTransfer', route: '/form/rtgs-transfer', icon: BanknotesIcon, category: 'transactions', subcategory: 'personal-banking' },
  { name: 'checkDeposit', route: '/form/check-deposit', icon: ArrowDownTrayIcon, category: 'transactions', subcategory: 'personal-banking' },
  { name: 'checkWithdrawal', route: '/form/check-withdrawal', icon: ArrowUpTrayIcon, category: 'transactions', subcategory: 'personal-banking' },
  
  // Personal Banking - Cards & Digital
  { name: 'ebankingApplication', route: '/form/ebanking', icon: DevicePhoneMobileIcon, category: 'cards-digital', subcategory: 'personal-banking' },

  
  // Personal Banking - Requests & Enquiries
  { name: 'statementRequest', route: '/form/statement-request', icon: DocumentChartBarIcon, category: 'requests-enquiries', subcategory: 'personal-banking' },
  { name: 'balanceConfirmation', route: '/form/balance-confirmation', icon: DocumentChartBarIcon, category: 'requests-enquiries', subcategory: 'personal-banking' },
  { name: 'chequeBookRequest', route: '/form/cheque-book-request', icon: DocumentChartBarIcon, category: 'requests-enquiries', subcategory: 'personal-banking' },
  { name: 'chequeReturnSlip', route: '/form/cheque-return-slip', icon: DocumentChartBarIcon, category: 'requests-enquiries', subcategory: 'personal-banking' },
  { name: 'stopPayment', route: '/form/stop-payment', icon: NoSymbolIcon, category: 'requests-enquiries', subcategory: 'personal-banking' },
  { name: 'lostPassbookReplacement', route: '/form/lost-passbook-replacement', icon: DocumentChartBarIcon, category: 'requests-enquiries', subcategory: 'personal-banking' },
  
  // Business Banking - Merchant Services
  { name: 'merchantAccountOpening', route: '/form/merchant-account-opening', icon: BuildingStorefrontIcon, category: 'merchant-services', subcategory: 'business-banking' },
  { name: 'posRequest', route: '/form/pos-request', icon: BuildingStorefrontIcon, category: 'merchant-services', subcategory: 'business-banking' },
  { name: 'additionalPOSRequest', route: '/form/additional-pos-request', icon: BuildingStorefrontIcon, category: 'merchant-services', subcategory: 'business-banking' },
  { name: 'posDeliveryForm', route: '/form/pos-delivery', icon: BuildingStorefrontIcon, category: 'merchant-services', subcategory: 'business-banking' },
  
  // Business Banking - Agent Services
  { name: 'agentAccountOpening', route: '/form/agent-account-opening', icon: UserPlusIcon, category: 'merchant-services', subcategory: 'business-banking' },
  
  // Specialized Services - CBE Birr
  { name: 'cbeBirrRegistration', route: '/form/cbe-birr', icon: CurrencyDollarIcon, category: 'cbe-birr', subcategory: 'specialized-services' },
  { name: 'cbeBirrLink', route: '/form/cbe-birr-link', icon: LinkIcon, category: 'cbe-birr', subcategory: 'specialized-services' },
  
  // Specialized Services - Other
  { name: 'fixedTimeDeposit', route: '/form/fixed-time-deposit', icon: BanknotesIcon, category: 'specialized-services', subcategory: 'specialized-services' },
  { name: 'corporateCustomer', route: '/form/corporate-customer', icon: BuildingStorefrontIcon, category: 'specialized-services', subcategory: 'specialized-services' },
  { name: 'customerIdMerge', route: '/form/customer-id-merge', icon: ArrowsRightLeftIcon, category: 'specialized-services', subcategory: 'specialized-services' },
  { name: 'phoneBlock', route: '/form/phone-block', icon: NoSymbolIcon, category: 'specialized-services', subcategory: 'specialized-services' },
  { name: 'cashDiscrepancyReport', route: '/form/cash-discrepancy-report', icon: DocumentChartBarIcon, category: 'specialized-services', subcategory: 'specialized-services' },
  { name: 'specialChequeClearance', route: '/form/special-cheque-clearance', icon: DocumentChartBarIcon, category: 'specialized-services', subcategory: 'specialized-services' },
  { name: 'ticketMandateRequest', route: '/form/ticket-mandate-request', icon: DocumentChartBarIcon, category: 'specialized-services', subcategory: 'specialized-services' },
  
  // History (always accessible)
  { name: 'history', route: '/customer/transaction-history', icon: ClockIcon, category: 'requests-enquiries', subcategory: 'personal-banking' },
];

// Updated categories for main navigation
const mainCategories = [
  { id: 'all', label: 'All Services', count: forms.length },
  { id: 'personal-banking', label: 'Personal Banking', count: forms.filter(f => f.subcategory === 'personal-banking').length },
  { id: 'business-banking', label: 'Business Banking', count: forms.filter(f => f.subcategory === 'business-banking').length },
  { id: 'specialized-services', label: 'Specialized Services', count: forms.filter(f => f.subcategory === 'specialized-services').length },
];

// Subcategories for secondary navigation when a main category is selected
const subCategories: Record<string, { id: string; label: string; }[]> = {
  'personal-banking': [
    { id: 'account-services', label: 'Account Services' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'cards-digital', label: 'Cards & Digital Banking' },
    { id: 'requests-enquiries', label: 'Requests & Enquiries' },
  ],
  'business-banking': [
    { id: 'merchant-services', label: 'Merchant & Agent Services' },
  ],
  'specialized-services': [
    { id: 'cbe-birr', label: 'CBE Birr Services' },
    { id: 'other', label: 'Other Specialized Services' },
  ],
};

// Optimized FormCard with memoization
const FormCard = React.memo(React.forwardRef<HTMLDivElement, {
  form: Form;
  onClick: () => void;
  isFocused: boolean;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}>(({ form, onClick, isFocused, onKeyDown }, ref) => {
  const { t } = useTranslation();
  const label = t(`forms.${form.name}`, form.name);
  
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={`${label}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={clsx(
        'group relative bg-white p-4 rounded-xl shadow-sm border border-amber-100 transition-all duration-200 ease-in-out',
        'hover:shadow-md hover:border-fuchsia-300 hover:transform hover:-translate-y-0.5',
        'focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500',
        isFocused && 'ring-2 ring-fuchsia-500 border-fuchsia-500',
        'active:scale-98'
      )}
    >
      <div className="flex flex-col items-center text-center h-full">
        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-amber-400 text-white mb-3 transition-all group-hover:from-amber-500 group-hover:to-fuchsia-700 group-hover:scale-105">
          <form.icon className="h-6 w-6" />
        </div>
        
        <h3 className="text-sm font-semibold text-gray-900 mb-2 leading-tight">
          {label}
        </h3>
        
        <div className="mt-auto">
          <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-gradient-to-r from-amber-50 to-fuchsia-50 text-fuchsia-700 border border-fuchsia-200">
            {form.category}
          </span>
        </div>
      </div>
    </div>
  );
}));

FormCard.displayName = 'FormCard';

// Simplified skeleton loader
const FormCardSkeleton: React.FC = () => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-100 animate-pulse">
    <div className="flex flex-col items-center">
      <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-amber-200 to-fuchsia-300 mb-3"></div>
      <div className="h-4 bg-gradient-to-r from-amber-200 to-fuchsia-200 rounded w-3/4 mb-2"></div>
      <div className="h-5 w-16 bg-gradient-to-r from-amber-200 to-fuchsia-200 rounded-full"></div>
    </div>
  </div>
);

const CustomerDashboardContent: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Refs
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State for nearby branches and queue counts
  const [nearbyBranches, setNearbyBranches] = useState<any[]>([]);
  const [queueCounts, setQueueCounts] = useState<Record<string, number>>({});
  const [loadingNearbyBranches, setLoadingNearbyBranches] = useState(false);
  const [isNearbyBranchesModalOpen, setIsNearbyBranchesModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Debounced search with useCallback for stability
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim().toLowerCase());
    }, 200);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Updated category filtering with subcategories
  const filteredForms = useMemo(() => {
    let filtered = forms;
    
    // Main category filter
    if (selectedCategory !== 'all') {
      // If it's a main category
      if (['personal-banking', 'business-banking', 'specialized-services'].includes(selectedCategory)) {
        filtered = filtered.filter(form => form.subcategory === selectedCategory);
      } 
      // If it's a subcategory
      else {
        filtered = filtered.filter(form => form.category === selectedCategory);
      }
    }
    
    // Search filter
    if (debouncedQuery) {
      filtered = filtered.filter(form => {
        const label = t(`forms.${form.name}`, form.name).toLowerCase();
        return label.includes(debouncedQuery);
      });
    }
    
    return filtered;
  }, [debouncedQuery, selectedCategory, t]);

  // SignalR connection removed - no authentication required

  // Keyboard navigation with improved accessibility
  const handleCardKeyDown = useCallback((idx: number) => (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        openForm(filteredForms[idx]);
        break;
      case 'ArrowRight':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % filteredForms.length);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + filteredForms.length) % filteredForms.length);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = prev + 2;
          return next < filteredForms.length ? next : next % 2;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = prev - 2;
          return next >= 0 ? next : filteredForms.length - (Math.abs(next) % 2);
        });
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(filteredForms.length - 1);
        break;
    }
  }, [filteredForms]);

  // Focus management
  useEffect(() => {
    if (focusedIndex >= 0 && cardRefs.current[focusedIndex]) {
      cardRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [searchQuery]);

  // Function to calculate distance between two coordinates
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

  // Function to fetch nearby branches and their queue counts
  const fetchNearbyBranches = useCallback(async () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }

    setLoadingNearbyBranches(true);
    try {
      // Get user's current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;

      // Fetch all branches
      const allBranches = await fetchBranches();

      // Calculate distances and filter nearby branches (within 50km)
      const branchesWithDistance = allBranches
        .filter(branch => branch.latitude && branch.longitude)
        .map(branch => ({
          ...branch,
          distance: calculateDistance(latitude, longitude, branch.latitude!, branch.longitude!)
        }))
        .filter(branch => branch.distance <= 50)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5); // Take only the 5 nearest branches

      setNearbyBranches(branchesWithDistance);

      // Fetch queue counts for nearby branches
      const counts: Record<string, number> = {};
      await Promise.all(
        branchesWithDistance.map(async (branch) => {
          try {
            const count = await getQueueCount(branch.id);
            counts[branch.id] = count;
          } catch (error) {
            console.warn(`Failed to fetch queue count for branch ${branch.id}:`, error);
            counts[branch.id] = 0;
          }
        })
      );

      setQueueCounts(counts);
    } catch (error) {
      console.error('Error fetching nearby branches:', error);
    } finally {
      setLoadingNearbyBranches(false);
    }
  }, []);

  // Form navigation handler - direct navigation without authentication
  const openForm = useCallback((form: Form) => {
    navigate(form.route);
  }, [navigate]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-amber-50 to-fuchsia-50" ref={containerRef}>
      {/* Nearby Branches Modal */}
      <NearbyBranchesModal
        isOpen={isNearbyBranchesModalOpen}
        onClose={() => setIsNearbyBranchesModalOpen(false)}
        loadingNearbyBranches={loadingNearbyBranches}
        nearbyBranches={nearbyBranches}
        queueCounts={queueCounts}
        fetchNearbyBranches={fetchNearbyBranches}
      />

      {/* Transaction Search Modal */}
      <TransactionSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      {/* Header with brand gradient */}
      <header className="bg-fuchsia-700 text-white shadow-lg z-50 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <img src={logo} alt="Bank Logo" className="h-16 w-16 rounded-full object-contain" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{t('bankName', 'Commercial Bank of Ethiopia')}</h1>
                <p className="text-fuchsia-100 text-sm">
                  {t('welcomeToCBE', 'Welcome to CBE Digital Banking')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Access Method Indicator */}
              <AccessMethodIndicatorWithContext />
              
              {/* Search Transaction Button */}
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 group text-sm"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                <span className="hidden sm:inline">{t('searchTransaction', 'Search')}</span>
              </button>
              
              {/* Nearby Branches Button with brand colors */}
              <button
                onClick={() => {
                  setIsNearbyBranchesModalOpen(true);
                  if (nearbyBranches.length === 0) {
                    fetchNearbyBranches();
                  }
                }}
                className="bg-gradient-to-r from-amber-600 to-fuchsia-700 hover:from-amber-700 hover:to-fuchsia-800 text-white px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 group text-sm shadow-md"
              >
                <BuildingStorefrontIcon className="h-5 w-5" />
                <span className="hidden sm:inline">{t('nearbyBranches', 'Nearby Branches')}</span>
                {nearbyBranches.length > 0 && (
                  <span className="bg-white text-fuchsia-700 rounded-full px-2 py-0.5 text-xs font-bold">
                    {nearbyBranches.reduce((total, branch) => total + (queueCounts[branch.id] || 0), 0)}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => openForm(forms.find(f => f.name === 'history')!)}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 group text-sm"
              >
                <ClockIcon className="h-5 w-5" />
                <span className="hidden sm:inline">{t('transactionHistory', 'History')}</span>
              </button>
              
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable area */}
      <main className="flex-grow overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          
          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 border border-fuchsia-100">
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="h-5 w-5 text-fuchsia-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder', 'Search for services...')}
                className="w-full pl-12 pr-10 py-3 border-2 border-fuchsia-100 rounded-xl text-base focus:outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-100 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-fuchsia-500 hover:text-fuchsia-700 transition-colors"
                  aria-label="Clear search"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Main Categories */}
            <div className="hidden md:flex flex-wrap gap-2 mb-3">
              {mainCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={clsx(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                    selectedCategory === category.id
                      ? 'bg-fuchsia-600 text-white shadow-lg'
                      : 'bg-gradient-to-r from-amber-50 to-fuchsia-50 text-fuchsia-700 hover:from-amber-100 hover:to-fuchsia-100 hover:text-fuchsia-800 border border-fuchsia-200'
                  )}
                >
                  <FunnelIcon className="h-4 w-4" />
                  {category.label}
                  <span className={clsx(
                    'px-1.5 py-0.5 rounded-full text-xs',
                    selectedCategory === category.id
                      ? 'bg-white/20'
                      : 'bg-white text-fuchsia-700'
                  )}>
                    {category.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Subcategories when a main category is selected */}
            {selectedCategory !== 'all' && ['personal-banking', 'business-banking', 'specialized-services'].includes(selectedCategory) && (
              <div className="hidden md:flex flex-wrap gap-2 mb-4">
                {subCategories[selectedCategory].map((subcategory) => (
                  <button
                    key={subcategory.id}
                    onClick={() => setSelectedCategory(subcategory.id)}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                      selectedCategory === subcategory.id
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-white text-fuchsia-700 hover:bg-amber-50 border border-fuchsia-200'
                    )}
                  >
                    {subcategory.label}
                  </button>
                ))}
              </div>
            )}

          </div>

          <div className="hidden md:flex justify-between items-center mb-3">
            {/* <p className="text-fuchsia-700 font-medium">
              {filteredForms.length} {t('servicesFound', 'services found')}
            </p> */}
            {debouncedQuery && (
              <button
                onClick={clearSearch}
                className="text-sm text-fuchsia-700 hover:text-fuchsia-900 font-medium"
              >
                Clear search
              </button>
            )}
          </div>

          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <FormCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && (
            <>
              {filteredForms.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-r from-amber-100 to-fuchsia-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MagnifyingGlassIcon className="h-8 w-8 text-fuchsia-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('noResults', 'No services found')}
                  </h3>
                  <p className="text-gray-600">
                    {debouncedQuery 
                      ? t('noResultsForQuery', 'Try adjusting your search or filters')
                      : t('noServicesAvailable', 'No services available in this category')
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredForms.map((form, idx) => (
                    <FormCard
                      key={form.name}
                      form={form}
                      onClick={() => openForm(form)}
                      isFocused={focusedIndex === idx}
                      onKeyDown={handleCardKeyDown(idx)}
                      ref={(el: HTMLDivElement | null) => { cardRefs.current[idx] = el; }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Branch Watermark */}
      <BranchWatermarkWithContext />
    </div>
  );
};

export default function Dashboard() {
  return (
    <DashboardErrorBoundary>
      <CustomerDashboardContent />
    </DashboardErrorBoundary>
  );
}