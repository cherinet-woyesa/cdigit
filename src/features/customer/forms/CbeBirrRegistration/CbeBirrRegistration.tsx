import React, { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import Field from '../../../../components/Field';
import { fetchWindowsByBranch } from '../../../../services/windowService';
import { createCbeBirrRegistration, getCbeBirrRegistration, updateCbeBirrRegistration } from '../../../../services/cbeBirrRegistrationService';
import type { Window as WindowType } from '../../../../services/windowService';
import authService from '../../../../services/authService';

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
    const { phone } = useAuth();
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
    const [step, setStep] = useState(0); // 0: Personal, 1: Address, 2: ID, 3: Mother, 4: Signature, 5: Review
    const ABIY_BRANCH_ID = 'a3d3e1b5-8c9a-4c7c-a1e3-6b3d8f4a2b2c';
    const [isUpdate, setIsUpdate] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpMessage, setOtpMessage] = useState('');
    const [otpError, setOtpError] = useState('');
    const [phoneForOtp, setPhoneForOtp] = useState<string | null>(null);
    // Step-wise validation
    const validateStep = (): boolean => {
        const errs: Errors = {};
        if (step === 0) {
            if (!formData.phoneNumber) errs.phoneNumber = 'Phone Number is required.';
            if (!formData.fullName) errs.fullName = 'Full Name is required.';
            if (!formData.fatherName) errs.fatherName = "Father's Name is required.";
            if (!formData.grandfatherName) errs.grandfatherName = "Grandfather's Name is required.";
            if (!formData.placeOfBirth) errs.placeOfBirth = 'Place of Birth is required.';
            if (!formData.dateOfBirth) errs.dateOfBirth = 'Date of Birth is required.';
            // Phone validation
            const phoneRegex = /^(\+2519|\+2517|09|9|07|7)\d{8}$/;
            if (!phoneRegex.test(formData.phoneNumber)) {
                errs.phoneNumber = 'Please enter a valid Ethiopian phone number';
            }
        }
        if (step === 1) {
            if (!formData.city) errs.city = 'City is required.';
            if (!formData.wereda) errs.wereda = 'Wereda is required.';
            if (!formData.kebele) errs.kebele = 'Kebele is required.';
            if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                errs.email = 'Please enter a valid email address';
            }
        }
        if (step === 2) {
            if (!formData.idNumber) errs.idNumber = 'ID Number is required.';
            if (!formData.issuedBy) errs.issuedBy = 'Issued By is required.';
        }
        if (step === 3) {
            if (!formData.motherName) errs.motherName = "Mother's Name is required.";
            if (!formData.motherFatherName) errs.motherFatherName = "Mother's Father Name is required.";
            if (!formData.motherGrandfatherName) errs.motherGrandfatherName = "Mother's Grandfather Name is required.";
        }
        if (step === 4) {
            if (!formData.otpCode) errs.otpCode = 'OTP Code is required.';
        }
        // Step 4 (Digital Signature) is optional for now; no validation
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => {
        if (!validateStep()) return;
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
                    // Split FullName and MothersFullName into components (best-effort)
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
                    setStep(0);
                    window.scrollTo(0,0);
                }
            } catch (e) {
                console.error('Failed to load registration for update', e);
            }
        };

        initializeUpdate();
    }, [phone, navState]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
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

    const validateAll = (): boolean => {
        const errs: Errors = {};
        
        // Required fields validation
        const requiredFields: (keyof FormData)[] = [
            'phoneNumber', 'fullName', 'fatherName', 'grandfatherName',
            'placeOfBirth', 'dateOfBirth', 'city', 'wereda', 'kebele',
            'idNumber', 'issuedBy', 'motherName', 'motherFatherName',
            'motherGrandfatherName', 'otpCode'
        ];

        requiredFields.forEach(field => {
            if (!formData[field]) {
                errs[field] = `${field.split(/(?=[A-Z])/).join(' ')} is required.`;
            }
        });

        // Phone number validation
        const phoneRegex = /^(\+2519|\+2517|09|9|07|7)\d{8}$/;
        if (!phoneRegex.test(formData.phoneNumber)) {
            errs.phoneNumber = 'Please enter a valid Ethiopian phone number';
        }

        // Email validation if provided
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errs.email = 'Please enter a valid email address';
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
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
                // fallback to 09XXXXXXXX
                phoneToSend = '0' + normalized.slice(-9);
                await authService.requestOtp(phoneToSend);
                success = true;
            }

            if (success) {
                setOtpMessage('OTP sent successfully.');
                setPhoneForOtp(phoneToSend);
                // lock the phone field to the exact OTP phone format
                setFormData(prev => ({ ...prev, phoneNumber: phoneToSend }));
            }
        } catch (e: any) {
            setOtpError(typeof e === 'string' ? e : (e?.message || 'Failed to send OTP'));
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
                setOtpMessage(res.message || 'OTP verified.');
            } else {
                setOtpVerified(false);
                setOtpError(res.message || 'OTP verification failed');
            }
        } catch (e: any) {
            setOtpVerified(false);
            setOtpError(e?.message || 'OTP verification failed');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Build backend payload
            const fullNameCombined = `${formData.fullName} ${formData.fatherName} ${formData.grandfatherName}`.trim();
            const mothersFullName = `${formData.motherName} ${formData.motherFatherName} ${formData.motherGrandfatherName}`.trim();

            if (!otpVerified) {
                // Attempt verification inline before submit
                await handleVerifyOtp();
                if (!otpVerified) {
                    throw new Error('OTP not verified');
                }
            }

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
                throw new Error(apiRes?.message || 'Registration failed');
            }

            // Navigate to confirmation page with API response
            navigate('/form/cbe-birr/confirmation', { 
                state: { api: apiRes.data }
            });
        } catch (error) {
            console.error('Error submitting form:', error);
            setErrors(prev => ({
                ...prev,
                submit: 'Failed to submit the form. Please try again.'
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step content
    function getStepContent() {
        if (step === 0) {
            return (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold text-cbe-primary mb-4">Personal Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Phone Number *" error={errors.phoneNumber}>
                            <input
                                name="phoneNumber"
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                disabled={!!phone}
                                placeholder="+251XXXXXXXXX"
                                className="w-full px-3 py-2 border rounded"
                            />
                        </Field>
                        <Field label="Full Name *" error={errors.fullName}>
                            <input
                                name="fullName"
                                type="text"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Your full name"
                                className="w-full px-3 py-2 border rounded"
                            />
                        </Field>
                        <Field label="Father's Name *" error={errors.fatherName}>
                            <input
                                name="fatherName"
                                type="text"
                                value={formData.fatherName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </Field>
                        <Field label="Grandfather's Name *" error={errors.grandfatherName}>
                            <input
                                name="grandfatherName"
                                type="text"
                                value={formData.grandfatherName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </Field>
                        <Field label="Place of Birth *" error={errors.placeOfBirth}>
                            <input
                                name="placeOfBirth"
                                type="text"
                                value={formData.placeOfBirth}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </Field>
                        <Field label="Date of Birth *" error={errors.dateOfBirth}>
                            <input
                                name="dateOfBirth"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </Field>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Gender *</label>
                            <div className="flex space-x-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="Male"
                                        checked={formData.gender === 'Male'}
                                        onChange={handleRadioChange}
                                        className="h-4 w-4 text-cbe-primary focus:ring-cbe-primary"
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
                                        className="h-4 w-4 text-cbe-primary focus:ring-cbe-primary"
                                    />
                                    <span className="ml-2">Female</span>
                                </label>
                            </div>
                            {errors.gender && (
                                <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
        if (step === 1) {
            return (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold text-cbe-primary mb-4">Address Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="City *" error={errors.city}>
                            <input
                                name="city"
                                type="text"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </Field>
                        <Field label="Wereda *" error={errors.wereda}>
                            <input
                                name="wereda"
                                type="text"
                                value={formData.wereda}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </Field>
                        <Field label="Kebele *" error={errors.kebele}>
                            <input
                                name="kebele"
                                type="text"
                                value={formData.kebele}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </Field>
                        <div className="md:col-span-3">
                            <Field label="Email Address" error={errors.email}>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="example@domain.com"
                                    className="w-full px-3 py-2 border rounded"
                                />
                            </Field>
                        </div>
                    </div>
                </div>
            );
        }
        if (step === 2) {
            return (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold text-cbe-primary mb-4">ID Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="ID Number *" error={errors.idNumber}>
                            <input
                                name="idNumber"
                                type="text"
                                value={formData.idNumber}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </Field>
                        <Field label="Issued By *" error={errors.issuedBy}>
                            <input
                                name="issuedBy"
                                type="text"
                                value={formData.issuedBy}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </Field>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Marital Status *
                            </label>
                            <select
                                name="maritalStatus"
                                value={formData.maritalStatus}
                                onChange={handleChange}
                                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-cbe-primary focus:border-cbe-primary sm:text-sm"
                            >
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                                <option value="Widow">Widow</option>
                            </select>
                            {errors.maritalStatus && (
                                <p className="mt-1 text-sm text-red-600">{errors.maritalStatus}</p>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Education Level *
                            </label>
                            <select
                                name="educationLevel"
                                value={formData.educationLevel}
                                onChange={handleChange}
                                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-cbe-primary focus:border-cbe-primary sm:text-sm"
                            >
                                {educationLevels.map(level => (
                                    <option key={level} value={level}>
                                        {level}
                                    </option>
                                ))}
                            </select>
                            {errors.educationLevel && (
                                <p className="mt-1 text-sm text-red-600">{errors.educationLevel}</p>
                            )}
                        </div>
                    </div>
                </div>
            );
        }
        if (step === 3) {
            return (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold text-cbe-primary mb-4">Mother's Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Mother's Name *" error={errors.motherName}>
                            <input
                                name="motherName"
                                type="text"
                                value={formData.motherName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </Field>
                        <Field label="Mother's Father Name *" error={errors.motherFatherName}>
                            <input
                                name="motherFatherName"
                                type="text"
                                value={formData.motherFatherName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </Field>
                        <Field label="Mother's Grandfather Name *" error={errors.motherGrandfatherName}>
                            <input
                                name="motherGrandfatherName"
                                type="text"
                                value={formData.motherGrandfatherName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </Field>
                    </div>
                </div>
            );
        }
        if (step === 4) {
            return (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold text-cbe-primary mb-4">Digital Signature</h2>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <p className="text-sm text-gray-500 mb-4">
                            Please sign in the box below using your mouse or touch screen
                        </p>
                        <div className="bg-white border border-gray-300 rounded h-40 mb-4 flex items-center justify-center">
                            {/* In a real app, you would integrate a signature pad component here */}
                            <p className="text-gray-400">Signature pad will be here</p>
                        </div>
                        <input
                            type="hidden"
                            name="digitalSignature"
                            value={formData.digitalSignature}
                        />
                        <div className="mt-4 text-left">
                            <Field label="OTP Code *" error={errors.otpCode}>
                                <input
                                    name="otpCode"
                                    type="text"
                                    value={formData.otpCode}
                                    onChange={handleChange}
                                    placeholder="Enter the 6-digit OTP"
                                    className="w-full px-3 py-2 border rounded"
                                />
                            </Field>
                            <div className="flex gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={handleRequestOtp}
                                    disabled={otpLoading}
                                    className="px-3 py-2 bg-fuchsia-700 text-white rounded disabled:opacity-50"
                                >
                                    {otpLoading ? 'Sending...' : 'Request OTP'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleVerifyOtp}
                                    disabled={otpLoading || !formData.otpCode}
                                    className="px-3 py-2 bg-gray-200 text-fuchsia-800 rounded disabled:opacity-50"
                                >
                                    {otpLoading ? 'Verifying...' : (otpVerified ? 'Verified' : 'Verify OTP')}
                                </button>
                            </div>
                            {(otpMessage || otpError) && (
                                <div className="mt-2 text-sm">
                                    {otpMessage && <p className="text-green-600">{otpMessage}</p>}
                                    {otpError && <p className="text-red-600">{otpError}</p>}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between">
                            <button
                                type="button"
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                            >
                                Clear Signature
                            </button>
                            <span className="text-xs text-gray-500 self-center">
                                Your signature will be used for verification
                            </span>
                        </div>
                        {errors.digitalSignature && (
                            <p className="mt-2 text-sm text-red-600">{errors.digitalSignature}</p>
                        )}
                    </div>
                </div>
            );
        }
        if (step === 5) {
            // Review & Submit
            return (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Registration Summary
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Review your CBE-Birr registration details
                        </p>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                        <dl className="sm:divide-y sm:divide-gray-200">
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formData.phoneNumber}</dd>
                            </div>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formData.fullName}</dd>
                            </div>
                            {/* ...add more summary fields as needed... */}
                        </dl>
                    </div>
                </div>
            );
        }
        return null;
    }

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md">
            <div className="text-center mb-4 bg-fuchsia-700 text-white p-3 rounded-lg shadow-lg">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">CBE-Birr Registration</h1>
            </div>
            <form onSubmit={step === 5 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
                {getStepContent()}
                <div className="flex justify-between pt-2">
                    {step > 0 && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-fuchsia-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-700"
                        >
                            Back
                        </button>
                    )}
                    {step < 5 && (
                        <button
                            type="submit"
                            className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-fuchsia-700 hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-700"
                        >
                            Next
                        </button>
                    )}
                    {step === 5 && (
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-fuchsia-700 hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                        </button>
                    )}
                </div>
                {errors.submit && (
                    <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{errors.submit}</p>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
