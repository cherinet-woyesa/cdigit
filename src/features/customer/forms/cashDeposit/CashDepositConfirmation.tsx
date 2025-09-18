import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo, useRef } from 'react';
import depositService from '../../../../services/depositService';
import { CheckCircleIcon, PrinterIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { useReactToPrint } from 'react-to-print';

type DepositData = {
    id?: string;
    formReferenceId?: string;
    referenceId?: string;
    ReferenceId?: string;
    accountNumber?: string;
    accountHolderName?: string;
    amount?: number;
    tokenNumber?: string;
    queueNumber?: number;
    [key: string]: any; // For any additional properties
};

export default function DepositConfirmation() {
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    const [serverData, setServerData] = useState<any>(state?.serverData || null);
    const [localData, setLocalData] = useState<DepositData>(state?.serverData?.data || {});
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const data = useMemo(() => {
        // Correctly handle the nested 'data' key from the API response
        if (serverData?.data) {
            return serverData.data;
        }
        // Fallback to state if serverData is not set, checking for the nested data first
        if (state?.serverData?.data) {
            return state.serverData.data;
        }
        return {};
    }, [serverData, state]);

    useEffect(() => {
        const fetchDeposit = async () => {
            // Don't fetch if we already have data or an error
            if (data.id || error) return;
            
            const refId = data.formReferenceId || data.referenceId || data.ReferenceId || state?.serverData?.data?.id;
            if (!refId) return;

            setSubmitting(true);
            setError('');
            try {
                console.log('Fetching deposit details for ID:', refId);
                const res = await depositService.getDepositById(refId);
                console.log('Received deposit details:', res);
                setServerData(res);
                
                // If we have the data directly in the response, update the local state
                if (res?.data) {
                    setLocalData(prev => ({
                        ...prev,
                        ...res.data,
                        id: res.data.id || prev.id,
                        formReferenceId: res.data.formReferenceId || prev.formReferenceId,
                        tokenNumber: res.data.tokenNumber || prev.tokenNumber,
                        queueNumber: res.data.queueNumber ?? prev.queueNumber
                    }));
                }
            } catch (e: any) {
                console.error('Error fetching deposit:', e);
                setError(e?.message || 'Failed to fetch deposit confirmation.');
            } finally {
                setSubmitting(false);
            }
        };

        // If we have server data in the state, use it directly
        if (state?.serverData?.data) {
            setServerData(state.serverData);
            setLocalData(prev => ({
                ...prev,
                ...state.serverData.data,
                tokenNumber: state.serverData.data.tokenNumber || prev.tokenNumber,
                queueNumber: state.serverData.data.queueNumber ?? prev.queueNumber
            }));
        }
        // Otherwise, fetch the data if we have a reference ID
        else if (state?.pending || !serverData) {
            fetchDeposit();
        }
    }, [state, serverData, error, data.id]);

    // Get the effective data, preferring localData over data from useMemo
    const effectiveData = localData?.id ? localData : (data || {});
    
    // Extract data from server response with proper fallbacks
    const accountNumber = effectiveData?.accountNumber || state?.ui?.accountNumber || 'N/A';
    const accountHolderName = effectiveData?.accountHolderName || state?.ui?.accountHolderName || 'N/A';
    const branchName = state?.branchName || 'Ayer Tena Branch';
    
    // Format amount with proper fallback
    const amountValue = effectiveData?.amount ?? state?.ui?.amount;
    const amount = amountValue !== undefined && amountValue !== null
        ? `${Number(amountValue).toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          })} ETB`
        : '0.00 ETB';
    
    // Get token and queue number from server response with proper fallbacks
    const token = effectiveData?.tokenNumber || serverData?.data?.tokenNumber || 'N/A';
    const queueNumber = effectiveData?.queueNumber?.toString() || serverData?.data?.queueNumber?.toString() || 'N/A';
    
    // Status information for display (commented out as not currently used in UI)
    // const status = data?.status || 'Pending';
    // const transactionType = data?.transactionType || 'Deposit';

    const componentToPrintRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        content: () => componentToPrintRef.current,
        documentTitle: 'Deposit Confirmation',
        onAfterPrint: () => console.log('Print completed'),
        removeAfterPrint: true,
        pageStyle: `
            @page { 
                size: auto; 
                margin: 10mm 10mm 10mm 10mm; 
            }
            @media print { 
                body { 
                    -webkit-print-color-adjust: exact; 
                } 
            }
        `,
        // @ts-ignore - Ignore the type error for the content property
    } as any);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6">
            <div ref={componentToPrintRef} className="max-w-2xl w-full bg-white p-4 sm:p-6 rounded-lg shadow-lg">
                <div className="mb-6 bg-fuchsia-700 text-white p-4 rounded-lg shadow-lg text-center">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Deposit Confirmation</h1>
                </div>
                
                <div className="text-center mb-4">
                    <CheckCircleIcon className="h-14 w-14 mx-auto text-green-500" />
                    <h1 className="text-xl font-extrabold text-fuchsia-800 mt-2">Success!</h1>
                    <p className="text-gray-600 text-sm">Your deposit has been submitted.</p>
                </div>

                <div className="my-4 grid grid-cols-2 gap-3">
                    <div className="bg-fuchsia-700 p-3 rounded-lg shadow text-center">
                        <p className="text-xs font-medium text-fuchsia-100">Queue #</p>
                        <p className="text-3xl font-bold">{queueNumber}</p>
                    </div>
                    <div className="bg-fuchsia-600 p-3 rounded-lg shadow text-center">
                        <p className="text-xs font-medium text-fuchsia-100">Token</p>
                        <p className="text-3xl font-bold">{token}</p>
                    </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg shadow-inner mb-4">
                    <h3 className="text-base font-bold text-fuchsia-700 mb-2">Transaction Summary</h3>
                    <div className="space-y-2 text-sm sm:text-base text-gray-700">
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
                            <span>{branchName}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => navigate('/form/cash-deposit')} 
                        className="flex items-center justify-center gap-1 w-full bg-fuchsia-700 text-white text-sm px-2 py-1.5 rounded-md shadow hover:bg-fuchsia-800 transition"
                    >
                        <ArrowPathIcon className="h-3.5 w-3.5" />
                        New
                    </button>
                    <button 
                        onClick={handlePrint} 
                        className="flex items-center justify-center gap-1 w-full bg-gray-200 text-fuchsia-800 text-sm px-2 py-1.5 rounded-md shadow hover:bg-gray-300 transition"
                    >
                        <PrinterIcon className="h-3.5 w-3.5" />
                        Print
                    </button>
                    <button
                        onClick={async () => {
                            setSubmitting(true);
                            setError('');
                            try {
                                navigate('/form/cash-deposit', { state: { updateId: data.id } });
                            } catch (e: any) {
                                setError(e?.message || 'Failed to update deposit.');
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
                                await depositService.cancelDepositByCustomer(data.id);
                                navigate('/form/cash-deposit', { state: { cancelled: true } });
                            } catch (e: any) {
                                setError(e?.message || 'Failed to cancel deposit.');
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
                {error && <div className="text-red-500 mt-4">{error}</div>}
                <p className="text-sm text-gray-500 mt-6">Thank you for banking with us!</p>
            </div>
        </div>
    );
}

