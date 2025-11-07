// features/customer/forms/posDeliveryForm/POSDeliveryFormConfirmation.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useBranch } from '@context/BranchContext';
import { FileText, MapPin, User, Phone, Calendar } from 'lucide-react';
import { getPOSDeliveryFormById } from '@services/forms/posDeliveryFormService';
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

interface POSDeliveryFormData {
    id?: string;
    address?: string;
    city?: string;
    contactName?: string;
    contactPhone?: string;
    deliveryDate?: string;
    status?: string;
}

export default function POSDeliveryFormConfirmation() {
    const { t } = useTranslation();
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    const { branch } = useBranch();
    
    const [formData, setFormData] = useState<POSDeliveryFormData>({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const componentToPrintRef = useRef<HTMLDivElement>(null);
    const handlePrint = usePrint(componentToPrintRef as React.RefObject<HTMLDivElement>, t('posDeliveryFormConfirmation', 'POS Delivery Form Confirmation'));

    const branchName = branch?.name || t('selectedBranch', 'Selected Branch');
    const entityId = getEntityId(formData);

    useEffect(() => {
        const initializeData = async () => {
            try {
                setIsLoading(true);
                setError('');
                
                if (state?.serverData?.data) {
                    setFormData(state.serverData.data);
                } else if (state?.updateId) {
                    const response = await getPOSDeliveryFormById(state.updateId);
                    if (response.success && response.data) {
                        setFormData(response.data);
                    } else {
                        setError(response.message || t('loadFailed', 'Failed to load form details'));
                    }
                } else {
                    setError(t('invalidState', 'Invalid request state. Please start over.'));
                }
            } catch (err: any) {
                setError(err?.message || t('loadFailed', 'Failed to load form details'));
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, [state, t]);

    const handleNewForm = () => navigate('/form/pos-delivery');
    const handleBackToDashboard = () => navigate('/dashboard');

    if (isLoading) return <LoadingState message={t('loading', 'Loading form details...')} />;
    
    if (error && !entityId) return (
        <ErrorState
            error={error}
            onPrimaryAction={() => navigate('/form/pos-delivery')}
            onSecondaryAction={handleBackToDashboard}
            primaryLabel={t('goToPOSDeliveryForm', 'Go to POS Delivery Form')}
            secondaryLabel={t('backToDashboard', 'Back to Dashboard')}
        />
    );

    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <SuccessHeader
                        icon={FileText}
                        title={t('posDeliveryFormConfirmation', 'POS Delivery Form Confirmation')}
                        branchName={branchName}
                        phone={null}
                    />

                    <div ref={componentToPrintRef} className="p-4">
                        <SuccessIcon
                            title={t('success', 'Success!')}
                            message={t('formSubmitted', 'Your POS delivery form has been submitted.')}
                        />

                        <div className="mb-4">
                            <div className="bg-amber-25 rounded-lg p-4 border border-amber-200 shadow-sm">
                                <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    {t('confirmationSummary', 'Confirmation Summary')}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <SummaryRow icon={MapPin} label={t('address', 'Address')} value={`${formData.address}, ${formData.city}`} />
                                    <SummaryRow icon={User} label={t('contactName', 'Contact Name')} value={formData.contactName || 'N/A'} />
                                    <SummaryRow icon={Phone} label={t('contactPhone', 'Contact Phone')} value={formData.contactPhone || 'N/A'} />
                                    <SummaryRow icon={Calendar} label={t('deliveryDate', 'Delivery Date')} value={formData.deliveryDate || 'N/A'} />
                                </div>
                            </div>
                        </div>

                        <div className="text-center pt-3 border-t border-amber-200">
                            <p className="text-amber-700 text-xs">{t('thankYouBanking', 'Thank you for banking with us!')}</p>
                        </div>
                    </div>

                    <ActionButtons
                        onNew={handleNewForm}
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
