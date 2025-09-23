import { useAuth } from '../../context/AuthContext';
import { useEffect, useState, useMemo, useRef } from 'react';
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
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { HubConnectionBuilder } from '@microsoft/signalr';
import QueueNotifyModal from '../../modals/QueueNotifyModal';
import TransactionFeedbackModal from './TransactionFeedbackModal';
import clsx from 'clsx';

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
}

const forms: Form[] = [
  { name: 'accountOpening', route: '/form/account-opening', icon: DocumentTextIcon, description: 'Open a new bank account.' },
  { name: 'cashDeposit', route: '/form/cash-deposit', icon: ArrowDownTrayIcon, description: 'Deposit cash to an account.' },
  { name: 'cashWithdrawal', route: '/form/cash-withdrawal', icon: ArrowUpTrayIcon, description: 'Withdraw cash from your account.' },
  { name: 'fundTransfer', route: '/form/fund-transfer', icon: ArrowsRightLeftIcon, description: 'Transfer funds between accounts.' },
  { name: 'rtgsTransfer', route: '/form/rtgs-transfer', icon: ArrowsRightLeftIcon, description: 'RTGS Customer Transfer Order.' },
  { name: 'ebankingApplication', route: '/form/ebanking', icon: DevicePhoneMobileIcon, description: 'Apply for E-Banking services.' },
  { name: 'cbeBirrRegistration', route: '/form/cbe-birr', icon: CurrencyDollarIcon, description: 'Register for CBE-Birr.' },
  
  { name: 'posRequest', route: '/form/pos-request', icon: ReceiptPercentIcon, description: 'Request a POS device for your business.' },
  { name: 'statementRequest', route: '/form/statement-request', icon: DocumentDuplicateIcon, description: 'Request your account statement.' },
  { name: 'stopPayment', route: '/form/stop-payment', icon: HandRaisedIcon, description: 'Request to stop payment on a cheque.' },
  { name: 'cbeBirrLink', route: '/form/cbe-birr-link', icon: LinkIcon, description: 'Link your CBE-Birr and bank account.' },
  { name: 'otherForms', route: '/form/other-forms', icon: Squares2X2Icon, description: 'Explore other banking services.' },
  { name: 'history', route: '/customer/transaction-history', icon: ClockIcon, description: 'View your transaction history.' },
];


// Card component for forms
import React from 'react';
const FormCard = React.forwardRef<HTMLDivElement, {
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
      aria-label={label}
      title={label}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={clsx(
        'cursor-pointer group bg-white p-3 sm:p-5 rounded-xl shadow-lg border border-transparent transition-all duration-300',
        'hover:shadow-xl hover:border-fuchsia-500 hover:bg-fuchsia-700',
        isFocused && 'ring-2 ring-fuchsia-500',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500'
      )}
    >
      <div className="flex items-center justify-center h-9 w-9 sm:h-11 sm:w-11 rounded-lg bg-fuchsia-100 mb-2 sm:mb-3">
        <form.icon className="h-5 w-5 sm:h-6 sm:w-6 text-fuchsia-700 group-hover:text-white" />
      </div>
      <h3 className="text-sm sm:text-lg font-semibold text-gray-800 group-hover:text-white">
        {label}
      </h3>
      <div className="mt-1.5 sm:mt-3 text-fuchsia-600 font-semibold flex items-center gap-1 sm:gap-2 group-hover:gap-3 transition-all group-hover:text-white text-sm">
        <span>
          {form.name === 'history' ? t('viewHistory', 'View History') : t('startForm')}
        </span>
        <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4" />
      </div>
    </div>
  );
});
FormCard.displayName = 'FormCard';

