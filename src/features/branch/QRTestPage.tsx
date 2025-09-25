import React, { useState } from 'react';
import QRCode from 'qrcode';
import { useNavigate } from 'react-router-dom';

const QRTestPage: React.FC = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [branchId, setBranchId] = useState<string>('branch-001');
  const [branchName, setBranchName] = useState<string>('CBE Test Branch');
  const navigate = useNavigate();

  const generateTestQRCode = async () => {
    try {
      const qrData = JSON.stringify({
        branchId: branchId,
        branchName: branchName,
        type: 'cbe_branch',
        timestamp: new Date().toISOString()
      });

      const url = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#701a75',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const goToBranchSelection = () => {
    navigate('/branch-selection');
  };

  return (
    <div className="min-h-screen bg-[#faf6e9] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          QR Code Test Page
        </h1>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch ID
            </label>
            <input
              type="text"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
              placeholder="Enter branch ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch Name
            </label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
              placeholder="Enter branch name"
            />
          </div>

          <button
            onClick={generateTestQRCode}
            className="w-full py-3 bg-fuchsia-700 text-white rounded-lg hover:bg-fuchsia-800 transition-colors"
          >
            Generate Test QR Code
          </button>
        </div>

        {qrCodeUrl && (
          <div className="text-center border-t pt-6">
            <h2 className="text-lg font-semibold mb-3">Test QR Code</h2>
            <img 
              src={qrCodeUrl} 
              alt="Test QR Code" 
              className="mx-auto border-4 border-white shadow-md rounded-lg"
            />
            <p className="text-sm text-gray-600 mt-3">
              Scan this QR code with the branch selection page
            </p>
            
            <div className="mt-4 space-y-2">
              <button
                onClick={goToBranchSelection}
                className="w-full py-2 border border-fuchsia-700 text-fuchsia-700 rounded-lg hover:bg-fuchsia-50 transition-colors"
              >
                Go to Branch Selection
              </button>
              
              <button
                onClick={() => window.open(qrCodeUrl, '_blank')}
                className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Open QR Code in New Tab
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Testing Instructions:</h3>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Generate a QR code above</li>
            <li>2. Open this page on your computer</li>
            <li>3. Open the app on your phone</li>
            <li>4. Go to branch selection page</li>
            <li>5. Click "Scan Branch QR Code"</li>
            <li>6. Scan the QR code on your computer screen</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default QRTestPage;