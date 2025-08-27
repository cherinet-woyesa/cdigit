
import { useLocation } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';
import { submitWithdrawal } from '../../../services/withdrawalService';

export default function WithdrawalConfirmation() {
  const { state } = useLocation() as { state?: any };
  const [serverData, setServerData] = useState<any>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);


  // Default values in case of direct access (shouldn't happen in normal flow)
  const confirmationData = state || {
    referenceId: 'WD-87654321',
    accountNumber: '2000XXXXXX8910',
    amount: '25,000.00 ETB',
    branch: 'Abiy Branch',
    token: '7319',
    window: '5',
    message: 'Withdrawal submitted successfully.'
  };


  // Compose values from all possible sources, prioritizing backend response (including .data)
  const data = serverData?.data || serverData || {};
  const referenceId = data.formReferenceId || data.referenceId || data.ReferenceId || state?.referenceId || state?.ui?.referenceId || confirmationData.referenceId;
  const branch = serverData?.branch || serverData?.Branch || state?.branch || state?.ui?.branch || confirmationData.branch;
  const accountNumber = (data.accountNumber || data.AccountNumber || state?.ui?.accountNumber || confirmationData.accountNumber || '').toString();
  const accountHolderName = data.accountHolderName || data.accountHolderName || '';
  const amountValueRaw = data.Withdrawal_Amount ?? data.withdrawa_Amount ?? data.amount ?? data.Amount;
  const amount = (amountValueRaw !== undefined && !isNaN(Number(amountValueRaw)) && Number(amountValueRaw) > 0)
    ? `${Number(amountValueRaw).toLocaleString()}.00 ETB`
    : (state?.ui?.amount || confirmationData.amount);
  const token = (data.tokenNumber || data.TokenNumber || data.token || data.Token || state?.token || confirmationData.token) as string;
  const queueNumber = data.queueNumber || data.QueueNumber;
  const windowValue = (data.windowNumber || data.WindowNumber || state?.window || confirmationData.window) as string | number;

  useEffect(() => {
    const runSubmit = async () => {
      if (!state?.pending || !state?.requestPayload) return;
      setSubmitting(true);
      setError('');
      try {
        const res = await submitWithdrawal(state.requestPayload);
        setServerData(res);
      } catch (e: any) {
        setError(e?.message || 'Failed to submit withdrawal.');
      } finally {
        setSubmitting(false);
      }
    };
    runSubmit();
  }, [state]);

  return (
    <div className="min-h-screen bg-[#f5f0ff] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-fuchsia-200">
        {/* Header */}
        <div className="bg-fuchsia-700 p-6 text-center text-white">
          <CheckCircleIcon className="h-16 w-16 mx-auto text-fuchsia-200" />
          <h1 className="text-2xl font-bold mt-4">Withdrawal Submitted Successfully!</h1>
          <p className="text-fuchsia-100 mt-2">{serverData?.message || confirmationData.message || 'Please proceed to the counter with your token'}</p>
        </div>

        {/* Confirmation Details */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-fuchsia-800 border-b border-fuchsia-100 pb-2">
              Transaction Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-fuchsia-600">Reference ID:</p>
                <p className="font-medium">{referenceId}</p>
              </div>
              <div>
                <p className="text-sm text-fuchsia-600">Branch:</p>
                <p className="font-medium">{branch}</p>
              </div>
              <div>
                <p className="text-sm text-fuchsia-600">Account Number:</p>
                <p className="font-medium">{accountNumber}</p>
              </div>
              <div>
                <p className="text-sm text-fuchsia-600">Account Holder Name:</p>
                <p className="font-medium">{data.accountHolderName || data.AccountHolderName || ''}</p>
              </div>
              <div>
                <p className="text-sm text-fuchsia-600">Amount:</p>
                <p className="font-medium">{amount}</p>
              </div>
            </div>
          </div>

          {/* Queue Number & Token Display */}
          <div className="flex flex-col md:flex-row gap-4 mt-2">
            {/* On mobile, stack vertically. On desktop, side by side. */}
            <div className="flex-1 bg-fuchsia-50 rounded-lg p-4 border border-fuchsia-100 flex flex-col items-center justify-center">
              <p className="text-sm text-fuchsia-600">Your Queue Number</p>
              <p className="text-6xl font-extrabold text-fuchsia-700 my-2 tracking-widest drop-shadow-lg">{queueNumber ?? 'N/A'}</p>
            </div>
            <div className="flex-1 bg-fuchsia-50 rounded-lg p-4 border border-fuchsia-100 flex flex-col items-center justify-center">
              <p className="text-sm text-fuchsia-600">Your Token Number</p>
              <p className="text-base font-bold text-fuchsia-700 my-2">{token}</p>
              {windowValue && windowValue !== 'N/A' && (
                <p className="text-fuchsia-700 font-medium">
                  Proceed to Window: <span className="text-2xl">{windowValue}</span>
                </p>
              )}
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

          {/* Backend Raw Data (for debugging/confirmation) */}
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
            {serverData?.data && (
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-700 break-all">
                <div className="mb-1 font-semibold text-fuchsia-700">Backend Response:</div>
                <pre className="whitespace-pre-wrap">{JSON.stringify(serverData.data, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}