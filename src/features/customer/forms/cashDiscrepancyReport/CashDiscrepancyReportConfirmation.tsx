// features/customer/forms/cashDiscrepancyReport/CashDiscrepancyReportConfirmation.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useBranch } from '@context/BranchContext';
import { FileText, DollarSign, Info, File } from 'lucide-react';
import { getCashDiscrepancyReportById } from '@services/transactions/cashDiscrepancyReportService';
import {
    SuccessHeader,
    SuccessIcon,
    ActionButtons,
    StatusMessage,
    usePrint,
    LoadingState,
    ErrorState
} from '@features/customer/components/SharedConfirmationComponents';
import { formatAmount, getEntityId } from '@features/customer/utils/confirmationHelpers';

interface CashDiscrepancyReportData {
    id?: string;
    discrepancyAmount?: number;
    description?: string;
    reason?: string;
    documentReference?: string;
    status?: string;
}

export default function CashDiscrepancyReportConfirmation() {
    const { t } = useTranslation();
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    const { branch } = useBranch();
    
    const [reportData, setReportData] = useState<CashDiscrepancyReportData>({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const componentToPrintRef = useRef<HTMLDivElement>(null);
    const handlePrint = usePrint(componentToPrintRef as React.RefObject<HTMLDivElement>, t('cashDiscrepancyReportConfirmation', 'Cash Discrepancy Report Confirmation'));

    const branchName = branch?.name || t('selectedBranch', 'Selected Branch');
    const entityId = getEntityId(reportData);

    useEffect(() => {
        const initializeData = async () => {
            try {
                setIsLoading(true);
                setError('');
                
                if (state?.serverData?.data) {
                    setReportData(state.serverData.data);
                } else if (state?.updateId) {
                    const response = await getCashDiscrepancyReportById(state.updateId);
                    if (response.success && response.data) {
                        setReportData(response.data);
                    } else {
                        setError(response.message || t('loadFailed', 'Failed to load report details'));
                    }
                } else {
                    setError(t('invalidState', 'Invalid request state. Please start over.'));
                }
            } catch (err: any) {
                setError(err?.message || t('loadFailed', 'Failed to load report details'));
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, [state, t]);

    const handleNewReport = () => navigate('/form/cash-discrepancy-report');
    const handleBackToDashboard = () => navigate('/dashboard');

    if (isLoading) return <LoadingState message={t('loading', 'Loading report details...')} />;
    
    if (error && !entityId) return (
        <ErrorState
            error={error}
            onPrimaryAction={() => navigate('/form/cash-discrepancy-report')}
            onSecondaryAction={handleBackToDashboard}
            primaryLabel={t('goToCashDiscrepancyReport', 'Go to Cash Discrepancy Report')}
            secondaryLabel={t('backToDashboard', 'Back to Dashboard')}
        />
    );

    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <SuccessHeader
                        icon={FileText}
                        title={t('cashDiscrepancyReportConfirmation', 'Cash Discrepancy Report Confirmation')}
                        branchName={branchName}
                        phone={null}
                    />

                    <div ref={componentToPrintRef} className="p-4">
                        <SuccessIcon
                            title={t('success', 'Success!')}
                            message={t('reportSubmitted', 'Your cash discrepancy report has been submitted.')}
                        />

                        <div className="mb-4">
                            <div className="bg-amber-25 rounded-lg p-4 border border-amber-200 shadow-sm">
                                <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    {t('confirmationSummary', 'Confirmation Summary')}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <SummaryRow icon={DollarSign} label={t('discrepancyAmount', 'Discrepancy Amount')} value={formatAmount(reportData.discrepancyAmount)} isBold />
                                    <SummaryRow icon={Info} label={t('description', 'Description')} value={reportData.description || 'N/A'} />
                                    <SummaryRow icon={Info} label={t('reason', 'Reason')} value={reportData.reason || 'N/A'} />
                                    {reportData.documentReference && (
                                        <SummaryRow icon={File} label={t('documentReference', 'Document Reference')} value={reportData.documentReference} />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="text-center pt-3 border-t border-amber-200">
                            <p className="text-amber-700 text-xs">{t('thankYouBanking', 'Thank you for banking with us!')}</p>
                        </div>
                    </div>

                    <ActionButtons
                        onNew={handleNewReport}
                        onPrint={handlePrint}
                    />

                    {error && <StatusMessage type="error" message={error} />}
                </div>
            </div>
        </div>
    );
}

function SummaryRow({ icon: Icon, label, value, isBold = false }: {
    icon: React.ComponentType<any>;
    label: string;
    value: string;
    isBold?: boolean;
}) {
    return (
        <div className="flex justify-between items-center py-1 border-b border-amber-100">
            <span className="font-medium text-amber-800 flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {label}:
            </span>
            <span className={`text-right ${isBold ? 'text-lg font-bold text-amber-700' : 'font-semibold'}`}>
                {value}
            </span>
        </div>
    );
}
