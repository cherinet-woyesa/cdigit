import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo, useRef, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { 
    CheckCircle2, 
    Printer, 
    RefreshCw, 
    X, 
    AlertTriangle,
    Plane,
    MapPin,
    Calendar,
    Clock,
    User,
    CreditCard,
    DollarSign,
    Building,
    Landmark,
    FileText
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Dialog, Transition } from '@headlessui/react';

// Enhanced message components (same as cash deposit)
function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{message}</span>
        </div>
    );
}

function SuccessMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-green-700">{message}</span>
        </div>
    );
}

type RTGSData = {
    id?: string;
    formReferenceId?: string;
    branchName?: string;
    orderingAccountNumber?: string;
    orderingCustomerName?: string;
    beneficiaryBank?: string;
    beneficiaryBranch?: string;
    beneficiaryAccountNumber?: string;
    beneficiaryName?: string;
    transferAmount?: number;
    paymentNarrative?: string;
    customerTelephone?: string;
    tokenNumber?: string;
    queueNumber?: number;
    submittedAt?: string;
    status?: string;
};

export default function RTGSTransferConfirmation() {
    const { t } = useTranslation();
    const { phone } = useAuth();
    const { branch } = useBranch();
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [data, setData] = useState<RTGSData>({});

    const componentToPrintRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        content: () => componentToPrintRef.current,
        documentTitle: t('rtgsConfirmation', 'RTGS Transfer Confirmation'),
        pageStyle: `
            @page { size: auto; margin: 10mm; }
            @media print { 
                body { -webkit-print-color-adjust: exact; }
                .no-print { display: none !important; }
            }
        `,
    } as any);

    useEffect(() => {
        const initializeData = async () => {
            try {
                setIsLoading(true);
                setError('');

                // Check if we have API response data
                if (state?.api) {
                    const api = state.api;
                    
                    // Handle both direct API response and nested data structure
                    const apiData = api.data || api;
                    
                    console.log('RTGS API Response:', api);
                    console.log('Processed RTGS Data:', apiData);

                    setData({
                        id: apiData.Id || apiData.id,
                        formReferenceId: apiData.FormReferenceId || apiData.formReferenceId || apiData.ReferenceNumber,
                        branchName: apiData.BranchName || apiData.branchName || state?.branchName || branch?.name,
                        orderingAccountNumber: apiData.OrderingAccountNumber || apiData.orderingAccountNumber,
                        orderingCustomerName: apiData.OrderingCustomerName || apiData.orderingCustomerName,
                        beneficiaryBank: apiData.BeneficiaryBank || apiData.beneficiaryBank,
                        beneficiaryBranch: apiData.BeneficiaryBranch || apiData.beneficiaryBranch,
                        beneficiaryAccountNumber: apiData.BeneficiaryAccountNumber || apiData.beneficiaryAccountNumber,
                        beneficiaryName: apiData.BeneficiaryName || apiData.beneficiaryName,
                        transferAmount: apiData.TransferAmount ?? apiData.transferAmount,
                        paymentNarrative: apiData.PaymentNarrative || apiData.paymentNarrative,
                        customerTelephone: apiData.CustomerTelephone || apiData.customerTelephone || phone,
                        tokenNumber: apiData.TokenNumber || apiData.tokenNumber,
                        queueNumber: apiData.QueueNumber ?? apiData.queueNumber,
                        submittedAt: apiData.SubmittedAt || apiData.submittedAt || new Date().toISOString(),
                        status: apiData.Status || apiData.status || 'Submitted',
                    });
                    setIsLoading(false);
                    return;
                }

                // Fallback to form data if no API response
                if (state?.formData) {
                    setData({
                        formReferenceId: state.formData.formReferenceId,
                        branchName: state.formData.branchName,
                        orderingAccountNumber: state.formData.orderingAccountNumber,
                        orderingCustomerName: state.formData.orderingCustomerName,
                        beneficiaryBank: state.formData.beneficiaryBank,
                        beneficiaryBranch: state.formData.beneficiaryBranch,
                        beneficiaryAccountNumber: state.formData.beneficiaryAccountNumber,
                        beneficiaryName: state.formData.beneficiaryName,
                        transferAmount: state.formData.transferAmount,
                        paymentNarrative: state.formData.paymentNarrative,
                        customerTelephone: state.formData.customerTelephone,
                        submittedAt: new Date().toISOString(),
                        status: 'Submitted'
                    });
                    setIsLoading(false);
                    return;
                }

                setError(t('noTransferData', 'No transfer data found. Please complete the RTGS transfer form first.'));
                setIsLoading(false);
            } catch (err: any) {
                console.error('Error initializing RTGS data:', err);
                setError(err?.message || t('loadFailed', 'Failed to load transfer details'));
                setIsLoading(false);
            }
        };

        initializeData();
    }, [state, t, branch, phone]);

    const handleNewTransfer = () => {
        navigate('/form/rtgs-transfer', { 
            state: { 
                showSuccess: false 
            } 
        });
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    const handleCancelTransfer = async () => {
        if (!data.id) return;
        
        try {
            setSubmitting(true);
            setError('');
            // Note: You'll need to implement cancelRTGSTransfer in your service
            // const response = await cancelRTGSTransfer(data.id);
            // if (response.success) {
            //     setSuccessMessage(response.message || t('transferCancelled', 'Transfer cancelled successfully'));
            //     setShowCancelModal(false);
            //     setTimeout(() => {
            //         navigate('/form/rtgs-transfer', {
            //             state: {
            //                 showSuccess: true,
            //                 successMessage: response.message || t('transferCancelled', 'Transfer cancelled successfully')
            //             }
            //         });
            //     }, 1500);
            // } else {
            //     throw new Error(response.message || t('cancelTransferFailed', 'Failed to cancel transfer'));
            // }
            throw new Error('Cancel functionality not implemented yet');
        } catch (e: any) {
            setError(e?.message || t('cancelTransferFailed', 'Failed to cancel transfer. Please try again.'));
        } finally {
            setSubmitting(false);
        }
    };

    // Format date for display
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return 'N/A';
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-700 mx-auto mb-4"></div>
                        <p className="text-gray-600">{t('loading', 'Loading...')}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !data.formReferenceId) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('error', 'Error')}</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => navigate('/form/rtgs-transfer')}
                                className="bg-fuchsia-700 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-800"
                            >
                                {t('returnToForm', 'Return to Form')}
                            </button>
                            <button
                                onClick={handleBackToDashboard}
                                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                            >
                                {t('backToDashboard', 'Back to Dashboard')}
                            </button>
                        </div>
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
                                        <h1 className="text-lg font-bold">{t('rtgsConfirmation', 'RTGS Transfer Confirmation')}</h1>
                                        <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>{data.branchName || branch?.name || t('selectedBranch', 'Selected Branch')}</span>
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
                            <p className="text-gray-600 text-sm">{t('transferSubmitted', 'Your RTGS transfer has been submitted.')}</p>
                        </div>

                        {/* Queue and Token Cards with improved colors */}
                        {(data.queueNumber || data.tokenNumber) && (
                            <div className="mb-4">
                                <div className="grid grid-cols-2 gap-3">
                                    {data.queueNumber && (
                                        <div className="bg-gradient-to-r from-amber-300 to-amber-400 p-3 rounded-lg text-center text-amber-900 shadow-sm">
                                            <div className="flex items-center justify-center gap-1 mb-1">
                                                <MapPin className="h-3 w-3" />
                                                <span className="text-xs font-medium">{t('queueNumber', 'Queue #')}</span>
                                            </div>
                                            <p className="text-2xl font-bold">{data.queueNumber}</p>
                                        </div>
                                    )}
                                    {data.tokenNumber && data.tokenNumber !== 'N/A' && (
                                        <div className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 p-3 rounded-lg text-center text-white shadow-sm">
                                            <div className="flex items-center justify-center gap-1 mb-1">
                                                <CreditCard className="h-3 w-3" />
                                                <span className="text-xs font-medium">{t('token', 'Token')}</span>
                                            </div>
                                            <p className="text-2xl font-bold">{data.tokenNumber}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

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
                                            {t('referenceNumber', 'Reference')}:
                                        </span>
                                        <span className="font-mono font-semibold">{data.formReferenceId || 'Pending'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {t('customer', 'Customer')}:
                                        </span>
                                        <span className="text-right font-semibold">{data.orderingCustomerName || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <CreditCard className="h-3 w-3" />
                                            {t('fromAccount', 'From Account')}:
                                        </span>
                                        <span className="font-mono font-semibold">{data.orderingAccountNumber || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {t('beneficiary', 'Beneficiary')}:
                                        </span>
                                        <span className="font-semibold">{data.beneficiaryName || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <CreditCard className="h-3 w-3" />
                                            {t('toAccount', 'To Account')}:
                                        </span>
                                        <span className="font-mono font-semibold">{data.beneficiaryAccountNumber || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <Building className="h-3 w-3" />
                                            {t('bankBranch', 'Bank/Branch')}:
                                        </span>
                                        <span className="text-right">{data.beneficiaryBank || 'N/A'}{data.beneficiaryBranch ? ` / ${data.beneficiaryBranch}` : ''}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <DollarSign className="h-3 w-3" />
                                            {t('amount', 'Amount')}:
                                        </span>
                                        <span className="text-lg font-bold text-amber-700">
                                            {data.transferAmount ? `${data.transferAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB` : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {t('status', 'Status')}:
                                        </span>
                                        <span className={`font-medium ${
                                            data.status === 'Completed' || data.status === 'COMPLETED' ? 'text-green-600' :
                                            data.status === 'Pending' || data.status === 'PENDING' ? 'text-yellow-600' :
                                            data.status === 'Failed' || data.status === 'FAILED' ? 'text-red-600' :
                                            'text-blue-600'
                                        }`}>
                                            {data.status || 'Submitted'}
                                        </span>
                                    </div>
                                    {data.paymentNarrative && (
                                        <div className="flex justify-between items-start py-1 border-t border-amber-100 mt-2 pt-2">
                                            <span className="font-medium text-amber-800 flex items-center gap-1">
                                                <FileText className="h-3 w-3" />
                                                {t('narrative', 'Narrative')}:
                                            </span>
                                            <span className="text-right text-sm max-w-xs">{data.paymentNarrative}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center py-1 border-t border-amber-100 mt-2 pt-2">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {t('submittedAt', 'Submitted')}:
                                        </span>
                                        <span className="text-sm text-amber-600">{formatDate(data.submittedAt)}</span>
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

                        {/* Cancel Button - Only show if transfer can be cancelled */}
                        {data.id && (data.status === 'Pending' || data.status === 'PENDING') && (
                            <div className="mt-2">
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    disabled={submitting}
                                    className="flex items-center justify-center gap-1 w-full bg-rose-500 hover:bg-rose-600 text-white px-2 py-2 rounded-lg disabled:opacity-50 font-medium transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                    {submitting ? t('cancelling', 'Cancelling...') : t('cancel', 'Cancel')}
                                </button>
                            </div>
                        )}

                        {/* Back to Dashboard Button */}
                        <div className="mt-2">
                            <button
                                onClick={handleBackToDashboard}
                                className="flex items-center justify-center gap-1 w-full border border-amber-300 text-amber-700 hover:bg-amber-50 px-2 py-2 rounded-lg font-medium transition-colors"
                            >
                                {t('backToDashboard', 'Back to Dashboard')}
                            </button>
                        </div>

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
                                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                                            {t('confirmCancellation', 'Confirm Cancellation')}
                                        </Dialog.Title>
                                        
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500">
                                                {t('cancelTransferPrompt', 'Are you sure you want to cancel this RTGS transfer? This action cannot be undone.')}
                                            </p>
                                        </div>

                                        {error && <ErrorMessage message={error} />}

                                        <div className="mt-6 flex justify-end gap-3">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50"
                                                onClick={() => setShowCancelModal(false)}
                                                disabled={submitting}
                                            >
                                                {t('goBack', 'Go Back')}
                                            </button>
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-lg border border-transparent bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50"
                                                onClick={handleCancelTransfer}
                                                disabled={submitting}
                                            >
                                                {submitting ? t('cancelling', 'Cancelling...') : t('yesCancelTransfer', 'Yes, Cancel Transfer')}
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