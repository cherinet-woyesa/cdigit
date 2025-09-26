import React from 'react'; // Add this import
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  Squares2X2Icon,
  ReceiptPercentIcon,
  DocumentDuplicateIcon,
  HandRaisedIcon,
  LinkIcon,
  XMarkIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { HubConnectionBuilder } from '@microsoft/signalr';
import QueueNotifyModal from '../../modals/QueueNotifyModal';
import clsx from 'clsx';
import LanguageSwitcher from '../../components/LanguageSwitcher';

type FormName =
  | 'accountOpening'
  | 'cashDeposit'
  | 'cashWithdrawal'
  | 'fundTransfer'
  | 'history'
  | 'mobileBanking'
  | 'atmCard'
  | 'cbeBirr'
  | 'rtgsTransfer'
  | 'ebankingApplication'
  | 'otherServices'
  | 'cbeBirrRegistration'
  | 'otherForms'
  | 'posRequest'
  | 'statementRequest'
  | 'stopPayment'
  | 'cbeBirrLink';

interface Form {
  name: FormName;
  route: string;
  icon: React.ElementType;
  description: string;
  category: 'transactions' | 'services' | 'requests' | 'history';
}

const forms: Form[] = [
  { name: 'accountOpening', route: '/form/account-opening', icon: DocumentTextIcon, description: 'Open a new bank account.', category: 'services' },
  { name: 'cashDeposit', route: '/form/cash-deposit', icon: ArrowDownTrayIcon, description: 'Deposit cash to an account.', category: 'transactions' },
  { name: 'cashWithdrawal', route: '/form/cash-withdrawal', icon: ArrowUpTrayIcon, description: 'Withdraw cash from your account.', category: 'transactions' },
  { name: 'fundTransfer', route: '/form/fund-transfer', icon: ArrowsRightLeftIcon, description: 'Transfer funds between accounts.', category: 'transactions' },
  { name: 'rtgsTransfer', route: '/form/rtgs-transfer', icon: ArrowsRightLeftIcon, description: 'RTGS Customer Transfer Order.', category: 'transactions' },
  { name: 'ebankingApplication', route: '/form/ebanking', icon: DevicePhoneMobileIcon, description: 'Apply for E-Banking services.', category: 'services' },
  { name: 'cbeBirrRegistration', route: '/form/cbe-birr', icon: CurrencyDollarIcon, description: 'Register for CBE-Birr.', category: 'services' },
  { name: 'posRequest', route: '/form/pos-request', icon: ReceiptPercentIcon, description: 'Request a POS device for your business.', category: 'requests' },
  { name: 'statementRequest', route: '/form/statement-request', icon: DocumentDuplicateIcon, description: 'Request your account statement.', category: 'requests' },
  { name: 'stopPayment', route: '/form/stop-payment', icon: HandRaisedIcon, description: 'Request to stop payment on a cheque.', category: 'requests' },
  { name: 'cbeBirrLink', route: '/form/cbe-birr-link', icon: LinkIcon, description: 'Link your CBE-Birr and bank account.', category: 'services' },
  { name: 'history', route: '/customer/transaction-history', icon: ClockIcon, description: 'View your transaction history.', category: 'history' },
];

