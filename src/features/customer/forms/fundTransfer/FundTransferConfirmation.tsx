import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { Plane, User, CreditCard, DollarSign, Building } from 'lucide-react';
import { getFundTransferById, cancelFundTransferByCustomer } from '../../../../services/fundTransferService';
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
} from '../../components/SharedConfirmationComponents';
import { formatAmount, formatQueueToken, getEntityId, initializeData } from '../../utils/confirmationHelpers';

interface TransferData {
    id?: string;
    debitAccountNumber?: string;
    creditAccountNumber?: string;
    accountHolderName?: string;
    amount?: number;
    tokenNumber?: string;
    queueNumber?: number;
    status?: string;
}

export default function FundTransferConfirmation() {
    const { t } = useTranslation();
    const authContext = useAuth();
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    const { branch } = useBranch();
    
    const phone = authContext?.phone || null;
    
    const [transferData, setTransferData] = useState<TransferData>({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const componentToPrintRef = useRef<HTMLDivElement>(null);
    const handlePrint = usePrint(componentToPrintRef as React.RefObject<HTMLDivElement>, t('transferConfirmation', 'Transfer Confirmation'));

    const branchName = branch?.name || t('selectedBranch', 'Selected Branch');
    const entityId = getEntityId(transferData);
    const canUpdateCancel = entityId && transferData.status?.toLowerCase() === 'pending';

    useEffect(() => {
        const initializeData = async () => {
            try {
                setIsLoading(true);
                setError('');
                
                if (state?.serverData?.data) {
                    setTransferData(state.serverData.data);
                } else if (state?.updateId) {
                    const response = await getFundTransferById(state.updateId);
                    if (response.success && response.data) {
                        setTransferData(response.data);
                    } else {
                        setError(response.message || t('loadFailed', 'Failed to load transfer details'));
                    }
                } else {
                    setError(t('invalidState', 'Invalid request state. Please start over.'));
                }
            } catch (err: any) {
                setError(err?.message || t('loadFailed', 'Failed to load transfer details'));
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, [state, t]);

    const handleCancel = async () => {
        if (!entityId) {
            setError(t('noTransferId', 'No transfer ID available'));
            return;
        }
        
        try {
            setIsSubmitting(true);
            setError('');
            const response = await cancelFundTransferByCustomer(entityId);
            if (response.success) {
                setSuccessMessage(response.message || t('transferCancelled', 'Transfer request cancelled successfully'));
                setShowCancelModal(false);
                setTimeout(() => {
                    navigate('/form/fund-transfer', {
                        state: {
                            showSuccess: true,
                            successMessage: response.message || t('transferCancelled', 'Transfer request cancelled successfully')
                        }
                    });
                }, 1500);
            } else {
                setError(response.message || t('cancelFailed', 'Failed to cancel transfer'));
            }
        } catch (err: any) {
            setError(err?.message || t('cancelFailed', 'Failed to cancel transfer'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!entityId) {
            setError(t('noTransferId', 'No transfer ID available'));
            return;
        }
        
        setIsSubmitting(true);
        setError('');
        try {
            const response = await getFundTransferById(entityId);
            if (response.success && response.data) {
                navigate('/form/fund-transfer', {
                    state: {
                        updateId: entityId,
                        formData: {
                            debitAccountNumber: response.data.debitAccountNumber,
                            creditAccountNumber: response.data.creditAccountNumber,
                            amount: response.data.amount,
                        },
                        tokenNumber: response.data.tokenNumber,
                        queueNumber: response.data.queueNumber
                    }
                });
            } else {
                setError(response.message || t('updateFailed', 'Failed to prepare transfer update.'));
            }
        } catch (err: any) {
            setError(err?.message || t('updateFailed', 'Failed to prepare transfer update.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNewTransfer = () => navigate('/form/fund-transfer');
    const handleBackToDashboard = () => navigate('/dashboard');

    useEffect(() => {
        if (error && !entityId && error === t('invalidState', 'Invalid request state. Please start over.')) {
            const timer = setTimeout(() => navigate('/form/fund-transfer'), 3000);
            return () => clearTimeout(timer);
        }
    }, [error, entityId, navigate, t]);

    if (isLoading) return <LoadingState message={t('loading', 'Loading transfer details...')} />;
    
    if (error && !entityId) return (
        <ErrorState
            error={error}
            onPrimaryAction={() => navigate('/form/fund-transfer')}
            onSecondaryAction={handleBackToDashboard}
            primaryLabel={t('goToTransfer', 'Go to Transfer')}
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
                        icon={Plane}
                        title={t('transferConfirmation', 'Transfer Confirmation')}
                        branchName={branchName}
                        phone={phone || ''}
                    />

                    <div ref={componentToPrintRef} className="p-4">
                        <SuccessIcon
                            title={t('success', 'Success!')}
                            message={t('transferSubmitted', 'Your transfer request has been submitted.')}
                        />

                        <QueueTokenCards 
                            queueNumber={formatQueueToken(transferData.queueNumber)} 
                            tokenNumber={formatQueueToken(transferData.tokenNumber)} 
                        />

                        <div className="mb-4">
                            <div className="bg-amber-25 rounded-lg p-4 border border-amber-200 shadow-sm">
                                <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    {t('transactionSummary', 'Transaction Summary')}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <SummaryRow icon={User} label={t('fromAccount', 'From Account')} value={transferData.debitAccountNumber || 'N/A'} isMono />
                                    <SummaryRow icon={User} label={t('toAccount', 'To Account')} value={transferData.creditAccountNumber || 'N/A'} isMono />
                                    <SummaryRow icon={Building} label={t('branch', 'Branch')} value={branchName} />
                                    <SummaryRow icon={DollarSign} label={t('amount', 'Amount')} value={formatAmount(transferData.amount)} isBold />
                                </div>
                            </div>
                        </div>

                        <div className="text-center pt-3 border-t border-amber-200">
                            <p className="text-amber-700 text-xs">{t('thankYouBanking', 'Thank you for banking with us!')}</p>
                        </div>
                    </div>

                    <ActionButtons
                        onNew={handleNewTransfer}
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
                    message={t('cancelTransferConfirmation', 'Are you sure you want to cancel this transfer? This action cannot be undone.')}
                />
            </div>
        </div>
    );
}

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
