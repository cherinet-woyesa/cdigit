// features/customer/forms/posRequest/POSRequest.tsx
import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '@context/BranchContext';
import { useToast } from '@context/ToastContext';
import { useFormSteps } from '@features/customer/hooks/useFormSteps';
import { useFormValidation } from '@features/customer/hooks/useFormValidation';
import { useOTPHandling } from '@features/customer/hooks/useOTPHandling';
import { useAddressManagement } from '@features/customer/hooks/useAddressManagement';
import { FormLayout } from '@features/customer/components/FormLayout';
import { AccountSelector } from '@features/customer/components/AccountSelector';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import { posRequestValidationSchema } from '@features/customer/utils/posRequestValidationSchema';
import { submitPosRequest } from '@services/forms/posRequestService';
import authService from '@services/auth/authService';
import Field from '@components/form/Field';
import { 
    Loader2, 
    CheckCircle2, 
    Building,
    MapPin,
    FileText,
    Shield,
    Phone,
    Mail,
    Home
} from 'lucide-react';

interface FormData {
    accountNumber: string;
    customerName: string;
    businessName: string;
    businessType: string;
    contactPerson: string;
    phoneNumber: string;
    email: string;
    region: string;
    zone: string;
    wereda: string;
    houseNumber: string;
    numberOfPOS: number;
    posType: 'mobile' | 'desktop';
    estimatedMonthlyTransaction: string;
    termsAccepted: boolean;
    otpCode: string;
}

// Add interface for validated account
interface ValidatedAccount {
    accountNumber: string;
    accountHolderName: string;
    isDiaspora?: boolean;
    accountType?: string;
}

