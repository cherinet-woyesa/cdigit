import React, { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';
import Field from '../../../../components/Field';
import { fetchWindowsByBranch } from '../../../../services/windowService';
import { createCbeBirrRegistration, getCbeBirrRegistration, updateCbeBirrRegistration } from '../../../../services/cbeBirrRegistrationService';
import type { Window as WindowType } from '../../../../services/windowService';
import authService from '../../../../services/authService';
import { 
    Loader2, 
    AlertCircle, 
    CheckCircle2, 
    ChevronRight,
    User,
    MapPin,
    IdCard,
    Users,
    PenTool,
    Shield,
    Calendar,
    Phone,
    Mail,
    BookOpen,
    Heart
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

// Success message component
function SuccessMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-green-700">{message}</span>
        </div>
    );
}

type FormData = {
    name: string;
    phoneNumber: string;
    fullName: string;
    fatherName: string;
    grandfatherName: string;
    placeOfBirth: string;
    dateOfBirth: string;
    gender: 'Male' | 'Female';
    city: string;
    wereda: string;
    kebele: string;
    email: string;
    idNumber: string;
    issuedBy: string;
    maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widow';
    educationLevel: string;
    motherName: string;
    motherFatherName: string;
    motherGrandfatherName: string;
    digitalSignature: string;
    otpCode: string;
};

type Errors = Partial<Record<keyof FormData | 'submit', string>>;

const educationLevels = [
    'Primary School',
    'Secondary School',
    'High School',
    'Diploma',
    "Bachelor's Degree",
    "Master's Degree",
    'PhD',
    'Other'
];

