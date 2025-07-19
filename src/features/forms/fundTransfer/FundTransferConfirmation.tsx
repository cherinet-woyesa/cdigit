import { useLocation } from 'react-router-dom'
import { CheckBadgeIcon, QrCodeIcon, DevicePhoneMobileIcon, ArrowDownTrayIcon, ShareIcon } from '@heroicons/react/24/solid'

export default function FundTransferConfirmation() {
  const { state } = useLocation()
  
  // Default values if accessed directly
  const confirmationData = state || {
    referenceId: 'FT-87654321',
    debitAccount: '1000XXXXXX4567',
    creditAccount: '2000XXXXXX8910',
    amount: '15,000.00 ETB',
    branch: 'Main Branch',
    token: '4826',
    window: '2'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-purple-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-600 p-8 text-center text-white relative">
          <div className="absolute top-4 right-4 bg-purple-800 text-xs px-2 py-1 rounded-full">
            Completed
          </div>
          <CheckBadgeIcon className="h-16 w-16 mx-auto text-purple-200" />
          <h1 className="text-2xl font-bold mt-4">Transfer Request Confirmed!</h1>
          <p className="text-purple-100 mt-2">Your token number is ready</p>
        </div>

        {/* Confirmation Details */}
        <div className="p-6 space-y-6">
          {/* Token Display */}
          <div className="bg-gradient-to-r from-purple-50 to-white rounded-xl p-6 border-2 border-purple-200 text-center relative overflow-hidden">
            <div className="absolute -top-4 -right-4 text-purple-100 opacity-30">
              <QrCodeIcon className="h-24 w-24" />
            </div>
            <p className="text-sm text-purple-600 font-medium">YOUR TOKEN NUMBER</p>
            <p className="text-5xl font-bold text-purple-700 my-3 tracking-wider">{confirmationData.token}</p>
            <div className="inline-flex items-center bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-medium">
              <DevicePhoneMobileIcon className="h-4 w-4 mr-1" />
              Window: {confirmationData.window}
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-purple-800 border-b border-purple-100 pb-2">
              Transaction Summary
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Reference ID:</span>
                <span className="font-medium">{confirmationData.referenceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Branch:</span>
                <span className="font-medium">{confirmationData.branch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">From Account:</span>
                <span className="font-medium">{confirmationData.debitAccount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">To Account:</span>
                <span className="font-medium">{confirmationData.creditAccount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">{confirmationData.amount}</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
              NEXT STEPS
            </h3>
            <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
              <li>Proceed to <strong>Window {confirmationData.window}</strong></li>
              <li>Present your <strong>valid ID</strong> to the teller</li>
              <li>Provide your <strong>token number</strong> when asked</li>
              <li>Confirm transfer details with the teller</li>
            </ol>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              IMPORTANT NOTES
            </h3>
            <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
              <li>Token expires in <strong>30 minutes</strong></li>
              <li>You must present <strong>original ID</strong> - copies not accepted</li>
              <li>Transfers may take up to <strong>24 hours</strong> to reflect</li>
              <li>You'll receive SMS confirmation when processed</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-white border border-purple-600 text-purple-700 font-medium py-2 px-4 rounded-lg hover:bg-purple-50 transition flex items-center justify-center"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-1" />
              Save
            </button>
            <button
              onClick={() => navigator.share?.({
                title: 'CBE Transfer Token',
                text: `My CBE transfer token is ${confirmationData.token} for window ${confirmationData.window}`,
              })}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition flex items-center justify-center"
            >
              <ShareIcon className="h-5 w-5 mr-1" />
              Share
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            Thank you for banking with Commercial Bank of Ethiopia
          </p>
        </div>
      </div>
    </div>
  )
}