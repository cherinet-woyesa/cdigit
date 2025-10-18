import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { cancelEBankingApplicationByCustomer } from '../../../../services/eBankingApplicationService';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';
import { 
    CheckCircle2, 
    Printer, 
    AlertCircle,
    Loader2,
    Edit,
    X,
    Wifi,
    MapPin,
    Calendar,
    User,
    CreditCard,
    DollarSign,
    Phone,
    RefreshCw,
    AlertTriangle
} from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';


// Enhanced message components
function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
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

const E_BANKING_OPTIONS = [
    { id: 'mobile_banking', label: 'Mobile Banking', icon: '📱' },
    { id: 'internet_banking', label: 'Internet Banking', icon: '💻' },
    { id: 'ussd', label: 'USSD Banking', icon: ' *️⃣' },
    { id: 'card_banking', label: 'Card Banking', icon: '💳' },
];

export default function EBankingConfirmation() {
    const { t } = useTranslation();
    const location = useLocation() as { state?: any };
    const navigate = useNavigate();
    const { phone, user } = useAuth();
    const { branch } = useBranch();
    
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);


    const componentToPrintRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        content: () => componentToPrintRef.current,
        documentTitle: `E-Banking-Application-${data?.tokenNumber || ''}`,
        pageStyle: `
            @page { size: auto; margin: 10mm; }
            @media print { 
                body { -webkit-print-color-adjust: exact; }
                .no-print { display: none !important; }
            }
        `,
    } as any);

    useEffect(() => {
        const initializeData = () => {
            try {
                const state = location.state;
                if (!state) {
                    setError(t('noDataAvailable', 'No confirmation data available'));
                    setIsLoading(false);
                    return;
                }

                // Use server data with fallback to UI data
                const serverData = state.serverData?.data || state.serverData || state.api?.data || state.api;
                const uiData = state.ui || {};

                const services = serverData?.ServicesRequested 
                    ? String(serverData.ServicesRequested).split(',').map((s: string) => s.trim()).filter(Boolean)
                    : (uiData.ebankingChannels || []);

                setData({
                    formReferenceId: serverData?.FormReferenceId || serverData?.formReferenceId || 'N/A',
                    branchName: state.branchName || serverData?.BranchName || branch?.name || 'N/A',
                    accountNumber: serverData?.AccountNumber || uiData.accountNumber || 'N/A',
                    customerName: serverData?.AccountHolderName || uiData.accountHolderName || 'N/A',
                    mobileNumber: uiData.mobileNumber || uiData.telephoneNumber || phone || 'N/A',
                    ebankingChannels: services,
                    queueNumber: serverData?.QueueNumber || serverData?.queueNumber || 'N/A',
                    tokenNumber: serverData?.TokenNumber || serverData?.tokenNumber || 'N/A',
                    status: serverData?.Status || serverData?.status || 'OnQueue',
                    message: serverData?.Message || serverData?.message || t('defaultSuccessMessage', 'Your application has been submitted successfully.'),
                    submittedAt: new Date().toISOString(),
                });
            } catch (err) {
                console.error('Error initializing data:', err);
                setError(t('dataLoadError', 'Failed to load confirmation data'));
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, [location.state, branch, phone, t]);

    const handleCancel = async () => {
        if (!data?.formReferenceId || data.formReferenceId === 'N/A') {
            setError(t('noApplicationId', 'No application ID available for cancellation'));
            return;
        }

        try {
            setIsCancelling(true);
            setError('');
            const response = await cancelEBankingApplicationByCustomer(data.formReferenceId);
            
            if (response.success) {
                setSuccessMessage(response.message || t('applicationCancelled', 'Application cancelled successfully'));
                setShowCancelModal(false);
                setTimeout(() => navigate('/dashboard'), 2000);
            } else {
                setError(response.message || t('cancelFailed', 'Failed to cancel application'));
            }
        } catch (err: any) {
            setError(err?.message || t('cancelFailed', 'Failed to cancel application'));
        } finally {
            setIsCancelling(false);
        }
    };

    const handleUpdate = () => {
        if (!data?.formReferenceId || data.formReferenceId === 'N/A') return;
        navigate('/form/ebanking', { state: { updateId: data.formReferenceId } });
    };

    const handleNewApplication = () => {
        navigate('/form/ebanking');
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <Loader2 className="h-12 w-12 text-fuchsia-700 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">{t('loading', 'Loading...')}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !data) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('error', 'Error')}</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={handleNewApplication}
                                className="bg-fuchsia-700 text-white px-6 py-2 rounded-lg hover:bg-fuchsia-800"
                            >
                                {t('newApplication', 'New Application')}
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
                                        <Wifi className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold">{t('eBankingApplication', 'E-Banking Application')}</h1>
                                        <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>{data?.branchName || branch?.name || t('branch', 'Branch')}</span>
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
                            <p className="text-gray-600 text-sm">{data?.message || t('defaultSuccessMessage', 'Your application has been submitted successfully.')}</p>
                        </div>

                        {/* Queue and Token Cards with improved colors */}
                        <div className="mb-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gradient-to-r from-amber-300 to-amber-400 p-3 rounded-lg text-center text-amber-900 shadow-sm">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <MapPin className="h-3 w-3" />
                                        <span className="text-xs font-medium">{t('queueNumber', 'Queue #')}</span>
                                    </div>
                                    <p className="text-2xl font-bold">{data?.queueNumber || 'N/A'}</p>
                                </div>
                                <div className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 p-3 rounded-lg text-center text-white shadow-sm">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <CreditCard className="h-3 w-3" />
                                        <span className="text-xs font-medium">{t('token', 'Token')}</span>
                                    </div>
                                    <p className="text-2xl font-bold">{data?.tokenNumber || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Transaction Summary with softer background */}
                        <div className="mb-4">
                            <div className="bg-amber-25 rounded-lg p-4 border border-amber-200 shadow-sm">
                                <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    {t('applicationDetails', 'Application Details')}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800">{t('customerName', 'Customer Name')}:</span>
                                        <span className="font-semibold text-right">{data?.customerName || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800">{t('accountNumber', 'Account Number')}:</span>
                                        <span className="font-mono font-semibold">{data?.accountNumber || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800">{t('mobileNumber', 'Mobile Number')}:</span>
                                        <span>{data?.mobileNumber || 'N/A'}</span>
                                    </div>
                                    {data?.ebankingChannels?.length > 0 && (
                                        <div className="flex justify-between items-start py-1 border-b border-amber-100">
                                            <span className="font-medium text-amber-800">{t('requestedServices', 'Services')}:</span>
                                            <div className="flex flex-wrap gap-1 justify-end">
                                                {data.ebankingChannels.map((channel: string) => {
                                                    const option = E_BANKING_OPTIONS.find(opt => opt.id === channel);
                                                    return (
                                                        <span key={channel} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs">
                                                            <span>{option?.icon}</span>
                                                            <span>{option?.label || channel}</span>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center py-1">
                                        <span className="font-medium text-amber-800">{t('status', 'Status')}:</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            data?.status === 'OnQueue' 
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {data?.status || t('pending', 'Pending')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Thank You Message */}
                        <div className="text-center pt-3 border-t border-amber-200">
                            <p className="text-amber-700 text-xs">{t('thankYouForBanking', 'Thank you for banking with us!')}</p>
                        </div>
                    </div>

                    {/* Action Buttons with improved colors */}
                    <div className="p-4 border-t border-amber-200 no-print">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleNewApplication}
                                className="flex items-center justify-center gap-1 w-full bg-amber-500 hover:bg-amber-600 text-white px-2 py-2 rounded-lg font-medium transition-colors"
                            >
                                <RefreshCw className="h-3 w-3" />
                                {t('newApplication', 'New')}
                            </button>
                            
                            <button
                                onClick={handlePrint}
                                className="flex items-center justify-center gap-1 w-full bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-800 px-2 py-2 rounded-lg font-medium transition-colors"
                            >
                                <Printer className="h-3 w-3" />
                                {t('print', 'Print')}
                            </button>
                        </div>

                        {data?.formReferenceId && data.formReferenceId !== 'N/A' && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <button
                                    onClick={handleUpdate}
                                    className="flex items-center justify-center gap-1 w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white px-2 py-2 rounded-lg font-medium transition-colors"
                                >
                                    <Edit className="h-3 w-3" />
                                    {t('update', 'Update')}
                                </button>
                                
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    disabled={isCancelling}
                                    className="flex items-center justify-center gap-1 w-full bg-rose-500 hover:bg-rose-600 text-white px-2 py-2 rounded-lg disabled:opacity-50 font-medium transition-colors"
                                >
                                    {isCancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                                    {t('cancel', 'Cancel')}
                                </button>
                            </div>
                        )}

                        {/* Messages */}
                        {error && <div className="mt-3"><ErrorMessage message={error} /></div>}
                        {successMessage && <div className="mt-3"><SuccessMessage message={successMessage} /></div>}
                    </div>
                </div>

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
                                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                                            {t('confirmCancellation', 'Confirm Cancellation')}
                                        </Dialog.Title>
                                        
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500">
                                                {t('cancelEBankingPrompt', 'Are you sure you want to cancel this E-Banking application? This action cannot be undone.')}
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
                                                {isCancelling ? t('cancelling', 'Cancelling...') : t('yesCancel', 'Yes, Cancel')}
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