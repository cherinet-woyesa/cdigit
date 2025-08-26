import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CheckBadgeIcon, QrCodeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/solid'
import { submitWithdrawal } from '../../../services/withdrawalService'

export default function WithdrawalConfirmation() {
  const { state } = useLocation() as { state?: any }
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [serverData, setServerData] = useState<any>(null)
  
  // Default values if accessed directly (shouldn't happen in normal flow)
  const confirmationData = state || {
    referenceId: 'WD-87654321',
    accountNumber: '2000XXXXXX8910',
    amount: '25,000.00 ETB',
    branch: 'Abiy Branch',
    token: '7319',
    window: '5',
    message: 'Withdrawal submitted successfully.'
  }

  const displayAccount = (serverData?.accountNumber || state?.ui?.accountNumber || confirmationData.accountNumber || '').toString()
  const maskedAccount = displayAccount.replace(/.(?=.{4})/g, '•')
  const tokenValue = (serverData?.TokenNumber || serverData?.tokenNumber || state?.token || confirmationData.token) as string
  const windowValue = (serverData?.windowNumber || serverData?.QueueNumber || state?.window || confirmationData.window) as string | number
  const amountValueRaw = serverData ? (serverData.Withdrawal_Amount ?? serverData.withdrawa_Amount) : undefined
  const amountText = (amountValueRaw !== undefined && !isNaN(Number(amountValueRaw)) && Number(amountValueRaw) > 0)
    ? `${Number(amountValueRaw).toLocaleString()}.00 ETB`
    : (state?.ui?.amount || confirmationData.amount)

  // Fix: get referenceId and branch from all possible sources, including state.ui
  const referenceId = serverData?.referenceId || state?.referenceId || state?.ui?.referenceId || confirmationData.referenceId;
  const branch = serverData?.branch || state?.branch || state?.ui?.branch || confirmationData.branch;

  useEffect(() => {
    const runSubmit = async () => {
      if (!state?.pending || !state?.requestPayload) return
      setSubmitting(true)
      setError('')
      try {
        const res = await submitWithdrawal(state.requestPayload)
        setServerData(res)
      } catch (e: any) {
        setError(e?.message || 'Failed to submit withdrawal.')
      } finally {
        setSubmitting(false)
      }
    }
    runSubmit()
  }, [state])

  return (
    <div className="min-h-screen bg-gradient-to-b from-fuchsia-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-fuchsia-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-fuchsia-700 to-fuchsia-600 p-8 text-center text-white relative">
          <div className="absolute top-4 right-4 bg-fuchsia-800 text-xs px-2 py-1 rounded-full">
            Completed
          </div>
          <CheckBadgeIcon className="h-16 w-16 mx-auto text-fuchsia-200" />
          <h1 className="text-2xl font-bold mt-4">Withdrawal Request Confirmed!</h1>
          <p className="text-fuchsia-100 mt-2">{serverData?.message || confirmationData.message || 'Your token number is ready'}</p>
        </div>

        {/* Confirmation Details */}
        <div className="p-6 space-y-6">
          {/* Token Display */}
          <div className="bg-gradient-to-r from-fuchsia-50 to-white rounded-xl p-6 border-2 border-fuchsia-200 text-center relative overflow-hidden">
            <div className="absolute -top-4 -right-4 text-fuchsia-100 opacity-30">
              <QrCodeIcon className="h-24 w-24" />
            </div>
            <p className="text-sm text-fuchsia-600 font-medium">YOUR TOKEN NUMBER</p>
            <p className="text-5xl font-bold text-fuchsia-700 my-3 tracking-wider">{tokenValue}</p>
            <div className="inline-flex items-center bg-fuchsia-100 text-fuchsia-700 px-4 py-1 rounded-full text-sm font-medium">
              <DevicePhoneMobileIcon className="h-4 w-4 mr-1" />
              Window: {windowValue ?? 'N/A'}
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-fuchsia-800 border-b border-fuchsia-100 pb-2">
              Transaction Summary
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-fuchsia-600">Reference ID:</p>
                <p className="font-medium break-all">{referenceId}</p>
              </div>
              <div>
                <p className="text-sm text-fuchsia-600">Branch:</p>
                <p className="font-medium">{branch}</p>
              </div>
              <div>
                <p className="text-sm text-fuchsia-600">Account Number:</p>
                <p className="font-medium">{maskedAccount}</p>
              </div>
              <div>
                <p className="text-sm text-fuchsia-600">Amount:</p>
                <p className="font-medium">{amountText}</p>
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
              <li>Proceed to <strong>Window {windowValue ?? 'N/A'}</strong></li>
              <li>Present your <strong>valid ID</strong> to the teller</li>
              <li>Provide your <strong>token number</strong> when asked</li>
              <li>Collect your cash and receipt</li>
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
              <li>For security, this request cannot be modified</li>
              <li>You'll receive SMS confirmation after processing</li>
            </ul>
          </div>

          {/* Errors */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-white border border-fuchsia-600 text-fuchsia-700 font-medium py-2 px-4 rounded-lg hover:bg-fuchsia-50 transition flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
              </svg>
              Print
            </button>
            <button
              onClick={() => navigator.share?.({
                title: 'CBE Withdrawal Token',
                text: `My CBE withdrawal token is ${confirmationData.token} for window ${confirmationData.window}`,
              })}
              className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              {submitting ? 'Submitting...' : 'Share'}
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