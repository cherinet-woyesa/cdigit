import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@context/AuthContext';
import { useBranch } from '@context/BranchContext';
import { Heart, User, Phone, IdCard, Building, BookOpen, Users, MapPin } from 'lucide-react';
import {
    SuccessHeader,
    SuccessIcon,
    QueueTokenCards,
    ActionButtons,
    StatusMessage,
    usePrint,
    LoadingState,
    ErrorState
} from '@features/customer/components/SharedConfirmationComponents';
import { formatQueueToken, getEntityId } from '@features/customer/utils/confirmationHelpers';

interface RegistrationData {
    id?: string;
    customerPhoneNumber?: string;
    fullName?: string;
    placeOfBirth?: string;
    dateOfBirth?: string;
    gender?: string;
    city?: string;
    wereda?: string;
    kebele?: string;
    idNumber?: string;
    issuedBy?: string;
    maritalStatus?: string;
    educationLevel?: string;
    mothersFullName?: string;
    tokenNumber?: string;
    queueNumber?: number;
    status?: string;
}

export default function CbeBirrRegistrationConfirmation() {
    const { t } = useTranslation();
    const { phone } = useAuth();
    const { state } = useLocation() as { state?: any };
    const navigate = useNavigate();
    const { branch } = useBranch();
    
    const [registrationData, setRegistrationData] = useState<RegistrationData>({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const componentToPrintRef = useRef<HTMLDivElement>(null);
    const handlePrint = usePrint(componentToPrintRef, t('cbeBirrRegistrationConfirmation', 'CBE-Birr Registration Confirmation'));

    const branchName = branch?.name || t('branch', 'Branch');
    const entityId = getEntityId(registrationData);

    // Data initialization
    useEffect(() => {
        const initializeData = async () => {
            try {
                setIsLoading(true);
                setError('');
                
                if (state?.api) {
                    setRegistrationData(state.api);
                } else if (state?.updateId) {
                    setError(t('updateFlowNotSupported', 'Update flow not yet supported'));
                } else {
                    setError(t('invalidState', 'Invalid request state. Please start over.'));
                }
            } catch (err: any) {
                setError(err?.message || t('loadFailed', 'Failed to load registration details'));
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, [state, t]);

    // Handlers
    const handleUpdate = async () => {
        if (!entityId) {
            setError(t('noRegistrationId', 'No registration ID available'));
            return;
        }
        
        setIsUpdating(true);
        setError('');
        try {
            navigate('/form/cbe-birr', {
                state: {
                    updateId: entityId,
                    formData: {
                        phoneNumber: registrationData.customerPhoneNumber,
                        fullName: registrationData.fullName,
                    }
                }
            });
        } catch (err: any) {
            setError(err?.message || t('updateFailed', 'Failed to prepare registration update.'));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleNewRegistration = () => navigate('/form/cbe-birr');
    const handleBackToDashboard = () => navigate('/dashboard');

    // Auto-redirect for invalid state
    useEffect(() => {
        if (error && !entityId && error === t('invalidState', 'Invalid request state. Please start over.')) {
            const timer = setTimeout(() => navigate('/form/cbe-birr'), 3000);
            return () => clearTimeout(timer);
        }
    }, [error, entityId, navigate, t]);

    // Loading and error states
    if (isLoading) return <LoadingState message={t('loading', 'Loading registration details...')} />;
    
    if (error && !entityId) return (
        <ErrorState
            error={error}
            onPrimaryAction={() => navigate('/form/cbe-birr')}
            onSecondaryAction={handleBackToDashboard}
            primaryLabel={t('goToRegistration', 'Go to Registration')}
            secondaryLabel={t('backToDashboard', 'Back to Dashboard')}
        />
    );

    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <SuccessHeader
                        icon={Heart}
                        title={t('cbeBirrRegistrationConfirmation', 'CBE-Birr Registration Confirmation')}
                        branchName={branchName}
                        phone={phone}
                    />

                    <div ref={componentToPrintRef} className="p-4">
                        <SuccessIcon
                            title={t('success', 'Success!')}
                            message={t('registrationSubmitted', 'Your CBE-Birr registration has been submitted.')}
                        />

                        {(registrationData.queueNumber || registrationData.tokenNumber) && (
                            <QueueTokenCards 
                                queueNumber={formatQueueToken(registrationData.queueNumber)} 
                                tokenNumber={formatQueueToken(registrationData.tokenNumber)} 
                            />
                        )}

                        <div className="mb-4">
                            <div className="bg-amber-25 rounded-lg p-4 border border-amber-200 shadow-sm">
                                <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {t('registrationSummary', 'Registration Summary')}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <SummaryRow icon={Phone} label={t('phoneNumber', 'Phone Number')} value={registrationData.customerPhoneNumber || 'N/A'} />
                                    <SummaryRow icon={User} label={t('fullName', 'Full Name')} value={registrationData.fullName || 'N/A'} />
                                    <SummaryRow label={t('gender', 'Gender')} value={registrationData.gender || 'N/A'} />
                                    <SummaryRow label={t('dateOfBirth', 'Date of Birth')} value={registrationData.dateOfBirth ? new Date(registrationData.dateOfBirth).toLocaleDateString() : 'N/A'} />
                                    <SummaryRow label={t('placeOfBirth', 'Place of Birth')} value={registrationData.placeOfBirth || 'N/A'} />
                                    <SummaryRow icon={Building} label={t('address', 'Address')} value={getAddress(registrationData)} />
                                    <SummaryRow icon={IdCard} label={t('idNumber', 'ID Number')} value={registrationData.idNumber || 'N/A'} isMono />
                                    <SummaryRow label={t('issuedBy', 'Issued By')} value={registrationData.issuedBy || 'N/A'} />
                                    <SummaryRow label={t('maritalStatus', 'Marital Status')} value={registrationData.maritalStatus || 'N/A'} />
                                    <SummaryRow icon={BookOpen} label={t('educationLevel', 'Education Level')} value={registrationData.educationLevel || 'N/A'} />
                                    <SummaryRow icon={Users} label={t('mothersName', 'Mother\'s Name')} value={registrationData.mothersFullName || 'N/A'} />
                                    <StatusRow status={registrationData.status} />
                                </div>
                            </div>
                        </div>

                        <div className="text-center pt-3 border-t border-amber-200">
                            <p className="text-amber-700 text-xs">{t('thankYouBanking', 'Thank you for banking with us!')}</p>
                        </div>
                    </div>

                    <ActionButtons
                        onNew={handleNewRegistration}
                        onPrint={handlePrint}
                        onUpdate={handleUpdate}
                        showUpdateCancel={!!entityId}
                        isSubmitting={isUpdating}
                    />

                    {error && <StatusMessage type="error" message={error} />}
                </div>
            </div>
        </div>
    );
}

// Helper functions
function getAddress(data: RegistrationData): string {
    return [data.city, data.wereda, data.kebele].filter(Boolean).join(', ') || 'N/A';
}

function getStatusColor(status?: string): string {
    const colors: { [key: string]: string } = {
        'PENDING': 'text-yellow-600',
        'APPROVED': 'text-green-600',
        'REJECTED': 'text-red-600'
    };
    return colors[status || ''] || 'text-gray-600';
}

// Helper components
function SummaryRow({ icon: Icon, label, value, isMono = false }: {
    icon?: React.ComponentType<any>;
    label: string;
    value: string;
    isMono?: boolean;
}) {
    return (
        <div className="flex justify-between items-center py-1 border-b border-amber-100">
            <span className="font-medium text-amber-800 flex items-center gap-1">
                {Icon && <Icon className="h-3 w-3" />}
                {label}:
            </span>
            <span className={`text-right ${isMono ? 'font-mono' : ''} font-semibold`}>
                {value}
            </span>
        </div>
    );
}

function StatusRow({ status }: { status?: string }) {
    const { t } = useTranslation();
    
    return (
        <div className="flex justify-between items-center py-1 border-t border-amber-100 mt-2 pt-2">
            <span className="font-medium text-amber-800 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {t('status', 'Status')}:
            </span>
            <span className={`font-medium ${getStatusColor(status)}`}>
                {status || 'SUBMITTED'}
            </span>
        </div>
    );
}