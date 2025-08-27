
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import depositService from '../../../services/depositService';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
// import { submitDeposit } from '../../../services/depositService'; // Uncomment if you want to auto-submit on mount


export default function DepositConfirmation() {
  const { state } = useLocation() as { state?: any };
  const [serverData, setServerData] = useState<any>(state?.serverData || null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Default values in case of direct access (shouldn't happen in normal flow)
  const confirmationData = state || {
    referenceId: 'CD-12345678',
    accountNumber: '1000XXXXXX4567',
    amount: '5,000.00 ETB',
    branch: 'Abiy Branch',
    token: '2547',
    window: '3',
    message: 'Deposit submitted successfully.'
  };

  // Compose values from all possible sources, prioritizing backend response (including .data)
  // Use state.serverData?.data if present, else state.data, else serverData?.data, else serverData, else {}
  // Always use .data if present (backend returns { success, message, data })
  // Patch: fallback to state for missing fields if backend returns null/empty
  // Always prefer backend response (serverData.data), fallback to state/serverData only if missing
  let data: any = {};
  if (serverData && serverData.data && Object.keys(serverData.data).length > 0) {
    data = serverData.data;
  } else if (serverData && Object.keys(serverData).length > 0 && !serverData.data) {
    data = serverData;
  } else if (state?.serverData?.data && Object.keys(state.serverData.data).length > 0) {
    data = state.serverData.data;
  } else if (state?.data && Object.keys(state.data).length > 0) {
    data = state.data;
  } else if (state && Object.keys(state).length > 0) {
    data = state;
  } else {
    data = {};
  }

  // On mount, if no serverData but we have a referenceId, fetch from backend
  useEffect(() => {
    const fetchDeposit = async () => {
      if (serverData || error) return;
      // Try to get referenceId from state or confirmationData
      const refId = data.formReferenceId || data.referenceId || data.ReferenceId || state?.referenceId || confirmationData.referenceId;
      if (!refId) return;
      setSubmitting(true);
      setError('');
      try {
        // Try to fetch by referenceId (assuming backend supports it)
        const res = await depositService.getDepositById(refId);
        setServerData(res);
      } catch (e: any) {
        setError(e?.message || 'Failed to fetch deposit confirmation.');
      } finally {
        setSubmitting(false);
      }
    };
    fetchDeposit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const referenceId = data.formReferenceId || data.referenceId || data.ReferenceId || state?.referenceId || confirmationData.referenceId;
  const branch = data.branch || data.Branch || state?.branch || confirmationData.branch;
  const accountNumber = (data.accountNumber || data.AccountNumber || state?.accountNumber || confirmationData.accountNumber || '').toString();
  // Always prefer backend response fields, fallback to state/confirmationData only if missing
  const accountHolderName = data.accountHolderName || data.AccountHolderName || confirmationData.accountHolderName || '';
  const amountValueRaw = data.amount ?? data.Amount ?? confirmationData.amount;
  const amount = (amountValueRaw !== undefined && !isNaN(Number(amountValueRaw)) && Number(amountValueRaw) > 0)
    ? `${Number(amountValueRaw).toLocaleString()}.00 ETB`
    : (typeof amountValueRaw === 'string' ? amountValueRaw : confirmationData.amount);
  const amountInWords = data.amountInWords || data.AmountInWords || confirmationData.amountInWords || '';
  const token = (data.tokenNumber || data.TokenNumber || data.token || data.Token || confirmationData.token) as string;
  const queueNumber = data.queueNumber || data.QueueNumber || confirmationData.queueNumber;

  // If you want to auto-submit on mount, uncomment and implement submitDeposit
  // useEffect(() => {
  //   const runSubmit = async () => {
  //     if (!state?.pending || !state?.requestPayload) return;
  //     setSubmitting(true);
  //     setError('');
  //     try {
  //       const res = await submitDeposit(state.requestPayload);
  //       setServerData(res);
  //     } catch (e: any) {
  //       setError(e?.message || 'Failed to submit deposit.');
  //     } finally {
  //       setSubmitting(false);
  //     }
  //   };
  //   runSubmit();
  // }, [state]);

  return (
    <div className="min-h-screen bg-[#f5f0ff] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-fuchsia-200">
        {/* Header */}
        <div className="bg-fuchsia-700 p-6 text-center text-white">
          <CheckCircleIcon className="h-16 w-16 mx-auto text-fuchsia-200" />
          <h1 className="text-2xl font-bold mt-4">Deposit Submitted Successfully!</h1>
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
                <p className="font-medium">{accountHolderName}</p>
              </div>
              <div>
                <p className="text-sm text-fuchsia-600">Amount:</p>
                <p className="font-medium">{amount}</p>
              </div>
              <div>
                <p className="text-sm text-fuchsia-600">Amount in Words:</p>
                <p className="font-medium">{amountInWords}</p>
              </div>
            </div>
          </div>

          {/* Queue Number & Token Display */}
          <div className="flex flex-col md:flex-row gap-4 mt-2">
            <div className="flex-1 bg-fuchsia-50 rounded-lg p-4 border border-fuchsia-100 flex flex-col items-center justify-center">
              <p className="text-sm text-fuchsia-600">Your Queue Number</p>
              <p className="text-6xl font-extrabold text-fuchsia-700 my-2 tracking-widest drop-shadow-lg">{queueNumber ?? 'N/A'}</p>
            </div>
            <div className="flex-1 bg-fuchsia-50 rounded-lg p-4 border border-fuchsia-100 flex flex-col items-center justify-center">
              <p className="text-sm text-fuchsia-600">Your Token Number</p>
              <p className="text-base font-bold text-fuchsia-700 my-2">{token}</p>
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