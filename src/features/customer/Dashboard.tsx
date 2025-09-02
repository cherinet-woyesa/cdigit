import { useAuth } from '../../context/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, ArrowRightIcon, DocumentTextIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, ArrowsRightLeftIcon, ClockIcon, DevicePhoneMobileIcon, CreditCardIcon, CurrencyDollarIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

type FormName = 'accountOpening' | 'cashDeposit' | 'cashWithdrawal' | 'fundTransfer' | 'history' | 'mobileBanking' | 'atmCard' | 'cbeBirr' | 'otherForms';

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
  { name: 'history', route: '/customer/transaction-history', icon: ClockIcon, description: 'View your transaction history.' },
  { name: 'mobileBanking', route: '/form/mobile-banking', icon: DevicePhoneMobileIcon, description: 'Manage your accounts on the go.' },
  { name: 'atmCard', route: '/form/atm-card', icon: CreditCardIcon, description: 'Request or manage your ATM card.' },
  { name: 'cbeBirr', route: '/form/cbe-birr', icon: CurrencyDollarIcon, description: 'Access mobile money services.' },
  { name: 'otherForms', route: '/form/other-forms', icon: Squares2X2Icon, description: 'Explore other banking services.' },
];

export default function Dashboard() {
  const { phone } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredForms = useMemo(() => {
    if (!searchQuery.trim()) return forms;
    const query = searchQuery.toLowerCase().trim();
    return forms.filter(form => t(`forms.${form.name}` as const).toLowerCase().includes(query));
  }, [searchQuery, t]);

  useEffect(() => {
    if (!phone) navigate('/');
  }, [phone, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-fuchsia-700 text-white py-5 px-6 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm bg-fuchsia-800 px-3 py-1 rounded-full">
            Logged in as: {phone}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-4 sm:py-8 px-2">
  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
    <div className="bg-fuchsia-700 text-white p-4 sm:p-6 rounded-xl mb-4 sm:mb-8 shadow-lg">
      <h2 className="text-2xl sm:text-3xl font-bold">{t('welcomeBanner')}</h2>
      <p className="opacity-90 mt-1 text-sm sm:text-base">{t('welcomeSubtitle')}</p>
    </div>

    <div className="mb-4 sm:mb-8">
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-12 pr-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 text-base sm:text-lg"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4">
      {filteredForms.map((form) => (
        <div
          key={form.name}
          onClick={() => navigate(form.route)}
          className="cursor-pointer group bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-fuchsia-500 transform hover:-translate-y-1 hover:bg-fuchsia-700"
        >
            <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-fuchsia-100 mb-2 sm:mb-4">
                <form.icon className="h-5 w-5 sm:h-6 sm:w-6 text-fuchsia-700 group-hover:text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 group-hover:text-white">
              {t(`forms.${form.name}` as const)}
            </h3>
            
            <div className="mt-2 sm:mt-4 text-fuchsia-600 font-semibold flex items-center gap-1 sm:gap-2 group-hover:gap-3 transition-all group-hover:text-white">
                <span>{form.name === 'history' ? 'View History' : t('startForm')}</span>
                <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
        </div>
      ))}
    </div>
  </div>
</main>
    </div>
  );
}
