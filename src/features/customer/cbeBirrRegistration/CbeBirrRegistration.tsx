import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Field } from '../accountOpening/components/FormElements';
import { fetchWindowsByBranch } from '../../../services/windowService';
import type { Window as WindowType } from '../../../services/windowService';

const API_BASE_URL = 'http://localhost:5268/api';

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
};

type Errors = Partial<Record<keyof FormData, string>>;

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
    });

    const [errors, setErrors] = useState<Errors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [windows, setWindows] = useState<WindowType[]>([]);
    const ABIY_BRANCH_ID = 'a3d3e1b5-8c9a-4c7c-a1e3-6b3d8f4a2b2c';

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
    }, [phone]);

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
            'motherGrandfatherName', 'digitalSignature'
        ];

        requiredFields.forEach(field => {
            if (!formData[field]) {
                errs[field] = `${field.split(/(?=[A-Z])/).join(' ')} is required.`;
            }
        });

        // Phone number validation
        const phoneRegex = /^(\+2519|\+2517|09|9|07|7)\d{8,9}$/;
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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateAll()) return;
        
        setIsSubmitting(true);
        try {
            // Generate a random window number from available windows
            const randomWindow = windows.length > 0 
                ? windows[Math.floor(Math.random() * windows.length)] 
                : { id: '1', name: 'Window 1', branchId: ABIY_BRANCH_ID };

            // Generate form reference ID (CB-YYYYMMDD-XXX)
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
            const refNumber = Math.floor(100 + Math.random() * 900); // Random 3-digit number
            const formReferenceId = `CB-${dateStr}-${refNumber}`;

            // Generate token number (CB-XXXXXX)
            const tokenNumber = `CB-${Math.floor(100000 + Math.random() * 900000)}`;

            const registrationData = {
                formReferenceId,
                branchId: ABIY_BRANCH_ID,
                windowId: randomWindow.id,
                windowNumber: randomWindow.name.replace('Window ', ''),
                tokenNumber,
                ...formData,
                submittedAt: now.toISOString(),
            };

            // In a real app, you would send this to your backend
            console.log('Submitting registration:', registrationData);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Navigate to confirmation page with the form data
            navigate('/form/cbe-birr/confirmation', { 
                state: { 
                    formData: registrationData,
                    windowNumber: randomWindow.name.replace('Window ', '')
                } 
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

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-cbe-primary mb-6">CBE-Birr Registration</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold text-cbe-primary mb-4">Personal Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                            label="Phone Number *"
                            name="phoneNumber"
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            error={errors.phoneNumber}
                            placeholder="+251XXXXXXXXX"
                        />
                        
                        <Field
                            label="Full Name *"
                            name="fullName"
                            type="text"
                            value={formData.fullName}
                            onChange={handleChange}
                            error={errors.fullName}
                            placeholder="Your full name"
                        />
                        
                        <Field
                            label="Father's Name *"
                            name="fatherName"
                            type="text"
                            value={formData.fatherName}
                            onChange={handleChange}
                            error={errors.fatherName}
                        />
                        
                        <Field
                            label="Grandfather's Name *"
                            name="grandfatherName"
                            type="text"
                            value={formData.grandfatherName}
                            onChange={handleChange}
                            error={errors.grandfatherName}
                        />
                        
                        <Field
                            label="Place of Birth *"
                            name="placeOfBirth"
                            type="text"
                            value={formData.placeOfBirth}
                            onChange={handleChange}
                            error={errors.placeOfBirth}
                        />
                        
                        <Field
                            label="Date of Birth *"
                            name="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            error={errors.dateOfBirth}
                        />
                        
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
                
                {/* Address Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold text-cbe-primary mb-4">Address Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field
                            label="City *"
                            name="city"
                            type="text"
                            value={formData.city}
                            onChange={handleChange}
                            error={errors.city}
                        />
                        
                        <Field
                            label="Wereda *"
                            name="wereda"
                            type="text"
                            value={formData.wereda}
                            onChange={handleChange}
                            error={errors.wereda}
                        />
                        
                        <Field
                            label="Kebele *"
                            name="kebele"
                            type="text"
                            value={formData.kebele}
                            onChange={handleChange}
                            error={errors.kebele}
                        />
                        
                        <div className="md:col-span-3">
                            <Field
                                label="Email Address"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                error={errors.email}
                                placeholder="example@domain.com"
                            />
                        </div>
                    </div>
                </div>
                
                {/* ID Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold text-cbe-primary mb-4">ID Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                            label="ID Number *"
                            name="idNumber"
                            type="text"
                            value={formData.idNumber}
                            onChange={handleChange}
                            error={errors.idNumber}
                        />
                        
                        <Field
                            label="Issued By *"
                            name="issuedBy"
                            type="text"
                            value={formData.issuedBy}
                            onChange={handleChange}
                            error={errors.issuedBy}
                        />
                        
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
                
                {/* Mother's Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold text-cbe-primary mb-4">Mother's Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field
                            label="Mother's Name *"
                            name="motherName"
                            type="text"
                            value={formData.motherName}
                            onChange={handleChange}
                            error={errors.motherName}
                        />
                        
                        <Field
                            label="Mother's Father Name *"
                            name="motherFatherName"
                            type="text"
                            value={formData.motherFatherName}
                            onChange={handleChange}
                            error={errors.motherFatherName}
                        />
                        
                        <Field
                            label="Mother's Grandfather Name *"
                            name="motherGrandfatherName"
                            type="text"
                            value={formData.motherGrandfatherName}
                            onChange={handleChange}
                            error={errors.motherGrandfatherName}
                        />
                    </div>
                </div>
                
                {/* Digital Signature */}
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
                
                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-4">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cbe-primary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cbe-primary hover:bg-cbe-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cbe-primary disabled:opacity-50"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                    </button>
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
