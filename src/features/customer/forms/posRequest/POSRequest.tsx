import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { useUserAccounts } from '../../../../hooks/useUserAccounts';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';
import { submitPosRequest } from '../../../../services/posRequestService';
import authService from '../../../../services/authService';
import Field from '../../../../components/Field';
import { 
    Loader2, 
    AlertCircle, 
    CheckCircle2, 
    ChevronRight,
    CreditCard,
    Building,
    MapPin,
    User,
    Phone,
    Mail,
    FileText,
    Shield,
    Calendar
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
    accountNumber: string;
    customerName: string;
    businessName: string;
    businessType: string;
    contactPerson: string;
    phoneNumber: string;
    email: string;
    region: string;
    city: string;
    subCity: string;
    woreda: string;
    houseNumber: string;
    landmark: string;
    numberOfPOS: number;
    posType: 'mobile' | 'desktop';
    estimatedMonthlyTransaction: string;
    termsAccepted: boolean;
    otp: string;
}

type Errors = Partial<Record<keyof FormData, string>> & { submit?: string; otp?: string };

export default function POSRequestForm() {
    const { t } = useTranslation();
    const { phone, token, user } = useAuth();
    const { branch } = useBranch();
    const navigate = useNavigate();
    const location = useLocation();
    const { 
        accounts, 
        loadingAccounts, 
        errorAccounts, 
        refreshAccounts 
    } = useUserAccounts();

    const [formData, setFormData] = useState<FormData>({
        accountNumber: '',
        customerName: '',
        businessName: '',
        businessType: '',
        contactPerson: '',
        phoneNumber: phone || '',
        email: '',
        region: '',
        city: '',
        subCity: '',
        woreda: '',
        houseNumber: '',
        landmark: '',
        numberOfPOS: 1,
        posType: 'mobile',
        estimatedMonthlyTransaction: '',
        termsAccepted: false,
        otp: '',
    });
    const [errors, setErrors] = useState<Errors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<number>(1);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendTimer, setResendTimer] = useState<NodeJS.Timeout | null>(null);

    // Account selection logic (consistent with withdrawal form)
    useEffect(() => {
        if (loadingAccounts) return;

        if (!accounts || accounts.length === 0) {
            setFormData(prev => ({ ...prev, accountNumber: '', customerName: '' }));
            return;
        }

        if (accounts.length === 1) {
            const account = accounts[0];
            setFormData(prev => ({
                ...prev,
                accountNumber: account.accountNumber,
                customerName: account.accountHolderName || '',
            }));
        } else if (accounts.length > 1) {
            const savedAccount = localStorage.getItem('selectedPOSAccount');
            const selectedAccount = accounts.find(a => a.accountNumber === savedAccount) || accounts[0];
            setFormData(prev => ({
                ...prev,
                accountNumber: selectedAccount.accountNumber,
                customerName: selectedAccount.accountHolderName || '',
            }));
        }
    }, [accounts, loadingAccounts]);

    // Handle cleanup of timers
    useEffect(() => {
        return () => {
            if (resendTimer) clearInterval(resendTimer);
        };
    }, [resendTimer]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (errors[name as keyof Errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }

        if (name === 'accountNumber') {
            const selected = accounts.find(acc => acc.accountNumber === value);
            if (selected) {
                setFormData(prev => ({
                    ...prev,
                    accountNumber: value,
                    customerName: selected.accountHolderName || ''
                }));
                localStorage.setItem('selectedPOSAccount', value);
                return;
            }
        }

        if (name === 'otp') {
            const sanitizedValue = value.replace(/\D/g, '').slice(0, 6);
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }

        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
            return;
        }
        
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateStep1 = (): boolean => {
        const errs: Errors = {};
        
        if (!formData.accountNumber.trim()) {
            errs.accountNumber = t('accountNumberRequired', 'Please select an account');
        }
        
        if (!formData.businessName.trim()) {
            errs.businessName = t('businessNameRequired', 'Business name is required');
        }
        
        if (!formData.businessType.trim()) {
            errs.businessType = t('businessTypeRequired', 'Business type is required');
        }
        
        if (!formData.contactPerson.trim()) {
            errs.contactPerson = t('contactPersonRequired', 'Contact person is required');
        }
        
        if (!formData.phoneNumber.trim()) {
            errs.phoneNumber = t('phoneNumberRequired', 'Phone number is required');
        }
        
        if (!formData.email.trim()) {
            errs.email = t('emailRequired', 'Email is required');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errs.email = t('invalidEmail', 'Please enter a valid email address');
        }
        
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep2 = (): boolean => {
        const errs: Errors = {};
        
        if (!formData.region.trim()) {
            errs.region = t('regionRequired', 'Region is required');
        }
        
        if (!formData.city.trim()) {
            errs.city = t('cityRequired', 'City is required');
        }
        
        if (!formData.subCity.trim()) {
            errs.subCity = t('subCityRequired', 'Sub-city is required');
        }
        
        if (!formData.woreda.trim()) {
            errs.woreda = t('woredaRequired', 'Woreda is required');
        }
        
        if (!formData.houseNumber.trim()) {
            errs.houseNumber = t('houseNumberRequired', 'House number is required');
        }
        
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep3 = (): boolean => {
        const errs: Errors = {};
        
        if (!formData.otp || formData.otp.length !== 6) {
            errs.otp = t('validOtpRequired', 'Please enter the 6-digit OTP');
        }
        
        if (!formData.termsAccepted) {
            errs.termsAccepted = t('termsAcceptanceRequired', 'You must accept the terms and conditions');
        }
        
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleStep1Next = (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep1()) {
            const firstError = Object.keys(errors)[0];
            if (firstError) {
                document.getElementById(firstError)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        setStep(2);
    };

    const handleStep2Next = (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep2()) {
            const firstError = Object.keys(errors)[0];
            if (firstError) {
                document.getElementById(firstError)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        setStep(3);
    };

    const handleStep3Next = async (e: FormEvent) => {
        e.preventDefault();
        if (!phone) {
            setErrors({ submit: t('missingPhoneNumber', 'Phone number not found. Please log in again.') });
            return;
        }

        setOtpLoading(true);
        setErrors({});
        setOtpMessage('');

        try {
            // Use the phone number from form or authenticated user
            const phoneToUse = formData.phoneNumber || phone;
            await authService.requestOtp(phoneToUse);
            
            setOtpMessage(t('otpSent', 'OTP sent to your phone.'));
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
            setResendTimer(timer);
        } catch (error: any) {
            setErrors({ submit: error?.message || t('otpRequestFailed', 'Failed to send OTP.') });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!phone || resendCooldown > 0) return;

        setOtpLoading(true);
        setErrors({});
        setOtpMessage('');

        try {
            const phoneToUse = formData.phoneNumber || phone;
            await authService.requestOtp(phoneToUse);
            
            setOtpMessage(t('otpResent', 'OTP resent successfully.'));
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
            setResendTimer(timer);
        } catch (error: any) {
            setErrors({ submit: error?.message || t('otpRequestFailed', 'Failed to send OTP.') });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep3()) return;
        if (!formData.otp || formData.otp.length !== 6) {
            setErrors({ otp: t('validOtpRequired', 'Please enter the 6-digit OTP') });
            return;
        }

        if (!branch?.id) {
            setErrors({ submit: t('missingBranch', 'Please select a branch.') });
            return;
        }

        setIsSubmitting(true);
        try {
            // Build address string from individual fields (backend requirement)
            const addressParts = [
                formData.region,
                formData.city, 
                formData.subCity,
                formData.woreda,
                formData.houseNumber
            ].filter(Boolean);
            
            if (formData.landmark) {
                addressParts.push(formData.landmark);
            }
            
            const fullAddress = addressParts.join(', ');

            // Build payload matching backend PosRequestCreateDto
            const posRequestData = {
                BranchId: branch.id,
                OtpCode: formData.otp,
                AccountNumber: formData.accountNumber,
                ContactNumber: formData.phoneNumber,
                SecondaryContactNumber: null, // Optional - set to null
                Address: fullAddress,
                NatureOfBusiness: formData.businessName,
                TypeOfBusiness: formData.businessType,
                NumberOfPOSRequired: formData.numberOfPOS,
                TermsAccepted: formData.termsAccepted
            };

            const response = await submitPosRequest(posRequestData);

            if (response && response.success) {
                navigate('/form/pos-request/confirmation', { 
                    state: { 
                        serverData: response,
                        branchName: branch?.name,
                        formData: formData,
                        address: fullAddress
                    } 
                });
            } else {
                setErrors({ submit: response?.message || t('submissionFailed', 'Submission failed. Please try again.') });
            }
        } catch (error: any) {
            setErrors({ submit: error?.message || t('submissionFailed', 'Submission failed. Please try again.') });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading states (consistent with withdrawal form)
    if (loadingAccounts) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <Loader2 className="h-12 w-12 text-fuchsia-700 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">{t('loading', 'Loading...')}</p>
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('error', 'Error')}</h3>
                        <p className="text-gray-600 mb-4">{errorAccounts}</p>
                        <button
                            onClick={() => refreshAccounts()}
                            className="bg-fuchsia-700 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-800"
                        >
                            {t('tryAgain', 'Try Again')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!loadingAccounts && accounts.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noAccounts', 'No Accounts')}</h3>
                        <p className="text-gray-600 mb-4">{t('noAccountsMessage', 'No accounts found for your phone number.')}</p>
                        <button
                            onClick={() => refreshAccounts()}
                            className="bg-fuchsia-700 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-800"
                        >
                            {t('refresh', 'Refresh')}
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
                    {/* Header with Language Switcher */}
                    <header className="bg-fuchsia-700 text-white rounded-t-lg">
                        <div className="px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <Building className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold">{t('posRequest', 'POS Request')}</h1>
                                        <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>{branch?.name || t('branch', 'Branch')}</span>
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
                                    <div className="bg-white/20 rounded-lg p-1">
                                        <LanguageSwitcher />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div className="p-6">
                        {/* Progress Steps - 4 steps for POS request */}
                        <div className="flex justify-center mb-6">
                            <div className="flex items-center bg-gray-50 rounded-lg p-1">
                                <div className={`flex items-center px-4 py-2 rounded-md ${step >= 1 ? 'bg-fuchsia-700 text-white' : 'text-gray-600'}`}>
                                    <span className="font-medium text-sm">1. {t('businessInfo', 'Business Info')}</span>
                                </div>
                                <div className="mx-1 text-gray-400 text-sm">→</div>
                                <div className={`flex items-center px-4 py-2 rounded-md ${step >= 2 ? 'bg-fuchsia-700 text-white' : 'text-gray-600'}`}>
                                    <span className="font-medium text-sm">2. {t('address', 'Address')}</span>
                                </div>
                                <div className="mx-1 text-gray-400 text-sm">→</div>
                                <div className={`flex items-center px-4 py-2 rounded-md ${step >= 3 ? 'bg-fuchsia-700 text-white' : 'text-gray-600'}`}>
                                    <span className="font-medium text-sm">3. {t('review', 'Review')}</span>
                                </div>
                                <div className="mx-1 text-gray-400 text-sm">→</div>
                                <div className={`flex items-center px-4 py-2 rounded-md ${step >= 4 ? 'bg-fuchsia-700 text-white' : 'text-gray-600'}`}>
                                    <span className="font-medium text-sm">4. {t('otp', 'OTP')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Step 1: Business Information */}
                        {step === 1 && (
                            <form onSubmit={handleStep1Next} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Building className="h-5 w-5 text-fuchsia-700" />
                                        {t('businessInformation', 'Business Information')}
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field 
                                            label={t('accountNumber', 'Account Number')} 
                                            required 
                                            error={errors.accountNumber}
                                        >
                                            <select 
                                                name="accountNumber" 
                                                value={formData.accountNumber} 
                                                onChange={handleChange} 
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="accountNumber"
                                            >
                                                <option value="">{t('selectAccount', 'Select account')}</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.accountNumber} value={acc.accountNumber}>
                                                        {acc.accountNumber} - {acc.accountType}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>
                                        
                                        <Field 
                                            label={t('customerName', 'Customer Name')} 
                                        >
                                            <input 
                                                type="text" 
                                                name="customerName" 
                                                value={formData.customerName} 
                                                readOnly 
                                                className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50"
                                            />
                                        </Field>

                                        <div className="md:col-span-2">
                                            <Field 
                                                label={t('businessName', 'Business Name')} 
                                                required 
                                                error={errors.businessName}
                                            >
                                                <input 
                                                    type="text" 
                                                    name="businessName" 
                                                    value={formData.businessName} 
                                                    onChange={handleChange} 
                                                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                    id="businessName"
                                                />
                                            </Field>
                                        </div>

                                        <Field 
                                            label={t('businessType', 'Business Type')} 
                                            required 
                                            error={errors.businessType}
                                        >
                                            <select 
                                                name="businessType" 
                                                value={formData.businessType} 
                                                onChange={handleChange} 
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="businessType"
                                            >
                                                <option value="">{t('selectBusinessType', 'Select Business Type')}</option>
                                                <option value="retail">{t('retail', 'Retail')}</option>
                                                <option value="wholesale">{t('wholesale', 'Wholesale')}</option>
                                                <option value="service">{t('service', 'Service')}</option>
                                                <option value="hospitality">{t('hospitality', 'Hospitality')}</option>
                                                <option value="other">{t('other', 'Other')}</option>
                                            </select>
                                        </Field>

                                        <Field 
                                            label={t('contactPerson', 'Contact Person')} 
                                            required 
                                            error={errors.contactPerson}
                                        >
                                            <input 
                                                type="text" 
                                                name="contactPerson" 
                                                value={formData.contactPerson} 
                                                onChange={handleChange} 
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="contactPerson"
                                            />
                                        </Field>

                                        <Field 
                                            label={t('phoneNumber', 'Phone Number')} 
                                            required 
                                            error={errors.phoneNumber}
                                        >
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Phone className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input 
                                                    type="tel" 
                                                    name="phoneNumber" 
                                                    value={formData.phoneNumber} 
                                                    onChange={handleChange} 
                                                    className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                    id="phoneNumber"
                                                />
                                            </div>
                                        </Field>

                                        <Field 
                                            label={t('emailAddress', 'Email Address')} 
                                            required 
                                            error={errors.email}
                                        >
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input 
                                                    type="email" 
                                                    name="email" 
                                                    value={formData.email} 
                                                    onChange={handleChange} 
                                                    className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                    id="email"
                                                />
                                            </div>
                                        </Field>
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="flex justify-end">
                                    <button 
                                        type="submit" 
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 flex items-center gap-2"
                                    >
                                        <span>{t('continue', 'Continue')}</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 2: Address Information */}
                        {step === 2 && (
                            <form onSubmit={handleStep2Next} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-fuchsia-700" />
                                        {t('addressInformation', 'Address Information')}
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field 
                                            label={t('region', 'Region')} 
                                            required 
                                            error={errors.region}
                                        >
                                            <input 
                                                type="text" 
                                                name="region" 
                                                value={formData.region} 
                                                onChange={handleChange} 
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="region"
                                            />
                                        </Field>

                                        <Field 
                                            label={t('city', 'City')} 
                                            required 
                                            error={errors.city}
                                        >
                                            <input 
                                                type="text" 
                                                name="city" 
                                                value={formData.city} 
                                                onChange={handleChange} 
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="city"
                                            />
                                        </Field>

                                        <Field 
                                            label={t('subCity', 'Sub-city')} 
                                            required 
                                            error={errors.subCity}
                                        >
                                            <input 
                                                type="text" 
                                                name="subCity" 
                                                value={formData.subCity} 
                                                onChange={handleChange} 
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="subCity"
                                            />
                                        </Field>

                                        <Field 
                                            label={t('woreda', 'Woreda')} 
                                            required 
                                            error={errors.woreda}
                                        >
                                            <input 
                                                type="text" 
                                                name="woreda" 
                                                value={formData.woreda} 
                                                onChange={handleChange} 
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="woreda"
                                            />
                                        </Field>

                                        <Field 
                                            label={t('houseNumber', 'House Number')} 
                                            required 
                                            error={errors.houseNumber}
                                        >
                                            <input 
                                                type="text" 
                                                name="houseNumber" 
                                                value={formData.houseNumber} 
                                                onChange={handleChange} 
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="houseNumber"
                                            />
                                        </Field>

                                        <Field 
                                            label={t('landmark', 'Landmark (Optional)')} 
                                        >
                                            <input 
                                                type="text" 
                                                name="landmark" 
                                                value={formData.landmark} 
                                                onChange={handleChange} 
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                            />
                                        </Field>
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-fuchsia-700" />
                                        {t('posDetails', 'POS Terminal Details')}
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field 
                                            label={t('numberOfPOS', 'Number of POS Terminals')} 
                                            required
                                        >
                                            <select 
                                                name="numberOfPOS" 
                                                value={formData.numberOfPOS} 
                                                onChange={handleChange} 
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                            >
                                                {[1, 2, 3, 4, 5].map(num => (
                                                    <option key={num} value={num}>{num}</option>
                                                ))}
                                            </select>
                                        </Field>

                                        <Field 
                                            label={t('posType', 'POS Type')} 
                                            required
                                        >
                                            <select 
                                                name="posType" 
                                                value={formData.posType} 
                                                onChange={handleChange} 
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                            >
                                                <option value="mobile">{t('mobilePos', 'Mobile POS')}</option>
                                                <option value="desktop">{t('desktopPos', 'Desktop POS')}</option>
                                            </select>
                                        </Field>

                                        <div className="md:col-span-2">
                                            <Field 
                                                label={t('estimatedMonthlyTransaction', 'Estimated Monthly Transaction Volume (ETB)')} 
                                            >
                                                <select 
                                                    name="estimatedMonthlyTransaction" 
                                                    value={formData.estimatedMonthlyTransaction} 
                                                    onChange={handleChange} 
                                                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                >
                                                    <option value="">{t('selectRange', 'Select Range')}</option>
                                                    <option value="1-50000">1 - 50,000 ETB</option>
                                                    <option value="50001-200000">50,001 - 200,000 ETB</option>
                                                    <option value="200001-500000">200,001 - 500,000 ETB</option>
                                                    <option value="500001-1000000">500,001 - 1,000,000 ETB</option>
                                                    <option value="1000001+">1,000,000+ ETB</option>
                                                </select>
                                            </Field>
                                        </div>
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(1)}
                                        className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 justify-center"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                        {t('back', 'Back')}
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 flex items-center gap-2 justify-center"
                                    >
                                        <span>{t('continue', 'Continue')}</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 3: Review Information */}
{step === 3 && (
    <form onSubmit={handleStep3Next} className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-fuchsia-700" />
                {t('reviewInformation', 'Review Information')}
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {t('businessInformation', 'Business Information')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm font-medium text-gray-500">{t('accountNumber', 'Account Number')}:</span>
                            <p className="text-sm text-gray-900">{formData.accountNumber}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500">{t('customerName', 'Customer Name')}:</span>
                            <p className="text-sm text-gray-900">{formData.customerName}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500">{t('businessName', 'Business Name')}:</span>
                            <p className="text-sm text-gray-900">{formData.businessName}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500">{t('businessType', 'Business Type')}:</span>
                            <p className="text-sm text-gray-900 capitalize">{formData.businessType}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500">{t('contactPerson', 'Contact Person')}:</span>
                            <p className="text-sm text-gray-900">{formData.contactPerson}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500">{t('phoneNumber', 'Phone Number')}:</span>
                            <p className="text-sm text-gray-900">{formData.phoneNumber}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500">{t('emailAddress', 'Email')}:</span>
                            <p className="text-sm text-gray-900">{formData.email}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {t('addressInformation', 'Address Information')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm font-medium text-gray-500">{t('region', 'Region')}:</span>
                            <p className="text-sm text-gray-900">{formData.region}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500">{t('city', 'City')}:</span>
                            <p className="text-sm text-gray-900">{formData.city}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500">{t('subCity', 'Sub-city')}:</span>
                            <p className="text-sm text-gray-900">{formData.subCity}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500">{t('woreda', 'Woreda')}:</span>
                            <p className="text-sm text-gray-900">{formData.woreda}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500">{t('houseNumber', 'House Number')}:</span>
                            <p className="text-sm text-gray-900">{formData.houseNumber}</p>
                        </div>
                        {formData.landmark && (
                            <div>
                                <span className="text-sm font-medium text-gray-500">{t('landmark', 'Landmark')}:</span>
                                <p className="text-sm text-gray-900">{formData.landmark}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {t('posDetails', 'POS Terminal Details')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm font-medium text-gray-500">{t('numberOfPOS', 'Number of POS')}:</span>
                            <p className="text-sm text-gray-900">{formData.numberOfPOS}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500">{t('posType', 'POS Type')}:</span>
                            <p className="text-sm text-gray-900 capitalize">{formData.posType}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500">{t('estimatedMonthlyTransaction', 'Estimated Monthly Volume')}:</span>
                            <p className="text-sm text-gray-900">{formData.estimatedMonthlyTransaction || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mt-6">
                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                            id="termsAccepted"
                            name="termsAccepted"
                            type="checkbox"
                            checked={formData.termsAccepted}
                            onChange={handleChange}
                            className="h-4 w-4 text-fuchsia-600 focus:ring-fuchsia-500 border-gray-300 rounded"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="termsAccepted" className="font-medium text-gray-700">
                            {t('acceptTerms', 'I agree to the terms and conditions')}
                        </label>
                        <p className="text-gray-500">
                            {t('termsDescription', 'By submitting this form, I confirm that all the information provided is accurate and complete.')}
                        </p>
                        {errors.termsAccepted && (
                            <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {errors.submit && <ErrorMessage message={errors.submit} />}

        <div className="grid grid-cols-2 gap-4">
            <button 
                type="button" 
                onClick={() => setStep(2)}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 justify-center"
            >
                <ChevronRight className="h-4 w-4 rotate-180" />
                {t('back', 'Back')}
            </button>
            <button 
                type="submit" 
                disabled={otpLoading}
                className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 disabled:opacity-50 flex items-center gap-2 justify-center"
            >
                {otpLoading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('requestingOtp', 'Requesting OTP...')}
                    </>
                ) : (
                    <>
                        <Shield className="h-4 w-4" />
                        {t('requestOtp', 'Request OTP')}
                    </>
                )}
            </button>
        </div>
    </form>
)}
                                    {/* Terms and Conditions */}
                                    <div className="mt-6">
                                        <div className="flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="termsAccepted"
                                                    name="termsAccepted"
                                                    type="checkbox"
                                                    checked={formData.termsAccepted}
                                                    onChange={handleChange}
                                                    className="h-4 w-4 text-fuchsia-600 focus:ring-fuchsia-500 border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor="termsAccepted" className="font-medium text-gray-700">
                                                    {t('acceptTerms', 'I agree to the terms and conditions')}
                                                </label>
                                                <p className="text-gray-500">
                                                    {t('termsDescription', 'By submitting this form, I confirm that all the information provided is accurate and complete.')}
                                                </p>
                                                {errors.termsAccepted && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(2)}
                                        className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 justify-center"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                        {t('back', 'Back')}
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={otpLoading}
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 disabled:opacity-50 flex items-center gap-2 justify-center"
                                    >
                                        {otpLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {t('requestingOtp', 'Requesting OTP...')}
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="h-4 w-4" />
                                                {t('requestOtp', 'Request OTP')}
                                            </>
                                        )}
                                    </button>
                                </div>
                                </div>
                        
                        {/* Step 4: OTP Verification */}
                        {step === 4 && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-fuchsia-700" />
                                        {t('otpVerification', 'OTP Verification')}
                                    </h2>
                                    
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-blue-700">
                                            {t('otpSentMessage', 'An OTP has been sent to your phone number:')} 
                                            <strong className="text-blue-900"> {formData.phoneNumber || phone}</strong>
                                        </p>
                                        {otpMessage && (
                                            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                {otpMessage}
                                            </p>
                                        )}
                                    </div>

                                    <div className="max-w-md">
                                        <Field 
                                            label={t('enterOtp', 'Enter OTP')} 
                                            required 
                                            error={errors.otp}
                                        >
                                            <input 
                                                type="text" 
                                                name="otp" 
                                                value={formData.otp} 
                                                onChange={handleChange} 
                                                maxLength={6}
                                                className="w-full p-3 text-center text-2xl tracking-widest rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent font-mono"
                                                placeholder="000000"
                                                id="otp"
                                            />
                                        </Field>
                                        
                                        <div className="mt-2 flex justify-between items-center">
                                            <button
                                                type="button"
                                                onClick={handleResendOtp}
                                                disabled={resendCooldown > 0 || otpLoading}
                                                className="text-sm text-fuchsia-700 hover:text-fuchsia-800 disabled:text-gray-400"
                                            >
                                                {resendCooldown > 0 
                                                    ? t('resendOtpIn', `Resend OTP in ${resendCooldown}s`) 
                                                    : t('resendOtp', 'Resend OTP')
                                                }
                                            </button>
                                            <span className="text-sm text-gray-500">
                                                {formData.otp.length}/6
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(3)}
                                        className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 justify-center"
                                    >
                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                        {t('back', 'Back')}
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting || formData.otp.length !== 6}
                                        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 disabled:opacity-50 flex items-center gap-2 justify-center"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {t('submitting', 'Submitting...')}
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" />
                                                {t('submitRequest', 'Submit Request')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        
    );
}