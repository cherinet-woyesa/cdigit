// features/customer/forms/corporateCustomer/CorporateCustomerConfirmation.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useBranch } from '@context/BranchContext';
import { FileText, Building, User, Phone, Mail } from 'lucide-react';
import { getCorporateCustomerById } from '@services/corporateCustomerService';
import {
    SuccessHeader,
    SuccessIcon,
    ActionButtons,
    StatusMessage,
    usePrint,
    LoadingState,
    ErrorState
} from '@features/customer/components/SharedConfirmationComponents';
import { getEntityId } from '@features/customer/utils/confirmationHelpers';

interface CorporateCustomerData {
    id?: string;
    businessName?: string;
    businessType?: string;
    fullName?: string;
    phoneNumber?: string;
    email?: string;
    status?: string;
}

export default function CorporateCustomerConfirmation() {
    const { t } = useTranslation();
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    const { branch } = useBranch();
    
    const [customerData, setCustomerData] = useState<CorporateCustomerData>({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const componentToPrintRef = useRef<HTMLDivElement>(null);
    const handlePrint = usePrint(componentToPrintRef as React.RefObject<HTMLDivElement>, t('corporateCustomerConfirmation', 'Corporate Customer Confirmation'));

    const branchName = branch?.name || t('selectedBranch', 'Selected Branch');
    const entityId = getEntityId(customerData);

    useEffect(() => {
        const initializeData = async () => {
            try {
                setIsLoading(true);
                setError('');
                
                if (state?.serverData?.data) {
                    setCustomerData(state.serverData.data);
                } else if (state?.updateId) {
                    const response = await getCorporateCustomerById(state.updateId);
                    if (response.success && response.data) {
                        setCustomerData(response.data);
                    } else {
                        setError(response.message || t('loadFailed', 'Failed to load customer details'));
                    }
                } else {
                    setError(t('invalidState', 'Invalid request state. Please start over.'));
                }
            } catch (err: any) {
                setError(err?.message || t('loadFailed', 'Failed to load customer details'));
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, [state, t]);

    const handleNewCustomer = () => navigate('/form/corporate-customer');
    const handleBackToDashboard = () => navigate('/dashboard');

    if (isLoading) return <LoadingState message={t('loading', 'Loading customer details...')} />;
    
    if (error && !entityId) return (
        <ErrorState
            error={error}
            onPrimaryAction={() => navigate('/form/corporate-customer')}
            onSecondaryAction={handleBackToDashboard}
            primaryLabel={t('goToCorporateCustomer', 'Go to Corporate Customer Form')}
            secondaryLabel={t('backToDashboard', 'Back to Dashboard')}
        />
    );

    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <SuccessHeader
                        icon={FileText}
                        title={t('corporateCustomerConfirmation', 'Corporate Customer Confirmation')}
                        branchName={branchName}
                        phone={null}
                    />

                    <div ref={componentToPrintRef} className="p-4">
                        <SuccessIcon
                            title={t('success', 'Success!')}
                            message={t('customerCreated', 'The corporate customer has been created.')}
                        />

                        <div className="mb-4">
                            <div className="bg-amber-25 rounded-lg p-4 border border-amber-200 shadow-sm">
                                <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    {t('confirmationSummary', 'Confirmation Summary')}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <SummaryRow icon={Building} label={t('businessName', 'Business Name')} value={customerData.businessName || 'N/A'} />
                                    <SummaryRow icon={Building} label={t('businessType', 'Business Type')} value={customerData.businessType || 'N/A'} />
                                    <SummaryRow icon={User} label={t('contactPerson', 'Contact Person')} value={customerData.fullName || 'N/A'} />
                                    <SummaryRow icon={Phone} label={t('phoneNumber', 'Phone Number')} value={customerData.phoneNumber || 'N/A'} />
                                    <SummaryRow icon={Mail} label={t('email', 'Email')} value={customerData.email || 'N/A'} />
                                </div>
                            </div>
                        </div>

                        <div className="text-center pt-3 border-t border-amber-200">
                            <p className="text-amber-700 text-xs">{t('thankYouBanking', 'Thank you for banking with us!')}</p>
                        </div>
                    </div>

                    <ActionButtons
                        onNew={handleNewCustomer}
                        onPrint={handlePrint}
                    />

                    {error && <StatusMessage type="error" message={error} />}
                </div>
            </div>
        </div>
    );
}

function SummaryRow({ icon: Icon, label, value }: {
    icon: React.ComponentType<any>;
    label: string;
    value: string;
}) {
    return (
        <div className="flex justify-between items-center py-1 border-b border-amber-100">
            <span className="font-medium text-amber-800 flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {label}:
            </span>
            <span className="text-right font-semibold">
                {value}
            </span>
        </div>
    );
}
