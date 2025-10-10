import React from 'react';
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
import TransactionFeedbackModal from '../../modals/TransactionFeedbackModal';
import clsx from 'clsx';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { DashboardErrorBoundary } from '../../components/dashboard/ErrorBoundary';
import { config, BRAND_COLORS } from '../../config/env';

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
  { name: 'ebankingApplication', route: '/form/ebanking', icon: DevicePhoneMobileIcon, description: 'Apply for E-Banking services.', category: 'services' },
  { name: 'cbeBirrRegistration', route: '/form/cbe-birr', icon: CurrencyDollarIcon, description: 'Register for CBE-Birr.', category: 'services' },
  { name: 'posRequest', route: '/form/pos-request', icon: ReceiptPercentIcon, description: 'Request a POS device for your business.', category: 'requests' },
  { name: 'rtgsTransfer', route: '/form/rtgs-transfer', icon: ArrowsRightLeftIcon, description: 'RTGS Customer Transfer Order.', category: 'transactions' },
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
        'group relative bg-white p-3 rounded-xl shadow-sm border border-gray-200 transition-all duration-300 ease-out',
        'hover:shadow-md hover:border-fuchsia-300 hover:transform hover:-translate-y-1',
        'focus:outline-none focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-700',
        isFocused && 'ring-4 ring-fuchsia-100 border-fuchsia-700 -translate-y-1',
        'active:scale-95'
      )}
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex-shrink-0 flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-fuchsia-700 group-hover:bg-fuchsia-800 transition-all">
            <form.icon className="h-5 w-5 text-white" />
          </div>
          <span className={clsx(
            'px-2 py-1 rounded-full text-[10px] font-medium capitalize',
            'bg-fuchsia-100 text-fuchsia-800'
          )}>
            {form.category}
          </span>
        </div>
        
        <div className="flex-grow">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 leading-tight">
            {label}
          </h3>
          <p className="text-[12px] text-gray-500 line-clamp-2 leading-snug">
            {form.description}
          </p>
        </div>
        
        <div className="flex-shrink-0 flex items-center justify-end mt-2">
          <div className="flex items-center gap-1 text-fuchsia-700 group-hover:text-fuchsia-800 transition-colors">
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
  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 animate-pulse">
    <div className="flex items-center gap-3 mb-2">
      <div className="h-10 w-10 rounded-lg bg-gray-200"></div>
      <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
    </div>
    <div className="h-4 bg-gray-200 rounded mb-1 w-3/4"></div>
    <div className="h-3 bg-gray-200 rounded mb-3 w-full"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    <div className="flex justify-end mt-2">
      <div className="h-4 w-12 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const CustomerDashboardContent: React.FC = () => {
  const { phone, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isQueueNotifyModalOpen, setIsQueueNotifyModalOpen] = useState(false);
  const [queueNotifyModalMessage, setQueueNotifyModalMessage] = useState('');
  const [queueNotifyModalTitle, setQueueNotifyModalTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [signalRError, setSignalRError] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Transaction Feedback Modal state
  const [isTransactionFeedbackModalOpen, setTransactionFeedbackModalOpen] = useState(false);
  const [TransactionCompletdModalTransactionId, setTransactionCompletdModalTransactionId] = useState('');
  const [transactionCompletdModalFrontMakerId, setTransactionCompletdModalFrontMakerId] = useState('');
  const [transactionCompletdModalBranchId, setTransactionCompletdModalBranchId] = useState('');
  const [TransactionCompletdModalTransactionType, setTransactionCompletdModalTransactionType] = useState('');
  const [TransactionCompletdModalTransactionAmount, setTransactionCompletdModalTransactionAmount] = useState('');
  const [TransactionCompletdModalMessage, setTransactionCompletdModalMessage] = useState('');
  const [TransactionCompletdModalCustomerPhone, setTransactionCompletdModalCustomerPhone] = useState('');
  
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

  // SignalR connection with better error handling and cleanup
  useEffect(() => {
    if (!phone) {
      navigate('/otp-login');
      return;
    }

    let connection: any = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    
    const connectSignalR = async () => {
      try {
        connection = new HubConnectionBuilder()
          .withUrl(`${config.SIGNALR_URL}/hub/queueHub`)
          .withAutomaticReconnect({
            nextRetryDelayInMilliseconds: (retryContext) => {
              if (retryContext.previousRetryCount >= MAX_RECONNECT_ATTEMPTS) {
                console.warn('Max SignalR reconnection attempts reached');
                setSignalRError(t('signalRError', 'Notifications temporarily unavailable'));
                return null; // Stop reconnecting
              }
              return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
            }
          })
          .build();

        // Connection state handlers
        connection.onreconnecting(() => {
          console.log('SignalR reconnecting...');
          reconnectAttempts++;
        });

        connection.onreconnected(() => {
          console.log('SignalR reconnected successfully');
          reconnectAttempts = 0;
          setSignalRError(null);
          // Rejoin group after reconnection
          connection.invoke('JoinQueueGroup', phone).catch(console.error);
        });

        connection.onclose(() => {
          console.log('SignalR connection closed');
        });

        await connection.start();
        console.log('SignalR connected successfully');
        
        await connection.invoke('JoinQueueGroup', phone);
        
        connection.on('CustomerCalled', (data: { message: string; windowId: string }) => {
          setQueueNotifyModalTitle(t('beingCalled', 'You Are Being Called'));
          setQueueNotifyModalMessage(`${data.message} - Window ${data.windowId}`);
          setIsQueueNotifyModalOpen(true);
        });

        // Transaction Completed handler
        connection.on("TransactionCompleted", (data: any) => {
          setIsQueueNotifyModalOpen(false);
          setTransactionFeedbackModalOpen(true);
          setTransactionCompletdModalTransactionId(data.transactionId);
          setTransactionCompletdModalFrontMakerId(data.frontMakerId);
          setTransactionCompletdModalBranchId(data.branchId);
          setTransactionCompletdModalCustomerPhone(data.customerPhone);
          setTransactionCompletdModalTransactionType(data.transactionType);
          setTransactionCompletdModalTransactionAmount(data.amount);
          setTransactionCompletdModalMessage(data.message);
        });

        setSignalRError(null);
      } catch (error) {
        console.error('SignalR connection failed:', error);
        setSignalRError(t('signalRError', 'Notifications temporarily unavailable'));
      }
    };

    connectSignalR();

    // Cleanup function
    return () => {
      if (connection) {
        console.log('Cleaning up SignalR connection');
        connection.off('CustomerCalled');
        connection.off('TransactionCompleted');
        connection.stop().catch((err: any) => console.warn('Error stopping SignalR:', err));
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
      {/* Notification Modals */}
      <QueueNotifyModal
        isOpen={isQueueNotifyModalOpen}
        onClose={() => setIsQueueNotifyModalOpen(false)}
        title={queueNotifyModalTitle}
        message={queueNotifyModalMessage}
      />

      <TransactionFeedbackModal
        isOpen={isTransactionFeedbackModalOpen}
        onClose={() => setTransactionFeedbackModalOpen(false)}
        transactionId={TransactionCompletdModalTransactionId}
        frontMakerId={transactionCompletdModalFrontMakerId}
        branchId={transactionCompletdModalBranchId}
        customerPhone={TransactionCompletdModalCustomerPhone}
        transactionType={TransactionCompletdModalTransactionType}
        transactionAmount={TransactionCompletdModalTransactionAmount}
        message={TransactionCompletdModalMessage}
      />

      {/* Header */}
      <header className="bg-fuchsia-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Left Side: Welcome Message */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{t('welcomeBack', 'Welcome back')}, {user?.firstName || 'Customer'}!</h1>
              <p className="text-fuchsia-100 text-sm mt-1 hidden sm:block">
                {t('welcomeSubtitle', 'Access all banking services in one place.')}
              </p>
            </div>
            
            {/* Right Side: Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => openForm(forms.find(f => f.name === 'history')!)}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 group text-sm"
              >
                <ClockIcon className="h-5 w-5" />
                <span>{t('transactionHistory', 'History')}</span>
              </button>
              <div className="bg-white/10 px-3 py-2 rounded-lg text-sm font-mono flex items-center gap-2">
                <DevicePhoneMobileIcon className="h-5 w-5" /> {phone}
              </div>
              <div className="bg-white/10 rounded-lg">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          {/* Search Bar */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder', 'Search for services...')}
              className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-fuchsia-700 focus:ring-4 focus:ring-fuchsia-100 transition-all"
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
          <div className="hidden md:flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={clsx(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                  selectedCategory === category.id
                    ? 'bg-fuchsia-700 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-fuchsia-50 hover:text-fuchsia-700'
                )}
              >
                <FunnelIcon className="h-4 w-4" />
                {category.label}
                <span className={clsx(
                  'px-1.5 py-0.5 rounded-full text-xs',
                  selectedCategory === category.id
                    ? 'bg-white/20'
                    : 'bg-fuchsia-100 text-fuchsia-700'
                )}>
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="hidden md:flex justify-between items-center mb-3">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
              <FormCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Services Grid */}
        {!loading && (
          <>
            {filteredForms.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-fuchsia-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
};

export default function Dashboard() {
  return (
    <DashboardErrorBoundary>
      <CustomerDashboardContent />
    </DashboardErrorBoundary>
  );
}