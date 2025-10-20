import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo, useRef, Fragment } from 'react';
import { cancelFundTransferByCustomer, getFundTransferById } from '../../../../services/fundTransferService';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';
import { useAuth } from '../../../../context/AuthContext';
import { 
    CheckCircle2, 
    Printer, 
    RefreshCw, 
    X, 
    AlertTriangle,
    ArrowRightLeft,
    MapPin,
    Calendar,
    CreditCard,
    DollarSign,
    Building
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Dialog, Transition } from '@headlessui/react';

// Enhanced message components
function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{message}</span>
        </div>
    );
}

function SuccessMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-green-700 text-sm">{message}</span>
        </div>
    );
}

export default function FundTransferConfirmation() {
    const { t } = useTranslation();
    const { phone } = useAuth();
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    const [serverData, setServerData] = useState<any>(state?.serverData || null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const data = useMemo(() => {
        if (serverData?.data) return serverData.data;
        if (state?.serverData?.data) return state.serverData.data;
        return {};
    }, [serverData, state]);

    useEffect(() => {
        const fetchFundTransfer = async () => {
            if (data.id || error) return;
            const refId = data.formReferenceId || data.referenceId || data.ReferenceId || state?.serverData?.data?.id;
            if (!refId) return;
            
            setSubmitting(true);
            setError('');
            try {
                const res = await getFundTransferById(refId);
                setServerData(res);
            } catch (e: any) {
                setError(e?.message || t('fetchTransferError', 'Failed to fetch fund transfer confirmation.'));
            } finally {
                setSubmitting(false);
            }
        };

        if (state?.serverData?.data) {
            setServerData(state.serverData);
        } else if (state?.pending || !serverData) {
            fetchFundTransfer();
        }
    }, [state, serverData, error, data.id, t]);

    const debitAccount = data.DebitAccountNumber || data.debitAccountNumber || state?.ui?.debitAccount || 'N/A';
    const creditAccount = data.CreditAccountNumber || data.creditAccountNumber || state?.ui?.creditAccount || 'N/A';
    const amountValue = data.Amount ?? data.amount ?? state?.ui?.amount;
    const amount = amountValue != null ? `${Number(amountValue).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB` : '0.00 ETB';
    const branchName = state?.branchName || t('selectedBranch', 'Selected Branch');
    const token = (data.TokenNumber || data.tokenNumber || state?.tokenNumber)?.toString() || 'N/A';
    const queueNumber = (data.QueueNumber ?? data.queueNumber ?? state?.queueNumber)?.toString() || 'N/A';
    const entityId = data.Id || data.id || null;

    const componentToPrintRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        content: () => componentToPrintRef.current,
        documentTitle: t('fundTransferConfirmation', 'Fund Transfer Confirmation'),
        pageStyle: `
            @page { size: auto; margin: 10mm; }
            @media print { 
                body { -webkit-print-color-adjust: exact; }
                .no-print { display: none !important; }
            }
        `,
    } as any);

    const handleNewTransfer = () => {
        navigate('/form/fund-transfer', { state: { showSuccess: false } });
    };

    const handleUpdateTransfer = () => {
        if (!entityId) return;
        navigate('/form/fund-transfer', { state: { updateId: entityId } });
    };

    const handleCancelTransfer = async () => {
        if (!entityId) return;
        
        try {
            setSubmitting(true);
            setError('');
            const response = await cancelFundTransferByCustomer(entityId);
            if (response.success) {
                setSuccessMessage(response.message || t('transferCancelled', 'Fund transfer cancelled successfully'));
                setShowCancelModal(false);
                setTimeout(() => {
                    navigate('/form/fund-transfer', {
                        state: {
                            showSuccess: true,
                            successMessage: response.message || t('transferCancelled', 'Fund transfer cancelled successfully')
                        }
                    });
                }, 1500);
            } else {
                throw new Error(response.message || t('cancelTransferFailed', 'Failed to cancel fund transfer'));
            }
        } catch (e: any) {
            setError(e?.message || t('cancelTransferFailed', 'Failed to cancel fund transfer. Please try again.'));
        } finally {
            setSubmitting(false);
        }
    };

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
                                        <ArrowRightLeft className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold">{t('fundTransferConfirmation', 'Fund Transfer Confirmation')}</h1>
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
                                    {/* <div className="bg-white/20 rounded p-1">
                                        <LanguageSwitcher />
                                    </div> */}
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
                            <p className="text-gray-600 text-sm">{t('transferSubmitted', 'Your fund transfer has been submitted.')}</p>
                        </div>

                        {/* Queue and Token Cards with improved colors */}
                        <div className="mb-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gradient-to-r from-amber-300 to-amber-400 p-3 rounded-lg text-center text-amber-900 shadow-sm">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <MapPin className="h-3 w-3" />
                                        <span className="text-xs font-medium">{t('queueNumber', 'Queue #')}</span>
                                    </div>
                                    <p className="text-2xl font-bold">{queueNumber}</p>
                                </div>
                                <div className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 p-3 rounded-lg text-center text-white shadow-sm">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <CreditCard className="h-3 w-3" />
                                        <span className="text-xs font-medium">{t('token', 'Token')}</span>
                                    </div>
                                    <p className="text-2xl font-bold">{token}</p>
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
                                            <CreditCard className="h-3 w-3" />
                                            {t('debitAccount', 'Debit Account')}:
                                        </span>
                                        <span className="font-mono font-semibold">{debitAccount}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <CreditCard className="h-3 w-3" />
                                            {t('creditAccount', 'Credit Account')}:
                                        </span>
                                        <span className="font-mono font-semibold">{creditAccount}</span>
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
                                        <span className="text-lg font-bold text-amber-700">{amount}</span>
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
                                onClick={handleNewTransfer}
                                className="flex items-center justify-center gap-1 w-full bg-amber-500 hover:bg-amber-600 text-white px-2 py-2 rounded-lg font-medium transition-colors"
                            >
                                <RefreshCw className="h-3 w-3" />
                                {t('newTransfer', 'New')}
                            </button>
                            
                            <button
                                onClick={handlePrint}
                                className="flex items-center justify-center gap-1 w-full bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-800 px-2 py-2 rounded-lg font-medium transition-colors"
                            >
                                <Printer className="h-3 w-3" />
                                {t('print', 'Print')}
                            </button>
                        </div>

                        {/* Update and Cancel Buttons - Only show if entity exists */}
                        {entityId && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <button
                                    onClick={handleUpdateTransfer}
                                    disabled={submitting}
                                    className="flex items-center justify-center gap-1 w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white px-2 py-2 rounded-lg disabled:opacity-50 font-medium transition-colors"
                                >
                                    <RefreshCw className="h-3 w-3" />
                                    {submitting ? t('processing', 'Processing...') : t('update', 'Update')}
                                </button>
                                
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    disabled={submitting}
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
                    <Dialog as="div" className="relative z-10" onClose={() => !submitting && setShowCancelModal(false)}>
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
                                                {t('cancelTransferConfirmation', 'Are you sure you want to cancel this fund transfer? This action cannot be undone.')}
                                            </p>
                                        </div>

                                        <div className="mt-4 flex gap-3">
                                            <button
                                                type="button"
                                                disabled={submitting}
                                                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                                onClick={() => setShowCancelModal(false)}
                                            >
                                                {t('no', 'No')}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={submitting}
                                                className="inline-flex justify-center rounded-md border border-transparent bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 focus:outline-none disabled:opacity-50"
                                                onClick={handleCancelTransfer}
                                            >
                                                {submitting ? (
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
