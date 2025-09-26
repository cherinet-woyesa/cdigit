import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { 
    getWithdrawalById, 
    cancelWithdrawalByCustomer, 
    updateWithdrawal
} from '../../../../services/withdrawalService';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { 
    CheckCircle2, 
    Printer, 
    AlertCircle,
    Loader2,
    Edit,
    X,
    Plane,
    MapPin,
    Calendar
} from 'lucide-react';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';

// Success message component (consistent with deposit form)
function SuccessMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-green-700">{message}</span>
        </div>
    );
}

// Error message component (consistent with deposit form)
function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{message}</span>
        </div>
    );
}

interface WithdrawalData {
    id?: string;
    branchId?: string;
    formReferenceId?: string;
    accountNumber?: string;
    accountHolderName?: string;
    withdrawal_Amount?: number;
    tokenNumber?: string;
    queueNumber?: number;
    remark?: string;
    status?: string;
    submittedAt?: string;
}

export default function WithdrawalConfirmation() {
    const { t } = useTranslation();
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    const { phone, user } = useAuth();
    const { branch } = useBranch();
    
    const [withdrawalData, setWithdrawalData] = useState<WithdrawalData>({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editAmount, setEditAmount] = useState<number | ''>('');
    const [editRemark, setEditRemark] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState('');

    const componentToPrintRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        content: () => componentToPrintRef.current,
        documentTitle: `Withdrawal-Confirmation-${withdrawalData.tokenNumber || ''}`,
    } as any);

    useEffect(() => {
        const initializeData = async () => {
            try {
                setIsLoading(true);
                
                if (state?.serverData) {
                    // Use data from navigation state
                    const serverData = state.serverData;
                    setWithdrawalData({
                        id: serverData.data?.id,
                        branchId: serverData.data?.branchId,
                        formReferenceId: serverData.data?.formReferenceId,
                        accountNumber: serverData.data?.accountNumber,
                        accountHolderName: serverData.data?.accountHolderName,
                        withdrawal_Amount: serverData.data?.withdrawal_Amount,
                        tokenNumber: serverData.data?.tokenNumber,
                        queueNumber: serverData.data?.queueNumber,
                        remark: serverData.data?.remark,
                        status: serverData.data?.status,
                        submittedAt: serverData.data?.submittedAt,
                    });
                } else if (state?.updateId) {
                    // Fetch withdrawal by ID for update flow
                    const response = await getWithdrawalById(state.updateId);
                    if (response.success) {
                        setWithdrawalData(response.data || {});
                    } else {
                        setError(response.message || 'Failed to load withdrawal details');
                    }
                } else {
                    setError('Invalid request state. Please start over.');
                }
            } catch (err: any) {
                console.error('Error initializing withdrawal data:', err);
                setError(err?.message || 'Failed to load withdrawal details');
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, [state]);

    const handleCancel = async () => {
        if (!withdrawalData.id) {
            setError('No withdrawal ID available');
            return;
        }
        
        if (!window.confirm(t('confirmCancel', 'Are you sure you want to cancel this withdrawal request?'))) {
            return;
        }

        try {
            setIsCancelling(true);
            const response = await cancelWithdrawalByCustomer(withdrawalData.id);
            
            if (response.success) {
                setSuccessMessage(response.message || t('withdrawalCancelled', 'Withdrawal request cancelled successfully'));
                
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } else {
                setError(response.message || t('cancelFailed', 'Failed to cancel withdrawal'));
            }
        } catch (err: any) {
            console.error('Error cancelling withdrawal:', err);
            setError(err?.message || t('cancelFailed', 'Failed to cancel withdrawal'));
        } finally {
            setIsCancelling(false);
        }
    };

    const handleUpdate = async () => {
        if (!withdrawalData.id || !editAmount) {
            setError('Invalid update data');
            return;
        }

        try {
            setIsUpdating(true);
            const updateData = {
                withdrawal_Amount: Number(editAmount),
                remark: editRemark,
            };
            
            const result = await updateWithdrawal(withdrawalData.id, updateData);
            if (result.success) {
                setSuccessMessage(result.message || t('withdrawalUpdated', 'Withdrawal updated successfully'));
                setWithdrawalData(prev => ({
                    ...prev,
                    withdrawal_Amount: Number(editAmount),
                    remark: editRemark
                }));
                setEditMode(false);
                
                setTimeout(() => {
                    setSuccessMessage('');
                }, 3000);
            } else {
                setError(result.message || t('updateFailed', 'Failed to update withdrawal'));
            }
        } catch (err: any) {
            setError(err?.message || t('updateFailed', 'Failed to update withdrawal'));
        } finally {
            setIsUpdating(false);
        }
    };

    const startEdit = () => {
        setEditAmount(withdrawalData.withdrawal_Amount || 0);
        setEditRemark(withdrawalData.remark || '');
        setEditMode(true);
        setError('');
        setSuccessMessage('');
    };

    const cancelEdit = () => {
        setEditMode(false);
        setEditAmount(withdrawalData.withdrawal_Amount || 0);
        setEditRemark(withdrawalData.remark || '');
    };

    const handleNewWithdrawal = () => {
        navigate('/form/cash-withdrawal');
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <Loader2 className="h-12 w-12 text-fuchsia-700 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">{t('loading', 'Loading...')}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !withdrawalData.id) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('error', 'Error')}</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => navigate('/form/cash-withdrawal')}
                                className="bg-fuchsia-700 text-white px-6 py-2 rounded-lg hover:bg-fuchsia-800"
                            >
                                {t('tryAgain', 'Try Again')}
                            </button>
                            <button
                                onClick={handleBackToDashboard}
                                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50"
                            >
                                {t('backToDashboard', 'Back to Dashboard')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Success state after cancellation/update
    if (successMessage && !withdrawalData.id) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('success', 'Success!')}</h3>
                        <p className="text-gray-600 mb-4">{successMessage}</p>
                        <button
                            onClick={handleBackToDashboard}
                            className="bg-fuchsia-700 text-white px-6 py-2 rounded-lg hover:bg-fuchsia-800"
                        >
                            {t('backToDashboard', 'Back to Dashboard')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full mx-auto">
                <div ref={componentToPrintRef} className="bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Header with Language Switcher */}
                    <header className="bg-fuchsia-700 text-white rounded-t-lg">
                        <div className="px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <Plane className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold">{t('withdrawalConfirmation', 'Withdrawal Confirmation')}</h1>
                                        <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>{branch?.name || state?.branchName || t('branch', 'Branch')}</span>
                                            <span>•</span>
                                            <Calendar className="h-3 w-3" />
                                            <span>{new Date().toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <div className="bg-fuchsia-800/50 px-3 py-1 rounded-full text-xs">
                                        📱 {phone}
                                    </div>
                                    <div className="bg-white/20 rounded-lg p-1">
                                        <LanguageSwitcher />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div className="p-6">
                        {successMessage && (
                            <div className="mb-6">
                                <SuccessMessage message={successMessage} />
                            </div>
                        )}

                        {error && (
                            <div className="mb-6">
                                <ErrorMessage message={error} />
                            </div>
                        )}

                        {/* Success Header */}
                        <div className="text-center mb-6">
                            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-3" />
                            <h2 className="text-2xl font-bold text-gray-900">{t('withdrawalSubmitted', 'Withdrawal Submitted Successfully!')}</h2>
                            <p className="text-gray-600 mt-1">{t('thankYouForBanking', 'Thank you for banking with us!')}</p>
                        </div>

                        {/* Token and Queue Numbers */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-fuchsia-700 text-white p-4 rounded-lg text-center">
                                <div className="text-sm font-medium opacity-90">{t('queueNumber', 'Queue Number')}</div>
                                <div className="text-3xl font-bold mt-1">{withdrawalData.queueNumber || 'N/A'}</div>
                            </div>
                            <div className="bg-fuchsia-600 text-white p-4 rounded-lg text-center">
                                <div className="text-sm font-medium opacity-90">{t('tokenNumber', 'Token Number')}</div>
                                <div className="text-3xl font-bold mt-1">{withdrawalData.tokenNumber || 'N/A'}</div>
                            </div>
                        </div>

                        {/* Transaction Summary */}
                        <div className="border border-gray-200 rounded-lg p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('transactionSummary', 'Transaction Summary')}</h3>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="font-medium text-gray-700">{t('accountNumber', 'Account Number')}:</span>
                                    <span className="font-mono">{withdrawalData.accountNumber || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="font-medium text-gray-700">{t('accountHolder', 'Account Holder')}:</span>
                                    <span>{withdrawalData.accountHolderName || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="font-medium text-gray-700">{t('amount', 'Amount')}:</span>
                                    <span className="text-lg font-bold text-fuchsia-700">
                                        {withdrawalData.withdrawal_Amount?.toLocaleString() || '0'} ETB
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="font-medium text-gray-700">{t('status', 'Status')}:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        withdrawalData.status === 'OnQueue' 
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {withdrawalData.status || t('pending', 'Pending')}
                                    </span>
                                </div>
                            </div>

                            {/* Edit Form */}
                            {editMode && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-3">{t('editWithdrawal', 'Edit Withdrawal')}</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('amount', 'Amount')} (ETB)
                                            </label>
                                            <input
                                                type="number"
                                                value={editAmount}
                                                onChange={(e) => setEditAmount(Number(e.target.value))}
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                                min="1"
                                                step="0.01"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('remark', 'Remark')} ({t('optional', 'Optional')})
                                            </label>
                                            <input
                                                type="text"
                                                value={editRemark}
                                                onChange={(e) => setEditRemark(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg"
                                                placeholder={t('enterRemark', 'Enter remark...')}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleUpdate}
                                                disabled={isUpdating}
                                                className="flex-1 bg-fuchsia-700 text-white py-2 rounded-lg hover:bg-fuchsia-800 disabled:opacity-50"
                                            >
                                                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : t('save', 'Save')}
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                                            >
                                                {t('cancel', 'Cancel')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button
                                onClick={handleNewWithdrawal}
                                className="bg-fuchsia-700 text-white py-2 rounded-lg hover:bg-fuchsia-800 text-sm font-medium"
                            >
                                {t('newWithdrawal', 'New Withdrawal')}
                            </button>
                            
                            <button
                                onClick={handlePrint}
                                className="border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-medium"
                            >
                                <Printer className="h-4 w-4" />
                                {t('print', 'Print')}
                            </button>
                            
                            {!editMode ? (
                                <>
                                    <button
                                        onClick={startEdit}
                                        className="border border-yellow-300 text-yellow-700 py-2 rounded-lg hover:bg-yellow-50 flex items-center justify-center gap-2 text-sm font-medium"
                                    >
                                        <Edit className="h-4 w-4" />
                                        {t('update', 'Update')}
                                    </button>
                                    
                                    <button
                                        onClick={handleCancel}
                                        disabled={isCancelling}
                                        className="border border-red-300 text-red-700 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
                                    >
                                        {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                        {t('cancel', 'Cancel')}
                                    </button>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}