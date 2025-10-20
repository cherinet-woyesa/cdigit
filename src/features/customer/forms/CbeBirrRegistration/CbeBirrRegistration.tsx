import React, { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';
import Field from '../../../../components/Field';
import { createCbeBirrRegistration, getCbeBirrRegistration, updateCbeBirrRegistration } from '../../../../services/cbeBirrRegistrationService';
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
    Shield,
    Calendar,
    Mail,
    Heart,
    BookOpen,
    Home
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

type Errors = Partial<Record<keyof FormData | 'submit' | 'otp', string>>;

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
    const { phone } = useAuth();
    const { branch } = useBranch();
    const navigate = useNavigate();
    const { state: navState } = useLocation() as { state?: any };
    
    const [formData, setFormData] = useState<FormData>({
        name: '',
        phoneNumber: phone || '', // Initialize with phone from AuthContext
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
    const [step, setStep] = useState(1); // 1: Personal, 2: Address, 3: ID, 4: Mother, 5: Review, 6: OTP
    const ABIY_BRANCH_ID = 'a3d3e1b5-8c9a-4c7c-a1e3-6b3d8f4a2b2c';
    const [isUpdate, setIsUpdate] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendTimer, setResendTimer] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (resendTimer) clearInterval(resendTimer);
        };
    }, [resendTimer]);

    // Initialize or update phone number when auth context phone changes
    useEffect(() => {
        if (phone) {
            setFormData(prev => ({ ...prev, phoneNumber: phone }));
        }
    }, [phone]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // Update form data without showing real-time validation errors
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error for this field when user starts typing
        if (errors[name as keyof Errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    // New function to handle field blur (when user moves away from field)
    const handleBlur = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // Apply validation only when user leaves the field
        if (step === 1) {
            if (name === 'fullName') {
                if (value.trim() === '') {
                    setErrors(prev => ({ ...prev, fullName: t('fullNameRequired', 'First name is required') }));
                } else if (value.length < 2) {
                    setErrors(prev => ({ ...prev, fullName: t('fullNameTooShort', 'First name is too short') }));
                }
            }
            
            if (name === 'fatherName') {
                if (value.trim() === '') {
                    setErrors(prev => ({ ...prev, fatherName: t('fatherNameRequired', 'Father name is required') }));
                } else if (value.length < 2) {
                    setErrors(prev => ({ ...prev, fatherName: t('fatherNameTooShort', 'Father name is too short') }));
                }
            }
            
            if (name === 'grandfatherName') {
                if (value.trim() === '') {
                    setErrors(prev => ({ ...prev, grandfatherName: t('grandfatherNameRequired', 'Grandfather name is required') }));
                } else if (value.length < 2) {
                    setErrors(prev => ({ ...prev, grandfatherName: t('grandfatherNameTooShort', 'Grandfather name is too short') }));
                }
            }
            
            if (name === 'placeOfBirth') {
                if (value.trim() === '') {
                    setErrors(prev => ({ ...prev, placeOfBirth: t('placeOfBirthRequired', 'Place of birth is required') }));
                } else if (value.length < 2) {
                    setErrors(prev => ({ ...prev, placeOfBirth: t('placeOfBirthTooShort', 'Place of birth is too short') }));
                }
            }
            
            if (name === 'dateOfBirth') {
                if (value.trim() === '') {
                    setErrors(prev => ({ ...prev, dateOfBirth: t('dateOfBirthRequired', 'Date of birth is required') }));
                } else {
                    // Check if date is in the future
                    const selectedDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (selectedDate > today) {
                        setErrors(prev => ({ ...prev, dateOfBirth: t('dateOfBirthInFuture', 'Date of birth cannot be in the future') }));
                    }
                }
            }
        }
        
        if (step === 2) {
            if (name === 'city') {
                if (value.trim() === '') {
                    setErrors(prev => ({ ...prev, city: t('cityRequired', 'City is required') }));
                } else if (value.length < 2) {
                    setErrors(prev => ({ ...prev, city: t('cityTooShort', 'City is too short') }));
                }
            }
            
            if (name === 'wereda') {
                if (value.trim() === '') {
                    setErrors(prev => ({ ...prev, wereda: t('weredaRequired', 'Wereda is required') }));
                }
            }
            
            if (name === 'kebele') {
                if (value.trim() === '') {
                    setErrors(prev => ({ ...prev, kebele: t('kebeleRequired', 'Kebele is required') }));
                }
            }
            
            if (name === 'email') {
                if (value.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    setErrors(prev => ({ ...prev, email: t('invalidEmail', 'Please enter a valid email address') }));
                }
            }
        }
        
        if (step === 3) {
            if (name === 'idNumber') {
                if (value.trim() === '') {
                    setErrors(prev => ({ ...prev, idNumber: t('idNumberRequired', 'ID number is required') }));
                } else if (value.length < 5) {
                    setErrors(prev => ({ ...prev, idNumber: t('idNumberTooShort', 'ID number is too short') }));
                }
            }
            
            if (name === 'issuedBy') {
                if (value.trim() === '') {
                    setErrors(prev => ({ ...prev, issuedBy: t('issuedByRequired', 'Issued by is required') }));
                } else if (value.length < 2) {
                    setErrors(prev => ({ ...prev, issuedBy: t('issuedByTooShort', 'Issued by is too short') }));
                }
            }
        }
        
        if (step === 4) {
            if (name === 'motherName') {
                if (value.trim() === '') {
                    setErrors(prev => ({ ...prev, motherName: t('motherNameRequired', 'Mother name is required') }));
                } else if (value.length < 2) {
                    setErrors(prev => ({ ...prev, motherName: t('motherNameTooShort', 'Mother name is too short') }));
                }
            }
            
            if (name === 'motherFatherName') {
                if (value.trim() === '') {
                    setErrors(prev => ({ ...prev, motherFatherName: t('motherFatherNameRequired', 'Mother father name is required') }));
                } else if (value.length < 2) {
                    setErrors(prev => ({ ...prev, motherFatherName: t('motherFatherNameTooShort', 'Mother father name is too short') }));
                }
            }
            
            if (name === 'motherGrandfatherName') {
                if (value.trim() === '') {
                    setErrors(prev => ({ ...prev, motherGrandfatherName: t('motherGrandfatherNameRequired', 'Mother grandfather name is required') }));
                } else if (value.length < 2) {
                    setErrors(prev => ({ ...prev, motherGrandfatherName: t('motherGrandfatherNameTooShort', 'Mother grandfather name is too short') }));
                }
            }
        }
        
        if (step === 6) { // OTP step
            if (name === 'otpCode') {
                const sanitizedValue = value.replace(/\D/g, '').slice(0, 6);
                if (sanitizedValue.length === 6 && !/^\d{6}$/.test(sanitizedValue)) {
                    setErrors(prev => ({ ...prev, otp: t('validOtpRequired', 'OTP must be 6 digits') }));
                } else if (sanitizedValue.length > 0 && sanitizedValue.length < 6) {
                    setErrors(prev => ({ ...prev, otp: t('otpIncomplete', 'OTP must be 6 digits') }));
                }
            }
        }
    };

    const handleRadioChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error when radio button is selected
        if (errors[name as keyof Errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
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
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };

    // Step-wise validation
    const validateStep = (): boolean => {
        const errs: Errors = {};
        
        if (step === 1) {
            if (!formData.phoneNumber.trim()) errs.phoneNumber = t('phoneNumberRequired', 'Phone number is required');
            if (!formData.fullName.trim()) errs.fullName = t('fullNameRequired', 'First name is required');
            else if (formData.fullName.length < 2) errs.fullName = t('fullNameTooShort', 'First name is too short');
            if (!formData.fatherName.trim()) errs.fatherName = t('fatherNameRequired', "Father's name is required");
            else if (formData.fatherName.length < 2) errs.fatherName = t('fatherNameTooShort', 'Father name is too short');
            if (!formData.grandfatherName.trim()) errs.grandfatherName = t('grandfatherNameRequired', "Grandfather's name is required");
            else if (formData.grandfatherName.length < 2) errs.grandfatherName = t('grandfatherNameTooShort', 'Grandfather name is too short');
            if (!formData.placeOfBirth.trim()) errs.placeOfBirth = t('placeOfBirthRequired', 'Place of birth is required');
            else if (formData.placeOfBirth.length < 2) errs.placeOfBirth = t('placeOfBirthTooShort', 'Place of birth is too short');
            if (!formData.dateOfBirth) {
                errs.dateOfBirth = t('dateOfBirthRequired', 'Date of birth is required');
            } else {
                // Check if date is in the future
                const selectedDate = new Date(formData.dateOfBirth);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selectedDate > today) {
                    errs.dateOfBirth = t('dateOfBirthInFuture', 'Date of birth cannot be in the future');
                }
            }
        }
        
        if (step === 2) {
            if (!formData.city.trim()) errs.city = t('cityRequired', 'City is required');
            else if (formData.city.length < 2) errs.city = t('cityTooShort', 'City is too short');
            if (!formData.wereda.trim()) errs.wereda = t('weredaRequired', 'Wereda is required');
            if (!formData.kebele.trim()) errs.kebele = t('kebeleRequired', 'Kebele is required');
            if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                errs.email = t('invalidEmail', 'Please enter a valid email address');
            }
        }
        
        if (step === 3) {
            if (!formData.idNumber.trim()) errs.idNumber = t('idNumberRequired', 'ID number is required');
            else if (formData.idNumber.length < 5) errs.idNumber = t('idNumberTooShort', 'ID number is too short');
            if (!formData.issuedBy.trim()) errs.issuedBy = t('issuedByRequired', 'Issued by is required');
            else if (formData.issuedBy.length < 2) errs.issuedBy = t('issuedByTooShort', 'Issued by is too short');
        }
        
        if (step === 4) {
            if (!formData.motherName.trim()) errs.motherName = t('motherNameRequired', "Mother's name is required");
            else if (formData.motherName.length < 2) errs.motherName = t('motherNameTooShort', 'Mother name is too short');
            if (!formData.motherFatherName.trim()) errs.motherFatherName = t('motherFatherNameRequired', "Mother's father name is required");
            else if (formData.motherFatherName.length < 2) errs.motherFatherName = t('motherFatherNameTooShort', 'Mother father name is too short');
            if (!formData.motherGrandfatherName.trim()) errs.motherGrandfatherName = t('motherGrandfatherNameRequired', "Mother's grandfather name is required");
            else if (formData.motherGrandfatherName.length < 2) errs.motherGrandfatherName = t('motherGrandfatherNameTooShort', 'Mother grandfather name is too short');
        }
        
        if (step === 6) { // OTP step
            if (!formData.otpCode || formData.otpCode.length !== 6) {
                errs.otp = t('validOtpRequired', 'Please enter the 6-digit OTP');
            }
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleRequestOtp = async () => {
        if (!formData.phoneNumber) {
            setErrors({ submit: t('phoneNumberRequired', 'Phone number is required') });
            return;
        }

        setOtpLoading(true);
        setErrors({});
        setOtpMessage('');

        try {
            await authService.requestOtp(formData.phoneNumber);
            setOtpMessage(t('otpSent', 'OTP sent successfully to your phone'));
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
            setStep(6); // Move to OTP step
        } catch (error: any) {
            setErrors({ submit: error?.message || t('otpRequestFailed', 'Failed to send OTP') });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!formData.phoneNumber || resendCooldown > 0) return;

        setOtpLoading(true);
        setErrors({});
        setOtpMessage('');

        try {
            await authService.requestOtp(formData.phoneNumber);
            setOtpMessage(t('otpResent', 'OTP resent successfully'));
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
            setErrors({ submit: error?.message || t('otpRequestFailed', 'Failed to send OTP') });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep()) return;

        if (!formData.otpCode || formData.otpCode.length !== 6) {
            setErrors({ otp: t('validOtpRequired', 'Please enter the 6-digit OTP') });
            return;
        }

        setIsSubmitting(true);
        try {
            const fullNameCombined = `${formData.fullName} ${formData.fatherName} ${formData.grandfatherName}`.trim();
            const mothersFullName = `${formData.motherName} ${formData.motherFatherName} ${formData.motherGrandfatherName}`.trim();

            const payload = {
                FormReferenceId: `cbe-birr-${Date.now()}`,
                CustomerPhoneNumber: formData.phoneNumber,
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
                const errorMessage = apiRes?.message || t('submissionFailed', 'Registration failed');
                if (errorMessage.toLowerCase().includes('otp') || errorMessage.toLowerCase().includes('invalid')) {
                    setErrors({ otp: errorMessage });
                } else {
                    setErrors({ submit: errorMessage });
                }
                return;
            }

            navigate('/form/cbe-birr/confirmation', { 
                state: { api: apiRes.data }
            });
        } catch (error: any) {
            const errorMessage = error?.message || t('submissionFailed', 'Failed to submit the form. Please try again.');
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

    const stepTitles = [
        t('customerInformation', 'Customer Info'),
        t('addressInformation', 'Address Info'),
        t('idInformation', 'ID Info'),
        t('mothersInformation', "Mother's Info"),
        t('reviewApplication', 'Review'),
        t('otpVerification', 'OTP')
    ];

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
            case 5:
                return renderStep5();
            case 6:
                return renderStep6();
            default:
                return null;
        }
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label={t('phoneNumber', 'Phone Number')} required error={errors.phoneNumber}>
                    <input 
                        name="phoneNumber" 
                        type="tel" 
                        value={formData.phoneNumber} 
                        onChange={handleChange} 
                        disabled={!!phone} 
                        placeholder="+251XXXXXXXXX" 
                        className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                        id="phoneNumber" 
                    />
                </Field>
                <Field label={t('firstName', 'First Name')} required error={errors.fullName}>
                    <input 
                        name="fullName" 
                        type="text" 
                        value={formData.fullName} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                        placeholder="Your first name" 
                        className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                        id="fullName" 
                    />
                </Field>
                <Field label={t('fatherName', 'Father\'s Name')} required error={errors.fatherName}>
                    <input 
                        name="fatherName" 
                        type="text" 
                        value={formData.fatherName} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                        className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                        id="fatherName" 
                    />
                </Field>
                <Field label={t('grandfatherName', 'Grandfather\'s Name')} required error={errors.grandfatherName}>
                    <input 
                        name="grandfatherName" 
                        type="text" 
                        value={formData.grandfatherName} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                        className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                        id="grandfatherName" 
                    />
                </Field>
                <Field label={t('placeOfBirth', 'Place of Birth')} required error={errors.placeOfBirth}>
                    <input 
                        name="placeOfBirth" 
                        type="text" 
                        value={formData.placeOfBirth} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                        className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                        id="placeOfBirth" 
                    />
                </Field>
                <Field label={t('dateOfBirth', 'Date of Birth')} required error={errors.dateOfBirth}>
                    <input 
                        name="dateOfBirth" 
                        type="date" 
                        value={formData.dateOfBirth} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                        className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                        id="dateOfBirth" 
                    />
                </Field>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('gender', 'Gender')} *</label>
                    <div className="flex space-x-6">
                        <label className="inline-flex items-center">
                            <input 
                                type="radio" 
                                name="gender" 
                                value="Male" 
                                checked={formData.gender === 'Male'} 
                                onChange={handleRadioChange} 
                                className="h-4 w-4 text-amber-600 focus:ring-amber-500" 
                            />
                            <span className="ml-2">{t('male', 'Male')}</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input 
                                type="radio" 
                                name="gender" 
                                value="Female" 
                                checked={formData.gender === 'Female'} 
                                onChange={handleRadioChange} 
                                className="h-4 w-4 text-amber-600 focus:ring-amber-500" 
                            />
                            <span className="ml-2">{t('female', 'Female')}</span>
                        </label>
                    </div>
                    {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label={t('city', 'City')} required error={errors.city}>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            name="city" 
                            type="text" 
                            value={formData.city} 
                            onChange={handleChange} 
                            onBlur={handleBlur} 
                            className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                            id="city" 
                        />
                    </div>
                </Field>
                <Field label={t('wereda', 'Wereda')} required error={errors.wereda}>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            name="wereda" 
                            type="text" 
                            value={formData.wereda} 
                            onChange={handleChange} 
                            onBlur={handleBlur} 
                            className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                            id="wereda" 
                        />
                    </div>
                </Field>
                <Field label={t('kebele', 'Kebele')} required error={errors.kebele}>
                    <div className="relative">
                        <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            name="kebele" 
                            type="text" 
                            value={formData.kebele} 
                            onChange={handleChange} 
                            onBlur={handleBlur} 
                            className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                            id="kebele" 
                        />
                    </div>
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
                                onBlur={handleBlur} 
                                placeholder="example@domain.com" 
                                className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                                id="email" 
                            />
                        </div>
                    </Field>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label={t('idNumber', 'ID Number')} required error={errors.idNumber}>
                    <div className="relative">
                        <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            name="idNumber" 
                            type="text" 
                            value={formData.idNumber} 
                            onChange={handleChange} 
                            onBlur={handleBlur} 
                            className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                            id="idNumber" 
                        />
                    </div>
                </Field>
                <Field label={t('issuedBy', 'Issued By')} required error={errors.issuedBy}>
                    <input 
                        name="issuedBy" 
                        type="text" 
                        value={formData.issuedBy} 
                        onChange={handleChange} 
                        onBlur={handleBlur} 
                        className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                        id="issuedBy" 
                    />
                </Field>
                <div className="md:col-span-2">
                    <Field label={t('maritalStatus', 'Marital Status')} required>
                        <select 
                            name="maritalStatus" 
                            value={formData.maritalStatus} 
                            onChange={handleChange} 
                            className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                        >
                            <option value="Single">{t('single', 'Single')}</option>
                            <option value="Married">{t('married', 'Married')}</option>
                            <option value="Divorced">{t('divorced', 'Divorced')}</option>
                            <option value="Widow">{t('widow', 'Widow')}</option>
                        </select>
                    </Field>
                </div>
                <div className="md:col-span-2">
                    <Field label={t('educationLevel', 'Education Level')} required>
                        <select 
                            name="educationLevel" 
                            value={formData.educationLevel} 
                            onChange={handleChange} 
                            className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                        >
                            {educationLevels.map(level => (
                                <option key={level} value={level}>{t(level.toLowerCase().replace(/\s+/g, ''), level)}</option>
                            ))}
                        </select>
                    </Field>
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label={t('motherName', 'Mother\'s Name')} required error={errors.motherName}>
                    <div className="relative">
                        <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            name="motherName" 
                            type="text" 
                            value={formData.motherName} 
                            onChange={handleChange} 
                            onBlur={handleBlur} 
                            className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                            id="motherName" 
                        />
                    </div>
                </Field>
                <Field label={t('motherFatherName', 'Mother\'s Father Name')} required error={errors.motherFatherName}>
                    <div className="relative">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            name="motherFatherName" 
                            type="text" 
                            value={formData.motherFatherName} 
                            onChange={handleChange} 
                            onBlur={handleBlur} 
                            className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                            id="motherFatherName" 
                        />
                    </div>
                </Field>
                <Field label={t('motherGrandfatherName', 'Mother\'s Grandfather Name')} required error={errors.motherGrandfatherName}>
                    <div className="relative">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            name="motherGrandfatherName" 
                            type="text" 
                            value={formData.motherGrandfatherName} 
                            onChange={handleChange} 
                            onBlur={handleBlur} 
                            className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                            id="motherGrandfatherName" 
                        />
                    </div>
                </Field>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                    {t('cbeBirrRegistrationInfo', 'You are registering for CBE Birr mobile money service. After registration, you will be able to use mobile money transfer services.')}
                </p>
            </div>
        </div>
    );

    const renderStep5 = () => (
        <div className="border border-amber-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('reviewApplication', 'Review Application')}</h2>
            <div className="bg-amber-50 rounded-lg p-4 space-y-3 border border-amber-100">
                <div className="flex justify-between items-center py-2 border-b border-amber-200">
                    <span className="font-medium text-amber-800">{t('fullName', 'Full Name')}:</span>
                    <span className="font-semibold">{`${formData.fullName} ${formData.fatherName} ${formData.grandfatherName}`}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-amber-200">
                    <span className="font-medium text-amber-800">{t('phoneNumber', 'Phone Number')}:</span>
                    <span className="font-mono font-semibold">{formData.phoneNumber}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-amber-200">
                    <span className="font-medium text-amber-800">{t('idNumber', 'ID Number')}:</span>
                    <span className="font-semibold">{formData.idNumber}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-amber-800">{t('email', 'Email')}:</span>
                    <span className="font-semibold">{formData.email || 'N/A'}</span>
                </div>
            </div>
        </div>
    );

    const renderStep6 = () => (
        <div className="border border-amber-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('otpVerification', 'OTP Verification')}</h2>
            <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-700">
                        {t('otpInstructions', 'An OTP has been sent to your phone number:')} 
                        <strong className="text-amber-900"> {formData.phoneNumber}</strong>
                    </p>
                    {otpMessage && (
                        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {otpMessage}
                        </p>
                    )}
                </div>
                <div className="max-w-md">
                    <Field label={t('enterOtp', 'Enter OTP')} required error={errors.otp}>
                        <input 
                            type="text" 
                            name="otpCode" 
                            value={formData.otpCode} 
                            onChange={handleChange} 
                            maxLength={6} 
                            className="w-full p-3 text-center text-2xl tracking-widest rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono bg-amber-50" 
                            placeholder="000000" 
                            id="otpCode" 
                        />
                    </Field>
                    <div className="mt-2 flex justify-between items-center">
                        <button 
                            type="button" 
                            onClick={handleResendOtp} 
                            disabled={resendCooldown > 0 || otpLoading} 
                            className="text-sm text-amber-700 hover:text-amber-800 disabled:text-gray-400"
                        >
                            {resendCooldown > 0 
                                ? t('resendOtpIn', `Resend OTP in ${resendCooldown}s`) 
                                : t('resendOtp', 'Resend OTP')
                            }
                        </button>
                        <span className="text-sm text-gray-500">{formData.otpCode.length}/6</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full mx-auto">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Header with fuchsia-700 */}
                    <header className="bg-fuchsia-700 text-white">
                        <div className="px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <h1 className="text-lg font-bold">{t('forms.cbeBirrRegistration', 'CBE-Birr Registration')}</h1>
                                        <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>{branch?.name || t('branch', 'Branch')}</span>
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

                    <div className="p-6">
                        <form onSubmit={step === 6 ? handleSubmit : handleNext} className="space-y-6">
                            {renderStepContent()}
                            {errors.submit && <ErrorMessage message={errors.submit} />}
                            <div className="flex justify-between pt-4">
                                {step > 1 ? (
                                    <button type="button" onClick={handleBack} className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                                        <ChevronRight className="h-4 w-4 rotate-180" />{t('back', 'Back')}
                                    </button>
                                ) : (
                                    <div></div> // Spacer
                                )}
                                
                                {step < 5 ? (
                                    <button type="submit" className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 flex items-center gap-2">
                                        <span>{t('continue', 'Continue')}</span><ChevronRight className="h-4 w-4" />
                                    </button>
                                ) : step === 5 ? (
                                    <button type="button" onClick={handleRequestOtp} disabled={otpLoading} className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 flex items-center gap-2">
                                        {otpLoading ? <><Loader2 className="h-4 w-4 animate-spin" />{t('sending', 'Sending...')}</> : <><Shield className="h-4 w-4" /><span>{t('requestOtp', 'Request OTP')}</span></>}
                                    </button>
                                ) : (
                                    <button type="submit" disabled={isSubmitting || formData.otpCode.length !== 6} className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 disabled:opacity-50 flex items-center gap-2 justify-center">
                                        {isSubmitting ? (
                                            <><Loader2 className="h-4 w-4 animate-spin" />{t('processing', 'Processing...')}</>
                                        ) : (
                                            <><CheckCircle2 className="h-4 w-4" />{t('verifyAndSubmit', 'Verify & Submit')}</>
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