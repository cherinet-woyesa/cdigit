import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { 
    CheckCircle2, 
    Printer, 
    AlertCircle,
    Loader2,
    X,
    Heart,
    MapPin,
    Calendar,
    Clock,
    User,
    Phone,
    IdCard,
    BookOpen,
    Users,
    RefreshCw,
    Building
} from 'lucide-react';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';

// Success message component
function SuccessMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-green-700">{message}</span>
        </div>
    );
}

// Error message component
function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{message}</span>
        </div>
    );
}

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
    email?: string;
    idNumber?: string;
    issuedBy?: string;
    maritalStatus?: string;
    educationLevel?: string;
    mothersFullName?: string;
    tokenNumber?: string;
    queueNumber?: number;
    status?: string;
    submittedAt?: string;
}

interface LocationState {
    api?: RegistrationData;
    updateId?: string;
    formData?: any;
}

export default function CbeBirrRegistrationConfirmation() {
    const { t } = useTranslation();
    const { phone } = useAuth();
    const { state } = useLocation() as { state?: LocationState };
    const navigate = useNavigate();
    const { branch } = useBranch();
    const [registrationData, setRegistrationData] = useState<RegistrationData>({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [printError, setPrintError] = useState('');
    const componentToPrintRef = useRef<HTMLDivElement>(null);
    const branchName = branch?.name || t('branch', 'Branch');

    const handlePrint = useReactToPrint({
        content: () => componentToPrintRef.current,
        documentTitle: t('cbeBirrRegistrationConfirmation', 'CBE-Birr Registration Confirmation'),
        pageStyle: `
            @page { size: auto; margin: 10mm; }
            @media print { 
                body { -webkit-print-color-adjust: exact; }
                .no-print { display: none !important; }
            }
        `,
        onBeforeGetContent: () => setPrintError(''),
        onPrintError: () => setPrintError(t('printError', 'Failed to print. Please check your printer settings.')),
    } as any);

    useEffect(() => {
        const initializeData = async () => {
            try {
                setIsLoading(true);
                setError('');
                
                if (state?.api) {
                    const apiData = state.api;
                    setRegistrationData({
                        id: apiData.id,
                        customerPhoneNumber: apiData.customerPhoneNumber,
                        fullName: apiData.fullName,
                        placeOfBirth: apiData.placeOfBirth,
                        dateOfBirth: apiData.dateOfBirth,
                        gender: apiData.gender,
                        city: apiData.city,
                        wereda: apiData.wereda,
                        kebele: apiData.kebele,
                        email: apiData.email,
                        idNumber: apiData.idNumber,
                        issuedBy: apiData.issuedBy,
                        maritalStatus: apiData.maritalStatus,
                        educationLevel: apiData.educationLevel,
                        mothersFullName: apiData.mothersFullName,
                        tokenNumber: apiData.tokenNumber,
                        queueNumber: apiData.queueNumber,
                        status: apiData.status,
                        submittedAt: apiData.submittedAt || new Date().toISOString(),
                    });
                } else if (state?.updateId) {
                    setError(t('updateFlowNotSupported', 'Update flow not yet supported'));
                } else {
                    setError(t('invalidState', 'Invalid request state. Please start over.'));
                }
            } catch (err: any) {
                console.error('Error initializing registration data:', err);
                setError(err?.message || t('loadFailed', 'Failed to load registration details'));
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, [state, t]);

    const handleUpdate = async () => {
        if (!registrationData.id) {
            setError(t('noRegistrationId', 'No registration ID available'));
            return;
        }
        
        setIsUpdating(true);
        setError('');
        try {
            navigate('/form/cbe-birr', {
                state: {
                    updateId: registrationData.id,
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

    const handleNewRegistration = () => {
        navigate('/form/cbe-birr');
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    useEffect(() => {
        if (error && !registrationData.id && error === t('invalidState', 'Invalid request state. Please start over.')) {
            const timer = setTimeout(() => {
                navigate('/form/cbe-birr');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, registrationData.id, navigate, t]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <Loader2 className="h-12 w-12 text-fuchsia-700 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">{t('loading', 'Loading registration details...')}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !registrationData.id) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('error', 'Error')}</h3>
                        <p className="text-gray-600 mb-4">
                            {error === t('invalidState', 'Invalid request state. Please start over.')
                                ? t('redirectMessage', 'This page was loaded without a valid registration. You will be redirected to the registration form.')
                                : error}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => navigate('/form/cbe-birr')}
                                className="bg-fuchsia-700 text-white px-6 py-2 rounded-lg hover:bg-fuchsia-800 transition-colors"
                            >
                                {t('goToRegistration', 'Go to Registration')}
                            </button>
                            <button
                                onClick={handleBackToDashboard}
                                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                {t('backToDashboard', 'Back to Dashboard')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Header with softer gradient */}
                    <header className="bg-fuchsia-700 text-white">
                        <div className="px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <Heart className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold">{t('cbeBirrRegistrationConfirmation', 'CBE-Birr Registration Confirmation')}</h1>
                                        <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>{branchName}</span>
                                            <span>•</span>
                                            <Calendar className="h-3 w-3" />
                                            <span>{new Date().toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="bg-fuchsia-800/50 px-2 py-1 rounded-full text-xs">
                                        📱 {phone}
                                    </div>
                                    {/* <div className="bg-white/20 rounded p-1">
                                        <LanguageSwitcher />
                                    </div> */}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div ref={componentToPrintRef} className="p-4">
                        {/* Success Icon */}
                        <div className="text-center py-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
    <CheckCircle2 className="h-10 w-10 text-green-600" />
  </div>
                            <h2 className="text-lg font-bold text-gray-900 mb-1">{t('success', 'Success!')}</h2>
                            <p className="text-gray-600 text-sm">{t('registrationSubmitted', 'Your CBE-Birr registration has been submitted.')}</p>
                        </div>

                        {/* Queue and Token Cards with improved colors */}
                        {(registrationData.queueNumber || registrationData.tokenNumber) && (
                            <div className="mb-4">
                                <div className="grid grid-cols-2 gap-3">
                                    {registrationData.queueNumber && (
                                        <div className="bg-gradient-to-r from-amber-300 to-amber-400 p-3 rounded-lg text-center text-amber-900 shadow-sm">
                                            <div className="flex items-center justify-center gap-1 mb-1">
                                                <MapPin className="h-3 w-3" />
                                                <span className="text-xs font-medium">{t('queueNumber', 'Queue #')}</span>
                                            </div>
                                            <p className="text-2xl font-bold">{registrationData.queueNumber}</p>
                                        </div>
                                    )}
                                    {registrationData.tokenNumber && (
                                        <div className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 p-3 rounded-lg text-center text-white shadow-sm">
                                            <div className="flex items-center justify-center gap-1 mb-1">
                                                <IdCard className="h-3 w-3" />
                                                <span className="text-xs font-medium">{t('token', 'Token')}</span>
                                            </div>
                                            <p className="text-2xl font-bold">{registrationData.tokenNumber}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Registration Summary with softer background */}
                        <div className="mb-4">
                            <div className="bg-amber-25 rounded-lg p-4 border border-amber-200 shadow-sm">
                                <h3 className="text-md font-bold text-amber-700 mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {t('registrationSummary', 'Registration Summary')}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {t('phoneNumber', 'Phone Number')}:
                                        </span>
                                        <span className="font-semibold">{registrationData.customerPhoneNumber || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {t('fullName', 'Full Name')}:
                                        </span>
                                        <span className="font-semibold text-right">{registrationData.fullName || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800">
                                            {t('gender', 'Gender')}:
                                        </span>
                                        <span>{registrationData.gender || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800">
                                            {t('dateOfBirth', 'Date of Birth')}:
                                        </span>
                                        <span>{registrationData.dateOfBirth ? new Date(registrationData.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800">
                                            {t('placeOfBirth', 'Place of Birth')}:
                                        </span>
                                        <span>{registrationData.placeOfBirth || 'N/A'}</span>
                                    </div>

                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <Building className="h-3 w-3" />
                                            {t('address', 'Address')}:
                                        </span>
                                        <span className="text-right">
                                            {[registrationData.city, registrationData.wereda, registrationData.kebele]
                                                .filter(Boolean).join(', ') || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <IdCard className="h-3 w-3" />
                                            {t('idNumber', 'ID Number')}:
                                        </span>
                                        <span className="font-mono font-semibold">{registrationData.idNumber || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800">
                                            {t('issuedBy', 'Issued By')}:
                                        </span>
                                        <span>{registrationData.issuedBy || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800">
                                            {t('maritalStatus', 'Marital Status')}:
                                        </span>
                                        <span>{registrationData.maritalStatus || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-amber-100">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <BookOpen className="h-3 w-3" />
                                            {t('educationLevel', 'Education Level')}:
                                        </span>
                                        <span>{registrationData.educationLevel || 'N/A'}</span>
                                    </div>

                                    <div className="flex justify-between items-center py-1">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {t('mothersName', 'Mother\'s Name')}:
                                        </span>
                                        <span className="text-right">{registrationData.mothersFullName || 'N/A'}</span>
                                    </div>

                                    <div className="flex justify-between items-center py-1 border-t border-amber-100 mt-2 pt-2">
                                        <span className="font-medium text-amber-800 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {t('status', 'Status')}:
                                        </span>
                                        <span className={`font-medium ${
                                            registrationData.status === 'PENDING' ? 'text-yellow-600' : 
                                            registrationData.status === 'APPROVED' ? 'text-green-600' : 
                                            registrationData.status === 'REJECTED' ? 'text-red-600' : 
                                            'text-gray-600'
                                        }`}>
                                            {registrationData.status || 'SUBMITTED'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Thank You Message */}
                        <div className="text-center pt-3 border-t border-amber-200">
                            <p className="text-amber-700 text-xs">{t('thankYouBanking', 'Thank you for banking with us!')}</p>
                        </div>
                    </div>

                    {/* Action Buttons with improved colors */}
                    <div className="p-4 border-t border-amber-200 no-print">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleNewRegistration}
                                className="flex items-center justify-center gap-1 w-full bg-amber-500 hover:bg-amber-600 text-white px-2 py-2 rounded-lg font-medium transition-colors"
                            >
                                <RefreshCw className="h-3 w-3" />
                                {t('newRegistration', 'New')}
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center justify-center gap-1 w-full bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-800 px-2 py-2 rounded-lg font-medium transition-colors"
                            >
                                <Printer className="h-3 w-3" />
                                {t('print', 'Print')}
                            </button>
                        </div>
                        <div className="mt-2">
                            <button
                                onClick={handleUpdate}
                                disabled={isUpdating}
                                className="flex items-center justify-center gap-1 w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white px-2 py-2 rounded-lg disabled:opacity-50 font-medium transition-colors"
                            >
                                <RefreshCw className="h-3 w-3" />
                                {isUpdating ? t('processing', 'Processing...') : t('update', 'Update')}
                            </button>
                        </div>
                        
                        {/* Messages */}
                        {error && <ErrorMessage message={error} />}
                        {printError && <ErrorMessage message={printError} />}
                        {successMessage && <SuccessMessage message={successMessage} />}
                    </div>
                </div>
            </div>
        </div>
    );
}