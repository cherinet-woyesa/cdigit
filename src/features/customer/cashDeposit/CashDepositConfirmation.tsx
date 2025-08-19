import { useLocation } from 'react-router-dom'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

export default function DepositConfirmation() {
  const { state } = useLocation()
  
  // Default values in case of direct access (shouldn't happen in normal flow)
  const confirmationData = state || {
    formType: 'Cash Deposit',
    referenceId: 'CD-12345678',
    accountNumber: '1000XXXXXX4567',
    amount: '5,000.00 ETB',
    branch: 'Abiy Branch',
    token: '2547',
    window: '3'
  }

  return (
    <div className="min-h-screen bg-[#f5f0ff] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-fuchsia-200">
        {/* Header */}
        <div className="bg-fuchsia-700 p-6 text-center text-white">
          <CheckCircleIcon className="h-16 w-16 mx-auto text-fuchsia-200" />
          <h1 className="text-2xl font-bold mt-4">Deposit Submitted Successfully!</h1>
          <p className="text-fuchsia-100 mt-2">Please proceed to the counter with your token</p>
        </div>

        {/* Confirmation Details */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-fuchsia-800 border-b border-fuchsia-100 pb-2">
              Transaction Details
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-fuchsia-600">Reference ID:</p>
                <p className="font-medium">{confirmationData.referenceId}</p>
              </div>
              <div>
                <p className="text-sm text-fuchsia-600">Branch:</p>
                <p className="font-medium">{confirmationData.branch}</p>
              </div>
              <div>
                <p className="text-sm text-fuchsia-600">Account Number:</p>
                <p className="font-medium">{confirmationData.accountNumber}</p>
              </div>
              <div>
                <p className="text-sm text-fuchsia-600">Amount:</p>
                <p className="font-medium">{confirmationData.amount}</p>
              </div>
            </div>
          </div>

          {/* Token Display */}
          <div className="bg-fuchsia-50 rounded-lg p-4 border border-fuchsia-100">
            <div className="text-center">
              <p className="text-sm text-fuchsia-600">Your Token Number</p>
              <p className="text-4xl font-bold text-fuchsia-700 my-2">{confirmationData.token}</p>
              <p className="text-fuchsia-700 font-medium">
                Proceed to Window: <span className="text-2xl">{confirmationData.window ?? 'N/A'}</span>
              </p>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">Important:</h3>
            <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
              <li>This is not a transaction receipt</li>
              <li>Please present your ID at the counter</li>
              <li>Token expires in 30 minutes</li>
              <li>You will receive SMS confirmation after processing</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="pt-4">
            <button
              onClick={() => window.print()}
              className="w-full bg-white border border-fuchsia-600 text-fuchsia-700 font-medium py-2 px-4 rounded-lg hover:bg-fuchsia-50 transition"
            >
              Print Confirmation
            </button>
            <p className="text-center text-xs text-gray-500 mt-4">
              Thank you for choosing Commercial Bank of Ethiopia
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}