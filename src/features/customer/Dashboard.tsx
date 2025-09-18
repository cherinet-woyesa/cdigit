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
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { HubConnectionBuilder } from '@microsoft/signalr';
import QueueNotifyModal from '../../modals/QueueNotifyModal';
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
  | 'otherForms';

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
  { name: 'mobileBanking', route: '/form/mobile-banking', icon: DevicePhoneMobileIcon, description: 'Manage your accounts on the go.' },
  { name: 'atmCard', route: '/form/atm-card', icon: CreditCardIcon, description: 'Request or manage your ATM card.' },
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
        'cursor-pointer group bg-white p-3 sm:p-5 rounded-xl shadow-lg border-2 border-transparent transition-all duration-300',
        'hover:shadow-xl hover:border-fuchsia-500 hover:bg-fuchsia-700',
        isFocused && 'ring-2 ring-fuchsia-500',
        'focus:outline-none focus:ring-2 focus:ring-fuchsia-500'
      )}
      style={{ outline: isFocused ? '2px solid #a21caf' : undefined }}
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
  const [isQueueNotifyModalOpen, setIsQueueNotifyModalOpen] = useState(false);
  const [QueueNotifyModalMessage, setQueueNotifyModalMessage] = useState('');
  const [QueueNotifyModalTitle, setQueueNotifyModalTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [signalRError, setSignalRError] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Search with translation
  const filteredForms = useMemo(() => {
    if (!searchQuery.trim()) return forms;
    const query = searchQuery.toLowerCase().trim();
    return forms.filter((form) => {
      const label = t(`forms.${form.name}`, form.name);
      return label.toLowerCase().includes(query);
    });
  }, [searchQuery, t]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* QueueNotifyModal */}
      <QueueNotifyModal
        isOpen={isQueueNotifyModalOpen}
        onClose={() => setIsQueueNotifyModalOpen(false)}
        title={QueueNotifyModalTitle}
        message={QueueNotifyModalMessage}
      />
      <header className="bg-fuchsia-700 text-white py-3 px-4 sm:py-5 sm:px-6 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
          <h5 className="text-xs sm:text-sm bg-fuchsia-800 px-2.5 py-1 rounded-full items-left">
            {t('loggedInAs', { phone }) || `Logged in as: ${phone}`}
          </h5>
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

          <div className="mb-3 sm:mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 sm:left-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                className="w-full pl-10 pr-3 py-2 sm:py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 text-sm sm:text-lg"
              />
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
                    onClick={() => navigate(form.route)}
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