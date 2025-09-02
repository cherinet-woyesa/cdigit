import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo, useRef } from 'react';
import depositService from '../../../services/depositService';
import { CheckCircleIcon, PrinterIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { useReactToPrint } from 'react-to-print';

export default function DepositConfirmation() {
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    const [serverData, setServerData] = useState<any>(state?.serverData || null);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Memoize the data object to prevent re-creation on every render, fixing the infinite loop.
    const data = useMemo(() => {
        // Prioritize serverData.data if available, otherwise use serverData directly
        if (serverData?.data) return serverData.data;
        if (serverData) return serverData;
        // Fallback to state if serverData is not yet set (e.g., initial render)
        if (state?.serverData?.data) return state.serverData.data;
        if (state?.serverData) return state.serverData;
        return {};
    }, [serverData, state]);

    useEffect(() => {
        const fetchDeposit = async () => {
            // Don't fetch if we already have data or an error
            if (data.id || error) return; // Check for data.id instead of serverData
            
            const refId = data.formReferenceId || data.referenceId || data.ReferenceId;
            if (!refId) return;

            setSubmitting(true);
            setError('');
            try {
                const res = await depositService.getDepositById(refId);
                setServerData(res); // Update serverData state with fetched data
            } catch (e: any) {
                setError(e?.message || 'Failed to fetch deposit confirmation.');
            } finally {
                setSubmitting(false);
            }
        };

        // Only fetch if data.id is not available (meaning serverData was not initially set or was empty)
        if (!data.id) {
            fetchDeposit();
        }
    }, [data, error]); // Now `data` is stable thanks to useMemo

    const branchName = state?.branchName || 'N/A'; // Get branch name from state
    const accountNumber = (data.accountNumber || data.AccountNumber || state?.accountNumber || 'N/A').toString();
    const accountHolderName = data.accountHolderName || data.AccountHolderName || state?.accountHolderName || 'N/A';
    const amountValueRaw = data.amount ?? data.Amount ?? state?.amount;
    const amount = !isNaN(Number(amountValueRaw)) ? `${Number(amountValueRaw).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB` : String(amountValueRaw || '0.00');
    const token = (data.tokenNumber || data.TokenNumber || data.token || data.Token || 'N/A')?.toString();
    const queueNumber = (data.queueNumber || data.QueueNumber || 'N/A')?.toString();

    const componentToPrintRef = useRef(null);
    const handlePrint = useReactToPrint({
        // @ts-ignore
        content: () => componentToPrintRef.current,
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div ref={componentToPrintRef} className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-lg text-center">
                <header className="bg-fuchsia-700 text-white py-5 px-6 shadow-lg rounded-t-2xl -mt-8 -mx-8 mb-8">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-white">Deposit Confirmation</h1>
                    </div>
                </header>
                <CheckCircleIcon className="h-20 w-20 mx-auto text-green-500" />
                <h1 className="text-3xl font-extrabold text-fuchsia-800 mt-4">Success!</h1>
                <p className="text-gray-600 mt-2">Your deposit has been submitted. Please see your token and queue number below.</p>

                <div className="my-8 flex flex-col md:flex-row gap-4 justify-center text-white">
                    <div className="flex-1 bg-fuchsia-700 p-6 rounded-xl shadow-lg text-center">
                        <p className="text-lg font-semibold text-fuchsia-100">Queue Number</p>
                        <p className="text-7xl font-bold tracking-wider">{data.queueNumber || '-'}</p>
                    </div>
                    <div className="flex-1 bg-fuchsia-600 p-6 rounded-xl shadow-lg text-center">
                        <p className="text-lg font-semibold text-fuchsia-100">Token</p>
                        <p className="text-7xl font-bold tracking-wider">{data.tokenNumber || '-'}</p>
                    </div>
                </div>

                <div className="text-left bg-gray-50 p-6 rounded-lg shadow-inner">
                    <h3 className="text-xl font-bold text-fuchsia-700 mb-4">Summary</h3>
                    <div className="space-y-2 text-gray-700">
                        {/* <div className="flex justify-between"><strong className="font-medium">Reference ID:</strong> <span>{referenceId}</span></div> */}
                        <div className="flex justify-between"><strong className="font-medium">Account:</strong> <span>{accountHolderName} ({accountNumber})</span></div>
                        <div className="flex justify-between"><strong className="font-medium">Amount:</strong> <span className="font-bold text-fuchsia-800">{amount}</span></div>
                        <div className="flex justify-between"><strong className="font-medium">Branch:</strong> <span>{branchName}</span></div>
                    </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={() => navigate('/form/cash-deposit')} className="flex items-center justify-center gap-2 w-full sm:w-auto bg-fuchsia-700 text-white px-8 py-3 rounded-lg shadow-md hover:bg-fuchsia-800 transition transform hover:scale-105">
                        <ArrowPathIcon className="h-5 w-5" />
                        New Deposit
                    </button>
                    <button onClick={handlePrint} className="flex items-center justify-center gap-2 w-full sm:w-auto bg-gray-200 text-fuchsia-800 px-8 py-3 rounded-lg shadow-md hover:bg-gray-300 transition transform hover:scale-105">
                        <PrinterIcon className="h-5 w-5" />
                        Print
                    </button>
                </div>

                <p className="text-sm text-gray-500 mt-6">Thank you for banking with us!</p>
            </div>
        </div>
    );
}
