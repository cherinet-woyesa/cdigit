import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { fetchBranches } from '../../services/branchService';
import type { Branch } from '../../services/branchService';
import { 
  ArrowDownTrayIcon, 
  QrCodeIcon, 
  DocumentDuplicateIcon 
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const QRCodeGenerator: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrContent, setQrContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      generateQRCode(selectedBranch);
    }
  }, [selectedBranch]);

  const loadBranches = async () => {
    try {
      const branchesList = await fetchBranches();
      setBranches(branchesList);
      if (branchesList.length > 0) {
        setSelectedBranch(branchesList[0]);
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
      toast.error('Failed to load branches');
    }
  };

  const generateQRCode = async (branch: Branch) => {
    setIsLoading(true);
    try {
      const qrData = {
        branchId: branch.id,
        branchName: branch.name,
        branchCode: branch.code,
        type: 'cbe_branch',
        timestamp: new Date().toISOString()
      };

      const jsonString = JSON.stringify(qrData);
      setQrContent(jsonString);

      const qrUrl = await QRCode.toDataURL(jsonString, {
        width: 400,
        margin: 2,
        color: {
          dark: '#701a75',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl || !selectedBranch) return;

    const link = document.createElement('a');
    link.download = `cbe-${selectedBranch.code}-qrcode.png`;
    link.href = qrCodeUrl;
    link.click();
    toast.success(`QR code for ${selectedBranch.name} downloaded`);
  };

  const copyQRContent = async () => {
    try {
      await navigator.clipboard.writeText(qrContent);
      toast.success('QR code content copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = qrContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('QR code content copied to clipboard');
    }
  };

  const printQRCode = () => {
    if (!qrCodeUrl) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - ${selectedBranch?.name}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 40px; 
              }
              .branch-info { 
                margin-bottom: 20px; 
              }
              .instructions { 
                margin-top: 30px; 
                font-size: 14px; 
                color: #666; 
              }
            </style>
          </head>
          <body>
            <div class="branch-info">
              <h1>${selectedBranch?.name}</h1>
              <p><strong>Code:</strong> ${selectedBranch?.code}</p>
              <p><strong>Address:</strong> ${selectedBranch?.address || 'N/A'}</p>
            </div>
            <img src="${qrCodeUrl}" alt="QR Code for ${selectedBranch?.name}" style="max-width: 300px;">
            <div class="instructions">
              <p>Scan this QR code with CBE Digital App to select this branch</p>
              <p><small>Generated on ${new Date().toLocaleDateString()}</small></p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#faf6e9] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <QrCodeIcon className="h-8 w-8 text-fuchsia-700 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Branch QR Code Generator</h1>
                <p className="text-gray-600">Generate QR codes for physical branch display</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Branch Selection */}
            <div>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold mb-3">Select Branch</h2>
                <select
                  value={selectedBranch?.id || ''}
                  onChange={(e) => {
                    const branch = branches.find(b => b.id === e.target.value);
                    if (branch) setSelectedBranch(branch);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Details */}
              {selectedBranch && (
                <div className="bg-fuchsia-50 rounded-lg p-4">
                  <h3 className="font-semibold text-fuchsia-900 mb-2">Branch Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedBranch.name}</div>
                    <div><strong>Code:</strong> {selectedBranch.code}</div>
                    {selectedBranch.address && (
                      <div><strong>Address:</strong> {selectedBranch.address}</div>
                    )}
                    {selectedBranch.phone && (
                      <div><strong>Phone:</strong> {selectedBranch.phone}</div>
                    )}
                    {selectedBranch.workingHours && (
                      <div><strong>Hours:</strong> {selectedBranch.workingHours}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - QR Code Preview */}
            <div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-center">QR Code</h2>
                
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-700"></div>
                    <p className="mt-3 text-gray-600">Generating QR code...</p>
                  </div>
                ) : qrCodeUrl && selectedBranch ? (
                  <div className="text-center">
                    {/* QR Code Display */}
                    <div className="bg-white p-4 rounded-lg inline-block border-4 border-white shadow-lg">
                      <img 
                        src={qrCodeUrl} 
                        alt={`QR Code for ${selectedBranch.name}`}
                        className="w-64 h-64 mx-auto"
                      />
                    </div>
                    
                    {/* QR Code Content */}
                    <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">QR Content:</span>
                        <button
                          onClick={copyQRContent}
                          className="flex items-center text-xs text-fuchsia-700 hover:text-fuchsia-800"
                        >
                          <DocumentDuplicateIcon className="h-3 w-3 mr-1" />
                          Copy
                        </button>
                      </div>
                      <code className="text-xs bg-white p-2 rounded block text-left overflow-x-auto">
                        {qrContent}
                      </code>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <button
                        onClick={downloadQRCode}
                        className="flex items-center justify-center px-4 py-2 bg-fuchsia-700 text-white rounded-lg hover:bg-fuchsia-800 transition-colors"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Download
                      </button>
                      <button
                        onClick={printQRCode}
                        className="px-4 py-2 border border-fuchsia-700 text-fuchsia-700 rounded-lg hover:bg-fuchsia-50 transition-colors"
                      >
                        Print
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <QrCodeIcon className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                    <p>Select a branch to generate QR code</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">Usage Instructions:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">For Bank Staff:</h4>
                <ul className="space-y-1">
                  <li>• Select a branch from the dropdown</li>
                  <li>• Download or print the QR code</li>
                  <li>• Display QR codes at branch entrances</li>
                  <li>• Place near service desks and waiting areas</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">For Customers:</h4>
                <ul className="space-y-1">
                  <li>• Open CBE Digital app on your phone</li>
                  <li>• Go to branch selection page</li>
                  <li>• Tap "Scan Branch QR Code"</li>
                  <li>• Scan the QR code displayed at the branch</li>
                  <li>• Branch will be automatically selected</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Testing Instructions */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Testing Instructions:</h3>
            <ol className="text-sm text-green-800 space-y-1">
              <li>1. Generate a QR code for any branch</li>
              <li>2. Open the QR code on your computer screen</li>
              <li>3. On your phone, open the CBE Digital app</li>
              <li>4. Go to branch selection and click "Scan Branch QR Code"</li>
              <li>5. Scan the QR code from your computer screen</li>
              <li>6. The branch should be automatically selected</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;