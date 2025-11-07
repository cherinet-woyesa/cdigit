import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@context/AuthContext';
import { useBranch } from '@context/BranchContext';
import { Wifi, User, CreditCard, Phone, Building } from 'lucide-react';
import { cancelEBankingApplicationByCustomer } from '@services/forms/eBankingApplicationService';
import {
    SuccessHeader,
    SuccessIcon,
    QueueTokenCards,
    ActionButtons,
    CancelModal,
    StatusMessage,
    usePrint,
    LoadingState,
    ErrorState
} from '@features/customer/components/SharedConfirmationComponents';
import { formatQueueToken, getEntityId, initializeData } from '@features/customer/utils/confirmationHelpers';

const E_BANKING_OPTIONS = [
    { id: 'mobile_banking', label: 'Mobile Banking', icon: '📱' },
    { id: 'internet_banking', label: 'Internet Banking', icon: '💻' },
    { id: 'ussd', label: 'USSD Banking', icon: '*️⃣' },
    { id: 'card_banking', label: 'Card Banking', icon: '💳' },
];

export default function EBankingConfirmation() {
    const { t } = useTranslation();
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    const { phone } = useAuth();
    const { branch } = useBranch();
    
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);

    const componentToPrintRef = useRef<HTMLDivElement>(null);
    const handlePrint = usePrint(componentToPrintRef, t('eBankingApplication', 'E-Banking Application'));

    const entityId = data?.formReferenceId;
    const branchName = data?.branchName || branch?.name || t('branch', 'Branch');

    // Data initialization
    useEffect(() => {
        const loadData = () => {
            try {
                if (!state) {
                    setError('No confirmation data available');
                    setIsLoading(false);
                    return;
                }

                // Use the state data directly (already formatted from EBankingApplication)
                const services = state.ebankingChannels || [];

                setData({
                    formReferenceId: state.formReferenceId || 'N/A',
                    branchName: state.branchName || branchName,
                    accountNumber: state.accountNumber || 'N/A',
                    customerName: state.customerName || 'N/A',
                    mobileNumber: state.mobileNumber || phone || 'N/A',
                    ebankingChannels: services,
                    queueNumber: state.queueNumber || 'N/A',
                    tokenNumber: state.tokenNumber || 'N/A',
                    status: state.status || 'OnQueue',
                    message: state.message || 'Your application has been submitted successfully.',
                });
                setIsLoading(false);
            } catch (err) {
                console.error('Error loading confirmation data:', err);
                setError('Failed to load confirmation data');
                setIsLoading(false);
            }
        };

        loadData();
    }, [state, branchName, phone]);

    // Handlers
    const handleCancel = async () => {
        if (!entityId || entityId === 'N/A') {
            setError(t('noApplicationId', 'No application ID available for cancellation'));
            return;
        }

        try {
            setIsSubmitting(true);
            setError('');
            const response = await cancelEBankingApplicationByCustomer(entityId);
            
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
            setIsSubmitting(false);
        }
    };

    const handleUpdate = () => {
        if (!entityId || entityId === 'N/A') return;
        navigate('/form/ebanking', { state: { updateId: entityId } });
    };

    const handleNewApplication = () => navigate('/form/ebanking');
    const handleBackToDashboard = () => navigate('/dashboard');

    // Loading and error states
    if (isLoading) return <LoadingState message={t('loading', 'Loading...')} />;
    
    if (error && !data) return (
        <ErrorState
            error={error}
            onPrimaryAction={handleNewApplication}
            onSecondaryAction={handleBackToDashboard}
            primaryLabel={t('newApplication', 'New Application')}
            secondaryLabel={t('backToDashboard', 'Back to Dashboard')}
        />
    );

    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <SuccessHeader
                        icon={Wifi}
                        title={t('eBankingApplication', 'E-Banking Application')}
                        branchName={branchName}
                        phone={phone}
                    />

                    <div ref={componentToPrintRef} className="p-4">
                        <SuccessIcon
                            title={t('success', 'Success!')}
                            message={data?.message || t('defaultSuccessMessage', 'Your application has been submitted successfully.')}
                        />

                        <QueueTokenCards 
                            queueNumber={formatQueueToken(data?.queueNumber)} 
                            tokenNumber={formatQueueToken(data?.tokenNumber)} 
                        />

                        <div className="mb-4">
                            <div className="bg-amber-25 rounded-lg p-4 border border-amber-200 shadow-sm">
                                <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                                    <Building className="h-4 w-4" />
                                    {t('applicationDetails', 'Application Details')}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <SummaryRow icon={User} label={t('customerName', 'Customer Name')} value={data?.customerName || 'N/A'} />
                                    <SummaryRow icon={CreditCard} label={t('accountNumber', 'Account Number')} value={data?.accountNumber || 'N/A'} isMono />
                                    <SummaryRow icon={Phone} label={t('mobileNumber', 'Mobile Number')} value={data?.mobileNumber || 'N/A'} />
                                    {data?.ebankingChannels?.length > 0 && (
                                        <ServicesRow services={data.ebankingChannels} />
                                    )}
                                    <StatusRow status={data?.status} />
                                </div>
                            </div>
                        </div>

                        <div className="text-center pt-3 border-t border-amber-200">
                            <p className="text-amber-700 text-xs">{t('thankYouForBanking', 'Thank you for banking with us!')}</p>
                        </div>
                    </div>

                    <ActionButtons
                        onNew={handleNewApplication}
                        onPrint={handlePrint}
                        onUpdate={handleUpdate}
                        onCancel={() => setShowCancelModal(true)}
                        showUpdateCancel={!!entityId && entityId !== 'N/A'}
                        isSubmitting={isSubmitting}
                    />

                    {error && <StatusMessage type="error" message={error} />}
                    {successMessage && <StatusMessage type="success" message={successMessage} />}
                </div>

                <CancelModal
                    isOpen={showCancelModal}
                    onClose={() => setShowCancelModal(false)}
                    onConfirm={handleCancel}
                    isSubmitting={isSubmitting}
                    title={t('confirmCancellation', 'Confirm Cancellation')}
                    message={t('cancelEBankingPrompt', 'Are you sure you want to cancel this E-Banking application? This action cannot be undone.')}
                />
            </div>
        </div>
    );
}

// Helper components
function SummaryRow({ icon: Icon, label, value, isMono = false }: {
    icon: React.ComponentType<any>;
    label: string;
    value: string;
    isMono?: boolean;
}) {
    return (
        <div className="flex justify-between items-center py-1 border-b border-amber-100">
            <span className="font-medium text-amber-800">{label}:</span>
            <span className={`${isMono ? 'font-mono' : ''} font-semibold`}>{value}</span>
        </div>
    );
}

function ServicesRow({ services }: { services: string[] }) {
    const { t } = useTranslation();
    
    return (
        <div className="flex justify-between items-start py-1 border-b border-amber-100">
            <span className="font-medium text-amber-800">{t('requestedServices', 'Services')}:</span>
            <div className="flex flex-wrap gap-1 justify-end">
                {services.map((channel: string) => {
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
    );
}

function StatusRow({ status }: { status?: string }) {
    const { t } = useTranslation();
    
    return (
        <div className="flex justify-between items-center py-1">
            <span className="font-medium text-amber-800">{t('status', 'Status')}:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                status === 'OnQueue' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
                {status || t('pending', 'Pending')}
            </span>
        </div>
    );
}