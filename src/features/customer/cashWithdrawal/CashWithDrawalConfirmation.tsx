import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { submitWithdrawal, getWithdrawalById, type WithdrawalResponse } from '../../../services/withdrawalService';
import { CheckCircleIcon, PrinterIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { useReactToPrint } from 'react-to-print';

type WithdrawalData = {
    id?: string;
    branchId?: string;
    formReferenceId?: string;
    referenceId?: string;
    accountNumber?: string;
    accountHolderName?: string;
    withdrawal_Amount?: number;
    tokenNumber?: string;
    queueNumber?: number;
    remark?: string;
    transactionType?: string;
    status?: string;
    [key: string]: any;
};

export default function WithdrawalConfirmation() {
    const { state } = useLocation() as { state?: any };
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const [serverData, setServerData] = useState<WithdrawalResponse | null>(null);
    const [withdrawalData, setWithdrawalData] = useState<WithdrawalData>({});
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(true);

    const fetchWithdrawal = useCallback(async (withdrawalId: string) => {
        try {
            const response = await getWithdrawalById(withdrawalId);
            setServerData(response);
            if (response.data) {
                setWithdrawalData(prev => ({
                    ...prev,
                    ...response.data,
                    id: response.data?.id || prev.id,
                    formReferenceId: response.data?.formReferenceId || prev.formReferenceId,
                    tokenNumber: response.data?.tokenNumber || prev.tokenNumber,
                    queueNumber: response.data?.queueNumber ?? prev.queueNumber
                }));
            }
        } catch (err: any) {
            console.error('Error fetching withdrawal:', err);
            setError(err?.message || 'Failed to fetch withdrawal details');
        } finally {
            setSubmitting(false);
        }
    }, []);

    useEffect(() => {
        const runSubmit = async () => {
            if (!state?.pending || !state?.requestPayload) {
                // If no pending state but we have an ID, try to fetch the withdrawal
                if (id) {
                    await fetchWithdrawal(id);
                    return;
                }
                setError('Invalid request state. Please start over.');
                setSubmitting(false);
                return;
            }

            try {
                const result = await submitWithdrawal(state.requestPayload);
                setServerData(result);
                if (result.data) {
                    setWithdrawalData(prev => ({
                        ...prev,
                        ...result.data,
                        id: result.data?.id || prev.id,
                        formReferenceId: result.data?.formReferenceId || prev.formReferenceId,
                        tokenNumber: result.data?.tokenNumber || prev.tokenNumber,
                        queueNumber: result.data?.queueNumber ?? prev.queueNumber
                    }));
                }
            } catch (err: any) {
                setError(err?.message || 'Failed to process withdrawal');
                console.error('Withdrawal error:', err);
            } finally {
                setSubmitting(false);
            }
        };
        runSubmit();
    }, [state]);

    const componentToPrintRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        content: () => componentToPrintRef.current,
        pageStyle: `
            @page { 
                size: auto; 
                margin: 10mm 10mm 10mm 10mm; 
            }
            @media print { 
                body { 
                    -webkit-print-color-adjust: exact; 
                    background: white;
                }
                .no-print { 
                    display: none !important; 
                }
                .print-content {
                    padding: 0 !important;
                    margin: 0 !important;
                }
            }
        `,
        documentTitle: 'Withdrawal Confirmation',
        removeAfterPrint: false,
        onAfterPrint: () => console.log('Printed successfully')
    } as any); // Using 'as any' to bypass TypeScript error temporarily

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

    const effectiveData = withdrawalData?.id ? withdrawalData : (serverData?.data || {});

    // Format amount with proper fallback
    const amountValue = effectiveData?.withdrawal_Amount || 
                       (serverData as any)?.Withdrawal_Amount || 
                       (serverData as any)?.withdrawa_Amount;
    const amount = amountValue !== undefined && amountValue !== null
        ? new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'ETB',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number(amountValue))
        : 'N/A';

    // Get token and queue number with proper fallbacks
    const token = effectiveData?.tokenNumber || 
                 (serverData as any)?.tokenNumber || 
                 (serverData as any)?.TokenNumber || 
                 'N/A';
    const queueNumber = effectiveData?.queueNumber?.toString() || 
                       (serverData as any)?.queueNumber?.toString() || 
                       (serverData as any)?.QueueNumber?.toString() || 
                       'N/A';
    const accountNumber = effectiveData?.accountNumber || 
                         (serverData as any)?.accountNumber || 
                         'N/A';
    const accountHolderName = effectiveData?.accountHolderName || 
                             (serverData as any)?.accountHolderName || 
                             'N/A';
    const referenceId = effectiveData?.formReferenceId || 
                       effectiveData?.referenceId || 
                       (serverData as any)?.formReferenceId || 
                       (serverData as any)?.referenceId || 
                       'N/A';

    // If we have server data, show the success message
    if (serverData || withdrawalData.id) {
        // Format amount with proper fallback
        const amount = effectiveData?.withdrawal_Amount !== undefined && effectiveData?.withdrawal_Amount !== null
            ? `${Number(effectiveData.withdrawal_Amount).toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })} ETB`
            : '0.00 ETB';

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div ref={componentToPrintRef} className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-lg text-center">
                    <header className="bg-fuchsia-700 text-white py-5 px-6 shadow-lg rounded-t-2xl -mt-8 -mx-8 mb-8">
                        <div className="max-w-7xl mx-auto flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-white">Withdrawal Confirmation</h1>
                        </div>
                    </header>
                    <CheckCircleIcon className="h-20 w-20 mx-auto text-green-500" />
                    <h1 className="text-3xl font-extrabold text-fuchsia-800 mt-4">Success!</h1>
                    <p className="text-gray-600 mt-2">Your withdrawal request has been submitted. Please see your token and queue number below.</p>

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
                        <h3 className="text-xl font-bold text-fuchsia-700 mb-4">Transaction Summary</h3>
                        <div className="space-y-3 text-gray-700">
                            <div className="flex justify-between">
                                <strong className="font-medium">Account Holder:</strong> 
                                <span className="text-right">{accountHolderName}</span>
                            </div>
                            <div className="flex justify-between">
                                <strong className="font-medium">Account Number:</strong> 
                                <span>{accountNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <strong className="font-medium">Amount:</strong> 
                                <span className="font-bold text-fuchsia-800">{amount}</span>
                            </div>
                            <div className="flex justify-between">
                                <strong className="font-medium">Branch:</strong> 
                                <span>Ayer Tena Branch</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                        <button 
                            onClick={() => navigate('/customer/withdraw')} 
                            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-fuchsia-700 text-white px-8 py-3 rounded-lg shadow-md hover:bg-fuchsia-800 transition transform hover:scale-105"
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                            New Withdrawal
                        </button>
                        <button 
                            onClick={handlePrint} 
                            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-gray-200 text-fuchsia-800 px-8 py-3 rounded-lg shadow-md hover:bg-gray-300 transition transform hover:scale-105"
                        >
                            <PrinterIcon className="h-5 w-5" />
                            Print Receipt
                        </button>
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-6">Thank you for banking with us!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4 text-center">
            <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-lg">
                <ExclamationTriangleIcon className="h-16 w-16 mx-auto text-yellow-500" />
                <h1 className="text-2xl font-bold text-fuchsia-800 mt-4">No Data Available</h1>
                <p className="text-gray-600 mt-2">Please try again or contact support.</p>
                
                <div className="mt-8 flex flex-col space-y-4">
                    <button
                        onClick={() => navigate('/customer/withdraw')}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-fuchsia-700 hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500"
                    >
                        Back to Withdraw
                    </button>
                </div>

                <p className="text-sm text-gray-500 mt-6">Thank you for banking with us!</p>
            </div>
        </div>
    );
}