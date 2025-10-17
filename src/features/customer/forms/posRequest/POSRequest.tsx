import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Error message component
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
    kebele: string;
    houseNumber: string;
    landmark: string;
    numberOfPOS: number;
    posType: 'mobile' | 'desktop';
    estimatedMonthlyTransaction: string;
    termsAccepted: boolean;
    otpCode: string; // Changed from otp to otpCode for consistency
}

type Errors = Partial<Record<keyof FormData, string>> & { submit?: string; otp?: string };

export default function POSRequestForm() {
    const { t } = useTranslation();
    const { phone } = useAuth();
    const { branch } = useBranch();
    const navigate = useNavigate();
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
        kebele: '',
        houseNumber: '',
        landmark: '',
        numberOfPOS: 1,
        posType: 'mobile',
        estimatedMonthlyTransaction: '',
        termsAccepted: false,
        otpCode: '',
    });
    const [errors, setErrors] = useState<Errors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<number>(1);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendTimer, setResendTimer] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (loadingAccounts) return;
        if (!accounts || accounts.length === 0) return;

        if (accounts.length === 1) {
            const account = accounts[0];
            setFormData(prev => ({ ...prev, accountNumber: account.accountNumber, customerName: account.accountHolderName || '' }));
        } else {
            const savedAccount = localStorage.getItem('selectedPOSAccount');
            const selectedAccount = accounts.find(a => a.accountNumber === savedAccount) || accounts[0];
            setFormData(prev => ({ ...prev, accountNumber: selectedAccount.accountNumber, customerName: selectedAccount.accountHolderName || '' }));
        }
    }, [accounts, loadingAccounts]);

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
                setFormData(prev => ({ ...prev, accountNumber: value, customerName: selected.accountHolderName || '' }));
                localStorage.setItem('selectedPOSAccount', value);
            }
            return;
        }

        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
            return;
        }
        
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateStep = (): boolean => {
        const errs: Errors = {};
        switch (step) {
            case 1:
                if (!formData.accountNumber.trim()) errs.accountNumber = t('accountNumberRequired', 'Please select an account');
                if (!formData.businessName.trim()) errs.businessName = t('businessNameRequired', 'Business name is required');
                if (!formData.businessType.trim()) errs.businessType = t('businessTypeRequired', 'Business type is required');
                if (!formData.contactPerson.trim()) errs.contactPerson = t('contactPersonRequired', 'Contact person is required');
                if (!formData.phoneNumber.trim()) errs.phoneNumber = t('phoneNumberRequired', 'Phone number is required');
                if (!formData.email.trim()) errs.email = t('emailRequired', 'Email is required');
                else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = t('invalidEmail', 'Please enter a valid email address');
                break;
            case 2:
                if (!formData.region.trim()) errs.region = t('regionRequired', 'Region is required');
                if (!formData.city.trim()) errs.city = t('cityRequired', 'City is required');
                if (!formData.subCity.trim()) errs.subCity = t('subCityRequired', 'Sub-city is required');
                if (!formData.woreda.trim()) errs.woreda = t('woredaRequired', 'Woreda is required');
                if (!formData.kebele.trim()) errs.kebele = t('kebeleRequired', 'Kebele is required');
                if (!formData.houseNumber.trim()) errs.houseNumber = t('houseNumberRequired', 'House number is required');
                break;
            case 3:
                if (!formData.termsAccepted) errs.termsAccepted = t('termsAcceptanceRequired', 'You must accept the terms and conditions');
                break;
            case 4:
                if (!formData.otpCode || formData.otpCode.length !== 6) errs.otp = t('validOtpRequired', 'Please enter the 6-digit OTP');
                break;
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep()) {
            const firstError = Object.keys(errors)[0];
            if (firstError) document.getElementById(firstError)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setStep(prev => prev + 1);
    };

    const handleBack = () => setStep(prev => prev - 1);

    const handleRequestOtp = async () => {
        if (!validateStep()) return;
        if (!phone) {
            setErrors({ submit: t('missingPhoneNumber', 'Phone number not found. Please log in again.') });
            return;
        }

        setOtpLoading(true);
        setErrors({});
        setOtpMessage('');

        try {
            const phoneToUse = formData.phoneNumber || phone;
            await authService.requestOtp(phoneToUse);
            setOtpMessage(t('otpSent', 'OTP sent to your phone.'));
            setStep(4);
            setResendCooldown(30);
            const timer = setInterval(() => setResendCooldown(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
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
            const timer = setInterval(() => setResendCooldown(prev => (prev <= 1 ? 0 : prev - 1)), 1000);
            setResendTimer(timer);
        } catch (error: any) {
            setErrors({ submit: error?.message || t('otpRequestFailed', 'Failed to send OTP.') });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        const errs: Errors = {};
        if (!formData.accountNumber.trim()) errs.accountNumber = t('accountNumberRequired', 'Please select an account');
        if (!formData.businessName.trim()) errs.businessName = t('businessNameRequired', 'Business name is required');
        if (!formData.businessType.trim()) errs.businessType = t('businessTypeRequired', 'Business type is required');
        if (!formData.contactPerson.trim()) errs.contactPerson = t('contactPersonRequired', 'Contact person is required');
        if (!formData.phoneNumber.trim()) errs.phoneNumber = t('phoneNumberRequired', 'Phone number is required');
        if (!formData.email.trim()) errs.email = t('emailRequired', 'Email is required');
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = t('invalidEmail', 'Please enter a valid email address');
        
        if (!formData.region.trim()) errs.region = t('regionRequired', 'Region is required');
        if (!formData.city.trim()) errs.city = t('cityRequired', 'City is required');
        if (!formData.subCity.trim()) errs.subCity = t('subCityRequired', 'Sub-city is required');
        if (!formData.woreda.trim()) errs.woreda = t('woredaRequired', 'Woreda is required');
        if (!formData.kebele.trim()) errs.kebele = t('kebeleRequired', 'Kebele is required');
        if (!formData.houseNumber.trim()) errs.houseNumber = t('houseNumberRequired', 'House number is required');

        if (!formData.termsAccepted) errs.termsAccepted = t('termsAcceptanceRequired', 'You must accept the terms and conditions');
        
        if (!formData.otpCode || formData.otpCode.length !== 6) errs.otp = t('validOtpRequired', 'Please enter the 6-digit OTP');

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            if (errs.accountNumber || errs.businessName || errs.businessType || errs.contactPerson || errs.phoneNumber || errs.email) {
                setStep(1);
            } else if (errs.region || errs.city || errs.subCity || errs.woreda || errs.houseNumber || errs.kebele) {
                setStep(2);
            } else if (errs.termsAccepted) {
                setStep(3);
            }
            return;
        }

        if (!branch?.id) {
            setErrors({ submit: t('missingBranch', 'Please select a branch.') });
            return;
        }

        setIsSubmitting(true);
        try {
            const addressObject = {
                City: formData.city,
                Subcity: formData.subCity,
                Wereda: formData.woreda,
                Kebele: formData.kebele,
            };

            const rawPhone = (formData.phoneNumber || phone || '').toString();
            const posRequestData = {
                BranchId: branch.id,
                OtpCode: formData.otpCode,
                AccountNumber: formData.accountNumber,
                CustomerName: formData.customerName,
                PhoneNumber: rawPhone,
                ContactNumber: formData.phoneNumber,
                SecondaryContactNumber: null,
                Address: addressObject,
                BusinessName: formData.businessName,
                NatureOfBusiness: formData.businessName,
                TypeOfBusiness: formData.businessType,
                NumberOfPOSRequired: formData.numberOfPOS,
                TermsAccepted: formData.termsAccepted
            };

            console.log('Submitting POS Request with payload:', posRequestData);
            const response = await submitPosRequest(posRequestData);

            if (response && response.success) {
                navigate('/form/pos-request/confirmation', { 
                    state: { serverData: response, branchName: branch?.name, formData: formData, address: addressObject } 
                });
            } else {
                const errorMessage = response?.message || t('submissionFailed', 'Submission failed');
                if (errorMessage.toLowerCase().includes('otp') || errorMessage.toLowerCase().includes('invalid')) {
                    setErrors({ otp: errorMessage });
                } else {
                    setErrors({ submit: errorMessage });
                }
            }
        } catch (error: any) {
            const errorMessage = error?.message || t('submissionFailed', 'Submission failed');
            if (errorMessage.toLowerCase().includes('otp') || errorMessage.toLowerCase().includes('invalid')) {
                setErrors({ otp: errorMessage });
            } else {
                setErrors({ submit: errorMessage });
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingAccounts) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4"><div className="max-w-4xl w-full"><div className="bg-white rounded-lg shadow-lg p-8 text-center"><Loader2 className="h-12 w-12 text-fuchsia-700 animate-spin mx-auto mb-4" /><p className="text-gray-600">{t('loading', 'Loading...')}</p></div></div></div>;
    }

    if (errorAccounts) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4"><div className="max-w-4xl w-full"><div className="bg-white rounded-lg shadow-lg p-8 text-center"><AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900 mb-2">{t('error', 'Error')}</h3><p className="text-gray-600 mb-4">{errorAccounts}</p><button onClick={() => refreshAccounts()} className="bg-fuchsia-700 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-800">{t('tryAgain', 'Try Again')}</button></div></div></div>;
    }

    if (!loadingAccounts && accounts.length === 0) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4"><div className="max-w-4xl w-full"><div className="bg-white rounded-lg shadow-lg p-8 text-center"><CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noAccounts', 'No Accounts')}</h3><p className="text-gray-600 mb-4">{t('noAccountsMessage', 'No accounts found for your phone number.')}</p><button onClick={() => refreshAccounts()} className="bg-fuchsia-700 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-800">{t('refresh', 'Refresh')}</button></div></div></div>;
    }

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return renderStep1();
            case 2:
                return renderStep2();
            case 3:
                return renderStep3();
            case 4:
                return renderStep4();
            default:
                return null;
        }
    };

    const renderStep1 = () => (
        <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Building className="h-5 w-5 text-fuchsia-700" />{t('businessInformation', 'Business Information')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label={t('accountNumber', 'Account Number')} required error={errors.accountNumber}><select name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="accountNumber"><option value="">{t('selectAccount', 'Select account')}</option>{accounts.map(acc => (<option key={acc.accountNumber} value={acc.accountNumber}>{acc.accountNumber} - {acc.accountType}</option>))}</select></Field>
                <Field label={t('customerName', 'Customer Name')}><input type="text" name="customerName" value={formData.customerName} readOnly className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50" /></Field>
                <div className="md:col-span-2"><Field label={t('businessName', 'Business Name')} required error={errors.businessName}><input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="businessName" /></Field></div>
                <Field label={t('businessType', 'Business Type')} required error={errors.businessType}><select name="businessType" value={formData.businessType} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="businessType"><option value="">{t('selectBusinessType', 'Select Business Type')}</option><option value="retail">{t('retail', 'Retail')}</option><option value="wholesale">{t('wholesale', 'Wholesale')}</option><option value="service">{t('service', 'Service')}</option><option value="hospitality">{t('hospitality', 'Hospitality')}</option><option value="other">{t('other', 'Other')}</option></select></Field>
                <Field label={t('contactPerson', 'Contact Person')} required error={errors.contactPerson}><input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="contactPerson" /></Field>
                <Field label={t('phoneNumber', 'Phone Number')} required error={errors.phoneNumber}><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-gray-400" /></div><input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="phoneNumber" /></div></Field>
                <Field label={t('emailAddress', 'Email Address')} required error={errors.email}><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-gray-400" /></div><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="email" /></div></Field>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <>
            <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-fuchsia-700" />{t('addressInformation', 'Address Information')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label={t('region', 'Region')} required error={errors.region}><input type="text" name="region" value={formData.region} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="region" /></Field>
                    <Field label={t('city', 'City')} required error={errors.city}><input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="city" /></Field>
                    <Field label={t('subCity', 'Sub-city')} required error={errors.subCity}><input type="text" name="subCity" value={formData.subCity} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="subCity" /></Field>
                    <Field label={t('woreda', 'Woreda')} required error={errors.woreda}><input type="text" name="woreda" value={formData.woreda} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="woreda" /></Field>
                    <Field label={t('kebele', 'Kebele')} required error={errors.kebele}><input type="text" name="kebele" value={formData.kebele} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="kebele" /></Field>
                    <Field label={t('houseNumber', 'House Number')} required error={errors.houseNumber}><input type="text" name="houseNumber" value={formData.houseNumber} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="houseNumber" /></Field>
                    <Field label={t('landmark', 'Landmark (Optional)')}><input type="text" name="landmark" value={formData.landmark} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" /></Field>
                </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-6 mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-fuchsia-700" />{t('posDetails', 'POS Terminal Details')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label={t('numberOfPOS', 'Number of POS Terminals')} required><select name="numberOfPOS" value={formData.numberOfPOS} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent">{[1, 2, 3, 4, 5].map(num => (<option key={num} value={num}>{num}</option>))}</select></Field>
                    <Field label={t('posType', 'POS Type')} required><select name="posType" value={formData.posType} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"><option value="mobile">{t('mobilePos', 'Mobile POS')}</option><option value="desktop">{t('desktopPos', 'Desktop POS')}</option></select></Field>
                    <div className="md:col-span-2"><Field label={t('estimatedMonthlyTransaction', 'Estimated Monthly Transaction Volume (ETB)')}><select name="estimatedMonthlyTransaction" value={formData.estimatedMonthlyTransaction} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"><option value="">{t('selectRange', 'Select Range')}</option><option value="1-50000">1 - 50,000 ETB</option><option value="50001-200000">50,001 - 200,000 ETB</option><option value="200001-500000">200,001 - 500,000 ETB</option><option value="500001-1000000">500,001 - 1,000,000 ETB</option><option value="1000001+">1,000,000+ ETB</option></select></Field></div>
                </div>
            </div>
        </>
    );

    const renderStep3 = () => (
        <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-fuchsia-700" />{t('reviewInformation', 'Review Information')}</h2>
            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Building className="h-4 w-4" />{t('businessInformation', 'Business Information')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <p><span className="font-medium text-gray-500">{t('accountNumber', 'Account')}:</span> {formData.accountNumber}</p>
                        <p><span className="font-medium text-gray-500">{t('customerName', 'Name')}:</span> {formData.customerName}</p>
                        <p><span className="font-medium text-gray-500">{t('businessName', 'Business Name')}:</span> {formData.businessName}</p>
                        <p><span className="font-medium text-gray-500">{t('businessType', 'Type')}:</span> {formData.businessType}</p>
                        <p><span className="font-medium text-gray-500">{t('contactPerson', 'Contact')}:</span> {formData.contactPerson}</p>
                        <p><span className="font-medium text-gray-500">{t('phoneNumber', 'Phone')}:</span> {formData.phoneNumber}</p>
                        <p className="md:col-span-2"><span className="font-medium text-gray-500">{t('emailAddress', 'Email')}:</span> {formData.email}</p>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><MapPin className="h-4 w-4" />{t('address', 'Address')}</h3>
                    <p className="text-sm">{`${formData.houseNumber}, ${formData.woreda}, ${formData.subCity}, ${formData.city}, ${formData.region}`}</p>
                    {formData.landmark && <p className="text-sm"><span className="font-medium text-gray-500">{t('landmark', 'Landmark')}:</span> {formData.landmark}</p>}
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4" />{t('posDetails', 'POS Details')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <p><span className="font-medium text-gray-500">{t('numberOfPOS', 'Units')}:</span> {formData.numberOfPOS}</p>
                        <p><span className="font-medium text-gray-500">{t('posType', 'Type')}:</span> {formData.posType}</p>
                        <p className="md:col-span-2"><span className="font-medium text-gray-500">{t('estimatedVolume', 'Est. Volume')}:</span> {formData.estimatedMonthlyTransaction || 'N/A'}</p>
                    </div>
                </div>
            </div>
            <div className="mt-6"><div className="flex items-start"><div className="flex items-center h-5"><input id="termsAccepted" name="termsAccepted" type="checkbox" checked={formData.termsAccepted} onChange={handleChange} className="h-4 w-4 text-fuchsia-600 focus:ring-fuchsia-500 border-gray-300 rounded" /></div><div className="ml-3 text-sm"><label htmlFor="termsAccepted" className="font-medium text-gray-700">{t('acceptTerms', 'I agree to the terms and conditions')}</label><p className="text-gray-500">{t('termsDescription', 'By submitting this form, I confirm that all the information provided is accurate and complete.')}</p>{errors.termsAccepted && <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>}</div></div></div>
        </div>
    );

    const renderStep4 = () => (
        <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Shield className="h-5 w-5 text-fuchsia-700" />{t('otpVerification', 'OTP Verification')}</h2>
            <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4"><p className="text-sm text-blue-700">{t('otpInstructions', 'An OTP has been sent to your phone number:')} <strong className="text-blue-900"> {formData.phoneNumber}</strong></p>{otpMessage && <p className="text-sm text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{otpMessage}</p>}</div>
                <div className="max-w-md">
                    <Field label={t('enterOtp', 'Enter OTP')} required error={errors.otp}><input type="text" name="otpCode" value={formData.otpCode} onChange={handleChange} maxLength={6} className="w-full p-3 text-center text-2xl tracking-widest rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent font-mono" placeholder="000000" id="otpCode" /></Field>
                    <div className="mt-2 flex justify-between items-center">
                        <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0 || otpLoading} className="text-sm text-fuchsia-700 hover:text-fuchsia-800 disabled:text-gray-400">{resendCooldown > 0 ? t('resendOtpIn', `Resend OTP in ${resendCooldown}s`) : t('resendOtp', 'Resend OTP')}</button>
                        <span className="text-sm text-gray-500">{formData.otpCode.length}/6</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full mx-auto">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <header className="bg-gradient-to-r from-amber-500 to-fuchsia-700 text-white rounded-t-lg">
              <div className="px-6 py-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h1 className="text-lg font-bold">{t('posRequest', 'POS Request')}</h1>
                    <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{branch?.name || t('branch', 'Branch')}</span>
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

            <div className="p-6">
              <form onSubmit={step === 4 ? handleSubmit : handleNext} className="space-y-6">
                {renderStepContent()}
                {errors.submit && <ErrorMessage message={errors.submit} />}
                <div className="flex justify-between pt-4">
                  {step > 1 ? (
                    <button type="button" onClick={handleBack} className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 rotate-180" />
                      {t('back', 'Back')}
                    </button>
                  ) : (
                    <div></div>
                  )}
                  {step < 3 ? (
                    <button type="submit" className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 flex items-center gap-2">
                      <span>{t('continue', 'Continue')}</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : step === 3 ? (
                    <button type="button" onClick={handleRequestOtp} disabled={otpLoading || !formData.termsAccepted} className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 flex items-center gap-2 disabled:opacity-50">
                      {otpLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('requesting', 'Requesting...')}
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4" />
                          <span>{t('requestOtp', 'Request OTP')}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button type="submit" disabled={isSubmitting || formData.otpCode.length !== 6} className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 disabled:opacity-50 flex items-center gap-2 justify-center">
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
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
}