import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCodeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import logo from '@assets/logo.jpg';

const QRLogin: React.FC = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);

    // Simulate a network request and QR code validation
    setTimeout(() => {
      // On success, redirect to the customer dashboard
      // In a real app, the backend would provide a token to log the user in
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 to-fuchsia-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white shadow-lg rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <img src={logo} alt="CBE Logo" className="h-8 w-8 object-contain rounded-full" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-fuchsia-700 mb-2">Welcome to CBE</h1>
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-amber-100 mb-6">
          <QrCodeIcon className="h-16 w-16 text-fuchsia-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Login with QR Code</h2>
        <p className="text-gray-600 mb-6">Scan a QR code from your mobile app or a link sent via SMS to log in instantly.</p>
        
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="w-full bg-gradient-to-r from-fuchsia-600 to-amber-500 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:from-fuchsia-700 hover:to-amber-600 disabled:opacity-50 transition-all"
        >
          {isScanning ? (
            <>
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              <span>Scanning...</span>
            </>
          ) : (
            <span>Scan QR Code</span>
          )}
        </button>

        <p className="text-xs text-gray-500 mt-6">
          This is a placeholder UI. In a real application, this would open a camera to scan a QR code.
        </p>
      </div>
    </div>
  );
};

export default QRLogin;