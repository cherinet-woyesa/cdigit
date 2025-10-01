import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBranch } from "../../../../context/BranchContext";
import { useAuth } from "../../../../context/AuthContext";
import * as accountOpeningService from "../../../../services/accountOpeningService";
import { checkAccountExistsByPhone } from "../../../../services/accountsService";
import ProgressBar from '../../../../components/ProgressBar';
import Field from '../../../../components/Field';
import type { FormData, FormErrors, FormSummary } from "./types/formTypes";
import { INITIAL_DATA, INITIAL_FORM_ERRORS } from "./types/formTypes";
import { StepPersonal } from "./components/StepPersonal";
import { StepAddress } from "./components/StepAddress";
import { StepFinancial } from "./components/StepFinancial";
import { StepOther } from "./components/StepOther";
import { StepDocument } from "./components/StepDocument";
import { StepEPayment } from "./components/StepEPayment";
import { StepPassbook } from "./components/StepPassbook";
import { StepSignature } from "./components/StepSignature";
import { StepReview } from "./components/StepReview";
import { useMultiStepForm } from '../../../../hooks/useMultiStepForm';
import { 
    Loader2, 
    AlertCircle, 
    CheckCircle2, 
    ChevronRight,
    User,
    MapPin,
    CreditCard,
    FileText,
    Shield,
    Gift,
    PenTool,
    Plane,
    Calendar,
    Languages
} from 'lucide-react';

// Import translation hooks and components
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../../../components/LanguageSwitcher';

// Enhanced error message component with translation
function ErrorMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{message}</span>
        </div>
    );
}

// Success message component with translation
function SuccessMessage({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-green-700">{message}</span>
        </div>
    );
}

const steps = [
    "personal", "address", "financial", "other", 
    "document", "payment", "items", "signature", "review"
];

const stepIcons = [User, MapPin, CreditCard, Shield, FileText, CreditCard, Gift, PenTool, CheckCircle2];

// Enhanced phone number validation
const isValidPhoneNumber = (phone: string): boolean => {
    if (!phone.trim()) return false;
    
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    if (cleanPhone.length === 9) {
        return /^[97]\d{8}$/.test(cleanPhone);
    } else if (cleanPhone.length === 10) {
        return /^0[97]\d{8}$/.test(cleanPhone);
    } else if (cleanPhone.length === 12) {
        return /^251[97]\d{8}$/.test(cleanPhone);
    }
    
    return false;
};

const normalizePhoneNumber = (phone: string): string => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    if (cleanPhone.length === 9) {
        return `251${cleanPhone}`;
    } else if (cleanPhone.length === 10) {
        return `251${cleanPhone.substring(1)}`;
    } else if (cleanPhone.length === 12) {
        return cleanPhone;
    }
    
    return cleanPhone;
};

const formatPhoneForDisplay = (phone: string): string => {
    const normalized = normalizePhoneNumber(phone);
    return `+${normalized}`;
};

