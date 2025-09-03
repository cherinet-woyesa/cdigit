import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { submitWithdrawal, cancelWithdrawalByCustomer } from '../../../services/withdrawalService';
import { CheckCircleIcon, PrinterIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useReactToPrint } from 'react-to-print';

export default function WithdrawalConfirmation() {
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    const [serverData, setServerData] = useState<any>(null);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(true); // Start in submitting state

    useEffect(() => {
        const runSubmit = async () => {
            if (!state?.pending || !state?.requestPayload) {
                setError('Invalid request state. Please start over.');
                setSubmitting(false);
                return;
            }
            try {
                const res = await submitWithdrawal(state.requestPayload);
                setServerData(res);
            } catch (e: any) {
                setError(e?.message || 'Failed to submit withdrawal. Please try again.');
            } finally {
                setSubmitting(false);
            }
        };
        runSubmit();
    }, [state]);

    const componentToPrintRef = useRef(null);
    const handlePrint = useReactToPrint({
        // @ts-ignore
        content: () => componentToPrintRef.current,
    });

    if (submitting) {
        return (
            <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <ArrowPathIcon className="h-16 w-16 mx-auto text-fuchsia-600 animate-spin" />
                <h1 className="text-2xl font-bold text-fuchsia-800 mt-4">Processing Withdrawal...</h1>
                <p className="text-gray-600 mt-2">Please wait a moment.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-lg text-center">
                    <ExclamationTriangleIcon className="h-20 w-20 mx-auto text-red-500" />
                    <h1 className="text-3xl font-extrabold text-red-700 mt-4">Submission Failed</h1>
                    <p className="text-gray-600 mt-2">{error}</p>
                    <div className="mt-8">
                        <button onClick={() => navigate('/form/cash-withdrawal')} className="flex items-center justify-center gap-2 w-full sm:w-auto bg-fuchsia-700 text-white px-8 py-3 rounded-lg shadow-md hover:bg-fuchsia-800 transition">
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const data = serverData?.data || {};
    const uiData = state?.ui || {};
    const referenceId = data.formReferenceId || data.referenceId || uiData.referenceId || 'N/A';
    const branch = data.branch || uiData.branch || 'N/A';
    const accountNumber = data.accountNumber || uiData.accountNumber || 'N/A';
    const accountHolderName = data.accountHolderName || uiData.accountHolderName || 'N/A';
    const amount = uiData.amount || (data.withdrawal_Amount ? `${Number(data.withdrawal_Amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB` : 'N/A');
    const token = (data.tokenNumber || data.TokenNumber)?.toString() || 'N/A';
    const queueNumber = (data.queueNumber || data.QueueNumber)?.toString() || 'N/A';

    return (
        <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
            <div ref={componentToPrintRef} className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-lg text-center">
                <CheckCircleIcon className="h-20 w-20 mx-auto text-green-500" />
                <h1 className="text-3xl font-extrabold text-fuchsia-800 mt-4">Success!</h1>
                <p className="text-gray-600 mt-2">Your withdrawal has been submitted. Please see your token and queue number below.</p>

                <div className="my-8 flex flex-col md:flex-row gap-4 justify-center text-white">
                    <div className="flex-1 bg-fuchsia-700 p-6 rounded-xl shadow-lg text-center">
                        <p className="text-lg font-semibold text-fuchsia-100">Queue Number</p>
                        <p className="text-7xl font-bold tracking-wider">{queueNumber}</p>
                    </div>
                    <div className="flex-1 bg-fuchsia-600 p-6 rounded-xl shadow-lg text-center">
                        <p className="text-lg font-semibold text-fuchsia-100">Token</p>
                        <p className="text-7xl font-bold tracking-wider">{token}</p>
                    </div>
                </div>

                <div className="text-left bg-gray-50 p-6 rounded-lg shadow-inner">
                    <h3 className="text-xl font-bold text-fuchsia-700 mb-4">Summary</h3>
                    <div className="space-y-2 text-gray-700">
                        <div className="flex justify-between"><strong className="font-medium">Reference ID:</strong> <span>{referenceId}</span></div>
                        <div className="flex justify-between"><strong className="font-medium">Account:</strong> <span>{accountHolderName} ({accountNumber})</span></div>
                        <div className="flex justify-between"><strong className="font-medium">Amount:</strong> <span className="font-bold text-fuchsia-800">{amount}</span></div>
                        <div className="flex justify-between"><strong className="font-medium">Branch:</strong> <span>{branch}</span></div>
                    </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={() => navigate('/form/cash-withdrawal')} className="flex items-center justify-center gap-2 w-full sm:w-auto bg-fuchsia-700 text-white px-8 py-3 rounded-lg shadow-md hover:bg-fuchsia-800 transition transform hover:scale-105">
                        <ArrowPathIcon className="h-5 w-5" />
                        New Withdrawal
                    </button>
                    <button onClick={handlePrint} className="flex items-center justify-center gap-2 w-full sm:w-auto bg-gray-200 text-fuchsia-800 px-8 py-3 rounded-lg shadow-md hover:bg-gray-300 transition transform hover:scale-105">
                        <PrinterIcon className="h-5 w-5" />
                        Print
                    </button>
                    <button
                        onClick={async () => {
                            setSubmitting(true);
                            setError('');
                            try {
                                navigate('/form/cash-withdrawal', { state: { updateId: data.id || data.Id } });
                            } catch (e: any) {
                                setError(e?.message || 'Failed to update withdrawal.');
                            } finally {
                                setSubmitting(false);
                            }
                        }}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto bg-yellow-500 text-white px-8 py-3 rounded-lg shadow-md hover:bg-yellow-600 transition transform hover:scale-105"
                        disabled={submitting}
                    >
                        Update
                    </button>
                    <button
                        onClick={async () => {
                            setSubmitting(true);
                            setError('');
                            try {
                                await cancelWithdrawalByCustomer(data.id || data.Id);
                                navigate('/form/cash-withdrawal', { state: { cancelled: true } });
                            } catch (e: any) {
                                setError(e?.message || 'Failed to cancel withdrawal.');
                            } finally {
                                setSubmitting(false);
                            }
                        }}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto bg-red-600 text-white px-8 py-3 rounded-lg shadow-md hover:bg-red-700 transition transform hover:scale-105"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                </div>

                <p className="text-sm text-gray-500 mt-6">Thank you for banking with us!</p>
            </div>
        </div>
    );
}