// Categories for filtering
const categories = [
  { id: 'all', label: 'All Services', count: forms.length },
  { id: 'transactions', label: 'Transactions', count: forms.filter(f => f.category === 'transactions').length },
  { id: 'services', label: 'Banking Services', count: forms.filter(f => f.category === 'services').length },
  { id: 'requests', label: 'Requests', count: forms.filter(f => f.category === 'requests').length },
];

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
      aria-label={`${label} - ${form.description}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={clsx(
        'group relative bg-white p-4 rounded-2xl shadow-sm border-2 border-gray-100 transition-all duration-300 ease-out',
        'hover:shadow-xl hover:border-fuchsia-300 hover:transform hover:scale-105',
        'focus:outline-none focus:ring-4 focus:ring-fuchsia-200 focus:border-fuchsia-500',
        isFocused && 'ring-4 ring-fuchsia-200 border-fuchsia-500 scale-105',
        'active:scale-95'
      )}
    >
      {/* Gradient overlay on hover */}
      <div className={clsx(
        'absolute inset-0 rounded-2xl bg-gradient-to-br from-fuchsia-50 to-pink-50 opacity-0 transition-opacity duration-300',
        'group-hover:opacity-100'
      )} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 mb-3 group-hover:from-fuchsia-600 group-hover:to-pink-600 transition-all">
          <form.icon className="h-6 w-6 text-white" />
        </div>
        
        <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 leading-tight">
          {label}
        </h3>
        
        <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
          {form.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className={clsx(
            'px-2 py-1 rounded-full text-xs font-medium capitalize',
            form.category === 'transactions' && 'bg-blue-100 text-blue-800',
            form.category === 'services' && 'bg-green-100 text-green-800',
            form.category === 'requests' && 'bg-orange-100 text-orange-800',
            form.category === 'history' && 'bg-purple-100 text-purple-800'
          )}>
            {form.category}
          </span>
          
          <div className="flex items-center gap-1 text-fuchsia-600 group-hover:text-fuchsia-700 transition-colors">
            <span className="text-xs font-semibold">
              {form.name === 'history' ? t('viewHistory', 'View') : t('startForm', 'Start')}
            </span>
            <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
}));

FormCard.displayName = 'FormCard';

// Skeleton loader for better loading states
const FormCardSkeleton: React.FC = () => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-gray-100 animate-pulse">
    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gray-200 mb-3"></div>
    <div className="h-4 bg-gray-200 rounded mb-2"></div>
    <div className="h-3 bg-gray-200 rounded mb-3"></div>
    <div className="flex justify-between">
      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
      <div className="h-4 w-12 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export default function Dashboard() {
  const { phone, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isQueueNotifyModalOpen, setIsQueueNotifyModalOpen] = useState(false);
  const [queueNotifyModalMessage, setQueueNotifyModalMessage] = useState('');
  const [queueNotifyModalTitle, setQueueNotifyModalTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [signalRError, setSignalRError] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Refs
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search with useCallback for stability
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim().toLowerCase());
    }, 200);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Optimized form filtering with useMemo
  const filteredForms = useMemo(() => {
    let filtered = forms;
    
    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(form => form.category === selectedCategory);
    }
    
    // Search filter
    if (debouncedQuery) {
      filtered = filtered.filter(form => {
        const label = t(`forms.${form.name}`, form.name).toLowerCase();
        const description = form.description.toLowerCase();
        return label.includes(debouncedQuery) || description.includes(debouncedQuery);
      });
    }
    
    return filtered;
  }, [debouncedQuery, selectedCategory, t]);

  // SignalR connection with better error handling
  useEffect(() => {
    if (!phone) {
      navigate('/otp-login');
      return;
    }

    let connection: any;
    const connectSignalR = async () => {
      try {
        setLoading(true);
        connection = new HubConnectionBuilder()
          .withUrl('http://localhost:5268/hub/queueHub')
          .withAutomaticReconnect([0, 1000, 5000, 10000])
          .build();

        await connection.start();
        
        await connection.invoke('JoinQueueGroup', phone);
        
        connection.on('CustomerCalled', (data: { message: string; windowId: string }) => {
          setQueueNotifyModalTitle(t('beingCalled', 'You Are Being Called'));
          setQueueNotifyModalMessage(`${data.message} - Window ${data.windowId}`);
          setIsQueueNotifyModalOpen(true);
        });

        setSignalRError(null);
      } catch (error) {
        console.warn('SignalR connection failed:', error);
        setSignalRError(t('signalRError', 'Notifications temporarily unavailable'));
      } finally {
        setLoading(false);
      }
    };

    connectSignalR();

    return () => {
      if (connection) {
        connection.off('CustomerCalled');
        connection.stop().catch(console.warn);
      }
    };
  }, [phone, navigate, t]);

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

  // Form navigation handler
  const openForm = useCallback((form: Form) => {
    navigate(form.route);
  }, [navigate]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" ref={containerRef}>
      {/* Notification Modal */}
      <QueueNotifyModal
        isOpen={isQueueNotifyModalOpen}
        onClose={() => setIsQueueNotifyModalOpen(false)}
        title={queueNotifyModalTitle}
        message={queueNotifyModalMessage}
      />

      {/* Header */}
     
<header className="bg-fuchsia-700 text-white shadow-lg sticky top-0 z-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div>
        <h1 className="text-2xl font-bold">{t('dashboardTitle', 'CBE Digital Banking')}</h1>
        <p className="text-fuchsia-200 text-sm mt-1">
          {t('welcomeBack', 'Welcome back')}, {user?.firstName || 'Customer'}
        </p>
      </div>
      
      {/* Integrated Language Switcher */}
      <div className="flex items-center gap-3">
      <div className="bg-fuchsia-800/80 px-3 py-1.5 rounded-full text-sm">
          📱 {phone}
        </div>
        <div className="bg-fuchsia-700/30 rounded-lg p-1">
          <LanguageSwitcher />
        </div>
       
      </div>
    </div>
  </div>
</header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Welcome Banner */}
  <div className="bg-fuchsia-700 text-white rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">{t('welcomeBanner', 'Welcome to CBE Digital Services')}</h2>
              <p className="text-fuchsia-100 opacity-90">
                {t('welcomeSubtitle', 'Access all banking services in one place')}
              </p>
            </div>
            <button
              onClick={() => openForm(forms.find(f => f.name === 'history')!)}
              className="bg-fuchsia-800 hover:bg-fuchsia-900 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 group"
            >
              <ClockIcon className="h-5 w-5" />
              {t('viewHistory', 'Transaction History')}
              <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
  <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          {/* Search Bar */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder', 'Search for services...')}
              className="w-full pl-12 pr-10 py-4 border-2 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-100 transition-all"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={clsx(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                  selectedCategory === category.id
                    ? 'bg-fuchsia-700 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-fuchsia-100 hover:text-fuchsia-700'
                )}
              >
                <FunnelIcon className="h-4 w-4" />
                {category.label}
                <span className={clsx(
                  'px-1.5 py-0.5 rounded-full text-xs',
                  selectedCategory === category.id
                    ? 'bg-white/20'
                    : 'bg-fuchsia-50'
                )}>
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            {filteredForms.length} {t('servicesFound', 'services found')}
          </p>
          {debouncedQuery && (
            <button
              onClick={clearSearch}
              className="text-sm text-fuchsia-700 hover:text-fuchsia-900 font-medium"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <FormCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {signalRError && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-full">
                <DevicePhoneMobileIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-yellow-800 font-medium">{signalRError}</p>
                <p className="text-yellow-600 text-sm">You can still use all services</p>
              </div>
            </div>
          </div>
        )}

        {/* Services Grid */}
        {!loading && (
          <>
            {filteredForms.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

        {/* Quick Actions Footer */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-fuchsia-700 mb-4">Need help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="text-left p-4 rounded-xl border-2 border-gray-100 hover:border-fuchsia-700 transition-colors">
              <div className="text-fuchsia-700 font-semibold">Visit Branch</div>
              <div className="text-sm text-gray-600">Find nearest location</div>
            </button>
            <button className="text-left p-4 rounded-xl border-2 border-gray-100 hover:border-fuchsia-700 transition-colors">
              <div className="text-fuchsia-700 font-semibold">Contact Support</div>
              <div className="text-sm text-gray-600">Get help 24/7</div>
            </button>
            <button className="text-left p-4 rounded-xl border-2 border-gray-100 hover:border-fuchsia-700 transition-colors">
              <div className="text-fuchsia-700 font-semibold">FAQ</div>
              <div className="text-sm text-gray-600">Common questions</div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}