export default function CbeBirrRegistrationForm() {
    const { t } = useTranslation();
    const { phone, user } = useAuth();
    const { branch } = useBranch();
    const navigate = useNavigate();
    const { state: navState } = useLocation() as { state?: any };
    
    const [formData, setFormData] = useState<FormData>({
        name: '',
        phoneNumber: '',
        fullName: '',
        fatherName: '',
        grandfatherName: '',
        placeOfBirth: '',
        dateOfBirth: '',
        gender: 'Male',
        city: '',
        wereda: '',
        kebele: '',
        email: '',
        idNumber: '',
        issuedBy: '',
        maritalStatus: 'Single',
        educationLevel: educationLevels[0],
        motherName: '',
        motherFatherName: '',
        motherGrandfatherName: '',
        digitalSignature: '',
        otpCode: '',
    });

    const [errors, setErrors] = useState<Errors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [windows, setWindows] = useState<WindowType[]>([]);
    const [step, setStep] = useState(1); // 1: Personal, 2: Address, 3: ID, 4: Mother, 5: Signature, 6: Review
    const ABIY_BRANCH_ID = 'a3d3e1b5-8c9a-4c7c-a1e3-6b3d8f4a2b2c';
    const [isUpdate, setIsUpdate] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState('');
    const [otpError, setOtpError] = useState('');
    const [phoneForOtp, setPhoneForOtp] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Step-wise validation
    const validateStep = (): boolean => {
        const errs: Errors = {};
        
        if (step === 1) {
            if (!formData.phoneNumber.trim()) errs.phoneNumber = t('phoneNumberRequired', 'Phone number is required');
            if (!formData.fullName.trim()) errs.fullName = t('fullNameRequired', 'Full name is required');
            if (!formData.fatherName.trim()) errs.fatherName = t('fatherNameRequired', "Father's name is required");
            if (!formData.grandfatherName.trim()) errs.grandfatherName = t('grandfatherNameRequired', "Grandfather's name is required");
            if (!formData.placeOfBirth.trim()) errs.placeOfBirth = t('placeOfBirthRequired', 'Place of birth is required');
            if (!formData.dateOfBirth) errs.dateOfBirth = t('dateOfBirthRequired', 'Date of birth is required');
            
            const phoneRegex = /^(\+2519|\+2517|09|9|07|7)\d{8}$/;
            if (!phoneRegex.test(formData.phoneNumber)) {
                errs.phoneNumber = t('invalidEthiopianNumber', 'Please enter a valid Ethiopian phone number');
            }
        }
        
        if (step === 2) {
            if (!formData.city.trim()) errs.city = t('cityRequired', 'City is required');
            if (!formData.wereda.trim()) errs.wereda = t('weredaRequired', 'Wereda is required');
            if (!formData.kebele.trim()) errs.kebele = t('kebeleRequired', 'Kebele is required');
            if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                errs.email = t('invalidEmail', 'Please enter a valid email address');
            }
        }
        
        if (step === 3) {
            if (!formData.idNumber.trim()) errs.idNumber = t('idNumberRequired', 'ID number is required');
            if (!formData.issuedBy.trim()) errs.issuedBy = t('issuedByRequired', 'Issued by is required');
        }
        
        if (step === 4) {
            if (!formData.motherName.trim()) errs.motherName = t('motherNameRequired', "Mother's name is required");
            if (!formData.motherFatherName.trim()) errs.motherFatherName = t('motherFatherNameRequired', "Mother's father name is required");
            if (!formData.motherGrandfatherName.trim()) errs.motherGrandfatherName = t('motherGrandfatherNameRequired', "Mother's grandfather name is required");
        }
        
        if (step === 5) {
            if (!formData.otpCode.trim()) errs.otpCode = t('validOtpRequired', 'OTP code is required');
            if (formData.otpCode.length !== 6) errs.otpCode = t('validOtpRequired', 'Please enter 6-digit OTP');
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep()) {
            const firstError = Object.keys(errors)[0];
            if (firstError) {
                document.getElementById(firstError)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        setStep(prev => prev + 1);
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    useEffect(() => {
        // Pre-fill phone number if available from auth
        if (phone) {
            setFormData(prev => ({
                ...prev,
                phoneNumber: phone
            }));
        }

        // Fetch available windows
        const loadWindows = async () => {
            try {
                const windowsData = await fetchWindowsByBranch(ABIY_BRANCH_ID);
                setWindows(windowsData);
            } catch (error) {
                console.error('Error loading windows:', error);
            }
        };

        loadWindows();

        // If navigating with updateId, load existing data and prefill
        const initializeUpdate = async () => {
            const updateId = navState?.updateId as string | undefined;
            if (!updateId) return;
            try {
                const res = await getCbeBirrRegistration(updateId);
                const d = res?.data;
                if (d) {
                    const [fn, ff = '', fg = ''] = (d.FullName || '').split(' ');
                    const [mn, mf = '', mg = ''] = (d.MothersFullName || '').split(' ');
                    const iso = d.DateOfBirth ? new Date(d.DateOfBirth).toISOString().slice(0,10) : '';
                    setFormData(prev => ({
                        ...prev,
                        phoneNumber: d.CustomerPhoneNumber || prev.phoneNumber,
                        fullName: fn || prev.fullName,
                        fatherName: ff || prev.fatherName,
                        grandfatherName: fg || prev.grandfatherName,
                        placeOfBirth: d.PlaceOfBirth || prev.placeOfBirth,
                        dateOfBirth: iso,
                        gender: (d.Gender as any) || prev.gender,
                        city: d.City || prev.city,
                        wereda: d.Wereda || prev.wereda,
                        kebele: d.Kebele || prev.kebele,
                        email: d.Email || prev.email,
                        idNumber: d.IdNumber || prev.idNumber,
                        issuedBy: d.IssuedBy || prev.issuedBy,
                        maritalStatus: (d.MaritalStatus as any) || prev.maritalStatus,
                        educationLevel: d.EducationLevel || prev.educationLevel,
                        motherName: mn || prev.motherName,
                        motherFatherName: mf || prev.motherFatherName,
                        motherGrandfatherName: mg || prev.motherGrandfatherName,
                        digitalSignature: d.DigitalSignature || prev.digitalSignature,
                    }));
                    setIsUpdate(true);
                    setCurrentId(d.Id || updateId);
                    setStep(1);
                }
            } catch (e) {
                console.error('Failed to load registration for update', e);
            }
        };

        initializeUpdate();
    }, [phone, navState]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (errors[name as keyof Errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRadioChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const normalizePhone = (raw: string) => {
        const cleaned = raw.trim().replace(/[^\d+]/g, '');
        const digits = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
        if (/^0[79]\d{8}$/.test(digits)) return `+251${digits.slice(1)}`;
        if (/^[79]\d{8}$/.test(digits)) return `+251${digits}`;
        if (/^251[79]\d{8}$/.test(digits)) return `+${digits}`;
        return raw.trim();
    };

    const handleRequestOtp = async () => {
        setOtpError('');
        setOtpMessage('');
        setOtpLoading(true);
        try {
            const normalized = normalizePhone(formData.phoneNumber);
            let phoneToSend = normalized;
            let success = false;

            try {
                await authService.requestOtp(phoneToSend);
                success = true;
            } catch (err) {
                phoneToSend = '0' + normalized.slice(-9);
                await authService.requestOtp(phoneToSend);
                success = true;
            }

            if (success) {
                setOtpMessage(t('otpSent', 'OTP sent successfully.'));
                setPhoneForOtp(phoneToSend);
                setFormData(prev => ({ ...prev, phoneNumber: phoneToSend }));
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
            }
        } catch (e: any) {
            setOtpError(typeof e === 'string' ? e : (e?.message || t('otpRequestFailed', 'Failed to send OTP')));
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setOtpError('');
        setOtpMessage('');
        setOtpLoading(true);
        try {
            const phoneToUse = phoneForOtp || normalizePhone(formData.phoneNumber);
            const res = await authService.verifyOtp(phoneToUse, formData.otpCode);
            if (res.verified) {
                setOtpVerified(true);
                setOtpMessage(res.message || t('otpVerifiedReady', 'OTP verified successfully.'));
            } else {
                setOtpVerified(false);
                setOtpError(res.message || t('invalidOtp', 'OTP verification failed'));
            }
        } catch (e: any) {
            setOtpVerified(false);
            setOtpError(e?.message || t('invalidOtp', 'OTP verification failed'));
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep()) return;
        
        setIsSubmitting(true);
        try {
            if (!otpVerified) {
                await handleVerifyOtp();
                if (!otpVerified) {
                    throw new Error('OTP not verified');
                }
            }

            const fullNameCombined = `${formData.fullName} ${formData.fatherName} ${formData.grandfatherName}`.trim();
            const mothersFullName = `${formData.motherName} ${formData.motherFatherName} ${formData.motherGrandfatherName}`.trim();

            const payload = {
                CustomerPhoneNumber: phoneForOtp || formData.phoneNumber,
                FullName: fullNameCombined,
                BranchId: ABIY_BRANCH_ID,
                PlaceOfBirth: formData.placeOfBirth,
                DateOfBirth: formData.dateOfBirth,
                Gender: formData.gender,
                City: formData.city || undefined,
                Wereda: formData.wereda || undefined,
                Kebele: formData.kebele || undefined,
                Email: formData.email || undefined,
                IdNumber: formData.idNumber,
                IssuedBy: formData.issuedBy,
                MaritalStatus: formData.maritalStatus,
                EducationLevel: formData.educationLevel,
                MothersFullName: mothersFullName,
                DigitalSignature: formData.digitalSignature || undefined,
                OtpCode: formData.otpCode,
            };

            const apiRes = isUpdate && currentId
                ? await updateCbeBirrRegistration(currentId, payload)
                : await createCbeBirrRegistration(payload);

            if (!apiRes?.success) {
                throw new Error(apiRes?.message || t('submissionFailed', 'Registration failed'));
            }

            navigate('/form/cbe-birr/confirmation', { 
                state: { api: apiRes.data }
            });
        } catch (error: any) {
            setErrors(prev => ({
                ...prev,
                submit: error?.message || t('submissionFailed', 'Failed to submit the form. Please try again.')
            }));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step titles for progress indicator
    const stepTitles = [
        t('customerInformation', 'Customer Information'),
        t('addressInformation', 'Address Information'),
        t('idInformation', 'ID Information'),
        t('mothersInformation', 'Mother\'s Information'),
        t('otpVerification', 'OTP Verification'),
        t('reviewApplication', 'Review & Submit')
    ];

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
                                        <Heart className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold">{t('forms.cbeBirrRegistration', 'CBE-Birr Registration')}</h1>
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
                        {/* Progress Steps */}
                        <div className="flex justify-center mb-6">
                            <div className="flex items-center bg-gray-50 rounded-lg p-1 overflow-x-auto">
                                {stepTitles.map((title, index) => (
                                    <React.Fragment key={index}>
                                        <div className={`flex items-center px-3 py-2 rounded-md text-sm whitespace-nowrap ${
                                            step >= index + 1 ? 'bg-fuchsia-700 text-white' : 'text-gray-600'
                                        }`}>
                                            <span className="font-medium">{index + 1}. {title}</span>
                                        </div>
                                        {index < stepTitles.length - 1 && (
                                            <div className="mx-1 text-gray-400 text-sm">→</div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        {/* Step 1: Personal Information */}
                        {step === 1 && (
                            <form onSubmit={handleNext} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <User className="h-5 w-5 text-fuchsia-700" />
                                        {t('customerInformation', 'Personal Information')}
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field label={t('phoneNumber', 'Phone Number')} required error={errors.phoneNumber}>
                                            <input
                                                name="phoneNumber"
                                                type="tel"
                                                value={formData.phoneNumber}
                                                onChange={handleChange}
                                                disabled={!!phone}
                                                placeholder="+251XXXXXXXXX"
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="phoneNumber"
                                            />
                                        </Field>
                                        <Field label={t('fullName', 'Full Name')} required error={errors.fullName}>
                                            <input
                                                name="fullName"
                                                type="text"
                                                value={formData.fullName}
                                                onChange={handleChange}
                                                placeholder="Your full name"
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="fullName"
                                            />
                                        </Field>
                                        <Field label={t('fatherName', 'Father\'s Name')} required error={errors.fatherName}>
                                            <input
                                                name="fatherName"
                                                type="text"
                                                value={formData.fatherName}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="fatherName"
                                            />
                                        </Field>
                                        <Field label={t('grandfatherName', 'Grandfather\'s Name')} required error={errors.grandfatherName}>
                                            <input
                                                name="grandfatherName"
                                                type="text"
                                                value={formData.grandfatherName}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="grandfatherName"
                                            />
                                        </Field>
                                        <Field label={t('placeOfBirth', 'Place of Birth')} required error={errors.placeOfBirth}>
                                            <input
                                                name="placeOfBirth"
                                                type="text"
                                                value={formData.placeOfBirth}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="placeOfBirth"
                                            />
                                        </Field>
                                        <Field label={t('dateOfBirth', 'Date of Birth')} required error={errors.dateOfBirth}>
                                            <input
                                                name="dateOfBirth"
                                                type="date"
                                                value={formData.dateOfBirth}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="dateOfBirth"
                                            />
                                        </Field>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                                            <div className="flex space-x-6">
                                                <label className="inline-flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="gender"
                                                        value="Male"
                                                        checked={formData.gender === 'Male'}
                                                        onChange={handleRadioChange}
                                                        className="h-4 w-4 text-fuchsia-600 focus:ring-fuchsia-500"
                                                    />
                                                    <span className="ml-2">Male</span>
                                                </label>
                                                <label className="inline-flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="gender"
                                                        value="Female"
                                                        checked={formData.gender === 'Female'}
                                                        onChange={handleRadioChange}
                                                        className="h-4 w-4 text-fuchsia-600 focus:ring-fuchsia-500"
                                                    />
                                                    <span className="ml-2">Female</span>
                                                </label>
                                            </div>
                                            {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                                        </div>
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
                            <form onSubmit={handleNext} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-fuchsia-700" />
                                        {t('addressInformation', 'Address Information')}
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <Field label={t('city', 'City')} required error={errors.city}>
                                            <input
                                                name="city"
                                                type="text"
                                                value={formData.city}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="city"
                                            />
                                        </Field>
                                        <Field label={t('wereda', 'Wereda')} required error={errors.wereda}>
                                            <input
                                                name="wereda"
                                                type="text"
                                                value={formData.wereda}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="wereda"
                                            />
                                        </Field>
                                        <Field label={t('kebele', 'Kebele')} required error={errors.kebele}>
                                            <input
                                                name="kebele"
                                                type="text"
                                                value={formData.kebele}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="kebele"
                                            />
                                        </Field>
                                        <div className="md:col-span-3">
                                            <Field label={t('email', 'Email Address')} error={errors.email}>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <input
                                                        name="email"
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        placeholder="example@domain.com"
                                                        className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                        id="email"
                                                    />
                                                </div>
                                            </Field>
                                        </div>
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={handleBack}
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

                        {/* Step 3: ID Information */}
                        {step === 3 && (
                            <form onSubmit={handleNext} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <IdCard className="h-5 w-5 text-fuchsia-700" />
                                        {t('idInformation', 'ID Information')}
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field label={t('idNumber', 'ID Number')} required error={errors.idNumber}>
                                            <input
                                                name="idNumber"
                                                type="text"
                                                value={formData.idNumber}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="idNumber"
                                            />
                                        </Field>
                                        <Field label={t('issuedBy', 'Issued By')} required error={errors.issuedBy}>
                                            <input
                                                name="issuedBy"
                                                type="text"
                                                value={formData.issuedBy}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="issuedBy"
                                            />
                                        </Field>
                                        <div className="md:col-span-2">
                                            <Field label={t('maritalStatus', 'Marital Status')} required>
                                                <select
                                                    name="maritalStatus"
                                                    value={formData.maritalStatus}
                                                    onChange={handleChange}
                                                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                >
                                                    <option value="Single">Single</option>
                                                    <option value="Married">Married</option>
                                                    <option value="Divorced">Divorced</option>
                                                    <option value="Widow">Widow</option>
                                                </select>
                                            </Field>
                                        </div>
                                        <div className="md:col-span-2">
                                            <Field label={t('educationLevel', 'Education Level')} required>
                                                <select
                                                    name="educationLevel"
                                                    value={formData.educationLevel}
                                                    onChange={handleChange}
                                                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                >
                                                    {educationLevels.map(level => (
                                                        <option key={level} value={level}>{level}</option>
                                                    ))}
                                                </select>
                                            </Field>
                                        </div>
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={handleBack}
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

                        {/* Step 4: Mother's Information */}
                        {step === 4 && (
                            <form onSubmit={handleNext} className="space-y-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Users className="h-5 w-5 text-fuchsia-700" />
                                        {t('mothersInformation', 'Mother\'s Information')}
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <Field label={t('motherName', 'Mother\'s Name')} required error={errors.motherName}>
                                            <input
                                                name="motherName"
                                                type="text"
                                                value={formData.motherName}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="motherName"
                                            />
                                        </Field>
                                        <Field label={t('motherFatherName', 'Mother\'s Father Name')} required error={errors.motherFatherName}>
                                            <input
                                                name="motherFatherName"
                                                type="text"
                                                value={formData.motherFatherName}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="motherFatherName"
                                            />
                                        </Field>
                                        <Field label={t('motherGrandfatherName', 'Mother\'s Grandfather Name')} required error={errors.motherGrandfatherName}>
                                            <input
                                                name="motherGrandfatherName"
                                                type="text"
                                                value={formData.motherGrandfatherName}
                                                onChange={handleChange}
                                                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                                id="motherGrandfatherName"
                                            />
                                        </Field>
                                    </div>
                                </div>

                                {errors.submit && <ErrorMessage message={errors.submit} />}

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button" 
                                        onClick={handleBack}
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

                        
                        

{/* Step 5: OTP Verification */}
{step === 5 && (
    <form onSubmit={handleNext} className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-fuchsia-700" />
                {t('otpVerification', 'OTP Verification')}
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700">
                    {t('otpSentMessage', 'An OTP will be sent to your phone number:')} 
                    <strong className="text-blue-900"> {formData.phoneNumber}</strong>
                </p>
            </div>

            <div className="max-w-md">
                <Field 
                    label={t('enterOtp', 'Enter OTP')} 
                    required 
                    error={errors.otpCode}
                >
                    <input 
                        type="text" 
                        name="otpCode" 
                        value={formData.otpCode} 
                        onChange={handleChange} 
                        maxLength={6}
                        className="w-full p-3 text-center text-2xl tracking-widest rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent font-mono"
                        placeholder="000000"
                        id="otpCode"
                    />
                </Field>
                
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={otpLoading || resendCooldown > 0}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center gap-2 justify-center"
                    >
                        {otpLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('sendingOtp', 'Sending...')}
                            </>
                        ) : (
                            <>
                                <Phone className="h-4 w-4" />
                                {resendCooldown > 0 
                                    ? t('resendOtpIn', `Resend in ${resendCooldown}s`) 
                                    : t('requestOtp', 'Request OTP')
                                }
                            </>
                        )}
                    </button>
                    
                    <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otpLoading || !formData.otpCode}
                        className="bg-fuchsia-700 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-800 disabled:opacity-50 flex items-center gap-2 justify-center"
                    >
                        {otpLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('verifying', 'Verifying...')}
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                {otpVerified ? t('verified', 'Verified') : t('verifyOtp', 'Verify OTP')}
                            </>
                        )}
                    </button>
                </div>

                {(otpMessage || otpError) && (
                    <div className="mt-3">
                        {otpMessage && <SuccessMessage message={otpMessage} />}
                        {otpError && <ErrorMessage message={otpError} />}
                    </div>
                )}

                <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
                    <span>{formData.otpCode.length}/6</span>
                    {!otpVerified && formData.otpCode.length === 6 && (
                        <span className="text-orange-600">Click verify to continue</span>
                    )}
                    {otpVerified && (
                        <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            OTP verified successfully
                        </span>
                    )}
                </div>
            </div>
        </div>

        {errors.submit && <ErrorMessage message={errors.submit} />}

        <div className="grid grid-cols-2 gap-4">
            <button 
                type="button" 
                onClick={handleBack}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 justify-center"
            >
                <ChevronRight className="h-4 w-4 rotate-180" />
                {t('back', 'Back')}
            </button>
            <button 
                type="submit" 
                disabled={!otpVerified}
                className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 disabled:opacity-50 flex items-center gap-2 justify-center"
            >
                <span>{t('continue', 'Continue')}</span>
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    </form>
)}

{/* Step 6: Review & Submit */}
{step === 6 && (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                {t('reviewApplication', 'Review & Submit')}
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-2">{t('customerDetails', 'Customer Details')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">{t('phoneNumber', 'Phone Number')}:</span>
                            <span className="font-semibold">{formData.phoneNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">{t('fullName', 'Full Name')}:</span>
                            <span className="font-semibold">{formData.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">{t('fatherName', 'Father\'s Name')}:</span>
                            <span className="font-semibold">{formData.fatherName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">{t('grandfatherName', 'Grandfather\'s Name')}:</span>
                            <span className="font-semibold">{formData.grandfatherName}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">{t('dateOfBirth', 'Date of Birth')}:</span>
                            <span className="font-semibold">{formData.dateOfBirth}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">{t('gender', 'Gender')}:</span>
                            <span className="font-semibold">{formData.gender}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-700">{t('placeOfBirth', 'Place of Birth')}:</span>
                            <span className="font-semibold">{formData.placeOfBirth}</span>
                        </div>
                    </div>
                </div>

                <h3 className="font-semibold text-gray-900 border-b pb-2 mt-6">{t('addressInformation', 'Address Information')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex justify-between md:block">
                        <span className="font-medium text-gray-700">{t('city', 'City')}:</span>
                        <span className="font-semibold md:block">{formData.city}</span>
                    </div>
                    <div className="flex justify-between md:block">
                        <span className="font-medium text-gray-700">{t('wereda', 'Wereda')}:</span>
                        <span className="font-semibold md:block">{formData.wereda}</span>
                    </div>
                    <div className="flex justify-between md:block">
                        <span className="font-medium text-gray-700">{t('kebele', 'Kebele')}:</span>
                        <span className="font-semibold md:block">{formData.kebele}</span>
                    </div>
                </div>

                <h3 className="font-semibold text-gray-900 border-b pb-2 mt-6">{t('idInformation', 'ID Information')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between">
                        <span className="font-medium text-gray-700">{t('idNumber', 'ID Number')}:</span>
                        <span className="font-semibold">{formData.idNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-gray-700">{t('issuedBy', 'Issued By')}:</span>
                        <span className="font-semibold">{formData.issuedBy}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-gray-700">{t('maritalStatus', 'Marital Status')}:</span>
                        <span className="font-semibold">{formData.maritalStatus}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-gray-700">{t('educationLevel', 'Education Level')}:</span>
                        <span className="font-semibold">{formData.educationLevel}</span>
                    </div>
                </div>

                <h3 className="font-semibold text-gray-900 border-b pb-2 mt-6">{t('mothersInformation', 'Mother\'s Information')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex justify-between md:block">
                        <span className="font-medium text-gray-700">{t('motherName', 'Mother\'s Name')}:</span>
                        <span className="font-semibold md:block">{formData.motherName}</span>
                    </div>
                    <div className="flex justify-between md:block">
                        <span className="font-medium text-gray-700">{t('motherFatherName', 'Mother\'s Father')}:</span>
                        <span className="font-semibold md:block">{formData.motherFatherName}</span>
                    </div>
                    <div className="flex justify-between md:block">
                        <span className="font-medium text-gray-700">{t('motherGrandfatherName', 'Mother\'s Grandfather')}:</span>
                        <span className="font-semibold md:block">{formData.motherGrandfatherName}</span>
                    </div>
                </div>

                {otpVerified && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm font-medium">OTP Verified Successfully</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {errors.submit && <ErrorMessage message={errors.submit} />}

        <div className="grid grid-cols-2 gap-4">
            <button 
                type="button" 
                onClick={handleBack}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2 justify-center"
            >
                <ChevronRight className="h-4 w-4 rotate-180" />
                {t('back', 'Back')}
            </button>
            <button 
                type="submit" 
                disabled={isSubmitting || !otpVerified}
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
                        {isUpdate ? t('update', 'Update Registration') : t('submitApplication', 'Submit Registration')}
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