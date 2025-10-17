import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCodeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white shadow-lg rounded-2xl p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-fuchsia-100 mb-6">
          <QrCodeIcon className="h-16 w-16 text-fuchsia-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Login with QR Code</h1>
        <p className="text-gray-600 mb-6">Scan a QR code from your mobile app or a link sent via SMS to log in instantly.</p>
        
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="w-full bg-fuchsia-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-fuchsia-700 disabled:bg-fuchsia-400 transition-all"
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

        <p className="text-xs text-gray-400 mt-6">
          This is a placeholder UI. In a real application, this would open a camera to scan a QR code.
        </p>
      </div>
    </div>
  );
};

export default QRLogin;
