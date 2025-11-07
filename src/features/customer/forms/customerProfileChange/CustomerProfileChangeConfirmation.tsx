// features/customer/forms/customerProfileChange/CustomerProfileChangeConfirmation.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@context/AuthContext';
import { FileText, User, CreditCard, Calendar, CheckSquare, MessageSquare } from 'lucide-react';
import { customerProfileChangeService } from '@services/forms/customerProfileChangeService';
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

type CustomerProfileChangeData = {
    id?: string;
    formReferenceId?: string;
    customerId?: string;
    accountNumber?: string;
    accountName?: string;
    customerFullName?: string;
    accountType?: string;
    dateRequested?: string;
    tokenNumber?: string;
    queueNumber?: number;
    
    // Service requests
    changeOfSignatureOrName?: boolean;
    pinResetRequest?: boolean;
    mobileNumberReplacement?: boolean;
    changeOrAddMobileBankingChannel?: boolean;
    corpInternetBankingUserChange?: boolean;
    mobileBankingResubscription?: boolean;
    customerInfoChange?: boolean;
    mobileBankingTermination?: boolean;
    tokenReplacement?: boolean;
    internetBankingTermination?: boolean;
    linkOrChangeAdditionalAccounts?: boolean;
    accountClosure?: boolean;
    posMerchantContractTermination?: boolean;
    powerOfAttorneyChange?: boolean;
    additionalCardRequest?: boolean;
    cardReplacementRequest?: boolean;
    hasOtherRequest?: boolean;
    
    // Additional info
    reasonForRequest?: string;
    detailedRequestDescription?: string;
    clause?: string;
    
    [key: string]: any;
};

