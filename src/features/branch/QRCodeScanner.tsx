import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useBranch } from '@context/BranchContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchBranches } from '@services/branch/branchService';
import type { Branch } from '@services/branch/branchService';

interface QRCodeScannerProps {
  onClose: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { setBranch } = useBranch();
  const navigate = useNavigate();

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setScanning(true);
      setError('');

      // Check if camera access is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not available in your browser');
        return;
      }

      // Create QR code scanner
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [],
        },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          handleQRCodeScanned(decodedText);
        },
        (error) => {
          console.log('QR Scan error:', error);
        }
      );
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Failed to start camera. Please check permissions.');
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(error => {
        console.error('Failed to clear scanner:', error);
      });
      scannerRef.current = null;
    }
  };

  const handleQRCodeScanned = async (qrData: string) => {
    try {
      setError('');
      
      // Parse QR code data (expected format: branchId or JSON with branch info)
      let branchId: string;
      
      try {
        // Try to parse as JSON first
        const qrDataObj = JSON.parse(qrData);
        branchId = qrDataObj.branchId || qrDataObj.id || qrData;
      } catch {
        // If not JSON, use the raw data as branch ID
        branchId = qrData;
      }

      if (!branchId) {
        throw new Error('Invalid QR code format');
      }

      // Fetch all branches to find the matching one
      const branches = await fetchBranches();
      const branch = branches.find(b => 
        b.id === branchId || 
        b.code === branchId
        // Removed qrCode property as it doesn't exist in the Branch interface
      );

      if (!branch) {
        throw new Error('Branch not found for this QR code');
      }

      // Save branch to context and localStorage
      localStorage.setItem('selectedBranch', JSON.stringify(branch));
      localStorage.setItem('lastActiveBranchId', branch.id);
      await setBranch(branch);

      toast.success(`Selected branch: ${branch.name}`);
      
      // Navigate to language selection (not directly to OTP login)
      // This ensures the user selects a language before proceeding
      navigate('/language-selection', { 
        state: { fromQR: true, branchId: branch.id },
        replace: true 
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid QR code';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Restart scanner after error
      setTimeout(() => {
        stopScanner();
        startScanner();
      }, 2000);
    }
  };

  const handleManualEntry = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Scan Branch QR Code</h2>
          <p className="text-gray-600 mt-1">Point your camera at the branch QR code</p>
        </div>

        {/* QR Scanner Container */}
        <div id="qr-reader" className="w-full mb-4"></div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Scanning Status */}
        {scanning && !error && (
          <div className="mb-4 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-blue-700 text-sm">Scanning...</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-gray-900 mb-2">How to scan:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Ensure good lighting</li>
            <li>• Hold steady about 6-12 inches away</li>
            <li>• Center the QR code in the frame</li>
            <li>• Allow camera permissions if prompted</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleManualEntry}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Manual Entry
          </button>
          <button
            onClick={startScanner}
            className="flex-1 py-3 px-4 bg-fuchsia-700 text-white rounded-lg hover:bg-fuchsia-800 transition-colors"
          >
            Retry Scan
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;