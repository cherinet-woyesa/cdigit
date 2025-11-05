// features/customer/forms/checkWithdrawal/CheckWithdrawalConfirmation.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useBranch } from '../../../../context/BranchContext';
import { FileText, User, CreditCard, DollarSign } from 'lucide-react';
import { getCheckWithdrawalById } from '../../../../services/checkWithdrawalService';
import {
    SuccessHeader,
    SuccessIcon,
    ActionButtons,
    StatusMessage,
    usePrint,
    LoadingState,
    ErrorState
} from '../../components/SharedConfirmationComponents';
import { formatAmount, getEntityId } from '../../utils/confirmationHelpers';

interface CheckWithdrawalData {
    id?: string;
    accountNumber?: string;
    amount?: number;
    chequeNo?: string;
    status?: string;
}

export default function CheckWithdrawalConfirmation() {
    const { t } = useTranslation();
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    const { branch } = useBranch();
    
    const [checkWithdrawalData, setCheckWithdrawalData] = useState<CheckWithdrawalData>({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const componentToPrintRef = useRef<HTMLDivElement>(null);
    const handlePrint = usePrint(componentToPrintRef as React.RefObject<HTMLDivElement>, t('checkWithdrawalConfirmation', 'Check Withdrawal Confirmation'));

    const branchName = branch?.name || t('selectedBranch', 'Selected Branch');
    const entityId = getEntityId(checkWithdrawalData);

    useEffect(() => {
        const initializeData = async () => {
            try {
                setIsLoading(true);
                setError('');
                
                if (state?.serverData?.data) {
                    setCheckWithdrawalData(state.serverData.data);
                } else if (state?.updateId) {
                    const response = await getCheckWithdrawalById(state.updateId);
                    if (response.success && response.data) {
                        setCheckWithdrawalData(response.data);
                    } else {
                        setError(response.message || t('loadFailed', 'Failed to load check withdrawal details'));
                    }
                } else {
                    setError(t('invalidState', 'Invalid request state. Please start over.'));
                }
            } catch (err: any) {
                setError(err?.message || t('loadFailed', 'Failed to load check withdrawal details'));
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, [state, t]);

    const handleNewCheckWithdrawal = () => navigate('/form/check-withdrawal');
    const handleBackToDashboard = () => navigate('/dashboard');

    if (isLoading) return <LoadingState message={t('loading', 'Loading check withdrawal details...')} />;
    
    if (error && !entityId) return (
        <ErrorState
            error={error}
            onPrimaryAction={() => navigate('/form/check-withdrawal')}
            onSecondaryAction={handleBackToDashboard}
            primaryLabel={t('goToChequeWithdrawal', 'Go to Check Withdrawal')}
            secondaryLabel={t('backToDashboard', 'Back to Dashboard')}
        />
    );

    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <SuccessHeader
                        icon={FileText}
                        title={t('checkWithdrawalConfirmation', 'Check Withdrawal Confirmation')}
                        branchName={branchName}
                        phone={null}
                    />

                    <div ref={componentToPrintRef} className="p-4">
                        <SuccessIcon
                            title={t('success', 'Success!')}
                            message={t('checkWithdrawalSubmitted', 'Your check withdrawal request has been submitted.')}
                        />

                        <div className="mb-4">
                            <div className="bg-amber-25 rounded-lg p-4 border border-amber-200 shadow-sm">
                                <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    {t('confirmationSummary', 'Confirmation Summary')}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <SummaryRow icon={CreditCard} label={t('accountNumber', 'Account Number')} value={checkWithdrawalData.accountNumber || 'N/A'} isMono />
                                    <SummaryRow icon={DollarSign} label={t('amount', 'Amount')} value={formatAmount(checkWithdrawalData.amount)} isBold />
                                    <SummaryRow icon={FileText} label={t('chequeNo', 'Cheque Number')} value={checkWithdrawalData.chequeNo || 'N/A'} />
                                </div>
                            </div>
                        </div>

                        <div className="text-center pt-3 border-t border-amber-200">
                            <p className="text-amber-700 text-xs">{t('thankYouBanking', 'Thank you for banking with us!')}</p>
                        </div>
                    </div>

                    <ActionButtons
                        onNew={handleNewCheckWithdrawal}
                        onPrint={handlePrint}
                    />

                    {error && <StatusMessage type="error" message={error} />}
                </div>
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
