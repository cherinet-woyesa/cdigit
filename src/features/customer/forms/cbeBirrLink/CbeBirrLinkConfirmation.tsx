import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Printer, ArrowLeft, MapPin, User, Building } from 'lucide-react';
import { type CbeBirrLinkRequest } from '@services/cbeBirrService';
import {
    SuccessHeader,
    SuccessIcon,
    usePrint
} from '@features/customer/components/SharedConfirmationComponents';

const CbeBirrLinkConfirmation: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { state } = useLocation();
    
    const request = state?.request as CbeBirrLinkRequest | undefined;
    const componentToPrintRef = React.useRef<HTMLDivElement>(null!);
    const handlePrint = usePrint(componentToPrintRef, t('cbeBirrLink.confirmationTitle'));

    // Redirect if no request data
    useEffect(() => {
        if (!request) {
            navigate('/form/cbe-birr-link');
        }
    }, [request, navigate]);

    // Get action label
    const getActionLabel = (actionType: string) => {
        const labels: { [key: string]: string } = {
            'link': t('cbeBirrLink.actionLink'),
            'unlink': t('cbeBirrLink.actionUnlink'),
            'change_phone': t('cbeBirrLink.actionChangePhone'),
            'modify_end_date': t('cbeBirrLink.actionModifyEndDate')
        };
        return labels[actionType] || t('cbeBirrLink.actionRequest');
    };

    if (!request) {
        return null;
    }

    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4 print-confirmation">
            <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg overflow-hidden">
                <SuccessHeader
                    icon={CheckCircle2}
                    title={t('cbeBirrLink.requestSubmitted')}
                    branchName={request.branchName}
                    phone={''}
                />

                <div ref={componentToPrintRef} className="p-6">
                    <SuccessIcon
                        title={t('cbeBirrLink.success')}
                        message={t('cbeBirrLink.successMessage')}
                    />

                    {/* Request Summary */}
                    <div className="border border-amber-200 rounded-lg p-6 mb-6 bg-amber-25 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-amber-200 text-amber-700">
                            {t('cbeBirrLink.requestDetails')}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SummaryItem icon={MapPin} label={t('cbeBirrLink.formRefId')} value={request.formRefId} />
                            <SummaryItem icon={Building} label={t('cbeBirrLink.branchName')} value={request.branchName} />
                            <SummaryItem icon={User} label={t('cbeBirrLink.customerName')} value={request.fullName} />
                            <SummaryItem label={t('cbeBirrLink.selectedService')} value={getActionLabel(request.actionType)} />
                        </div>
                    </div>

                    {/* Next Steps */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="font-medium text-blue-800 mb-2">{t('cbeBirrLink.whatHappensNext')}</h3>
                        <p className="text-blue-700 text-sm">
                            {t('cbeBirrLink.nextStepsDescription')}
                        </p>
                    </div>

                    {/* Thank You Message */}
                    <div className="text-center pt-3 border-t border-amber-200">
                        <p className="text-amber-700 text-xs">{t('cbeBirrLink.thankYou')}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 border-t border-amber-200 no-print">
                    <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                        <button
                            onClick={() => navigate('/customer/dashboard')}
                            className="flex items-center justify-center px-4 py-2 border border-amber-300 rounded-md text-amber-700 bg-white hover:bg-amber-50 font-medium"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t('cbeBirrLink.backToDashboard')}
                        </button>
                        
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                            <button
                                onClick={handlePrint}
                                className="flex items-center justify-center px-4 py-2 border border-fuchsia-300 rounded-md text-fuchsia-700 bg-white hover:bg-fuchsia-50 font-medium"
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                {t('cbeBirrLink.printReceipt')}
                            </button>
                            
                            <button
                                onClick={() => navigate('/form/cbe-birr-link')}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-amber-500 hover:bg-amber-600 font-medium"
                            >
                                {t('cbeBirrLink.newRequest')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component for summary items
function SummaryItem({ icon: Icon, label, value }: {
    icon?: React.ComponentType<any>;
    label: string;
    value: string;
}) {
    return (
        <div>
            <p className="text-sm text-amber-600 flex items-center gap-1">
                {Icon && <Icon className="h-3 w-3" />}
                {label}
            </p>
            <p className="font-medium">{value}</p>
        </div>
    );
}

export default CbeBirrLinkConfirmation;