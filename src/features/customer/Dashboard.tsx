import { useAuth } from '../../context/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

type FormName = 'accountOpening' | 'cashDeposit' | 'cashWithdrawal' | 'fundTransfer' | 
  'mobileBanking' | 'atmCard' | 'cbeBirr' | 'otherForms';

interface Form {
  name: FormName;
  route: string;
}

const forms: Form[] = [
  { name: 'accountOpening', route: '/form/account-opening' },
  { name: 'cashDeposit', route: '/form/cash-deposit' },
  { name: 'cashWithdrawal', route: '/form/cash-withdrawal' },
  { name: 'fundTransfer', route: '/form/fund-transfer' },
  { name: 'mobileBanking', route: '/form/mobile-banking' },
  { name: 'atmCard', route: '/form/atm-card' },
  { name: 'cbeBirr', route: '/form/cbe-birr' },
  { name: 'otherForms', route: '/form/other-forms' },
]

export default function Dashboard() {
  const { phone } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter forms based on search query
  const filteredForms = useMemo(() => {
    if (!searchQuery.trim()) return forms;
    const query = searchQuery.toLowerCase().trim();
    
    return forms.filter(form => {
      // Use type assertion to ensure TypeScript knows this is a valid key
      const formName = t(`forms.${form.name}` as const).toLowerCase();
      const formRoute = form.route.toLowerCase();
      return formName.includes(query) || formRoute.includes(query);
    });
  }, [searchQuery, t]);

  useEffect(() => {
    if (!phone) navigate('/') // Redirect to login if not verified
  }, [phone, navigate])

  return (
    <div className="min-h-screen bg-[#faf6e9]">
      {/* Header */}
      <header className="bg-fuchsia-700 text-white py-5 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('dashboardTitle')}</h1>
          <p className="text-sm bg-fuchsia-800 px-3 py-1 rounded-full">
            {t('loggedInAs')}: {phone}
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Welcome Banner */}
        <div className="bg-fuchsia-700 text-white p-6 rounded-xl mb-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-2">{t('welcomeBanner')}</h2>
          <p className="opacity-90">{t('welcomeSubtitle')}</p>
        </div>

        {/* Search */}
        <div className="mb-10 relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-12 pr-4 py-4 border-0 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-fuchsia-700 text-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            )}
          </div>
          {searchQuery && filteredForms.length === 0 && (
            <p className="mt-2 text-sm text-gray-600">{t('noResults')}</p>
          )}
        </div>

        {/* Form Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredForms.map((form, idx) => (
            <div
              key={idx}
              onClick={() => navigate(form.route)}
              className="cursor-pointer group bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-fuchsia-700 hover:bg-fuchsia-700"
            >
              <div className="flex flex-col h-full">
                <div className="mb-4 p-3 bg-fuchsia-100 rounded-lg w-12 h-12 flex items-center justify-center group-hover:bg-fuchsia-800 transition-colors">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6 text-fuchsia-700 group-hover:text-white transition-colors" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-white transition-colors">
                  {t(`forms.${form.name}` as const)}
                </h3>
                <p className="text-sm text-fuchsia-700 mt-2 group-hover:text-white transition-colors mt-auto">
                  {t('startForm')} →
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}