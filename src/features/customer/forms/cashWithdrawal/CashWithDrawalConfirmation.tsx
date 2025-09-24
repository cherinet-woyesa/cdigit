import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { 
    getWithdrawalById, 
    cancelWithdrawalByCustomer, 
    submitWithdrawal,
    updateWithdrawal,
    type WithdrawalResponse 
} from '../../../../services/withdrawalService';
import { useTranslation } from 'react-i18next';
import { SpeakerWaveIcon } from '@heroicons/react/24/solid';
import { 
    CheckCircleIcon, 
    PrinterIcon, 
    ExclamationTriangleIcon 
} from '@heroicons/react/24/solid';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../../../../context/AuthContext';

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
    const { t, i18n } = useTranslation();
    const { state } = useLocation() as { state?: any };
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const { phone: _phone } = useAuth();
    const [serverData, setServerData] = useState<WithdrawalResponse | null>(null);
    const [withdrawalData, setWithdrawalData] = useState<WithdrawalData>({});
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editAmount, setEditAmount] = useState<number | ''>('');
    const [editRemark, setEditRemark] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

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
            try {
                if (id) {
                    // If we have an ID, fetch the withdrawal details
                    await fetchWithdrawal(id);
                } else if (state?.pending && state?.requestPayload) {
                    // If we have a pending submission, process it
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
                } else {
                    setError('Invalid request state. Please start over.');
                }
            } catch (err: any) {
                setError(err?.message || 'Failed to process withdrawal');
                console.error('Withdrawal error:', err);
            } finally {
                setSubmitting(false);
            }
        };
        
        runSubmit();
    }, [state, id, fetchWithdrawal]);

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

    const handleCancel = async () => {
        if (!id) {
            setError('No withdrawal ID provided');
            return;
        }
        
        if (!window.confirm('Are you sure you want to cancel this withdrawal request?')) {
            return;
        }

        try {
            setIsCancelling(true);
            const response = await cancelWithdrawalByCustomer(id);
            
            if (response.success) {
                setSuccessMessage(response.message || 'Withdrawal request cancelled successfully');
                setShowSuccess(true);
                
                // Show success message for 2 seconds before navigating
                setTimeout(() => {
                    setShowSuccess(false);
                    navigate('/dashboard');
                }, 2000);
            } else {
                setError(response.message || 'Failed to cancel withdrawal');
            }
        } catch (err: any) {
            console.error('Error cancelling withdrawal:', err);
            setError(err?.message || 'Failed to cancel withdrawal');
        } finally {
            setIsCancelling(false);
        }
    };

    const handleUpdate = () => {
        if (!id) return;
        navigate(`/form/cash-withdrawal/${id}/edit`);
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    if (submitting) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (showSuccess) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-lg text-center">
                    <CheckCircleIcon className="h-20 w-20 mx-auto text-green-500" />
                    <h1 className="text-3xl font-extrabold text-green-700 mt-4">Success!</h1>
                    <p className="text-gray-600 mt-2">{successMessage}</p>
                    <div className="mt-8">
                        <button 
                            onClick={handleBackToDashboard}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-fuchsia-700 text-white px-8 py-3 rounded-lg shadow-md hover:bg-fuchsia-800 transition"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
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
                    <div className="mt-8 flex justify-center gap-4">
                        <button 
                            onClick={() => navigate('/form/cash-withdrawal')} 
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-fuchsia-700 text-white rounded-lg hover:bg-fuchsia-800 transition"
                        >
                            Try Again
                        </button>
                        <button 
                            onClick={handleBackToDashboard}
                            className="flex items-center justify-center gap-2 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Consistent value extraction and formatting
    const effectiveData = withdrawalData?.id ? withdrawalData : (serverData?.data || {});

    // Set edit fields when entering edit mode
    const startEdit = () => {
        setEditAmount(Number(effectiveData?.withdrawal_Amount) || 0);
        setEditRemark(effectiveData?.remark || '');
        setEditMode(true);
    };

    const handleEditSave = async () => {
        if (!id) return;
        setIsUpdating(true);
        try {
            const updateData = {
                withdrawal_Amount: Number(editAmount),
                remark: editRemark,
            };
            const result = await updateWithdrawal(id, updateData);
            setSuccessMessage(result.message || 'Withdrawal updated successfully');
            setShowSuccess(true);
            setEditMode(false);
            setTimeout(() => {
                setShowSuccess(false);
                navigate('/dashboard');
            }, 2000);
        } catch (err: any) {
            setError(err?.message || 'Failed to update withdrawal');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleEditCancel = () => {
        setEditMode(false);
    };

    // Speech synthesis utility (if you want to use it in the UI, otherwise remove)
    // const speak = (text: string) => {
    //     if ('speechSynthesis' in window) {
    //         const utterance = new window.SpeechSynthesisUtterance(text);
    //         utterance.lang = i18n.language === 'am' ? 'am-ET' : 'en-US';
    //         window.speechSynthesis.speak(utterance);
    //     }
    // };
    // Always prefer values from navigation state if present and not 'N/A', then from effectiveData/serverData
    const amountValue = (state?.withdrawal_Amount && state?.withdrawal_Amount !== 'N/A')
        ? state.withdrawal_Amount
        : (effectiveData?.withdrawal_Amount ?? (serverData as any)?.Withdrawal_Amount ?? (serverData as any)?.withdrawal_Amount ?? 0);
    const amount = amountValue !== undefined && amountValue !== null
        ? `${Number(amountValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`
        : '0.00 ETB';
    const token = (state?.tokenNumber && state?.tokenNumber !== 'N/A')
        ? state.tokenNumber
        : (effectiveData?.tokenNumber || (serverData as any)?.tokenNumber || (serverData as any)?.TokenNumber || 'N/A');
    const queueNumber = (state?.queueNumber && state?.queueNumber !== 'N/A')
        ? state.queueNumber.toString()
        : (effectiveData?.queueNumber?.toString() || (serverData as any)?.queueNumber?.toString() || (serverData as any)?.QueueNumber?.toString() || (serverData as any)?.data?.queueNumber?.toString() || 'N/A');
    const accountNumber = effectiveData?.accountNumber || (serverData as any)?.accountNumber || 'N/A';
    const accountHolderName = effectiveData?.accountHolderName || (serverData as any)?.accountHolderName || 'N/A';

    // Speech synthesis utility

    // If we have server data, show the success message
    if (serverData || withdrawalData.id) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6">
                <div ref={componentToPrintRef} className="max-w-2xl w-full bg-white rounded-lg shadow-lg">
                    <div className="mb-6 bg-fuchsia-700 text-white rounded-t-lg shadow-lg text-center">
                        <div className="flex items-center justify-center gap-2">
                            <h1 className="text-4xl sm:text-5xl font-extrabold text-white py-5">{t('withdrawalConfirmation', 'Withdrawal Confirmation')}</h1>
                        </div>
                    </div>
                    <div className="text-center mb-1">
                        <CheckCircleIcon className="h-14 w-14 mx-auto text-green-500" />
                        <h1 className="text-xl font-extrabold text-fuchsia-800 mt-2">{t('success', 'Success!')}</h1>
                        <p className="text-gray-600 text-sm mb-1">{t('withdrawalSubmitted', 'Your withdrawal request has been submitted.')}</p>
                    </div>
                    <div className="my-4 grid grid-cols-2 gap-3">
                        <div className="bg-fuchsia-700 p-3 rounded-lg shadow text-center">
                            <p className="text-xs font-medium text-fuchsia-100">{t('queueNumber', 'Queue #')}</p>
                            <p className="text-3xl font-bold">{queueNumber}</p>
                        </div>
                        <div className="bg-fuchsia-600 p-3 rounded-lg shadow text-center">
                            <p className="text-xs font-medium text-fuchsia-100">{t('token', 'Token')}</p>
                            <p className="text-3xl font-bold">{token}</p>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg shadow-inner mb-4">
                        <h3 className="text-base font-bold text-fuchsia-700 mb-2">{t('transactionSummary', 'Transaction Summary')}</h3>
                        <div className="space-y-2 text-sm sm:text-base text-gray-700">
                            <div className="flex justify-between">
                                <strong className="font-medium">{t('account', 'Account')}:</strong>
                                <span className="text-right">{accountNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <strong className="font-medium">{t('accountHolder', 'Holder')}:</strong>
                                <span>{accountHolderName}</span>
                            </div>
                            <div className="flex justify-between">
                                <strong className="font-medium">{t('amount', 'Amount')}:</strong>
                                <span className="font-bold text-fuchsia-800">{amount}</span>
                            </div>
                            <div className="flex justify-between">
                                <strong className="font-medium">{t('type', 'Type')}:</strong>
                                <span>{t('withdrawal', 'Withdrawal')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                            onClick={() => navigate('/form/cash-withdrawal')}
                            className="flex items-center justify-center gap-1 w-full bg-fuchsia-700 text-white text-sm px-2 py-1.5 rounded-md shadow hover:bg-fuchsia-800 transition"
                        >
                            {t('newWithdrawal', 'New')}
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center justify-center gap-1 w-full bg-gray-200 text-fuchsia-800 text-sm px-2 py-1.5 rounded-md shadow hover:bg-gray-300 transition"
                        >
                            <PrinterIcon className="h-3.5 w-3.5" />
                            {t('print', 'Print')}
                        </button>
                        {editMode ? (
                            <>
                                <div className="col-span-2 sm:col-span-1 flex flex-col gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={editAmount}
                                        onChange={e => setEditAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full border rounded-md px-2 py-1 text-sm mb-1"
                                        placeholder="Withdrawal Amount"
                                    />
                                    <input
                                        type="text"
                                        value={editRemark}
                                        onChange={e => setEditRemark(e.target.value)}
                                        className="w-full border rounded-md px-2 py-1 text-sm"
                                        placeholder="Remark (optional)"
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={handleEditSave}
                                            disabled={isUpdating}
                                            className="flex-1 bg-yellow-500 text-white px-2 py-1 rounded-md hover:bg-yellow-600 disabled:bg-yellow-300"
                                        >
                                            {isUpdating ? t('updating', 'Updating...') : t('save', 'Save')}
                                        </button>
                                        <button
                                            onClick={handleEditCancel}
                                            disabled={isUpdating}
                                            className="flex-1 bg-gray-300 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-400"
                                        >
                                            {t('cancel', 'Cancel')}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={startEdit}
                                    className="flex items-center justify-center gap-1 w-full bg-yellow-500 text-white text-sm px-2 py-1.5 rounded-md shadow hover:bg-yellow-600 transition"
                                >
                                    {t('update', 'Update')}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={isCancelling}
                                    className="flex items-center justify-center gap-1 w-full bg-red-600 text-white text-sm px-2 py-1.5 rounded-md shadow hover:bg-red-700 transition disabled:opacity-70"
                                >
                                    {isCancelling ? t('cancelling', 'Cancelling...') : t('cancel', 'Cancel')}
                                </button>
                            </>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mt-6">{t('thankYouBanking', 'Thank you for banking with us!')}</p>
                </div>
            </div>
        );
    }
    // Fallback: No data available
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
