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
    BookOpen
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
        }
        
        if (step === 2) {
            if (!formData.city.trim()) errs.city = t('cityRequired', 'City is required');
            if (!formData.wereda.trim()) errs.wereda = t('weredaRequired', 'Wereda is required');
            if (!formData.kebele.trim()) errs.kebele = t('kebeleRequired', 'Kebele is required');
            if (formData.email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
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
        
        if (step === 6) { // OTP step
            if (!formData.otpCode || formData.otpCode.length !== 6) {
                errs.otp = t('validOtpRequired', 'Please enter the 6-digit OTP');
            }
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
        if (phone) {
            setFormData(prev => ({ ...prev, phoneNumber: phone }));
        }

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
                    setStep(5); // Start at review step for updates
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
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRadioChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
        <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><User className="h-5 w-5 text-fuchsia-700" />{t('customerInformation', 'Personal Information')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label={t('phoneNumber', 'Phone Number')} required error={errors.phoneNumber}><input name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} disabled={!!phone} placeholder="+251XXXXXXXXX" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="phoneNumber" /></Field>
                <Field label={t('fullName', 'Full Name')} required error={errors.fullName}><input name="fullName" type="text" value={formData.fullName} onChange={handleChange} placeholder="Your full name" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="fullName" /></Field>
                <Field label={t('fatherName', 'Father\'s Name')} required error={errors.fatherName}><input name="fatherName" type="text" value={formData.fatherName} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="fatherName" /></Field>
                <Field label={t('grandfatherName', 'Grandfather\'s Name')} required error={errors.grandfatherName}><input name="grandfatherName" type="text" value={formData.grandfatherName} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="grandfatherName" /></Field>
                <Field label={t('placeOfBirth', 'Place of Birth')} required error={errors.placeOfBirth}><input name="placeOfBirth" type="text" value={formData.placeOfBirth} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="placeOfBirth" /></Field>
                <Field label={t('dateOfBirth', 'Date of Birth')} required error={errors.dateOfBirth}><input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="dateOfBirth" /></Field>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label><div className="flex space-x-6"><label className="inline-flex items-center"><input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={handleRadioChange} className="h-4 w-4 text-fuchsia-600 focus:ring-fuchsia-500" /><span className="ml-2">Male</span></label><label className="inline-flex items-center"><input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={handleRadioChange} className="h-4 w-4 text-fuchsia-600 focus:ring-fuchsia-500" /><span className="ml-2">Female</span></label></div>{errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}</div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-fuchsia-700" />{t('addressInformation', 'Address Information')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label={t('city', 'City')} required error={errors.city}><input name="city" type="text" value={formData.city} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="city" /></Field>
                <Field label={t('wereda', 'Wereda')} required error={errors.wereda}><input name="wereda" type="text" value={formData.wereda} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="wereda" /></Field>
                <Field label={t('kebele', 'Kebele')} required error={errors.kebele}><input name="kebele" type="text" value={formData.kebele} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="kebele" /></Field>
                <div className="md:col-span-3"><Field label={t('email', 'Email Address')} error={errors.email}><div className="relative"><Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" /><input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="example@domain.com" className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="email" /></div></Field></div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><IdCard className="h-5 w-5 text-fuchsia-700" />{t('idInformation', 'ID Information')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label={t('idNumber', 'ID Number')} required error={errors.idNumber}><input name="idNumber" type="text" value={formData.idNumber} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="idNumber" /></Field>
                <Field label={t('issuedBy', 'Issued By')} required error={errors.issuedBy}><input name="issuedBy" type="text" value={formData.issuedBy} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="issuedBy" /></Field>
                <div className="md:col-span-2"><Field label={t('maritalStatus', 'Marital Status')} required><select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"><option value="Single">Single</option><option value="Married">Married</option><option value="Divorced">Divorced</option><option value="Widow">Widow</option></select></Field></div>
                <div className="md:col-span-2"><Field label={t('educationLevel', 'Education Level')} required><select name="educationLevel" value={formData.educationLevel} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent">{educationLevels.map(level => (<option key={level} value={level}>{level}</option>))}</select></Field></div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-fuchsia-700" />{t('mothersInformation', 'Mother\'s Information')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label={t('motherName', 'Mother\'s Name')} required error={errors.motherName}><input name="motherName" type="text" value={formData.motherName} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="motherName" /></Field>
                <Field label={t('motherFatherName', 'Mother\'s Father Name')} required error={errors.motherFatherName}><input name="motherFatherName" type="text" value={formData.motherFatherName} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="motherFatherName" /></Field>
                <Field label={t('motherGrandfatherName', 'Mother\'s Grandfather Name')} required error={errors.motherGrandfatherName}><input name="motherGrandfatherName" type="text" value={formData.motherGrandfatherName} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" id="motherGrandfatherName" /></Field>
            </div>
        </div>
    );

    const renderStep5 = () => (
        <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" />{t('reviewApplication', 'Review Application')}</h2>
            <div className="bg-gray-50 rounded-lg p-6 space-y-4 text-sm">
                <h3 className="font-semibold text-gray-900 border-b pb-2">{t('customerDetails', 'Customer Details')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <p><span className="font-medium">Phone:</span> {formData.phoneNumber}</p>
                    <p><span className="font-medium">Full Name:</span> {`${formData.fullName} ${formData.fatherName} ${formData.grandfatherName}`}</p>
                    <p><span className="font-medium">Date of Birth:</span> {formData.dateOfBirth}</p>
                    <p><span className="font-medium">Gender:</span> {formData.gender}</p>
                    <p><span className="font-medium">Place of Birth:</span> {formData.placeOfBirth}</p>
                    <p><span className="font-medium">Email:</span> {formData.email || 'N/A'}</p>
                </div>

                <h3 className="font-semibold text-gray-900 border-b pb-2 mt-4">{t('addressInformation', 'Address Information')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
                    <p><span className="font-medium">City:</span> {formData.city}</p>
                    <p><span className="font-medium">Wereda:</span> {formData.wereda}</p>
                    <p><span className="font-medium">Kebele:</span> {formData.kebele}</p>
                </div>

                <h3 className="font-semibold text-gray-900 border-b pb-2 mt-4">{t('idInformation', 'ID & Other Info')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <p><span className="font-medium">ID Number:</span> {formData.idNumber}</p>
                    <p><span className="font-medium">Issued By:</span> {formData.issuedBy}</p>
                    <p><span className="font-medium">Marital Status:</span> {formData.maritalStatus}</p>
                    <p><span className="font-medium">Education:</span> {formData.educationLevel}</p>
                </div>

                <h3 className="font-semibold text-gray-900 border-b pb-2 mt-4">{t('mothersInformation', "Mother's Information")}</h3>
                <p><span className="font-medium">Full Name:</span> {`${formData.motherName} ${formData.motherFatherName} ${formData.motherGrandfatherName}`}</p>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                    <p className="text-sm text-blue-700">{t('reviewInstructions', 'Please review your information carefully. Click "Request OTP" to proceed.')}</p>
                </div>
            </div>
        </div>
    );

    const renderStep6 = () => (
        <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Shield className="h-5 w-5 text-fuchsia-700" />{t('otpVerification', 'OTP Verification')}</h2>
            <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">{t('otpInstructions', 'An OTP has been sent to your phone number:')} <strong className="text-blue-900"> {formData.phoneNumber}</strong></p>
                    {otpMessage && <p className="text-sm text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{otpMessage}</p>}
                </div>
                <div className="max-w-md">
                    <Field label={t('enterOtp', 'Enter OTP')} required error={errors.otp}>
                        <input type="text" name="otpCode" value={formData.otpCode} onChange={handleChange} maxLength={6} className="w-full p-3 text-center text-2xl tracking-widest rounded-lg border border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent font-mono" placeholder="000000" id="otpCode" />
                    </Field>
                    <div className="mt-2 flex justify-between items-center">
                        <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0 || otpLoading} className="text-sm text-fuchsia-700 hover:text-fuchsia-800 disabled:text-gray-400">
                            {resendCooldown > 0 ? t('resendOtpIn', `Resend OTP in ${resendCooldown}s`) : t('resendOtp', 'Resend OTP')}
                        </button>
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
                    <header className="bg-fuchsia-700 text-white rounded-t-lg">
                        <div className="px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg"><Heart className="h-5 w-5 text-white" /></div>
                                    <div>
                                        <h1 className="text-lg font-bold">{t('forms.cbeBirrRegistration', 'CBE-Birr Registration')}</h1>
                                        <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1"><MapPin className="h-3 w-3" /><span>{branch?.name || t('branch', 'Branch')}</span><span>•</span><Calendar className="h-3 w-3" /><span>{new Date().toLocaleDateString()}</span></div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="bg-fuchsia-800/50 px-3 py-1 rounded-full text-xs">📱 {phone}</div>
                                    <div className="bg-white/20 rounded-lg p-1"><LanguageSwitcher /></div>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="p-6">
                        <div className="flex justify-center mb-6">
                            <div className="flex items-center bg-gray-50 rounded-lg p-1 overflow-x-auto">
                                {stepTitles.map((title, index) => (
                                    <React.Fragment key={index}>
                                        <div className={`flex items-center px-3 py-2 rounded-md text-sm whitespace-nowrap ${step >= index + 1 ? 'bg-fuchsia-700 text-white' : 'text-gray-600'}`}>
                                            <span className="font-medium">{index + 1}. {title}</span>
                                        </div>
                                        {index < stepTitles.length - 1 && <div className="mx-1 text-gray-400 text-sm">→</div>}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

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