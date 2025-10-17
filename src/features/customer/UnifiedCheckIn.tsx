import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  UserIcon,
  BuildingStorefrontIcon,
  DevicePhoneMobileIcon,
  QrCodeIcon,
  ComputerDesktopIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const UnifiedCheckIn: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const checkInMethods = [
    { 
      id: 'receptionist', 
      name: 'Receptionist Desk', 
      icon: UserIcon, 
      description: 'Check in with branch staff',
      path: '/check-in/receptionist'
    },
    { 
      id: 'kiosk', 
      name: 'Self-Service Kiosk', 
      icon: BuildingStorefrontIcon, 
      description: 'Use in-branch kiosks',
      path: '/kiosk'
    },
    { 
      id: 'mobile_app', 
      name: 'Mobile App', 
      icon: DevicePhoneMobileIcon, 
      description: 'Scan QR code with app',
      path: '/check-in/mobile-app'
    },
    { 
      id: 'sms_link', 
      name: 'SMS Link', 
      icon: QrCodeIcon, 
      description: 'Receive check-in link via SMS',
      path: '/check-in/mobile-app' // For now, we can direct this to mobile app
    },
    { 
      id: 'internet_banking', 
      name: 'Internet Banking', 
      icon: ComputerDesktopIcon, 
      description: 'Corporate customer access',
      path: '/check-in/corporate-internet-banking'
    },
  ];

  const handleMethodSelect = (path: string, methodId: string) => {
    // Track access channel
    localStorage.setItem('accessChannel', methodId);
    // Navigate to the respective path
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Omni-Channel Check-In</h1>
          <p className="text-gray-600 mt-1">How would you like to check in?</p>
        </div>

        <div className="space-y-4">
          {checkInMethods.map((method) => {
            const IconComponent = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => handleMethodSelect(method.path, method.id)}
                className="w-full p-4 rounded-lg border border-gray-300 hover:border-fuchsia-300 hover:shadow-md transition-all text-left flex items-center gap-4"
              >
                <div className="bg-fuchsia-100 p-3 rounded-lg">
                  <IconComponent className="h-6 w-6 text-fuchsia-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{method.name}</h3>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="text-fuchsia-600 hover:text-fuchsia-700 text-sm font-medium"
          >
            Back to Customer Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedCheckIn;