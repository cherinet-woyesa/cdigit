import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, Fragment } from 'react';
import { 
    getWithdrawalById, 
    cancelWithdrawalByCustomer
} from '../../../../services/withdrawalService';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { 
    CheckCircle2, 
    Printer, 
    AlertCircle,
    Loader2,
    X,
    Plane,
    MapPin,
    Calendar,
    Clock,
    CreditCard,
    DollarSign,
    Building,
    RefreshCw,
    User
} from 'lucide-react';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';

// Success message component
function SuccessMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-green-700">{message}</span>
        </div>
    );
}

// Error message component
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

interface LocationState {
    serverData?: {
        data?: WithdrawalData;
        success?: boolean;
        message?: string;
    };
    updateId?: string;
    formData?: any;
    tokenNumber?: string;
    queueNumber?: number;
}

export default function WithdrawalConfirmation() {
    const { t } = useTranslation();
    const { phone } = useAuth();
    const { state } = useLocation() as { state?: LocationState };
    const navigate = useNavigate();
    const { branch } = useBranch();
    const [withdrawalData, setWithdrawalData] = useState<WithdrawalData>({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [printError, setPrintError] = useState('');
    const componentToPrintRef = useRef<HTMLDivElement>(null);
    const branchName = branch?.name || t('selectedBranch', 'Selected Branch');

    const handlePrint = useReactToPrint({
        content: () => componentToPrintRef.current,
        documentTitle: t('withdrawalConfirmation', 'Withdrawal Confirmation'),
        pageStyle: `
            @page { size: auto; margin: 10mm; }
            @media print { 
                body { -webkit-print-color-adjust: exact; }
                .no-print { display: none !important; }
            }
        `,
        onBeforeGetContent: () => setPrintError(''),
        onPrintError: () => setPrintError(t('printError', 'Failed to print. Please check your printer settings.')),
    } as any);

    useEffect(() => {
        const initializeData = async () => {
            try {
                setIsLoading(true);
                setError('');
                
                if (state?.serverData?.data) {
                    // Use data from navigation state
                    const serverData = state.serverData.data;
                    setWithdrawalData({
                        id: serverData.id,
                        branchId: serverData.branchId,
                        formReferenceId: serverData.formReferenceId,
                        accountNumber: serverData.accountNumber,
                        accountHolderName: serverData.accountHolderName,
                        withdrawal_Amount: serverData.withdrawal_Amount,
                        tokenNumber: serverData.tokenNumber,
                        queueNumber: serverData.queueNumber,
                        remark: serverData.remark,
                        status: serverData.status,
                        submittedAt: serverData.submittedAt,
                    });
                } else if (state?.updateId) {
                    // Fetch withdrawal by ID for update flow
                    const response = await getWithdrawalById(state.updateId);
                    if (response.success && response.data) {
                        setWithdrawalData(response.data);
                    } else {
                        setError(response.message || t('loadFailed', 'Failed to load withdrawal details'));
                    }
                } else {
                    setError(t('invalidState', 'Invalid request state. Please start over.'));
                }
            } catch (err: any) {
                console.error('Error initializing withdrawal data:', err);
                setError(err?.message || t('loadFailed', 'Failed to load withdrawal details'));
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, [state, t]);

    const handleCancel = async () => {
        if (!withdrawalData.id) {
            setError(t('noWithdrawalId', 'No withdrawal ID available'));
            return;
        }
        try {
            setIsCancelling(true);
            setError('');
            const response = await cancelWithdrawalByCustomer(withdrawalData.id);
            if (response.success) {
                setSuccessMessage(response.message || t('withdrawalCancelled', 'Withdrawal request cancelled successfully'));
                setShowCancelModal(false);
                setTimeout(() => {
                    navigate('/form/cash-withdrawal', {
                        state: {
                            showSuccess: true,
                            successMessage: response.message || t('withdrawalCancelled', 'Withdrawal request cancelled successfully')
                        }
                    });
                }, 1500);
            } else {
                setError(response.message || t('cancelFailed', 'Failed to cancel withdrawal'));
            }
        } catch (err: any) {
            setError(err?.message || t('cancelFailed', 'Failed to cancel withdrawal'));
        } finally {
            setIsCancelling(false);
        }
    };

    const handleUpdate = async () => {
        if (!withdrawalData.id) {
            setError(t('noWithdrawalId', 'No withdrawal ID available'));
            return;
        }
        
        setIsUpdating(true);
        setError('');
        try {
            // Fetch latest withdrawal data and navigate to edit form
            const response = await getWithdrawalById(withdrawalData.id);
            if (response.success && response.data) {
                navigate('/form/cash-withdrawal', {
                    state: {
                        updateId: withdrawalData.id,
                        formData: {
                            accountNumber: response.data.accountNumber,
                            accountHolderName: response.data.accountHolderName,
                            amount: response.data.withdrawal_Amount,
                            remark: response.data.remark,
                        },
                        tokenNumber: response.data.tokenNumber,
                        queueNumber: response.data.queueNumber
                    }
                });
            } else {
                setError(response.message || t('updateFailed', 'Failed to prepare withdrawal update.'));
            }
        } catch (err: any) {
            setError(err?.message || t('updateFailed', 'Failed to prepare withdrawal update.'));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleNewWithdrawal = () => {
        navigate('/form/cash-withdrawal');
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    // Auto-redirect if error is due to invalid navigation state
    useEffect(() => {
        if (error && !withdrawalData.id && error === t('invalidState', 'Invalid request state. Please start over.')) {
            const timer = setTimeout(() => {
                navigate('/form/cash-withdrawal');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, withdrawalData.id, navigate, t]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <Loader2 className="h-12 w-12 text-fuchsia-700 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">{t('loading', 'Loading withdrawal details...')}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state with auto-redirect
    if (error && !withdrawalData.id) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('error', 'Error')}</h3>
                        <p className="text-gray-600 mb-4">
                            {error === t('invalidState', 'Invalid request state. Please start over.')
                                ? t('redirectMessage', 'This page was loaded without a valid withdrawal. You will be redirected to the withdrawal form.')
                                : error}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => navigate('/form/cash-withdrawal')}
                                className="bg-fuchsia-700 text-white px-6 py-2 rounded-lg hover:bg-fuchsia-800 transition-colors"
                            >
                                {t('goToWithdrawal', 'Go to Withdrawal')}
                            </button>
                            <button
                                onClick={handleBackToDashboard}
                                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                {t('backToDashboard', 'Back to Dashboard')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Success state after cancellation
    if (successMessage) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('success', 'Success!')}</h3>
                        <p className="text-gray-600 mb-4">{successMessage}</p>
                        <button
                            onClick={handleBackToDashboard}
                            className="bg-fuchsia-700 text-white px-6 py-2 rounded-lg hover:bg-fuchsia-800 transition-colors"
                        >
                            {t('backToDashboard', 'Back to Dashboard')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Header with softer gradient */}
                    <header className="bg-fuchsia-700 text-white">
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
                                            <span>{branchName}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="bg-fuchsia-800/50 px-2 py-1 rounded-full text-xs">
                                        📱 {phone}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div ref={componentToPrintRef} className="p-4">
                        {/* Success Icon */}
                        <div className="text-center py-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
    <CheckCircle2 className="h-10 w-10 text-green-600" />
  </div>
                            <h2 className="text-lg font-bold text-gray-900 mb-1">{t('success', 'Success!')}</h2>
                            <p className="text-gray-600 text-sm">{t('withdrawalSubmitted', 'Your withdrawal request has been submitted.')}</p>
                        </div>

                        {/* Queue and Token Cards with improved colors */}
                        <div className="mb-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gradient-to-r from-amber-300 to-amber-400 p-3 rounded-lg text-center text-amber-900 shadow-sm">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <MapPin className="h-3 w-3" />
                                        <span className="text-xs font-medium">{t('queueNumber', 'Queue #')}</span>
                                    </div>
                                    <p className="text-2xl font-bold">{withdrawalData.queueNumber || 'N/A'}</p>
                                </div>
                                <div className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 p-3 rounded-lg text-center text-white shadow-sm">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <CreditCard className="h-3 w-3" />
                                        <span className="text-xs font-medium">{t('token', 'Token')}</span>
                                    </div>
                                    <p className="text-2xl font-bold">{withdrawalData.tokenNumber || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Transaction Summary with softer background */}
                        <div className="mb-4">
                            <div className="bg-amber-25 rounded-lg p-4 border border-amber-200 shadow-sm">
                                <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    {t('transactionSummary', 'Transaction Summary')}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {t('accountHolder', 'Account Holder')}:
                                        </span>
                                        <span className="font-semibold text-right">{withdrawalData.accountHolderName || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <CreditCard className="h-3 w-3" />
                                            {t('accountNumber', 'Account Number')}:
                                        </span>
                                        <span className="font-mono font-semibold">{withdrawalData.accountNumber || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <Building className="h-3 w-3" />
                                            {t('branch', 'Branch')}:
                                        </span>
                                        <span>{branchName}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <DollarSign className="h-3 w-3" />
                                            {t('amount', 'Amount')}:
                                        </span>
                                        <span className="text-lg font-bold text-amber-700">
                                            {Number(withdrawalData.withdrawal_Amount || 0).toLocaleString('en-US', { 
                                                minimumFractionDigits: 2, 
                                                maximumFractionDigits: 2 
                                            })} ETB
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Thank You Message */}
                        <div className="text-center pt-3 border-t border-amber-200">
                            <p className="text-amber-700 text-xs">{t('thankYouBanking', 'Thank you for banking with us!')}</p>
                        </div>
                    </div>

                    {/* Action Buttons with improved colors */}
                    <div className="p-4 border-t border-amber-200 no-print">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleNewWithdrawal}
                                className="flex items-center justify-center gap-1 w-full bg-amber-500 hover:bg-amber-600 text-white px-2 py-2 rounded-lg font-medium transition-colors"
                            >
                                <RefreshCw className="h-3 w-3" />
                                {t('newWithdrawal', 'New')}
                            </button>
                            
                            <button
                                onClick={handlePrint}
                                className="flex items-center justify-center gap-1 w-full bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-800 px-2 py-2 rounded-lg font-medium transition-colors"
                            >
                                <Printer className="h-3 w-3" />
                                {t('print', 'Print')}
                            </button>
                        </div>

                        {/* Update and Cancel Buttons - Only show if entity exists and is pending */}
                        {withdrawalData.id && withdrawalData.status?.toLowerCase() === 'pending' && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <button
                                    onClick={handleUpdate}
                                    disabled={isUpdating}
                                    className="flex items-center justify-center gap-1 w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white px-2 py-2 rounded-lg disabled:opacity-50 font-medium transition-colors"
                                >
                                    <RefreshCw className="h-3 w-3" />
                                    {isUpdating ? t('processing', 'Processing...') : t('update', 'Update')}
                                </button>
                                
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    disabled={isUpdating}
                                    className="flex items-center justify-center gap-1 w-full bg-rose-500 hover:bg-rose-600 text-white px-2 py-2 rounded-lg disabled:opacity-50 font-medium transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                    {t('cancel', 'Cancel')}
                                </button>
                            </div>
                        )}

                        {/* Messages */}
                        {error && <ErrorMessage message={error} />}
                        {successMessage && <SuccessMessage message={successMessage} />}
                    </div>
                </div>

                {/* Cancel Confirmation Modal */}
                <Transition appear show={showCancelModal} as={Fragment}>
                    <Dialog as="div" className="relative z-10" onClose={() => !isUpdating && setShowCancelModal(false)}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black/25" />
                        </Transition.Child>

                        <div className="fixed inset-0 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4 text-center">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95"
                                    enterTo="opacity-100 scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100"
                                    leaveTo="opacity-0 scale-95"
                                >
                                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <Dialog.Title
                                            as="h3"
                                            className="text-lg font-medium leading-6 text-gray-900"
                                        >
                                            {t('confirmCancellation', 'Confirm Cancellation')}
                                        </Dialog.Title>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                {t('cancelWithdrawalConfirmation', 'Are you sure you want to cancel this withdrawal? This action cannot be undone.')}
                                            </p>
                                        </div>

                                        <div className="mt-4 flex gap-3">
                                            <button
                                                type="button"
                                                disabled={isUpdating}
                                                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                                onClick={() => setShowCancelModal(false)}
                                            >
                                                {t('no', 'No')}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isUpdating}
                                                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none disabled:opacity-50"
                                                onClick={handleCancel}
                                            >
                                                {isUpdating ? (
                                                    <span className="flex items-center">
                                                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                                        {t('processing', 'Processing...')}
                                                    </span>
                                                ) : (
                                                    t('yesCancel', 'Yes, Cancel')
                                                )}
                                            </button>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
            </div>
        </div>
    );
}