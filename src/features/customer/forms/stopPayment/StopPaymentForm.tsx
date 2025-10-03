import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { useUserAccounts } from '../../../../hooks/useUserAccounts';
import { useTranslation } from 'react-i18next';
import stopPaymentService, { type StopPaymentOrderResponseDto } from '../../../../services/stopPaymentService';
import { toast } from 'react-toastify';
import SignatureCanvas from 'react-signature-canvas';
import { 
    Loader2, 
    AlertCircle, 
    CheckCircle2, 
    ChevronRight,
    CreditCard,
    Search,
    FileText,
    Shield,
    PenTool,
    Eraser,
    MapPin,
    Calendar,
    User
} from 'lucide-react';

// Error message component (consistent with withdrawal form)
function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{message}</span>
        </div>
    );
}

interface FormData {
    mode: 'spo' | 'rspo';
    // SPO Fields
    accountNumber: string;
    chequeNumber: string;
    amount: string;
    chequeDate: string;
    reason: string;
    // RSPO Fields
    searchTerm: string;
    selectedSpoId: string;
    // Common
    signature: string;
    otp: string;
    termsAccepted: boolean;
}

type Errors = Partial<Record<keyof FormData, string>> & { submit?: string; otp?: string };

export default function EnhancedStopPaymentForm() {
    const { t } = useTranslation();
    const { phone, token, user } = useAuth();
    const { branch } = useBranch();
    const navigate = useNavigate();
    const { accounts, loadingAccounts, errorAccounts, refreshAccounts } = useUserAccounts();

    const [formData, setFormData] = useState<FormData>({
        mode: 'spo',
        accountNumber: '',
        chequeNumber: '',
        amount: '',
        chequeDate: '',
        reason: '',
        searchTerm: '',
        selectedSpoId: '',
        signature: '',
        otp: '',
        termsAccepted: false,
    });
    
    const [errors, setErrors] = useState<Errors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<number>(1);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [searchResults, setSearchResults] = useState<StopPaymentOrderResponseDto[]>([]);
    const [selectedSpo, setSelectedSpo] = useState<StopPaymentOrderResponseDto | null>(null);
    const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);
    const signaturePadRef = useRef<any>(null);

    // Customer accounts mapping
    const customerAccounts = accounts.map(acc => {
        const a = acc as any;
        return {
            accountNumber: a.accountNumber,
            accountType: a.accountType || a.TypeOfAccount || 'N/A',
            balance: a.balance ?? a.Balance ?? a.availableBalance ?? 0,
            currency: a.currency || a.Currency || 'ETB',
            status: a.status || a.Status || 'active',
        };
    });

    const selectedAccount = customerAccounts.find(acc => acc.accountNumber === formData.accountNumber);

    // Handle mode toggle
    const toggleMode = (newMode: 'spo' | 'rspo') => {
        setFormData(prev => ({ 
            ...prev, 
            mode: newMode,
            searchTerm: '',
            selectedSpoId: '',
            signature: '',
            otp: '',
            termsAccepted: false
        }));
        setSearchResults([]);
        setSelectedSpo(null);
        setStep(1);
        setErrors({});
    };

    // Handle form field changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (errors[name as keyof Errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }

        if (name === 'accountNumber') {
            setFormData(prev => ({ ...prev, [name]: value }));
            return;
        }

        if (name === 'amount') {
            const sanitizedValue = value.replace(/[^\d.]/g, '');
            const parts = sanitizedValue.split('.');
            if (parts.length > 2) return;
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }

        if (name === 'otp') {
            const sanitizedValue = value.replace(/\D/g, '').slice(0, 6);
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle search for RSPO
    const handleSearch = async (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }
        try {
            const response = await stopPaymentService.searchStopPaymentOrders({
                accountNumber: searchTerm,
                chequeNumber: searchTerm,
            });
            if (response.success && response.data) {
                const activeSpos = response.data.filter(
                    (spo) => spo.status === 'Approved' && !spo.isRevoked
                );
                setSearchResults(activeSpos);
            } else {
                toast.error(response.error || 'Failed to search Stop Payment Orders');
            }
        } catch (error) {
            console.error('Error searching SPOs:', error);
            toast.error('Failed to search Stop Payment Orders');
        }
    };

    // Handle SPO selection in RSPO mode
    const handleSelectSpo = (spo: StopPaymentOrderResponseDto) => {
        setSelectedSpo(spo);
        setFormData(prev => ({ ...prev, selectedSpoId: spo.id }));
    };

    // Signature handlers
    const handleSignatureClear = () => {
        if (signaturePadRef.current) {
            signaturePadRef.current.clear();
            setIsSignatureEmpty(true);
            setFormData(prev => ({ ...prev, signature: '' }));
        }
    };

    const handleSignatureEnd = () => {
        if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
            setIsSignatureEmpty(false);
            const signatureData = signaturePadRef.current.toDataURL();
            setFormData(prev => ({ ...prev, signature: signatureData }));
        }
    };

    // OTP handlers
    const handleRequestOtp = async () => {
        if (!phone) {
            setErrors({ submit: 'Phone number not found. Please log in again.' });
            return;
        }

        setOtpLoading(true);
        setErrors({});
        setOtpMessage('');

        try {
            const response = await stopPaymentService.requestOtp(phone);
            if (response.success) {
                setOtpMessage(response.data?.message || 'OTP sent to your phone.');
                setStep(4);
                setResendCooldown(30);
                
                const timer = setInterval(() => {
                    setResendCooldown(prev => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                setErrors({ submit: response.error || 'Failed to send OTP.' });
            }
        } catch (error: any) {
            setErrors({ submit: error?.message || 'Failed to send OTP.' });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!phone || resendCooldown > 0) return;
        await handleRequestOtp();
    };

    // Validation functions
    const validateStep1 = (): boolean => {
        const errs: Errors = {};
        
        if (formData.mode === 'spo') {
            if (!formData.accountNumber.trim()) {
                errs.accountNumber = 'Please select an account';
            }
            if (!formData.chequeNumber.trim()) {
                errs.chequeNumber = 'Cheque number is required';
            }
            if (!formData.amount || Number(formData.amount) <= 0) {
                errs.amount = 'Please enter a valid amount greater than 0';
            }
            if (!formData.chequeDate) {
                errs.chequeDate = 'Cheque date is required';
            }
            if (!formData.reason.trim()) {
                errs.reason = 'Reason is required';
            }
        } else {
            if (!selectedSpo) {
                errs.selectedSpoId = 'Please select a stop payment order to revoke';
            }
        }
        
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep3 = (): boolean => {
        const errs: Errors = {};
        
        if (!formData.signature) {
            errs.signature = 'Signature is required';
        }
        if (!formData.termsAccepted) {
            errs.termsAccepted = 'You must accept the terms and conditions';
        }
        
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep4 = (): boolean => {
        const errs: Errors = {};
        
        if (!formData.otp || formData.otp.length !== 6) {
            errs.otp = 'Please enter the 6-digit OTP';
        }
        
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Step navigation
    const handleStep1Next = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateStep1()) {
            setStep(2);
        }
    };

    const handleStep2Next = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(3);
    };

    const handleStep3Next = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep3()) return;
        await handleRequestOtp();
    };

    // Form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep4()) return;
        if (!phone || !branch?.id || !user) {
            setErrors({ submit: 'Please ensure all information is complete.' });
            return;
        }

        setIsSubmitting(true);
        try {
            if (formData.mode === 'spo') {
                // Submit SPO
                const requestData = {
                    accountNumber: formData.accountNumber,
                    chequeNumber: formData.chequeNumber,
                    chequeBookRequestId: '00000000-0000-0000-0000-000000000000', // TODO: Get from actual cheque book request
                    chequeAmount: parseFloat(formData.amount),
                    chequeDate: new Date(formData.chequeDate).toISOString(),
                    reason: formData.reason,
                    signature: formData.signature,
                    branchId: branch.id,
                    otpCode: formData.otp,
                    phoneNumber: phone,
                };
                
                const response = await stopPaymentService.submitStopPaymentOrder(requestData);
                if (response.success && response.data) {
                    toast.success('Stop Payment Order submitted successfully');
                    navigate('/form/stop-payment/confirmation', {
                        state: { 
                            request: response.data,
                            isRevoke: false,
                            branchName: branch.name,
                            formData: formData
                        },
                    });
                } else {
                    throw new Error(response.error || 'Failed to submit Stop Payment Order');
                }
            } else {
                // Submit RSPO
                if (!selectedSpo) {
                    throw new Error('No stop payment order selected');
                }

                const requestData = {
                    stopPaymentOrderId: selectedSpo.id,
                    chequeNumber: selectedSpo.chequeNumber,
                    signature: formData.signature,
                    otpCode: formData.otp,
                    phoneNumber: phone,
                };
                
                const response = await stopPaymentService.submitRevokeStopPaymentOrder(requestData);
                
                if (response.success && response.data) {
                    toast.success('Stop Payment Order revoked successfully');
                    navigate('/form/stop-payment/confirmation', {
                        state: { 
                            request: response.data.rspo,
                            isRevoke: true,
                            branchName: branch.name,
                            originalSpo: selectedSpo
                        },
                    });
                } else {
                    throw new Error(response.error || 'Failed to revoke Stop Payment Order');
                }
            }
        } catch (error: any) {
            setErrors({ submit: error?.message || 'Submission failed. Please try again.' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading and error states
    if (loadingAccounts) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <Loader2 className="h-12 w-12 text-fuchsia-700 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Loading accounts...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (errorAccounts) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Accounts</h3>
                        <p className="text-gray-600 mb-4">{errorAccounts}</p>
                        <button
                            onClick={() => refreshAccounts()}
                            className="bg-fuchsia-700 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-800"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full mx-auto">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Header */}
                    <header className="bg-fuchsia-700 text-white rounded-t-lg">
                        <div className="px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <FileText className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold">
                                            {formData.mode === 'spo' ? 'Stop Payment Order (SPO)' : 'Revoke Stop Payment Order (RSPO)'}
                                        </h1>
                                        <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>{branch?.name || 'Branch'}</span>
                                            <span>•</span>
                                            <Calendar className="h-3 w-3" />
                                            <span>{new Date().toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <div className="bg-fuchsia-800/50 px-3 py-1 rounded-full text-xs">
                                        📱 {phone}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Mode Toggle */}
                    <div className="border-b border-gray-200">
                        <div className="flex px-6">
                            <button
                                className={`py-4 px-4 font-medium border-b-2 transition-colors ${
                                    formData.mode === 'spo'
                                        ? 'text-fuchsia-700 border-fuchsia-700'
                                        : 'text-gray-500 border-transparent hover:text-gray-700'
                                }`}
                                onClick={() => toggleMode('spo')}
                            >
                                Stop Payment Order (SPO)
                            </button>
                            <button
                                className={`py-4 px-4 font-medium border-b-2 transition-colors ${
                                    formData.mode === 'rspo'
                                        ? 'text-fuchsia-700 border-fuchsia-700'
                                        : 'text-gray-500 border-transparent hover:text-gray-700'
                                }`}
                                onClick={() => toggleMode('rspo')}
                            >
                                Revoke Stop Payment (RSPO)
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="p-6">
                        {/* Progress Steps */}
                        <div className="flex justify-center mb-6">
                            <div className="flex items-center bg-gray-50 rounded-lg p-1">
                                {[1, 2, 3, 4].map((stepNumber) => (
                                    <React.Fragment key={stepNumber}>
                                        <div className={`flex items-center px-4 py-2 rounded-md ${
                                            step >= stepNumber ? 'bg-fuchsia-700 text-white' : 'text-gray-600'
                                        }`}>
                                            <span className="font-medium text-sm">
                                                {stepNumber}. {[
                                                    'Details',
                                                    'Confirm', 
                                                    'Signature',
                                                    'OTP'
                                                ][stepNumber - 1]}
                                            </span>
                                        </div>
                                        {stepNumber < 4 && (
                                            <div className="mx-1 text-gray-400 text-sm">→</div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        {errors.submit && <ErrorMessage message={errors.submit} />}

                        {/* Step 1: Details */}
                        {step === 1 && (
                            <form onSubmit={handleStep1Next} className="space-y-6">
                                {formData.mode === 'spo' ? (
                                    // SPO Details
                                    <div className="space-y-6">
                                        <div className="border border-gray-200 rounded-lg p-6">
                                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <CreditCard className="h-5 w-5 text-fuchsia-700" />
                                                Account Information
                                            </h2>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Select Account
                                                    </label>
                                                    <select
                                                        name="accountNumber"
                                                        value={formData.accountNumber}
                                                        onChange={handleChange}
                                                        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                    >
                                                        <option value="">Select an account</option>
                                                        {customerAccounts.map((account) => (
                                                            <option key={account.accountNumber} value={account.accountNumber}>
                                                                {account.accountNumber} - {account.accountType} 
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.accountNumber && <ErrorMessage message={errors.accountNumber} />}
                                                </div>

                                                {selectedAccount && (
                                                    <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-gray-500">Available Balance</p>
                                                            <p className="font-medium">
                                                                {selectedAccount.currency} {selectedAccount.balance?.toLocaleString() || '0.00'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Account Type</p>
                                                            <p className="font-medium">{selectedAccount.accountType}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="border border-gray-200 rounded-lg p-6">
                                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-fuchsia-700" />
                                                Cheque Details
                                            </h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Cheque Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="chequeNumber"
                                                        value={formData.chequeNumber}
                                                        onChange={handleChange}
                                                        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                        placeholder="Enter cheque number"
                                                    />
                                                    {errors.chequeNumber && <ErrorMessage message={errors.chequeNumber} />}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Amount ({selectedAccount?.currency || 'ETB'})
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="amount"
                                                        value={formData.amount}
                                                        onChange={handleChange}
                                                        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                        placeholder="0.00"
                                                    />
                                                    {errors.amount && <ErrorMessage message={errors.amount} />}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Cheque Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="chequeDate"
                                                        value={formData.chequeDate}
                                                        onChange={handleChange}
                                                        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                        max={new Date().toISOString().split('T')[0]}
                                                    />
                                                    {errors.chequeDate && <ErrorMessage message={errors.chequeDate} />}
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Reason for Stop Payment
                                                </label>
                                                <textarea
                                                    name="reason"
                                                    value={formData.reason}
                                                    onChange={handleChange}
                                                    rows={3}
                                                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                    placeholder="Please specify the reason for stopping payment on this cheque"
                                                />
                                                {errors.reason && <ErrorMessage message={errors.reason} />}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // RSPO Search
                                    <div className="border border-gray-200 rounded-lg p-6">
                                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Search className="h-5 w-5 text-fuchsia-700" />
                                            Search Stop Payment Order
                                        </h2>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Search by Account Number or Cheque Number
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Search className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        name="searchTerm"
                                                        value={formData.searchTerm}
                                                        onChange={(e) => {
                                                            handleChange(e);
                                                            handleSearch(e.target.value);
                                                        }}
                                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                        placeholder="Enter account number or cheque number"
                                                    />
                                                </div>
                                            </div>

                                            {/* Search Results */}
                                            {searchResults.length > 0 && (
                                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                                        <p className="text-sm font-medium text-gray-700">
                                                            {searchResults.length} active stop payment order(s) found
                                                        </p>
                                                    </div>
                                                    <div className="max-h-60 overflow-y-auto">
                                                        {searchResults.map((spo) => (
                                                            <div
                                                                key={spo.id}
                                                                className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                                                                    selectedSpo?.id === spo.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                                                                }`}
                                                                onClick={() => handleSelectSpo(spo)}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <input
                                                                        type="radio"
                                                                        name="selectedSpo"
                                                                        checked={selectedSpo?.id === spo.id}
                                                                        onChange={() => handleSelectSpo(spo)}
                                                                        className="h-4 w-4 text-fuchsia-600 focus:ring-fuchsia-500"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="flex justify-between items-start">
                                                                            <div>
                                                                                <p className="font-medium">Cheque #{spo.chequeNumber}</p>
                                                                                <p className="text-sm text-gray-500">Account: {spo.accountNumber}</p>
                                                                            </div>
                                                                            <p className="font-semibold text-fuchsia-700">
                                                                                ETB {spo.chequeAmount?.toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                        <p className="text-sm text-gray-600 mt-1">{spo.reason}</p>
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            Created: {new Date(spo.chequeDate).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {formData.searchTerm && searchResults.length === 0 && (
                                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No stop payment orders found</h3>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        No active stop payment orders match your search criteria.
                                                    </p>
                                                </div>
                                            )}

                                            {errors.selectedSpoId && <ErrorMessage message={errors.selectedSpoId} />}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <button 
                                        type="submit" 
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 flex items-center gap-2"
                                        disabled={formData.mode === 'rspo' && !selectedSpo}
                                    >
                                        <span>Continue</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 2: Confirmation */}
                        {step === 2 && (
                            <form onSubmit={handleStep2Next} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        Confirm {formData.mode === 'spo' ? 'Stop Payment Order' : 'Revocation'}
                                    </h2>
                                    
                                    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                                        {formData.mode === 'spo' ? (
                                            <>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-gray-500">Account Number</p>
                                                        <p className="font-semibold">{formData.accountNumber}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500">Cheque Number</p>
                                                        <p className="font-semibold">{formData.chequeNumber}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500">Amount</p>
                                                        <p className="font-semibold text-fuchsia-700">
                                                            {Number(formData.amount).toLocaleString()} {selectedAccount?.currency || 'ETB'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500">Cheque Date</p>
                                                        <p className="font-semibold">
                                                            {new Date(formData.chequeDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Reason</p>
                                                    <p className="font-semibold">{formData.reason}</p>
                                                </div>
                                            </>
                                        ) : (
                                            selectedSpo && (
                                                <>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-gray-500">Account Number</p>
                                                            <p className="font-semibold">{selectedSpo.accountNumber}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Cheque Number</p>
                                                            <p className="font-semibold">{selectedSpo.chequeNumber}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Amount</p>
                                                            <p className="font-semibold text-fuchsia-700">
                                                                ETB {selectedSpo.chequeAmount?.toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Original Reason</p>
                                                            <p className="font-semibold">{selectedSpo.reason}</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-blue-50 p-4 rounded-lg">
                                                        <p className="text-sm text-blue-700">
                                                            <strong>Note:</strong> Revoking this stop payment order will make the cheque payable again.
                                                        </p>
                                                    </div>
                                                </>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(1)}
                                        className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 justify-center"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                        Back
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 flex items-center gap-2 justify-center"
                                    >
                                        <PenTool className="h-4 w-4" />
                                        Add Signature
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 3: Signature */}
                        {step === 3 && (
                            <form onSubmit={handleStep3Next} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <PenTool className="h-5 w-5 text-fuchsia-700" />
                                        Digital Signature
                                    </h2>
                                    
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-blue-700">
                                            Please provide your signature using your finger or stylus. This signature will be used to authorize your {formData.mode === 'spo' ? 'stop payment order' : 'revocation request'}.
                                        </p>
                                    </div>

                                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4">
                                        <div className="bg-gray-100 rounded-lg p-2 mb-4">
                                            <SignatureCanvas
                                                ref={signaturePadRef}
                                                onEnd={handleSignatureEnd}
                                                canvasProps={{
                                                    className: "w-full h-48 bg-white border border-gray-300 rounded-md cursor-crosshair"
                                                }}
                                                penColor="black"
                                                backgroundColor="white"
                                                clearOnResize={false}
                                            />
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <button
                                                type="button"
                                                onClick={handleSignatureClear}
                                                className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                            >
                                                <Eraser className="h-4 w-4" />
                                                Clear Signature
                                            </button>
                                            
                                            <div className="text-sm text-gray-500">
                                                {!isSignatureEmpty ? (
                                                    <span className="text-green-600 flex items-center gap-1">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Signature provided
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        No signature provided
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Terms and Conditions */}
                                    <div className="mt-6">
                                        <div className="flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="terms"
                                                    name="termsAccepted"
                                                    type="checkbox"
                                                    checked={formData.termsAccepted}
                                                    onChange={handleChange}
                                                    className="h-4 w-4 text-fuchsia-600 focus:ring-fuchsia-500 border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor="terms" className="font-medium text-gray-700">
                                                    I acknowledge and accept the Terms and Conditions of the {formData.mode === 'spo' ? 'Stop Payment Order' : 'Revocation'} service. 
                                                    {formData.mode === 'rspo' && ' I understand that revoking this stop payment order will make the cheque payable again.'}
                                                </label>
                                                {errors.termsAccepted && <ErrorMessage message={errors.termsAccepted} />}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(2)}
                                        className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 justify-center"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                        Back
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={otpLoading || !formData.signature || !formData.termsAccepted}
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 disabled:opacity-50 flex items-center gap-2 justify-center"
                                    >
                                        {otpLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Requesting OTP...
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="h-4 w-4" />
                                                Request OTP
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 4: OTP Verification */}
{step === 4 && (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-fuchsia-700" />
                OTP Verification
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-700">
                    An OTP has been sent to your phone number: 
                    <strong className="text-blue-900"> {phone}</strong>
                </p>
                {otpMessage && (
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {otpMessage}
                    </p>
                )}
            </div>

            <div className="max-w-md">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Enter OTP
                    </label>
                    <input 
                        type="text" 
                        name="otp" 
                        value={formData.otp} 
                        onChange={handleChange} 
                        maxLength={6}
                        className="w-full p-3 text-center text-2xl tracking-widest rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent font-mono"
                        placeholder="000000"
                    />
                    {errors.otp && <ErrorMessage message={errors.otp} />}
                    
                    <div className="mt-2 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resendCooldown > 0 || otpLoading}
                            className="text-sm text-fuchsia-700 hover:text-fuchsia-800 disabled:text-gray-400"
                        >
                            {resendCooldown > 0 
                                ? `Resend OTP in ${resendCooldown}s` 
                                : 'Resend OTP'
                            }
                        </button>
                        <span className="text-sm text-gray-500">
                            {formData.otp.length}/6
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <button 
                type="button" 
                onClick={() => setStep(3)}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 justify-center"
            >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Back
            </button>
            <button 
                type="submit" 
                disabled={isSubmitting || formData.otp.length !== 6}
                className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 disabled:opacity-50 flex items-center gap-2 justify-center"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <CheckCircle2 className="h-4 w-4" />
                        {formData.mode === 'spo' ? 'Submit Stop Payment' : 'Revoke Stop Payment'}
                    </>
                )}
            </button>
        </div>
    </form>
)}
                    </div>
                </div>
            </div>
        </div>
    );
}