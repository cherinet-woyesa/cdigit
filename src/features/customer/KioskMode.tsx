import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
  DevicePhoneMobileIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
  DocumentDuplicateIcon,
  HandRaisedIcon,
  LinkIcon,
  ClockIcon,
  PrinterIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';

// Service categories for kiosk
const serviceCategories = [
  {
    id: 'transactions',
    name: 'Transactions',
    icon: ArrowsRightLeftIcon,
    color: 'bg-blue-500',
    services: [
      { id: 'cashDeposit', name: 'Cash Deposit', icon: ArrowDownTrayIcon, route: '/form/cash-deposit' },
      { id: 'cashWithdrawal', name: 'Cash Withdrawal', icon: ArrowUpTrayIcon, route: '/form/cash-withdrawal' },
      { id: 'fundTransfer', name: 'Fund Transfer', icon: ArrowsRightLeftIcon, route: '/form/fund-transfer' },
      { id: 'rtgsTransfer', name: 'RTGS Transfer', icon: ArrowsRightLeftIcon, route: '/form/rtgs-transfer' },
    ]
  },
  {
    id: 'services',
    name: 'Banking Services',
    icon: DevicePhoneMobileIcon,
    color: 'bg-green-500',
    services: [
      { id: 'accountOpening', name: 'Account Opening', icon: DocumentTextIcon, route: '/form/account-opening' },
      { id: 'ebanking', name: 'E-Banking', icon: DevicePhoneMobileIcon, route: '/form/ebanking' },
      { id: 'cbeBirr', name: 'CBE Birr', icon: CurrencyDollarIcon, route: '/form/cbe-birr' },
      { id: 'cbeBirrLink', name: 'CBE Birr Link', icon: LinkIcon, route: '/form/cbe-birr-link' },
    ]
  },
  {
    id: 'requests',
    name: 'Requests',
    icon: DocumentDuplicateIcon,
    color: 'bg-purple-500',
    services: [
      { id: 'posRequest', name: 'POS Request', icon: ReceiptPercentIcon, route: '/form/pos-request' },
      { id: 'statement', name: 'Statement Request', icon: DocumentDuplicateIcon, route: '/form/statement-request' },
      { id: 'stopPayment', name: 'Stop Payment', icon: HandRaisedIcon, route: '/form/stop-payment' },
    ]
  },
  {
    id: 'history',
    name: 'History',
    icon: ClockIcon,
    color: 'bg-orange-500',
    services: [
      { id: 'transactionHistory', name: 'Transaction History', icon: ClockIcon, route: '/customer/transaction-history' },
    ]
  }
];

const KioskMode: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [queueTicket, setQueueTicket] = useState<{
    queueNumber: string;
    tokenNumber: string;
    serviceType: string;
    timestamp: string;
  } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Auto-hide help after 30 seconds
  useEffect(() => {
    if (showHelp) {
      const timer = setTimeout(() => {
        setShowHelp(false);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [showHelp]);

  // Auto-reset kiosk after 2 minutes of inactivity
  useEffect(() => {
    const resetTimer = setTimeout(() => {
      setSelectedService(null);
      setQueueTicket(null);
    }, 120000); // 2 minutes

    return () => clearTimeout(resetTimer);
  }, [selectedService, queueTicket]);

  const handleServiceSelect = (route: string, serviceName: string) => {
    setSelectedService(serviceName);
    navigate(route);
  };

  const handlePrintTicket = () => {
    if (!queueTicket) return;
    
    // In a real implementation, this would connect to a printer service
    // For now, we'll show an alert with ticket details
    alert(`Printing Queue Ticket:
    
Queue Number: ${queueTicket.queueNumber}
Token: ${queueTicket.tokenNumber}
Service: ${queueTicket.serviceType}
Time: ${queueTicket.timestamp}

Please proceed to the counter when your number is called.`);
    
    // Reset after printing
    setQueueTicket(null);
    setSelectedService(null);
  };

  const handleScanQR = () => {
    // In a real implementation, this would use device camera
    alert('QR Code Scanner would open here in a real implementation.');
  };

  return (
    <div className="kiosk-mode min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-fuchsia-600 p-2 rounded-lg">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Commercial Bank of Ethiopia</h1>
            <p className="text-gray-300 text-sm">Self-Service Kiosk</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <button 
            onClick={() => setShowHelp(true)}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Help
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-6 overflow-auto">
        {!selectedService && !queueTicket ? (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Welcome to CBE Self-Service</h2>
              <p className="text-xl text-gray-300">Please select a service to begin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {serviceCategories.map((category) => (
                <div key={category.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`${category.color} p-2 rounded-lg`}>
                      <category.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold">{category.name}</h3>
                  </div>
                  <div className="space-y-3">
                    {category.services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => handleServiceSelect(service.route, service.name)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-left"
                      >
                        <service.icon className="h-5 w-5 text-gray-300" />
                        <span className="font-medium">{service.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={handleScanQR}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <QrCodeIcon className="h-5 w-5" />
                Scan QR Code
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg flex items-center gap-2 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Staff
              </button>
            </div>
          </div>
        ) : queueTicket ? (
          <div className="max-w-md mx-auto bg-white text-gray-900 rounded-2xl p-8 shadow-2xl">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Queue Ticket Generated</h2>
              <p className="text-gray-600 mb-6">Please proceed to the counter when your number is called</p>
              
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-fuchsia-700">{queueTicket.queueNumber}</div>
                  <div className="text-gray-500">Queue Number</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Token</div>
                    <div className="font-semibold">{queueTicket.tokenNumber}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Service</div>
                    <div className="font-semibold">{queueTicket.serviceType}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Time</div>
                    <div className="font-semibold">{queueTicket.timestamp}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handlePrintTicket}
                  className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <PrinterIcon className="h-5 w-5" />
                  Print Ticket
                </button>
                <button
                  onClick={() => {
                    setQueueTicket(null);
                    setSelectedService(null);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg transition-colors"
                >
                  Start New Service
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 bg-fuchsia-600 rounded-full mb-4"></div>
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
              <p className="mt-6 text-gray-400">Loading service...</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 p-4 text-center text-gray-400 text-sm">
        <p>Commercial Bank of Ethiopia Self-Service Kiosk • For assistance, press the Help button</p>
      </footer>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-gray-900 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Kiosk Help</h3>
              <button 
                onClick={() => setShowHelp(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">How to Use This Kiosk</h4>
                <p className="text-gray-600 text-sm">1. Select a service from the main menu</p>
                <p className="text-gray-600 text-sm">2. Complete the digital form</p>
                <p className="text-gray-600 text-sm">3. Get your queue number and token</p>
                <p className="text-gray-600 text-sm">4. Proceed to the counter when called</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Need Assistance?</h4>
                <p className="text-gray-600 text-sm">Press the "Call Staff" button or ask a bank employee for help.</p>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white py-2 rounded-lg"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KioskMode;