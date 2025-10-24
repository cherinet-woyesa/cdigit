import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext';
import { ArrowRightLeft, CreditCard, DollarSign, Building } from 'lucide-react';
import { cancelFundTransferByCustomer, getFundTransferById } from '../../../../services/fundTransferService';
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

export default function FundTransferConfirmation() {
    const { t } = useTranslation();
    const { phone } = useAuth();
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    
    const [serverData, setServerData] = useState<any>(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const componentToPrintRef = useRef<HTMLDivElement>(null);
    const handlePrint = usePrint(componentToPrintRef, t('fundTransferConfirmation', 'Fund Transfer Confirmation'));

    // Memoized data processing
    const { data, entityId, branchName, debitAccount, creditAccount, amount, token, queueNumber } = useMemo(() => {
        const rawData = serverData?.data || state?.serverData?.data || {};
        const processedData = initializeData(state, rawData);
        
        return {
            data: processedData,
            entityId: getEntityId(processedData),
            branchName: state?.branchName || t('selectedBranch', 'Selected Branch'),
            debitAccount: processedData.debitAccountNumber || 'N/A',
            creditAccount: processedData.creditAccountNumber || 'N/A',
            amount: formatAmount(processedData.amount),
            token: formatQueueToken(processedData.tokenNumber),
            queueNumber: formatQueueToken(processedData.queueNumber)
        };
    }, [serverData, state, t]);

    // Data fetching
    useEffect(() => {
        const fetchFundTransfer = async () => {
            if (data.id || error) return;
            
            const refId = data.formReferenceId || data.referenceId || data.ReferenceId;
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

    // Handlers
    const handleNewTransfer = () => navigate('/form/fund-transfer', { state: { showSuccess: false } });
    const handleUpdateTransfer = () => entityId && navigate('/form/fund-transfer', { state: { updateId: entityId } });

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
            setError(e?.message || t('cancelTransferFailed', 'Failed to cancel fund transfer.'));
        } finally {
            setSubmitting(false);
        }
    };

    // Loading and error states
    if (submitting && !data.id) return <LoadingState message={t('loading', 'Loading transfer details...')} />;
    if (error && !data.id) return (
        <ErrorState
            error={error}
            onPrimaryAction={() => navigate('/form/fund-transfer')}
            onSecondaryAction={() => navigate('/dashboard')}
            primaryLabel={t('goToTransfer', 'Go to Transfer')}
            secondaryLabel={t('backToDashboard', 'Back to Dashboard')}
        />
    );

    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <SuccessHeader
                        icon={ArrowRightLeft}
                        title={t('fundTransferConfirmation', 'Fund Transfer Confirmation')}
                        branchName={branchName}
                        phone={phone}
                    />

                    <div ref={componentToPrintRef} className="p-4">
                        <SuccessIcon
                            title={t('success', 'Success!')}
                            message={t('transferSubmitted', 'Your fund transfer has been submitted.')}
                        />

                        <QueueTokenCards queueNumber={queueNumber} tokenNumber={token} />

                        <div className="mb-4">
                            <div className="bg-amber-25 rounded-lg p-4 border border-amber-200 shadow-sm">
                                <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    {t('transactionSummary', 'Transaction Summary')}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <SummaryRow icon={CreditCard} label={t('debitAccount', 'Debit Account')} value={debitAccount} isMono />
                                    <SummaryRow icon={CreditCard} label={t('creditAccount', 'Credit Account')} value={creditAccount} isMono />
                                    <SummaryRow icon={Building} label={t('branch', 'Branch')} value={branchName} />
                                    <SummaryRow icon={DollarSign} label={t('amount', 'Amount')} value={amount} isBold />
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
                        onUpdate={handleUpdateTransfer}
                        onCancel={() => setShowCancelModal(true)}
                        showUpdateCancel={!!entityId}
                        isSubmitting={submitting}
                    />

                    {error && <StatusMessage type="error" message={error} />}
                    {successMessage && <StatusMessage type="success" message={successMessage} />}
                </div>

                <CancelModal
                    isOpen={showCancelModal}
                    onClose={() => setShowCancelModal(false)}
                    onConfirm={handleCancelTransfer}
                    isSubmitting={submitting}
                    title={t('confirmCancellation', 'Confirm Cancellation')}
                    message={t('cancelTransferConfirmation', 'Are you sure you want to cancel this fund transfer? This action cannot be undone.')}
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