export default function POSRequestForm() {
    const { branch } = useBranch();
    const navigate = useNavigate();
    const { success: showSuccess, error: showError, info } = useToast();

    const { step, next, prev, isFirst, isLast } = useFormSteps(4);
    const { errors, validateField, clearFieldError } = useFormValidation(posRequestValidationSchema);
    const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();

    const [formData, setFormData] = useState<FormData>({
        accountNumber: '',
        customerName: '',
        businessName: '',
        businessType: '',
        contactPerson: '',
        phoneNumber: '',
        email: '',
        region: '',
        zone: '',
        wereda: '',
        houseNumber: '',
        numberOfPOS: 1,
        posType: 'mobile',
        estimatedMonthlyTransaction: '',
        termsAccepted: false,
        otpCode: '',
    });

    const { regions, zones, woredas, regionLoading, zoneLoading, woredaLoading } = useAddressManagement(formData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [accountPhoneNumber, setAccountPhoneNumber] = useState<string | null>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        clearFieldError(name);

        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
            return;
        }
        
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAccountValidation = (account: ValidatedAccount | null) => {
        if (account) {
            setFormData(prev => ({
                ...prev,
                customerName: account.accountHolderName,
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                customerName: '',
            }));
            setAccountPhoneNumber(null); // Clear phone number if validation fails
        }
    };

    const handlePhoneNumberFetched = (phoneNumber: string) => {
        console.log('Phone number fetched from account:', phoneNumber);
        setAccountPhoneNumber(phoneNumber);
    };

    const handleAccountChange = (accountNumber: string, accountHolderName?: string) => {
        setFormData(prev => ({
            ...prev,
            accountNumber,
            customerName: accountHolderName || '',
        }));
        
        if (accountHolderName) {
            clearFieldError('accountNumber');
        }
    };

    const validateCurrentStep = () => {
        const stepFields: Record<number, (keyof FormData)[]> = {
            1: ['accountNumber', 'businessName', 'businessType', 'contactPerson', 'phoneNumber', 'email'],
            2: ['region', 'zone', 'wereda', 'houseNumber'],
            3: ['termsAccepted'],
            4: ['otpCode'],
        };

        const fieldsToValidate = stepFields[step] || [];
        let isValid = true;
        
        fieldsToValidate.forEach(field => {
            const fieldValue = formData[field];
            const fieldIsValid = validateField(field, fieldValue, formData);
            if (!fieldIsValid) {
                isValid = false;
            }
        });
        
        return isValid;
    };

    const handleNext = () => {
        if (validateCurrentStep()) {
            next();
        }
    };

    const handleRequestOTP = async () => {
        if (!validateCurrentStep()) return;
        
        // Use phone number from account validation, fallback to manually entered phone
        const phoneToUse = accountPhoneNumber || formData.phoneNumber;
        
        if (!phoneToUse) {
            showError('Phone number is required. Please ensure the account has a valid phone number.');
            return;
        }
        
        try {
            await requestOTP(
                () => authService.requestOTP(phoneToUse),
                'OTP sent to your phone'
            );
            info(`OTP sent to ${phoneToUse}`);
            next();
        } catch (error: any) {
            showError(error?.message || 'Failed to send OTP');
        }
    };

    const handleSubmit = async () => {
        if (!validateCurrentStep() || !branch?.id) {
            showError('Please ensure all fields are filled correctly.');
            return;
        }

        // Use phone number from account validation, fallback to manually entered phone
        const phoneToUse = accountPhoneNumber || formData.phoneNumber;
        
        if (!phoneToUse) {
            showError('Phone number is required. Please ensure the account has a valid phone number.');
            return;
        }

        setIsSubmitting(true);
        try {
            const addressObject = {
                City: formData.region,
                Subcity: formData.zone,
                Wereda: formData.wereda,
                Kebele: formData.houseNumber
            };

            const posRequestData = {
                BranchId: branch.id,
                OtpCode: formData.otpCode,
                AccountNumber: formData.accountNumber,
                CustomerName: formData.customerName,
                PhoneNumber: phoneToUse, // Use the phone number that OTP was sent to
                BusinessName: formData.businessName,
                ContactNumber: phoneToUse, // Use the same phone number
                SecondaryContactNumber: null,
                Address: addressObject,
                NatureOfBusiness: formData.businessName,
                TypeOfBusiness: formData.businessType,
                NumberOfPOSRequired: formData.numberOfPOS,
                TermsAccepted: formData.termsAccepted
            };

            const response = await submitPosRequest(posRequestData);

            if (response && response.success) {
                showSuccess('POS Request submitted successfully!');
                navigate('/form/pos-request/confirmation', { 
                    state: { serverData: response, branchName: branch?.name, formData: formData, address: addressObject } 
                });
            } else {
                const errorMessage = response?.message || 'Submission failed';
                if (errorMessage.toLowerCase().includes('otp')) {
                    showError(errorMessage);
                } else {
                    showError(errorMessage);
                }
            }
        } catch (error: any) {
            showError(error?.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep1 = () => (
        <div className="border border-amber-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Building className="h-5 w-5 text-fuchsia-700" />Business Information</h2>
            <div className="space-y-6">
                <AccountSelector
                    accounts={[]} // Pass empty array to disable dropdown
                    selectedAccount={formData.accountNumber}
                    onAccountChange={handleAccountChange}
                    onAccountValidation={handleAccountValidation}
                    onPhoneNumberFetched={handlePhoneNumberFetched}
                    error={errors.accountNumber}
                    allowManualEntry={true}
                />
                
                <div className="md:col-span-2">
                    <Field label="Business Name" required error={errors.businessName}>
                        <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" />
                    </Field>
                </div>
                <Field label="Business Type" required error={errors.businessType}>
                    <select name="businessType" value={formData.businessType} onChange={handleChange} className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50">
                        <option value="">Select Business Type</option>
                        <option value="retail">Retail</option>
                        <option value="wholesale">Wholesale</option>
                        <option value="service">Service</option>
                        <option value="hospitality">Hospitality</option>
                        <option value="other">Other</option>
                    </select>
                </Field>
                <Field label="Contact Person" required error={errors.contactPerson}>
                    <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" />
                </Field>
                <Field label="Phone Number" required error={errors.phoneNumber}>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full p-3 pl-10 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" />
                    </div>
                </Field>
                <Field label="Email Address" required error={errors.email}>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 pl-10 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" />
                    </div>
                </Field>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="border border-amber-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-fuchsia-700" />Address Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Region" required error={errors.region}>
                    <div className="relative">
                        {regionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />}
                        <select name="region" value={formData.region} onChange={handleChange} disabled={regionLoading} className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50">
                            <option value="">Select region</option>
                            {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>
                    </div>
                </Field>
                <Field label="Zone" required error={errors.zone}>
                    <div className="relative">
                        {zoneLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />}
                        <select name="zone" value={formData.zone} onChange={handleChange} disabled={!formData.region || zoneLoading} className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50">
                            <option value="">Select zone</option>
                            {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
                        </select>
                    </div>
                </Field>
                <Field label="Wereda" required error={errors.wereda}>
                    <div className="relative">
                        {woredaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />}
                        <select name="wereda" value={formData.wereda} onChange={handleChange} disabled={!formData.zone || woredaLoading} className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50">
                            <option value="">Select woreda</option>
                            {woredas.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                        </select>
                    </div>
                </Field>
                <Field label="House Number" required error={errors.houseNumber}>
                    <div className="relative">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="text" name="houseNumber" value={formData.houseNumber} onChange={handleChange} className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" placeholder="Enter house number" />
                    </div>
                </Field>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="border border-amber-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-fuchsia-700" />Review Information</h2>
            <div className="bg-amber-50 rounded-lg p-6 space-y-6">
                {/* Review content here */}
            </div>
            <div className="mt-6">
                <div className="flex items-start">
                    <input id="termsAccepted" name="termsAccepted" type="checkbox" checked={formData.termsAccepted} onChange={handleChange} className="h-4 w-4 text-fuchsia-600 focus:ring-fuchsia-500 border-amber-300 rounded" />
                    <div className="ml-3 text-sm">
                        <label htmlFor="termsAccepted" className="font-medium text-gray-700">I agree to the terms and conditions</label>
                        {errors.termsAccepted && <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => {
        const phoneToDisplay = accountPhoneNumber || formData.phoneNumber;
        
        return (
            <div className="border border-amber-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Shield className="h-5 w-5 text-fuchsia-700" />OTP Verification</h2>
                <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-sm text-amber-700">An OTP has been sent to: <strong className="text-amber-900">{phoneToDisplay}</strong></p>
                        {otpMessage && <p className="text-sm text-green-600 mt-1"><CheckCircle2 className="inline h-3 w-3 mr-1" />{otpMessage}</p>}
                    </div>
                    <div className="max-w-md">
                        <Field label="Enter OTP" required error={errors.otpCode}>
                            <input type="text" name="otpCode" value={formData.otpCode} onChange={handleChange} maxLength={6} className="w-full p-3 text-center text-2xl tracking-widest rounded-lg border border-amber-200 font-mono bg-amber-50" placeholder="000000" />
                        </Field>
                        <div className="mt-2 flex justify-between items-center">
                            <button type="button" onClick={() => resendOTP(() => authService.requestOTP(phoneToDisplay))} disabled={resendCooldown > 0 || otpLoading} className="text-sm text-fuchsia-700 hover:text-fuchsia-800 disabled:text-gray-400">
                                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                            </button>
                            <span className="text-sm text-gray-500">{formData.otpCode.length}/6</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const getStepContent = () => {
        switch (step) {
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            case 4: return renderStep4();
            default: return null;
        }
    };

    return (
        <FormLayout title="POS Request" branchName={branch?.name}>
            <form onSubmit={e => e.preventDefault()} className="space-y-6">
                {getStepContent()}
                <StepNavigation 
                    currentStep={step} 
                    totalSteps={4} 
                    onNext={isLast ? handleSubmit : (step === 3 ? handleRequestOTP : handleNext)} 
                    onBack={prev} 
                    nextLabel={isLast ? 'Submit Request' : (step === 3 ? 'Request OTP' : 'Continue')} 
                    nextDisabled={isSubmitting || otpLoading || (step === 3 && !formData.termsAccepted)} 
                    nextLoading={isSubmitting || otpLoading} 
                    hideBack={isFirst} 
                />
            </form>
        </FormLayout>
    );
}