export function AccountOpeningForm() {
    const navigate = useNavigate();
    const { branch } = useBranch();
    const { user } = useAuth();
    
    // Add translation hook
    const { t } = useTranslation();
    
    const [errors, setErrors] = useState<FormErrors>(INITIAL_FORM_ERRORS);
    const [submitting, setSubmitting] = useState(false);
    const [phoneNumberScreenActive, setPhoneNumberScreenActive] = useState(true);
    const [phoneNumberInput, setPhoneNumberInput] = useState("");
    const [phoneCheckLoading, setPhoneCheckLoading] = useState(false);
    const [phoneInputError, setPhoneInputError] = useState<string | undefined>();
    const [successMessage, setSuccessMessage] = useState('');
    const [resumeStep, setResumeStep] = useState<number>(0);

    const stepKeys = [
        "personalDetails", "addressDetails", "financialDetails", "otherDetails",
        "documentDetails", "ePaymentService", "passbookMudayRequest", "digitalSignature", "review"
    ];

    const {
        currentStep,
        steps: numSteps,
        formData,
        setFormData,
        next,
        back,
        goTo,
    } = useMultiStepForm<FormData>(INITIAL_DATA, steps.length);

    // Fix: Proper PascalCase conversion for backend
    const toPascalCase = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(toPascalCase);
        
        const pascalObj: any = {};
        for (const key in obj) {
            if (obj[key] !== undefined && obj[key] !== null) {
                const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
                pascalObj[pascalKey] = toPascalCase(obj[key]);
            }
        }
        return pascalObj;
    };

    const formatDateForBackend = (dateString: string | undefined): string => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toISOString();
        } catch {
            return dateString;
        }
    };

    const updateSectionData = <K extends keyof FormData>(section: K, data: Partial<FormData[K]>) => {
        setFormData((prev) => {
            const prevSectionData = prev[section];
            if (typeof prevSectionData === 'object' && prevSectionData !== null && !Array.isArray(prevSectionData)) {
                return { ...prev, [section]: { ...prevSectionData, ...data } };
            }
            return { ...prev, [section]: data };
        });
        setErrors((prev) => ({ ...prev, [section]: {} }));
    };

    // Enhanced session persistence with translation
    useEffect(() => {
        const restoreApplicationState = async () => {
            try {
                const savedPhone = localStorage.getItem('accountOpeningPhone');
                const savedStep = localStorage.getItem('accountOpeningCurrentStep');
                
                if (savedPhone && savedStep) {
                    const step = parseInt(savedStep, 10);
                    const normalizedPhone = normalizePhoneNumber(savedPhone);
                    
                    if (!isNaN(step) && step >= 0 && step < steps.length) {
                        setPhoneNumberInput(savedPhone);
                        setResumeStep(step);
                        
                        try {
                            const formSummary: FormSummary | null = await accountOpeningService.getSavedForm(normalizedPhone);
                            if (formSummary) {
                                const transformedData: FormData = {
                                    customerId: formSummary.customerId,
                                    personalDetails: formSummary.personalDetails || INITIAL_DATA.personalDetails,
                                    addressDetails: { ...INITIAL_DATA.addressDetails, ...formSummary.addressDetails, mobilePhone: formSummary.addressDetails?.mobilePhone || normalizedPhone },
                                    financialDetails: formSummary.financialDetails || INITIAL_DATA.financialDetails,
                                    otherDetails: formSummary.otherDetails || INITIAL_DATA.otherDetails,
                                    documentDetails: { ...INITIAL_DATA.documentDetails, ...formSummary.documentDetails, mobilePhoneNo: formSummary.documentDetails?.mobilePhoneNo || normalizedPhone },
                                    ePaymentService: formSummary.ePaymentService || INITIAL_DATA.ePaymentService,
                                    passbookMudayRequest: formSummary.passbookMudayRequest || INITIAL_DATA.passbookMudayRequest,
                                    digitalSignature: formSummary.digitalSignature || INITIAL_DATA.digitalSignature,
                                };
                                setFormData(transformedData);
                                
                                const params = new URLSearchParams(window.location.search);
                                const stepParam = params.get('step');
                                const urlStep = stepParam ? parseInt(stepParam, 10) : step;
                                
                                const finalStep = !isNaN(urlStep) && urlStep >= 0 && urlStep < steps.length ? urlStep : step;
                                setResumeStep(finalStep);
                                
                                setPhoneNumberScreenActive(false);
                                setTimeout(() => goTo(finalStep), 100);
                            }
                        } catch (error) {
                            console.log('No saved form found or error loading form:', error);
                            const params = new URLSearchParams(window.location.search);
                            const stepParam = params.get('step');
                            if (stepParam) {
                                const urlStep = parseInt(stepParam, 10);
                                if (!isNaN(urlStep) && urlStep >= 0 && urlStep < steps.length) {
                                    setResumeStep(urlStep);
                                }
                            }
                        }
                    }
                } else {
                    const params = new URLSearchParams(window.location.search);
                    const stepParam = params.get('step');
                    if (stepParam) {
                        const urlStep = parseInt(stepParam, 10);
                        if (!isNaN(urlStep) && urlStep >= 0 && urlStep < steps.length) {
                            setResumeStep(urlStep);
                        }
                    }
                }
            } catch (error) {
                console.error('Error restoring application state:', error);
            }
        };

        restoreApplicationState();
        
        const handler = (e: BeforeUnloadEvent) => {
            if (!phoneNumberScreenActive && currentStep < steps.length) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, []);

    useEffect(() => {
        if (!phoneNumberScreenActive && currentStep < steps.length) {
            localStorage.setItem('accountOpeningCurrentStep', currentStep.toString());
            
            try {
                const params = new URLSearchParams(window.location.search);
                params.set('step', String(currentStep));
                const newUrl = `${window.location.pathname}?${params.toString()}`;
                window.history.replaceState({}, '', newUrl);
            } catch (error) {
                console.error('Error updating URL:', error);
            }
        }
    }, [currentStep, phoneNumberScreenActive]);

    const handlePhoneNumberSubmit = async () => {
        if (!phoneNumberInput.trim() || !isValidPhoneNumber(phoneNumberInput.trim())) {
            setPhoneInputError(t('accountOpening.phoneValidationError', 'Please enter a valid Ethiopian mobile number (09, 07, +2519, +2517 formats accepted).'));
            return;
        }
        
        setPhoneInputError(undefined);
        setPhoneCheckLoading(true);
        
        try {
            const normalizedPhone = normalizePhoneNumber(phoneNumberInput.trim());
            
            localStorage.setItem('accountOpeningPhone', normalizedPhone);
            localStorage.setItem('accountOpeningPhoneDisplay', phoneNumberInput.trim());
            
            const accountExists = await checkAccountExistsByPhone(normalizedPhone);
            if (accountExists) {
                setPhoneInputError(t('accountOpening.phoneExistsError', 'An account already exists for this phone number.'));
                setPhoneCheckLoading(false);
                return;
            }
            
            const savedFormData: FormSummary | null = await accountOpeningService.getSavedForm(normalizedPhone);
            if (savedFormData) {
                const transformedData: FormData = {
                    customerId: savedFormData.customerId,
                    personalDetails: savedFormData.personalDetails || INITIAL_DATA.personalDetails,
                    addressDetails: { ...INITIAL_DATA.addressDetails, ...savedFormData.addressDetails, mobilePhone: savedFormData.addressDetails?.mobilePhone || normalizedPhone },
                    financialDetails: savedFormData.financialDetails || INITIAL_DATA.financialDetails,
                    otherDetails: savedFormData.otherDetails || INITIAL_DATA.otherDetails,
                    documentDetails: { ...INITIAL_DATA.documentDetails, ...savedFormData.documentDetails, mobilePhoneNo: savedFormData.documentDetails?.mobilePhoneNo || normalizedPhone },
                    ePaymentService: savedFormData.ePaymentService || INITIAL_DATA.ePaymentService,
                    passbookMudayRequest: savedFormData.passbookMudayRequest || INITIAL_DATA.passbookMudayRequest,
                    digitalSignature: savedFormData.digitalSignature || INITIAL_DATA.digitalSignature,
                };
                setFormData(transformedData);
                
                let lastFilledStep = resumeStep;
                if (savedFormData.digitalSignature?.id) lastFilledStep = 8;
                else if (savedFormData.passbookMudayRequest?.id) lastFilledStep = 7;
                else if (savedFormData.ePaymentService?.id) lastFilledStep = 6;
                else if (savedFormData.documentDetails?.id) lastFilledStep = 5;
                else if (savedFormData.otherDetails?.id) lastFilledStep = 4;
                else if (savedFormData.financialDetails?.id) lastFilledStep = 3;
                else if (savedFormData.addressDetails?.id) lastFilledStep = 2;
                else if (savedFormData.personalDetails?.id) lastFilledStep = 1;
                else lastFilledStep = 0;
                
                const finalStep = Math.max(resumeStep, lastFilledStep);
                setResumeStep(finalStep);
                
                setPhoneNumberScreenActive(false);
                setTimeout(() => goTo(finalStep), 100);
            } else {
                setFormData({ 
                    ...INITIAL_DATA, 
                    addressDetails: { ...INITIAL_DATA.addressDetails, mobilePhone: normalizedPhone }, 
                    documentDetails: { ...INITIAL_DATA.documentDetails, mobilePhoneNo: normalizedPhone } 
                });
                setPhoneNumberScreenActive(false);
                setTimeout(() => goTo(resumeStep), 100);
            }
        } catch (error: any) {
            setPhoneInputError(t('accountOpening.generalError', 'An unexpected error occurred. Please try again.'));
        } finally {
            setPhoneCheckLoading(false);
        }
    };

  const handleNext = async () => {
    if (currentStep === 8) { next(); return; }

    const stepDataKey = stepKeys[currentStep];
    if (!formData[stepDataKey as keyof FormData]) {
        console.error(`Data for step ${currentStep} is undefined.`);
        return;
    }

    setSubmitting(true);
    try {
        let response: any;
        let updatedCustomerData: Partial<FormData> = {};
        let nextCustomerId = formData.customerId;

        if (currentStep > 0 && (!formData.customerId || formData.customerId <= 0)) {
            setErrors((prev) => ({ ...prev, apiError: t('accountOpening.missingCustomerId', 'Customer ID is missing. Please complete Personal Details first.') }));
            setSubmitting(false);
            return;
        }

        const transformDataForBackend = (data: any) => {
            const transformed = toPascalCase(data);
            if (data.dateOfBirth) transformed.DateOfBirth = formatDateForBackend(data.dateOfBirth);
            if (data.issueDate) transformed.IssueDate = formatDateForBackend(data.issueDate);
            if (data.expiryDate) transformed.ExpiryDate = formatDateForBackend(data.expiryDate);
            if (nextCustomerId) transformed.CustomerId = nextCustomerId;
            return transformed;
        };

        switch (currentStep) {
            case 0:
                const personalData = transformDataForBackend({
                    ...formData.personalDetails,
                    mobilePhone: normalizePhoneNumber(phoneNumberInput)
                });
                response = await accountOpeningService.savePersonalDetails(personalData, normalizePhoneNumber(phoneNumberInput));
                nextCustomerId = response.id;
                updatedCustomerData = { 
                    customerId: nextCustomerId, 
                    personalDetails: { ...formData.personalDetails, id: response.id } 
                };
                break;

            case 1:
                const addressData = transformDataForBackend({
                    ...formData.addressDetails,
                    mobilePhone: formData.addressDetails.mobilePhone || normalizePhoneNumber(phoneNumberInput)
                });
                response = await accountOpeningService.saveAddressDetails(addressData);
                updatedCustomerData = { addressDetails: { ...formData.addressDetails, id: response.id } };
                break;

            case 2:
                response = await accountOpeningService.saveFinancialDetails(
                    transformDataForBackend(formData.financialDetails)
                );
                updatedCustomerData = { financialDetails: { ...formData.financialDetails, id: response.id } };
                break;

            case 3:
                response = await accountOpeningService.saveOtherDetails(
                    transformDataForBackend(formData.otherDetails)
                );
                updatedCustomerData = { otherDetails: { ...formData.otherDetails, id: response.id } };
                break;

            case 4:
                let docPhotoUrl = formData.documentDetails.docPhotoUrl;
                if (formData.documentDetails.photoIdFile) {
                    docPhotoUrl = await accountOpeningService.uploadDocumentPhoto(formData.documentDetails.photoIdFile);
                }
                const documentData = transformDataForBackend({
                    ...formData.documentDetails,
                    docPhotoUrl,
                    mobilePhoneNo: formData.documentDetails.mobilePhoneNo || normalizePhoneNumber(phoneNumberInput)
                });
                response = await accountOpeningService.saveDocumentDetails(documentData);
                updatedCustomerData = { 
                    documentDetails: { ...formData.documentDetails, id: response.id, docPhotoUrl } 
                };
                break;

            case 5:
                response = await accountOpeningService.saveEPaymentService(
                    transformDataForBackend(formData.ePaymentService)
                );
                updatedCustomerData = { ePaymentService: { ...formData.ePaymentService, id: response.id } };
                break;

            case 6:
                response = await accountOpeningService.savePassbookMudayRequest(
                    transformDataForBackend(formData.passbookMudayRequest)
                );
                updatedCustomerData = { passbookMudayRequest: { ...formData.passbookMudayRequest, id: response.id } };
                break;

            case 7:
                // FIXED: Remove file upload logic since we're using signature canvas
                const signatureData = transformDataForBackend({
                    ...formData.digitalSignature,
                    termsAccepted: true
                });
                response = await accountOpeningService.saveDigitalSignature(signatureData);
                updatedCustomerData = { 
                    digitalSignature: { ...formData.digitalSignature, id: response.id } 
                };
                break;
        }

        setFormData(prev => ({ ...prev, ...updatedCustomerData, customerId: nextCustomerId }));
        next();
    } catch (error) {
        console.error("Error saving form data:", error);
        setErrors((prev) => ({ 
            ...prev, 
            apiError: error instanceof Error ? error.message : t('accountOpening.saveError', 'Failed to save data. Please try again.') 
        }));
    } finally {
        setSubmitting(false);
    }
};

    const handleFinalSubmit = async () => {
        if (!formData.customerId) {
            setErrors((prev) => ({
                ...prev,
                apiError: t('accountOpening.submissionError', 'Could not submit application: Customer ID is missing. Please complete all previous steps first.'),
            }));
            return;
        }
        
        setSubmitting(true);
        setErrors(prev => ({ ...prev, apiError: undefined }));
        
        try {
            await accountOpeningService.submitApplication(formData.customerId);
            
            localStorage.removeItem('accountOpeningPhone');
            localStorage.removeItem('accountOpeningPhoneDisplay');
            localStorage.removeItem('accountOpeningCurrentStep');
            localStorage.removeItem('accountOpeningFormData');
            
            next();
        } catch (error) {
            console.error("Failed to submit application:", error);
            const errorMessage = error instanceof Error 
                ? t('accountOpening.submissionFailed', 'Failed to submit the application: {{message}}', { message: error.message })
                : t('accountOpening.unknownError', 'An unknown error occurred while submitting the application.');
                
            setErrors((prev) => ({
                ...prev,
                apiError: errorMessage,
            }));
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        const prevStep = currentStep - 1;
        if (prevStep >= 0) {
            setErrors((prev) => ({ ...prev, [stepKeys[prevStep]]: {} }));
        }
        back();
    };

    // Enhanced phone screen with translation
    const renderPhoneScreen = () => {
        const isValid = isValidPhoneNumber(phoneNumberInput);
        const CurrentIcon = stepIcons[0];
        const displayPhone = phoneNumberInput && isValid ? formatPhoneForDisplay(phoneNumberInput) : '';
        const hasSavedApplication = localStorage.getItem('accountOpeningPhone');
        
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
                <div className="text-center mb-8">
                    <div className="bg-fuchsia-100 p-4 rounded-full inline-flex mb-4">
                        <CurrentIcon className="h-12 w-12 text-fuchsia-700" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-fuchsia-800">
                        {hasSavedApplication ? t('accountOpening.resumeWelcome', 'Resume Your Application') : t('accountOpening.welcome', 'Welcome to CBE Account Opening')}
                    </h2>
                    <p className="text-gray-600 text-lg max-w-md">
                        {hasSavedApplication ? t('accountOpening.resumeDescription', 'Continue from where you left off') : t('accountOpening.startDescription', 'Enter your mobile number to begin')}
                    </p>
                </div>
                
                <div className="w-full max-w-md">
                    <Field label={t('accountOpening.phoneLabel', 'Ethiopian Mobile Number')} error={phoneInputError} required>
                        <div className="relative">
                            <input
                                type="tel"
                                className={`w-full p-3 rounded-lg border-2 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors text-lg ${
                                    phoneInputError ? 'border-red-300 bg-red-50' : 
                                    phoneNumberInput && isValid ? 'border-green-300 bg-green-50' : 'border-gray-300'
                                }`}
                                value={phoneNumberInput}
                                onChange={(e) => setPhoneNumberInput(e.target.value)}
                                placeholder={t('accountOpening.phonePlaceholder', '09xxxxxxx, 07xxxxxxx, +251...')}
                                autoFocus
                            />
                            {phoneNumberInput && isValid && (
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    <span className="text-green-600 text-sm ml-1 hidden sm:inline">
                                        {displayPhone}
                                    </span>
                                </div>
                            )}
                        </div>
                    </Field>
                    
                    <div className="mt-2 text-xs text-gray-500 mb-4">
                        <p>{t('accountOpening.phoneFormats', 'Accepted formats: 09xxxxxxx, 07xxxxxxx, 9xxxxxxx, +2519xxxxxxx, +2517xxxxxxx')}</p>
                    </div>
                    
                    <button
                        type="button"
                        className="w-full bg-fuchsia-700 text-white px-6 py-4 rounded-lg font-semibold hover:bg-fuchsia-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        onClick={handlePhoneNumberSubmit}
                        disabled={phoneCheckLoading || !isValid}
                    >
                        {phoneCheckLoading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                {hasSavedApplication ? t('accountOpening.resuming', 'Resuming...') : t('accountOpening.verifying', 'Verifying...')}
                            </>
                        ) : (
                            <>
                                {hasSavedApplication ? t('accountOpening.resumeButton', 'Resume Application') : t('accountOpening.continueButton', 'Continue to Application')}
                                <ChevronRight className="h-5 w-5" />
                            </>
                        )}
                    </button>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                                <Shield className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-blue-800 text-sm font-medium">
                                    {hasSavedApplication ? t('accountOpening.savedNotice', 'Application Saved') : t('accountOpening.privacyNotice', 'Your Privacy Matters')}
                                </p>
                                <p className="text-blue-600 text-xs">
                                    {hasSavedApplication 
                                        ? t('accountOpening.savedDescription', 'Your application progress is saved. You can resume anytime.') 
                                        : t('accountOpening.privacyDescription', 'We save your progress automatically. You can pause and resume later.')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Success screen with translation
    const renderSuccessScreen = () => {
        return (
            <div className="text-center p-8 py-12">
                <div className="bg-green-100 p-4 rounded-full inline-flex mb-6">
                    <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
                
                <h2 className="text-3xl font-extrabold text-green-800 mb-4">
                    {t('accountOpening.successTitle', 'Application Submitted Successfully!')}
                </h2>
                
                <p className="text-lg text-gray-700 mb-6 max-w-md mx-auto">
                    {t('accountOpening.successDescription', 'Your account opening application has been received and is being processed.')}
                </p>
                
                {formData.customerId && (
                    <div className="bg-gray-50 rounded-lg p-6 mb-8 max-w-md mx-auto">
                        <p className="text-gray-600 mb-2">{t('accountOpening.referenceLabel', 'Your application reference:')}</p>
                        <p className="text-2xl font-bold text-fuchsia-700 font-mono">{formData.customerId}</p>
                    </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                    <button 
                        onClick={() => navigate("/")}
                        className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                        {t('accountOpening.goHome', 'Go to Home')}
                    </button>
                    <button 
                        onClick={() => {
                            localStorage.removeItem('accountOpeningPhone');
                            localStorage.removeItem('accountOpeningPhoneDisplay');
                            localStorage.removeItem('accountOpeningCurrentStep');
                            localStorage.removeItem('accountOpeningFormData');
                            
                            setPhoneNumberScreenActive(true);
                            setPhoneNumberInput("");
                            setFormData(INITIAL_DATA);
                            setErrors(INITIAL_FORM_ERRORS);
                            goTo(0);
                        }}
                        className="bg-fuchsia-100 text-fuchsia-700 px-6 py-3 rounded-lg font-semibold hover:bg-fuchsia-200 transition-colors"
                    >
                        {t('accountOpening.newApplication', 'New Application')}
                    </button>
                </div>
                
                <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
                    <p className="text-blue-800 text-sm">
                        <strong>{t('accountOpening.nextSteps', 'Next Steps:')}</strong> {t('accountOpening.nextStepsDescription', 'You will receive an SMS confirmation shortly. Please visit your selected branch with original documents for verification.')}
                    </p>
                </div>
            </div>
        );
    };

    const renderStep = () => {
        if (phoneNumberScreenActive) {
            return renderPhoneScreen();
        }

        if (currentStep >= steps.length) {
            return renderSuccessScreen();
        }

        // Step components will need to be updated to use translation
        switch (currentStep) {
            case 0: return <StepPersonal 
                data={formData.personalDetails} 
                setData={(d) => updateSectionData("personalDetails", d)} 
                errors={errors.personalDetails} 
                onNext={handleNext} 
                submitting={submitting} 
            />;
            case 1: return <StepAddress 
                data={formData.addressDetails} 
                setData={(d) => updateSectionData("addressDetails", d)} 
                errors={errors.addressDetails} 
                setErrors={(e) => setErrors((prev) => ({ ...prev, addressDetails: e }))} 
                onNext={handleNext} 
                onBack={handleBack} 
                submitting={submitting} 
            />;
            case 2: return <StepFinancial 
                data={formData.financialDetails} 
                setData={(d) => updateSectionData("financialDetails", d)} 
                errors={errors.financialDetails} 
                onNext={handleNext} 
                onBack={handleBack} 
                submitting={submitting} 
            />;
            case 3: return <StepOther 
                data={formData.otherDetails} 
                setData={(d) => updateSectionData("otherDetails", d)} 
                errors={errors.otherDetails} 
                onNext={handleNext} 
                onBack={handleBack} 
                submitting={submitting} 
            />;
            case 4: return <StepDocument 
                data={formData.documentDetails} 
                setData={(d) => updateSectionData("documentDetails", d)} 
                errors={errors.documentDetails} 
                onNext={handleNext} 
                onBack={handleBack} 
                submitting={submitting} 
            />;
            case 5: return <StepEPayment 
                data={formData.ePaymentService} 
                setData={(d) => updateSectionData("ePaymentService", d)} 
                errors={errors.ePaymentService} 
                onNext={handleNext} 
                onBack={handleBack} 
                submitting={submitting} 
            />;
            case 6: return <StepPassbook 
                data={formData.passbookMudayRequest} 
                setData={(d) => updateSectionData("passbookMudayRequest", d)} 
                errors={errors.passbookMudayRequest} 
                onNext={handleNext} 
                onBack={handleBack} 
                submitting={submitting} 
            />;
            case 7: return <StepSignature 
                data={formData.digitalSignature} 
                setData={(d) => updateSectionData("digitalSignature", d)} 
                errors={errors.digitalSignature} 
                onNext={handleNext} 
                onBack={handleBack} 
                submitting={submitting} 
            />;
            case 8: return <StepReview 
                formData={formData} 
                goTo={goTo} 
                onBack={handleBack} 
                onSubmit={handleFinalSubmit} 
                submitting={submitting} 
            />;
            default: return <div className="text-center p-8">{t('accountOpening.invalidStep', 'Invalid step')}</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full mx-auto">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    {/* Enhanced Header with Language Switcher */}
                    <header className="bg-fuchsia-700 text-white rounded-t-lg">
                        <div className="px-6 py-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <Plane className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold">
                                            {localStorage.getItem('accountOpeningPhone') 
                                                ? t('accountOpening.resumeHeader', 'Resume Application') 
                                                : t('accountOpening.header', 'Account Opening')}
                                        </h1>
                                        <div className="flex items-center gap-2 text-fuchsia-100 text-xs mt-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>{branch?.name || t('accountOpening.selectedBranch', 'Selected Branch')}</span>
                                            <span>•</span>
                                            <Calendar className="h-3 w-3" />
                                            <span>{new Date().toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    {!phoneNumberScreenActive && (
                                        <div className="bg-fuchsia-800/50 px-3 py-1 rounded-full text-xs">
                                            📱 {localStorage.getItem('accountOpeningPhoneDisplay') || phoneNumberInput || t('accountOpening.phoneRequired', 'Phone Required')}
                                        </div>
                                    )}
                                    {/* Language Switcher */}
                                    <div className="bg-white/20 rounded-lg p-1">
                                        <LanguageSwitcher />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {!phoneNumberScreenActive && currentStep < steps.length && (
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                    {t('accountOpening.stepIndicator', 'Step {{current}} of {{total}}', {
                                        current: currentStep + 1,
                                        total: steps.length
                                    })}
                                </span>
                                <span className="text-sm text-fuchsia-700 font-semibold">
                                    {t(`accountOpening.steps.${steps[currentStep]}`, steps[currentStep])}
                                </span>
                            </div>
                            <ProgressBar currentStep={currentStep} totalSteps={steps.length} stepTitles={steps.map(step => t(`accountOpening.steps.${step}`, step))} />
                        </div>
                    )}

                    <div className="p-6">
                        {successMessage && (
                            <div className="mb-6">
                                <SuccessMessage message={successMessage} />
                            </div>
                        )}

                        {errors.apiError && (
                            <div className="mb-6">
                                <ErrorMessage message={errors.apiError} />
                            </div>
                        )}

                        <form onSubmit={(e) => e.preventDefault()}>
                            {renderStep()}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AccountOpeningForm;