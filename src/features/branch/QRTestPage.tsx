// components/QRTestPage.tsx
import React from 'react';
import QRCodeGenerator from './QRCodeGenerator';

export default function QRTestPage() {
  return (
    <div className="min-h-screen bg-amber-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-amber-700 mb-4">
            🧪 QR Code Testing - Abiy Branch
          </h1>
          
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="bg-amber-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📋 Test Checklist</h3>
              <ul className="space-y-1 text-amber-800">
                <li>✅ Branch ID: d9b1c3f7-4b05-44d3-b58e-9c5a5b4b90f6</li>
                <li>✅ Generate QR code</li>
                <li>✅ Scan with phone camera</li>
                <li>✅ Verify app opens (or redirects)</li>
                <li>✅ Check analytics tracking</li>
              </ul>
            </div>
            
            <div className="bg-amber-100 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📱 Phone Testing Guide</h3>
              <ol className="space-y-1 text-amber-800">
                <li>1. Open camera app on phone</li>
                <li>2. Point at QR code on screen</li>
                <li>3. Tap notification/link that appears</li>
                <li>4. Verify it opens your app/website</li>
              </ol>
            </div>
          </div>
        </div>
        
        <QRCodeGenerator />
      </div>
    </div>
  );
}