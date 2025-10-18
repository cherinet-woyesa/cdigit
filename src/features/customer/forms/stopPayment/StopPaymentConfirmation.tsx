import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, Fragment } from 'react';
import { 
    getStopPaymentOrderById,
    cancelStopPaymentOrder 
} from '../../../../services/stopPaymentService';
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
    FileText,
    MapPin,
    Calendar,
    Clock,
    CreditCard,
    DollarSign,
    Building,
    RefreshCw,
    User,
    Shield,
    Ban
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

interface StopPaymentData {
    id?: string;
    formReferenceId?: string;
    accountNumber?: string;
    customerName?: string;
    chequeNumber?: string;
    chequeAmount?: number;
    chequeDate?: string;
    reason?: string;
    branchName?: string;
    status?: 'Pending' | 'Approved' | 'Rejected' | 'Revoked';
    isRevoked?: boolean;
    revokedAt?: string;
    revokedBy?: string;
    dateCreated?: string;
    windowNumber?: number;
    frontMakerName?: string;
}

interface LocationState {
    request?: StopPaymentData;
    isRevoke?: boolean;
    branchName?: string;
    formData?: any;
    originalSpo?: StopPaymentData;
}

export default function StopPaymentConfirmation() {
    const { t } = useTranslation();
    const { phone } = useAuth();
    const { state } = useLocation() as { state?: LocationState };
    const navigate = useNavigate();
    const { branch } = useBranch();
    const [stopPaymentData, setStopPaymentData] = useState<StopPaymentData>({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [printError, setPrintError] = useState('');
    const componentToPrintRef = useRef<HTMLDivElement>(null);
    const branchName = branch?.name || state?.branchName || t('selectedBranch', 'Selected Branch');
    const isRevoke = state?.isRevoke || false;

    const handlePrint = useReactToPrint({
        content: () => componentToPrintRef.current,
        documentTitle: isRevoke 
            ? t('revokeStopPaymentConfirmation', 'Revoke Stop Payment Confirmation')
            : t('stopPaymentConfirmation', 'Stop Payment Confirmation'),
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
                
                if (state?.request) {
                    // Use data from navigation state
                    const requestData = state.request;
                    setStopPaymentData({
                        id: requestData.id,
                        formReferenceId: requestData.formReferenceId,
                        accountNumber: requestData.accountNumber,
                        customerName: requestData.customerName,
                        chequeNumber: requestData.chequeNumber,
                        chequeAmount: requestData.chequeAmount,
                        chequeDate: requestData.chequeDate,
                        reason: requestData.reason,
                        branchName: requestData.branchName,
                        status: requestData.status,
                        isRevoked: requestData.isRevoked,
                        revokedAt: requestData.revokedAt,
                        revokedBy: requestData.revokedBy,
                        dateCreated: requestData.dateCreated,
                        windowNumber: requestData.windowNumber,
                        frontMakerName: requestData.frontMakerName,
                    });
                } else {
                    setError(t('invalidState', 'Invalid request state. Please start over.'));
                }
            } catch (err: any) {
                console.error('Error initializing stop payment data:', err);
                setError(err?.message || t('loadFailed', 'Failed to load stop payment details'));
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, [state, t]);

    const handleCancel = async () => {
        if (!stopPaymentData.id) {
            setError(t('noStopPaymentId', 'No stop payment ID available'));
            return;
        }
        try {
            setIsCancelling(true);
            setError('');
            const response = await cancelStopPaymentOrder(stopPaymentData.id);
            if (response.success) {
                setSuccessMessage(response.message || t('stopPaymentCancelled', 'Stop Payment request cancelled successfully'));
                setShowCancelModal(false);
                setTimeout(() => {
                    navigate('/form/stop-payment', {
                        state: {
                            showSuccess: true,
                            successMessage: response.message || t('stopPaymentCancelled', 'Stop Payment request cancelled successfully')
                        }
                    });
                }, 1500);
            } else {
                setError(response.message || t('cancelFailed', 'Failed to cancel stop payment'));
            }
        } catch (err: any) {
            setError(err?.message || t('cancelFailed', 'Failed to cancel stop payment'));
        } finally {
            setIsCancelling(false);
        }
    };

    const handleNewStopPayment = () => {
        navigate('/form/stop-payment');
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    // Auto-redirect if error is due to invalid navigation state
    useEffect(() => {
        if (error && !stopPaymentData.id && error === t('invalidState', 'Invalid request state. Please start over.')) {
            const timer = setTimeout(() => {
                navigate('/form/stop-payment');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, stopPaymentData.id, navigate, t]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <Loader2 className="h-12 w-12 text-fuchsia-700 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">{t('loading', 'Loading stop payment details...')}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state with auto-redirect
    if (error && !stopPaymentData.id) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('error', 'Error')}</h3>
                        <p className="text-gray-600 mb-4">
                            {error === t('invalidState', 'Invalid request state. Please start over.')
                                ? t('redirectMessage', 'This page was loaded without a valid stop payment. You will be redirected to the stop payment form.')
                                : error}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => navigate('/form/stop-payment')}
                                className="bg-fuchsia-700 text-white px-6 py-2 rounded-lg hover:bg-fuchsia-800 transition-colors"
                            >
                                {t('goToStopPayment', 'Go to Stop Payment')}
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
            <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return 'text-green-600';
            case 'Pending': return 'text-yellow-600';
            case 'Rejected': return 'text-red-600';
            case 'Revoked': return 'text-purple-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Approved': return <CheckCircle2 className="h-4 w-4" />;
            case 'Pending': return <Clock className="h-4 w-4" />;
            case 'Rejected': return <X className="h-4 w-4" />;
            case 'Revoked': return <Ban className="h-4 w-4" />;
            default: return <AlertCircle className="h-4 w-4" />;
        }
    };

    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Header with softer gradient */}
                    <header className="bg-gradient-to-r from-amber-400 to-fuchsia-600 text-white">
                        <div className="px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <FileText className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold">
                                            {isRevoke 
                                                ? t('revokeStopPaymentConfirmation', 'Revoke Stop Payment Confirmation')
                                                : t('stopPaymentConfirmation', 'Stop Payment Confirmation')
                                            }
                                        </h1>
                                        <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>{branchName}</span>
                                            <span>•</span>
                                            <Calendar className="h-3 w-3" />
                                            <span>{new Date().toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="bg-fuchsia-800/50 px-2 py-1 rounded-full text-xs">
                                        📱 {phone}
                                    </div>
                                    <div className="bg-white/20 rounded p-1">
                                        <LanguageSwitcher />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div ref={componentToPrintRef} className="p-4">
                        {/* Success Icon */}
                        <div className="text-center py-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-3">
                                <CheckCircle2 className="h-10 w-10 text-amber-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 mb-1">{t('success', 'Success!')}</h2>
                            <p className="text-gray-600 text-sm">
                                {isRevoke 
                                    ? t('stopPaymentRevoked', 'Your stop payment has been successfully revoked.')
                                    : t('stopPaymentSubmitted', 'Your stop payment request has been submitted.')
                                }
                            </p>
                        </div>

                        {/* Reference ID Card with improved colors */}
                        <div className="mb-4">
                            <div className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 p-4 rounded-lg text-center text-white shadow-sm">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Shield className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                        {t('referenceNumber', 'Reference Number')}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold font-mono">
                                    {stopPaymentData.formReferenceId || 'N/A'}
                                </p>
                                {stopPaymentData.windowNumber && (
                                    <p className="text-sm mt-1 opacity-90">
                                        {t('window', 'Window')}: {stopPaymentData.windowNumber}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Transaction Summary with softer background */}
                        <div className="mb-4">
                            <div className="bg-amber-25 rounded-lg p-4 border border-amber-200 shadow-sm">
                                <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    {isRevoke 
                                        ? t('revocationSummary', 'Revocation Summary')
                                        : t('stopPaymentSummary', 'Stop Payment Summary')
                                    }
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {t('customerName', 'Customer Name')}:
                                        </span>
                                        <span className="font-semibold text-right">{stopPaymentData.customerName || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <CreditCard className="h-3 w-3" />
                                            {t('accountNumber', 'Account Number')}:
                                        </span>
                                        <span className="font-mono font-semibold">{stopPaymentData.accountNumber || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <FileText className="h-3 w-3" />
                                            {t('chequeNumber', 'Cheque Number')}:
                                        </span>
                                        <span className="font-mono font-semibold">{stopPaymentData.chequeNumber || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <DollarSign className="h-3 w-3" />
                                            {t('chequeAmount', 'Cheque Amount')}:
                                        </span>
                                        <span className="font-semibold text-amber-700">
                                            {stopPaymentData.chequeAmount != null 
                                                ? `${Number(stopPaymentData.chequeAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB` 
                                                : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {t('chequeDate', 'Cheque Date')}:
                                        </span>
                                        <span className="text-amber-700">
                                            {stopPaymentData.chequeDate 
                                                ? new Date(stopPaymentData.chequeDate).toLocaleDateString()
                                                : 'N/A'
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-start py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {t('reason', 'Reason')}:
                                        </span>
                                        <span className="text-right max-w-xs text-amber-700">{stopPaymentData.reason || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <Building className="h-3 w-3" />
                                            {t('branch', 'Branch')}:
                                        </span>
                                        <span className="text-amber-700">{branchName}</span>
                                    </div>
                                    {stopPaymentData.frontMakerName && (
                                        <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                            <span className="font-medium text-amber-800 flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {t('processedBy', 'Processed By')}:
                                            </span>
                                            <span className="text-amber-700">{stopPaymentData.frontMakerName}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center py-1">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            {getStatusIcon(stopPaymentData.status || '')}
                                            {t('status', 'Status')}:
                                        </span>
                                        <span className={`font-medium ${getStatusColor(stopPaymentData.status || '')}`}>
                                            {stopPaymentData.status || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Important Notes */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <h4 className="text-sm font-semibold text-blue-800 mb-1 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {t('importantNotes', 'Important Notes')}
                            </h4>
                            <ul className="text-xs text-blue-700 space-y-1">
                                <li>• {t('stopPaymentNote1', 'Please keep your reference number for future inquiries')}</li>
                                <li>• {t('stopPaymentNote2', 'This stop payment will be processed within 24 hours')}</li>
                                <li>• {t('stopPaymentNote3', 'Contact branch for any urgent matters')}</li>
                                {isRevoke && (
                                    <li>• {t('revokeNote', 'The cheque is now payable again after revocation')}</li>
                                )}
                            </ul>
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
                                onClick={handleNewStopPayment}
                                className="flex items-center justify-center gap-1 w-full bg-amber-500 hover:bg-amber-600 text-white px-2 py-2 rounded-lg font-medium transition-colors"
                            >
                                <RefreshCw className="h-3 w-3" />
                                {t('newRequest', 'New Request')}
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center justify-center gap-1 w-full bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-800 px-2 py-2 rounded-lg font-medium transition-colors"
                            >
                                <Printer className="h-3 w-3" />
                                {t('print', 'Print')}
                            </button>
                        </div>
                        <div className="mt-2">
                            <button
                                onClick={() => setShowCancelModal(true)}
                                disabled={isCancelling || stopPaymentData.status !== 'Pending'}
                                className="flex items-center justify-center gap-1 w-full bg-rose-500 hover:bg-rose-600 text-white px-2 py-2 rounded-lg disabled:opacity-50 font-medium transition-colors"
                                title={stopPaymentData.status !== 'Pending' ? t('onlyPendingCanCancel', 'Only pending requests can be cancelled') : ''}
                            >
                                <X className="h-3 w-3" />
                                {t('cancelRequest', 'Cancel Request')}
                            </button>
                        </div>
                        {/* Messages */}
                        {error && <ErrorMessage message={error} />}
                        {printError && <ErrorMessage message={printError} />}
                        {successMessage && <SuccessMessage message={successMessage} />}
                    </div>

                    {/* Cancel Confirmation Modal */}
                                        {/* Cancel Confirmation Modal */}
                    <Transition appear show={showCancelModal} as={Fragment}>
                        <Dialog as="div" className="relative z-10" onClose={() => !isCancelling && setShowCancelModal(false)}>
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
                                            <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                                {t('confirmCancellation', 'Confirm Cancellation')}
                                            </Dialog.Title>
                                            <div className="mt-4">
                                                <p className="text-sm text-gray-500">
                                                    {t('cancelStopPaymentPrompt', 'Are you sure you want to cancel this stop payment request? This action cannot be undone.')}
                                                </p>
                                            </div>
                                            {error && <ErrorMessage message={error} />}
                                            <div className="mt-6 flex justify-end gap-3">
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50"
                                                    onClick={() => setShowCancelModal(false)}
                                                    disabled={isCancelling}
                                                >
                                                    {t('goBack', 'Go Back')}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center rounded-lg border border-transparent bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50"
                                                    onClick={handleCancel}
                                                    disabled={isCancelling}
                                                >
                                                    {isCancelling ? t('cancelling', 'Cancelling...') : t('yesCancelRequest', 'Yes, Cancel Request')}
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
        </div>
    );
}