export default function Dashboard() {
  const { phone } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Queue Notify Modal state
  const [isQueueNotifyModalOpen, setIsQueueNotifyModalOpen] = useState(false);
  const [QueueNotifyModalMessage, setQueueNotifyModalMessage] = useState('');
  const [QueueNotifyModalTitle, setQueueNotifyModalTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [signalRError, setSignalRError] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentFormNames, setRecentFormNames] = useState<FormName[]>([]);

  //Transaction completd modal state
  const [isTransactionFeedbackModalOpen, setTransactionFeedbackModalOpen] = useState(false);
  const [TransactionCompletdModalTransactionId, setTransactionCompletdModalTransactionId] = useState('');
  const [transactionCompletdModalFrontMakerId, setTransactionCompletdModalFrontMakerId] = useState('');
  const [transactionCompletdModalBranchId, setTransactionCompletdModalBranchId] = useState('');
  const [TransactionCompletdModalTransactionType, setTransactionCompletdModalTransactionType] = useState('');
  const [TransactionCompletdModalTransactionAmount, setTransactionCompletdModalTransactionAmount] = useState('');
  const [TransactionCompletdModalMessage, setTransactionCompletdModalMessage] = useState('');
  const [TransactionCompletdModalCustomerPhone, setTransactionCompletdModalCustomerPhone] = useState(''); 
  // Search with translation
  const filteredForms = useMemo(() => {
    const q = debouncedQuery.trim();
    if (!q) return forms;
    const query = q.toLowerCase();
    return forms.filter((form) => {
      const label = t(`forms.${form.name}`, form.name);
      return label.toLowerCase().includes(query);
    });
  }, [debouncedQuery, t]);

  // Debounce search typing for perf
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery), 150);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Do not auto-focus a card on results change; only set focus via keyboard navigation

  // SignalR connection
  useEffect(() => {
    if (!phone) {
      navigate('/');
      return;
    }
    setLoading(true);
    setSignalRError(null);
    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5268/hub/queueHub')
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        setLoading(false);
        // Join group with phone number
        connection.invoke('JoinQueueGroup', phone);
        // Listen for messages
        connection.on('CustomerCalled', (data: { message: string; windowId: string }) => {
          setQueueNotifyModalTitle(t('beingCalled', 'You Are Being Called'));
          setQueueNotifyModalMessage(`${data.message} Window ${data.windowId}`);
          setIsQueueNotifyModalOpen(true);
        });

      connection.on("TransactionCompleted", (data) => {
        // Close the queue notify modal automatically
        setIsQueueNotifyModalOpen(false);

        setTransactionFeedbackModalOpen(true);
        setTransactionCompletdModalTransactionId(data.transactionId);
        setTransactionCompletdModalFrontMakerId(data.frontMakerId);
        setTransactionCompletdModalBranchId(data.branchId);
        setTransactionCompletdModalCustomerPhone(data.customerPhone);
        setTransactionCompletdModalTransactionType(data.transactionType);
        setTransactionCompletdModalTransactionAmount(data.amount);
        setTransactionCompletdModalMessage(data.message);

        console.log("Sgnal R data for completed transaction:" + data);
      });

      // connection.on('ReceiveNotification', (data) => {
      //   alert(data.message);
      // });

      })
      .catch(() => {
        setLoading(false);
        setSignalRError(t('signalRError', 'Could not connect to notification service.'));
      });

    return () => {
      connection.off('CustomerCalled');
      connection.stop();
    };
  }, [phone, navigate, t]);

  // Keyboard navigation for cards
  const handleCardKeyDown = (idx: number) => (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      navigate(filteredForms[idx].route);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % filteredForms.length);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + filteredForms.length) % filteredForms.length);
    }
  };

  useEffect(() => {
    if (focusedIndex >= 0 && cardRefs.current[focusedIndex]) {
      cardRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, filteredForms.length]);

  // Keyboard shortcut to focus search ('/')
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Load recents from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('recentForms');
      if (raw) {
        const parsed = JSON.parse(raw) as FormName[];
        if (Array.isArray(parsed)) setRecentFormNames(parsed.filter((n) => forms.some(f => f.name === n)));
      }
    } catch {}
  }, []);

  // Helpers to record recents and navigate
  const recordRecent = (name: FormName) => {
    setRecentFormNames((prev) => {
      const next = [name, ...prev.filter((n) => n !== name)].slice(0, 6);
      try { localStorage.setItem('recentForms', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const openForm = (form: Form) => {
    recordRecent(form.name);
    navigate(form.route);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* QueueNotifyModal */}
      <QueueNotifyModal
        isOpen={isQueueNotifyModalOpen}
        onClose={() => setIsQueueNotifyModalOpen(false)}
        title={QueueNotifyModalTitle}
        message={QueueNotifyModalMessage}
        QueueNotifyModalWindowNumber={QueueNotifyModalWindowNumber}
        QueueNotifyModalTellerName={QueueNotifyModalTellerName}
      />
      {/* TransactionFeedbackModal */}
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
      <header className="bg-fuchsia-700 text-white py-3 px-4 sm:py-5 sm:px-6 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-2">
            <h5 className="text-xs sm:text-sm bg-fuchsia-800 px-2.5 py-1 rounded-full items-left">
              {t('loggedInAs', { phone }) || `Logged in as: ${phone}`}
            </h5>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-3 sm:py-6 px-2">
        <div className="bg-white p-3 sm:p-5 rounded-xl shadow-lg">
          <div className="bg-fuchsia-700 text-white p-3 sm:p-5 rounded-xl mb-3 sm:mb-6 shadow-lg">
            <h2 className="text-xl sm:text-2xl font-bold">{t('welcomeBanner')}</h2>
            <p className="opacity-90 mt-1 text-xs sm:text-base">
              {t('welcomeSubtitle')}
            </p>
          </div>

          {/* Transaction History button */}
          <div className="mb-3 sm:mb-6">
            <button
              type="button"
              onClick={() => openForm(forms.find(f => f.name === 'history')!)}
              className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-fuchsia-700 hover:bg-fuchsia-800 text-white px-4 py-3 sm:py-4 rounded-xl shadow-lg transition"
              aria-label={t('viewHistory', 'View History')}
            >
              <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-sm sm:text-base font-semibold">{t('viewHistory', 'View History')}</span>
              <ArrowRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          <div className="mb-3 sm:mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 sm:left-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                ref={searchInputRef}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                className="w-full pl-10 pr-3 py-2 sm:py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 text-sm sm:text-lg"
              />
            </div>
            <div className="mt-1 text-xs text-gray-500" aria-live="polite">
              {filteredForms.length} {t('results', 'results')}
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <svg className="animate-spin h-8 w-8 text-fuchsia-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              <span className="ml-3 text-fuchsia-700 font-semibold">{t('loading', 'Loading...')}</span>
            </div>
          )}
          {/* SignalR error intentionally not shown to user */}

          {/* Recent Forms (commented out by request)
          {!loading && recentFormNames.length > 0 && (
            <div className="mb-3 sm:mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm sm:text-base font-semibold text-gray-700">{t('recentForms', 'Recent')}</h3>
                <button
                  type="button"
                  onClick={() => { setRecentFormNames([]); try { localStorage.removeItem('recentForms'); } catch {} }}
                  className="text-xs text-fuchsia-700 hover:underline"
                >
                  {t('clear', 'Clear')}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {recentFormNames
                  .map(n => forms.find(f => f.name === n))
                  .filter((f): f is Form => !!f)
                  .map((form) => (
                    <button
                      key={`recent-${form.name}`}
                      type="button"
                      onClick={() => openForm(form)}
                      className="flex items-center justify-center gap-2 bg-white border-2 border-fuchsia-200 hover:border-fuchsia-500 hover:bg-fuchsia-700 hover:text-white text-fuchsia-800 px-2 py-2 rounded-lg shadow-sm transition text-xs sm:text-sm"
                      aria-label={t(`forms.${form.name}`, form.name)}
                      title={t(`forms.${form.name}`, form.name)}
                    >
                      <form.icon className="h-4 w-4" />
                      <span className="font-medium truncate">{t(`forms.${form.name}`, form.name)}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
          */}

          {/* Cards grid */}
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredForms.length === 0 ? (
                <div className="col-span-full text-center text-gray-500 py-6">
                  {t('noFormsFound', 'No forms found for your search.')}
                </div>
              ) : (
                filteredForms.map((form, idx) => (
                  <FormCard
                    key={form.name}
                    form={form}
                    onClick={() => openForm(form)}
                    isFocused={focusedIndex === idx}
                    onKeyDown={handleCardKeyDown(idx)}
                    ref={(el: HTMLDivElement | null) => { cardRefs.current[idx] = el; }}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}