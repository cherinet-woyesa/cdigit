// components/QRCodeGenerator.tsx
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { fetchBranches } from '../../services/branchService';
import type { Branch } from '../../services/branchService';
import { 
  ArrowDownTrayIcon, 
  QrCodeIcon, 
  DocumentDuplicateIcon,
  ChartBarIcon,
  ArrowPathIcon
  
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

interface QRSession {
  qrSessionId: string;
  expiresAt: string;
  qrUrl: string;
  scanCount?: number;
  lastScanned?: string;
}

const QRCodeGenerator: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrContent, setQrContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [qrSession, setQrSession] = useState<QRSession | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      generateDynamicQRCode(selectedBranch);
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

  const generateDynamicQRCode = async (branch: Branch) => {
    setIsLoading(true);
    try {
      // 1. Create dynamic QR session
      const sessionResponse = await fetch('/api/qr-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branchId: branch.id,
          type: 'queue-join',
          metadata: {
            branchName: branch.name,
            branchCode: branch.code,
            address: branch.address,
            phone: branch.phone
          }
        }),
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create QR session');
      }

      const sessionData: QRSession = await sessionResponse.json();
      setQrSession(sessionData);

      // 2. Generate QR code with dynamic URL
      const qrUrl = await QRCode.toDataURL(sessionData.qrUrl, {
        width: 400,
        margin: 3,
        color: {
          dark: '#d97706', // Amber color
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' // High error correction
      });

      setQrCodeUrl(qrUrl);
      setQrContent(sessionData.qrUrl);
      
      // 3. Load initial analytics
      fetchAnalytics(sessionData.qrSessionId);

      toast.success(`Dynamic QR code generated for ${branch.name}`);

    } catch (error) {
      console.error('Failed to generate dynamic QR code:', error);
      toast.error('Failed to generate QR code');
      
      // Fallback to static QR if dynamic fails
      await generateStaticQRCode(branch);
    } finally {
      setIsLoading(false);
    }
  };

  const generateStaticQRCode = async (branch: Branch) => {
    // Fallback static QR (secure version)
    const staticData = `https://cbe-digital.com/branch/${branch.code}`;
    
    try {
      const qrUrl = await QRCode.toDataURL(staticData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#d97706', // Amber color
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(qrUrl);
      setQrContent(staticData);
      setQrSession(null);
      
      toast.info('Using static QR code (fallback mode)');
    } catch (error) {
      console.error('Static QR generation failed:', error);
      toast.error('QR generation failed');
    }
  };

  const fetchAnalytics = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/qr-sessions?sessionId=${sessionId}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const refreshQRCode = async () => {
    if (selectedBranch) {
      await generateDynamicQRCode(selectedBranch);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl || !selectedBranch) return;

    const link = document.createElement('a');
    link.download = `cbe-${selectedBranch.code}-qrcode-${Date.now()}.png`;
    link.href = qrCodeUrl;
    link.click();
    toast.success(`QR code for ${selectedBranch.name} downloaded`);
  };

  const copyQRContent = async () => {
    try {
      await navigator.clipboard.writeText(qrContent);
      toast.success('QR code URL copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = qrContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('QR code URL copied to clipboard');
    }
  };

  const printQRCode = () => {
    if (!qrCodeUrl || !selectedBranch) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const expirationDate = qrSession?.expiresAt 
        ? new Date(qrSession.expiresAt).toLocaleDateString()
        : 'No expiration';

      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - ${selectedBranch.name}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 40px; 
                background: white;
              }
              .branch-info { 
                margin-bottom: 20px; 
                color: #d97706;
              }
              .instructions { 
                margin-top: 30px; 
                font-size: 14px; 
                color: #666; 
              }
              .expiry {
                color: #dc2626;
                font-size: 12px;
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="branch-info">
              <h1>${selectedBranch.name}</h1>
              <p><strong>Code:</strong> ${selectedBranch.code}</p>
              <p><strong>Address:</strong> ${selectedBranch.address || 'N/A'}</p>
              <p class="expiry"><strong>Expires:</strong> ${expirationDate}</p>
            </div>
            <img src="${qrCodeUrl}" alt="QR Code for ${selectedBranch.name}" style="max-width: 300px;">
            <div class="instructions">
              <p>Scan this QR code with CBE Digital App to join queue</p>
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
    <div className="min-h-screen bg-amber-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <QrCodeIcon className="h-8 w-8 text-amber-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dynamic Branch QR Code Generator</h1>
                <p className="text-gray-600">Generate trackable QR codes for branch queue management</p>
              </div>
            </div>
            {qrSession && (
              <div className="flex items-center space-x-2 bg-amber-100 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-amber-700 text-sm font-medium">Dynamic QR</span>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Branch Selection & Analytics */}
            <div className="space-y-6">
              {/* Branch Selection */}
              <div className="bg-amber-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Select Branch</h2>
                <select
                  value={selectedBranch?.id || ''}
                  onChange={(e) => {
                    const branch = branches.find(b => b.id === e.target.value);
                    if (branch) setSelectedBranch(branch);
                  }}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                <div className="bg-amber-100 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-900 mb-2">Branch Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedBranch.name}</div>
                    <div><strong>Code:</strong> {selectedBranch.code}</div>
                    {selectedBranch.address && (
                      <div><strong>Address:</strong> {selectedBranch.address}</div>
                    )}
                    {selectedBranch.phone && (
                      <div><strong>Phone:</strong> {selectedBranch.phone}</div>
                    )}
                  </div>
                </div>
              )}

              {/* QR Session Analytics */}
              {qrSession && (
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-amber-900">QR Analytics</h3>
                    <button
                      onClick={() => fetchAnalytics(qrSession.qrSessionId)}
                      className="text-amber-600 hover:text-amber-800"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div><strong>Session ID:</strong> <code className="text-xs">{qrSession.qrSessionId}</code></div>
                    <div><strong>Expires:</strong> {new Date(qrSession.expiresAt).toLocaleDateString()}</div>
                    {analytics && (
                      <>
                        <div><strong>Scans:</strong> {analytics.scanCount || 0}</div>
                        {analytics.lastScanned && (
                          <div><strong>Last Scan:</strong> {new Date(analytics.lastScanned).toLocaleString()}</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - QR Code Preview */}
            <div>
              <div className="bg-amber-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Dynamic QR Code</h2>
                  <button
                    onClick={refreshQRCode}
                    disabled={isLoading}
                    className="flex items-center text-amber-600 hover:text-amber-800 disabled:opacity-50"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    Refresh
                  </button>
                </div>
                
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                    <p className="mt-3 text-gray-600">Generating dynamic QR code...</p>
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
                    <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Dynamic URL:</span>
                        <button
                          onClick={copyQRContent}
                          className="flex items-center text-xs text-amber-700 hover:text-amber-800"
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
                        className="flex items-center justify-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Download
                      </button>
                      <button
                        onClick={printQRCode}
                        className="px-4 py-2 border border-amber-600 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
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

          {/* Dynamic QR Benefits */}
          <div className="mt-8 p-4 bg-amber-100 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-3">Dynamic QR Code Benefits:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-amber-800">
              <div>
                <h4 className="font-medium mb-2">🎯 Tracking & Analytics</h4>
                <ul className="space-y-1">
                  <li>• Real-time scan count tracking</li>
                  <li>• Last scan timestamp</li>
                  <li>• Usage patterns analysis</li>
                  <li>• Performance metrics</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">🛡️ Security & Control</h4>
                <ul className="space-y-1">
                  <li>• Automatic expiration</li>
                  <li>• Revocable sessions</li>
                  <li>• No sensitive data exposure</li>
                  <li>• Dynamic redirection</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Testing Instructions */}
          <div className="mt-6 p-4 bg-amber-50 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-2">Testing Instructions:</h3>
            <ol className="text-sm text-amber-800 space-y-1">
              <li>1. Generate a dynamic QR code for any branch</li>
              <li>2. Scan with CBE Digital app (will redirect to branch selection)</li>
              <li>3. Check analytics for scan count updates</li>
              <li>4. Refresh QR code to create new session</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;