export default function CustomerProfileChangeConfirmation() {
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
    const handlePrint = usePrint(componentToPrintRef as React.RefObject<HTMLDivElement>, t('customerProfileChangeConfirmation', 'Customer Profile Change Confirmation'));

    // Memoized data processing
    const { data, entityId, branchName, customerId, accountNumber, accountName, customerFullName, accountType, dateRequested, token, queueNumber } = useMemo(() => {
        const rawData = serverData?.data || state?.serverData?.data || {};
        const processedData = initializeData(state, rawData);
        
        return {
            data: processedData,
            entityId: getEntityId(processedData),
            branchName: state?.branchName || t('selectedBranch', 'Selected Branch'),
            customerId: processedData.customerId || 'N/A',
            accountNumber: processedData.accountNumber || 'N/A',
            accountName: processedData.accountName || 'N/A',
            customerFullName: processedData.customerFullName || 'N/A',
            accountType: processedData.accountType || 'N/A',
            dateRequested: processedData.dateRequested ? new Date(processedData.dateRequested).toLocaleDateString() : 'N/A',
            token: formatQueueToken(processedData.tokenNumber),
            queueNumber: formatQueueToken(processedData.queueNumber),
        };
    }, [serverData, state, t]);

    // Get selected services
    const selectedServices = useMemo(() => {
        const services = [];
        if (data.changeOfSignatureOrName) services.push('Change of Signature or Name');
        if (data.pinResetRequest) services.push('PIN Reset Request');
        if (data.mobileNumberReplacement) services.push('Mobile Number Replacement');
        if (data.changeOrAddMobileBankingChannel) services.push('Change or Add Mobile Banking Channel');
        if (data.corpInternetBankingUserChange) services.push('Corporate Internet Banking User Change');
        if (data.mobileBankingResubscription) services.push('Mobile Banking Resubscription');
        if (data.customerInfoChange) services.push('Customer Information Change');
        if (data.mobileBankingTermination) services.push('Mobile Banking Termination');
        if (data.tokenReplacement) services.push('Token Replacement');
        if (data.internetBankingTermination) services.push('Internet Banking Termination');
        if (data.linkOrChangeAdditionalAccounts) services.push('Link or Change Additional Accounts');
        if (data.accountClosure) services.push('Account Closure');
        if (data.posMerchantContractTermination) services.push('POS Merchant Contract Termination');
        if (data.powerOfAttorneyChange) services.push('Power of Attorney Change');
        if (data.additionalCardRequest) services.push('Additional Card Request');
        if (data.cardReplacementRequest) services.push('Card Replacement Request');
        if (data.hasOtherRequest) services.push('Other Request');
        return services;
    }, [data]);

    // Data fetching
    useEffect(() => {
        const fetchData = async () => {
            if (data.id || error) return;
            
            const refId = data.formReferenceId || data.referenceId || data.ReferenceId;
            if (!refId) return;
            
            setSubmitting(true);
            setError('');
            try {
                const res = await customerProfileChangeService.getCustomerProfileChangeById(refId);
                setServerData(res);
            } catch (e: any) {
                setError(e?.message || t('fetchError', 'Failed to fetch confirmation details.'));
            } finally {
                setSubmitting(false);
            }
        };

        if (state?.serverData?.data) {
            setServerData(state.serverData);
        } else if (state?.pending || !serverData) {
            fetchData();
        }
    }, [state, serverData, error, data.id, t]);

    // Handlers
    const handleNewRequest = () => navigate('/form/customer-profile-change', { state: { showSuccess: false } });
    
    const handleUpdateRequest = async () => {
        if (!entityId) return;
        
        setSubmitting(true);
        setError('');
        try {
            const requestData = await customerProfileChangeService.getCustomerProfileChangeById(entityId);
            navigate('/form/customer-profile-change', {
                state: {
                    updateId: entityId,
                    formData: requestData.data,
                    tokenNumber: token,
                    queueNumber: parseInt(queueNumber)
                }
            });
        } catch (e: any) {
            setError(e?.message || t('prepareUpdateError', 'Failed to prepare update.'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelRequest = async () => {
        if (!entityId) return;
        
        try {
            setSubmitting(true);
            setError('');
            const response = await customerProfileChangeService.cancelCustomerProfileChange(entityId);
            if (response.success) {
                setSuccessMessage(response.message || t('requestCancelled', 'Request cancelled successfully'));
                setShowCancelModal(false);
                setTimeout(() => {
                    navigate('/form/customer-profile-change', {
                        state: {
                            showSuccess: true,
                            successMessage: response.message || t('requestCancelled', 'Request cancelled successfully')
                        }
                    });
                }, 1500);
            } else {
                throw new Error(response.message || t('cancelFailed', 'Failed to cancel request'));
            }
        } catch (e: any) {
            setError(e?.message || t('cancelFailed', 'Failed to cancel request.'));
        } finally {
            setSubmitting(false);
        }
    };

    // Loading and error states
    if (submitting && !data.id) return <LoadingState message={t('loading', 'Loading details...')} />;
    if (error && !data.id) return (
        <ErrorState
            error={error}
            onPrimaryAction={() => navigate('/form/customer-profile-change')}
            onSecondaryAction={() => navigate('/dashboard')}
            primaryLabel={t('goToForm', 'Go to Form')}
            secondaryLabel={t('backToDashboard', 'Back to Dashboard')}
        />
    );

    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <SuccessHeader
                        icon={FileText}
                        title={t('customerProfileChangeConfirmation', 'Customer Profile Change Confirmation')}
                        branchName={branchName}
                        phone={phone || ''}
                    />

                    <div ref={componentToPrintRef} className="p-4">
                        <SuccessIcon
                            title={t('success', 'Success!')}
                            message={t('requestSubmitted', 'Your customer profile change request has been submitted.')}
                        />

                        <QueueTokenCards queueNumber={queueNumber} tokenNumber={token} />

                        {/* Account Information */}
                        <div className="mb-4">
                            <div className="bg-amber-25 rounded-lg p-4 border border-amber-200 shadow-sm">
                                <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {t('accountInformation', 'Account Information')}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <SummaryRow icon={User} label={t('customerId', 'Customer ID')} value={customerId} isMono />
                                    <SummaryRow icon={CreditCard} label={t('accountNumber', 'Account Number')} value={accountNumber} isMono />
                                    <SummaryRow icon={User} label={t('accountName', 'Account Name')} value={accountName} />
                                    <SummaryRow icon={User} label={t('customerFullName', 'Customer Full Name')} value={customerFullName} />
                                    <SummaryRow icon={FileText} label={t('accountType', 'Account Type')} value={accountType} />
                                    <SummaryRow icon={Calendar} label={t('dateRequested', 'Date Requested')} value={dateRequested} />
                                </div>
                            </div>
                        </div>

                        {/* Selected Services */}
                        {selectedServices.length > 0 && (
                            <div className="mb-4">
                                <div className="bg-amber-25 rounded-lg p-4 border border-amber-200 shadow-sm">
                                    <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                                        <CheckSquare className="h-4 w-4" />
                                        {t('requestedServices', 'Requested Services')}
                                    </h3>
                                    <ul className="space-y-1 text-sm">
                                        {selectedServices.map((service, index) => (
                                            <li key={index} className="flex items-center gap-2 text-gray-700">
                                                <span className="text-green-600">✓</span>
                                                {service}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Additional Information */}
                        {(data.reasonForRequest || data.detailedRequestDescription || data.clause) && (
                            <div className="mb-4">
                                <div className="bg-amber-25 rounded-lg p-4 border border-amber-200 shadow-sm">
                                    <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        {t('additionalInformation', 'Additional Information')}
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        {data.reasonForRequest && (
                                            <div>
                                                <p className="font-medium text-amber-800 mb-1">{t('reasonForRequest', 'Reason for Request')}:</p>
                                                <p className="text-gray-700 bg-white p-2 rounded border border-amber-100">{data.reasonForRequest}</p>
                                            </div>
                                        )}
                                        {data.detailedRequestDescription && (
                                            <div>
                                                <p className="font-medium text-amber-800 mb-1">{t('detailedDescription', 'Detailed Description')}:</p>
                                                <p className="text-gray-700 bg-white p-2 rounded border border-amber-100">{data.detailedRequestDescription}</p>
                                            </div>
                                        )}
                                        {data.clause && (
                                            <div>
                                                <p className="font-medium text-amber-800 mb-1">{t('clause', 'Clause')}:</p>
                                                <p className="text-gray-700 bg-white p-2 rounded border border-amber-100">{data.clause}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="text-center pt-3 border-t border-amber-200">
                            <p className="text-amber-700 text-xs">{t('thankYouBanking', 'Thank you for banking with us!')}</p>
                        </div>
                    </div>

                    <ActionButtons
                        onNew={handleNewRequest}
                        onPrint={handlePrint}
                        onUpdate={handleUpdateRequest}
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
                    onConfirm={handleCancelRequest}
                    isSubmitting={submitting}
                    title={t('confirmCancellation', 'Confirm Cancellation')}
                    message={t('cancelConfirmation', 'Are you sure you want to cancel this request? This action cannot be undone.')}
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
