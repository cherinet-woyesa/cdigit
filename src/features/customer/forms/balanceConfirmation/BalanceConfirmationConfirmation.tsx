import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { FileText, User, CreditCard, DollarSign, Building, Calendar, MapPin } from 'lucide-react';
import { getBalanceConfirmationById, cancelBalanceConfirmationByCustomer } from '../../../../services/balanceConfirmationService';
import {
    SuccessHeader,
    SuccessIcon,
    ActionButtons,
    CancelModal,
    StatusMessage,
    usePrint,
    LoadingState,
    ErrorState
} from '../../components/SharedConfirmationComponents';
import { formatAmount, getEntityId } from '../../utils/confirmationHelpers';

interface BalanceConfirmationData {
    id?: string;
    accountNumber?: string;
    customerName?: string;
    accountOpenedDate?: string;
    balanceAsOfDate?: string;
    creditBalance?: number;
    embassyOrConcernedOrgan?: string;
    location?: string;
    status?: string;
    branchManagerName?: string;
}

export default function BalanceConfirmationConfirmation() {
    const { t } = useTranslation();
    const authContext = useAuth();
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    const { branch } = useBranch();
    
    // Make phone number optional since we're removing auth requirement
    const phone = authContext?.phone || null;
    
    const [balanceConfirmationData, setBalanceConfirmationData] = useState<BalanceConfirmationData>({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const componentToPrintRef = useRef<HTMLDivElement>(null);
    const handlePrint = usePrint(componentToPrintRef as React.RefObject<HTMLDivElement>, t('balanceConfirmationConfirmation', 'Balance Confirmation'));

    const branchName = branch?.name || t('selectedBranch', 'Selected Branch');
    const entityId = getEntityId(balanceConfirmationData);
    const canUpdateCancel = entityId && balanceConfirmationData.status?.toLowerCase() === 'pending';

    // Data initialization
    useEffect(() => {
        const initializeData = async () => {
            try {
                setIsLoading(true);
                setError('');
                
                if (state?.serverData?.data) {
                    setBalanceConfirmationData(state.serverData.data);
                } else if (state?.updateId) {
                    const response = await getBalanceConfirmationById(state.updateId);
                    if (response.success && response.data) {
                        setBalanceConfirmationData(response.data);
                    } else {
                        setError(response.message || t('loadFailed', 'Failed to load balance confirmation details'));
                    }
                } else {
                    setError(t('invalidState', 'Invalid request state. Please start over.'));
                }
            } catch (err: any) {
                setError(err?.message || t('loadFailed', 'Failed to load balance confirmation details'));
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, [state, t]);

    // Handlers
    const handleCancel = async () => {
        if (!entityId) {
            setError(t('noBalanceConfirmationId', 'No balance confirmation ID available'));
            return;
        }
        
        try {
            setIsSubmitting(true);
            setError('');
            const response = await cancelBalanceConfirmationByCustomer(entityId);
            if (response.success) {
                setSuccessMessage(response.message || t('balanceConfirmationCancelled', 'Balance confirmation request cancelled successfully'));
                setShowCancelModal(false);
                setTimeout(() => {
                    navigate('/form/balance-confirmation', {
                        state: {
                            showSuccess: true,
                            successMessage: response.message || t('balanceConfirmationCancelled', 'Balance confirmation request cancelled successfully')
                        }
                    });
                }, 1500);
            } else {
                setError(response.message || t('cancelFailed', 'Failed to cancel balance confirmation'));
            }
        } catch (err: any) {
            setError(err?.message || t('cancelFailed', 'Failed to cancel balance confirmation'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!entityId) {
            setError(t('noBalanceConfirmationId', 'No balance confirmation ID available'));
            return;
        }
        
        setIsSubmitting(true);
        setError('');
        try {
            const response = await getBalanceConfirmationById(entityId);
            if (response.success && response.data) {
                navigate('/form/balance-confirmation', {
                    state: {
                        updateId: entityId,
                        formData: {
                            accountNumber: response.data.accountNumber,
                            customerName: response.data.customerName,
                            accountOpenedDate: response.data.accountOpenedDate,
                            balanceAsOfDate: response.data.balanceAsOfDate,
                            creditBalance: response.data.creditBalance,
                            embassyOrConcernedOrgan: response.data.embassyOrConcernedOrgan,
                            location: response.data.location,
                        }
                    }
                });
            } else {
                setError(response.message || t('updateFailed', 'Failed to prepare balance confirmation update.'));
            }
        } catch (err: any) {
            setError(err?.message || t('updateFailed', 'Failed to prepare balance confirmation update.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNewBalanceConfirmation = () => navigate('/form/balance-confirmation');
    const handleBackToDashboard = () => navigate('/dashboard');

    // Auto-redirect for invalid state
    useEffect(() => {
        if (error && !entityId && error === t('invalidState', 'Invalid request state. Please start over.')) {
            const timer = setTimeout(() => navigate('/form/balance-confirmation'), 3000);
            return () => clearTimeout(timer);
        }
    }, [error, entityId, navigate, t]);

    // Loading and error states
    if (isLoading) return <LoadingState message={t('loading', 'Loading balance confirmation details...')} />;
    
    if (error && !entityId) return (
        <ErrorState
            error={error}
            onPrimaryAction={() => navigate('/form/balance-confirmation')}
            onSecondaryAction={handleBackToDashboard}
            primaryLabel={t('goToBalanceConfirmation', 'Go to Balance Confirmation')}
            secondaryLabel={t('backToDashboard', 'Back to Dashboard')}
        />
    );

    if (successMessage) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <SuccessIcon title={t('success', 'Success!')} message={successMessage} />
                        <button
                            onClick={handleBackToDashboard}
                            className="mt-4 bg-fuchsia-700 text-white px-6 py-2 rounded-lg hover:bg-fuchsia-800 transition-colors"
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
                    <SuccessHeader
                        icon={FileText}
                        title={t('balanceConfirmationConfirmation', 'Balance Confirmation')}
                        branchName={branchName}
                        phone={phone || ''}
                    />

                    <div ref={componentToPrintRef} className="p-4">
                        <SuccessIcon
                            title={t('success', 'Success!')}
                            message={t('balanceConfirmationSubmitted', 'Your balance confirmation request has been submitted.')}
                        />

                        <div className="mb-4">
                            <div className="bg-amber-25 rounded-lg p-4 border border-amber-200 shadow-sm">
                                <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    {t('confirmationSummary', 'Confirmation Summary')}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <SummaryRow icon={User} label={t('customerName', 'Customer Name')} value={balanceConfirmationData.customerName || 'N/A'} />
                                    <SummaryRow icon={CreditCard} label={t('accountNumber', 'Account Number')} value={balanceConfirmationData.accountNumber || 'N/A'} isMono />
                                    <SummaryRow icon={Calendar} label={t('accountOpenedDate', 'Account Opened Date')} value={balanceConfirmationData.accountOpenedDate || 'N/A'} />
                                    <SummaryRow icon={Calendar} label={t('balanceAsOfDate', 'Balance As Of Date')} value={balanceConfirmationData.balanceAsOfDate || 'N/A'} />
                                    <SummaryRow icon={DollarSign} label={t('creditBalance', 'Credit Balance')} value={formatAmount(balanceConfirmationData.creditBalance)} isBold />
                                    {balanceConfirmationData.embassyOrConcernedOrgan && (
                                        <SummaryRow icon={Building} label={t('embassyOrganization', 'Embassy/Organization')} value={balanceConfirmationData.embassyOrConcernedOrgan} />
                                    )}
                                    {balanceConfirmationData.location && (
                                        <SummaryRow icon={MapPin} label={t('location', 'Location')} value={balanceConfirmationData.location} />
                                    )}
                                    <SummaryRow icon={Building} label={t('branch', 'Branch')} value={branchName} />
                                    {balanceConfirmationData.branchManagerName && (
                                        <SummaryRow icon={User} label={t('branchManager', 'Branch Manager')} value={balanceConfirmationData.branchManagerName} />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="text-center pt-3 border-t border-amber-200">
                            <p className="text-amber-700 text-xs">{t('thankYouBanking', 'Thank you for banking with us!')}</p>
                        </div>
                    </div>

                    <ActionButtons
                        onNew={handleNewBalanceConfirmation}
                        onPrint={handlePrint}
                        onUpdate={canUpdateCancel ? handleUpdate : undefined}
                        onCancel={canUpdateCancel ? () => setShowCancelModal(true) : undefined}
                        showUpdateCancel={!!canUpdateCancel}
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
                    message={t('cancelBalanceConfirmationConfirmation', 'Are you sure you want to cancel this balance confirmation request? This action cannot be undone.')}
                />
            </div>
        </div>
    );
}

// Helper component for summary rows
function SummaryRow({ icon: Icon, label, value, isMono = false, isBold = false }: {
    icon: React.ComponentType<any>;
    label: string;
    value: string;
    isMono?: boolean;
    isBold?: boolean;
}) {
    return (
        <div className="flex justify-between items-center py-1 border-b border-amber-100">
            <span className="font-medium text-amber-800 flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {label}:
            </span>
            <span className={`text-right ${isMono ? 'font-mono' : ''} ${isBold ? 'text-lg font-bold text-amber-700' : 'font-semibold'}`}>
                {value}
            </span>
        </div>
    );
}