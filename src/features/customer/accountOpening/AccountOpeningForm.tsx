import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as accountOpeningService from "../../../services/accountOpeningService";
import { ProgressBar, Field } from "./FormElements";
import type {
    Errors,
    FormData,
    FormErrors,
    FormSummary,
} from "./formTypes";
import { INITIAL_DATA } from "./formTypes";
import { StepPersonal } from "./StepPersonal";
import { StepAddress } from "./StepAddress";
import { StepFinancial } from "./StepFinancial";
import { StepOther } from "./StepOther";
import { StepDocument } from "./StepDocument";
import { StepEPayment } from "./StepEPayment";
import { StepPassbook } from "./StepPassbook";
import { StepSignature } from "./StepSignature";

const steps = [
    "Personal",
    "Address",
    "Financial",
    "Other",
    "Document",
    "E-Payment",
    "Passbook",
    "Signature",
];

export function AccountOpeningForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
    const [currentStep, setCurrentStep] = useState(0);
    const [errors, setErrors] = useState<FormErrors>({
        personalDetails: {},
        addressDetails: {},
        financialDetails: {},
        otherDetails: {},
        documentDetails: {},
        ePaymentService: {},
        passbookMudayRequest: {},
        digitalSignature: {},
        apiError: undefined,
    });
    const [submitting, setSubmitting] = useState(false);
    const [phoneNumberScreenActive, setPhoneNumberScreenActive] = useState(true);
    const [phoneNumberInput, setPhoneNumberInput] = useState("");
    const [phoneCheckLoading, setPhoneCheckLoading] = useState(false);
    const [phoneInputError, setPhoneInputError] = useState<string | undefined>(undefined);

    const stepKeys = [
        "personalDetails",
        "addressDetails",
        "financialDetails",
        "otherDetails",
        "documentDetails",
        "ePaymentService",
        "passbookMudayRequest",
        "digitalSignature",
    ];

    const updateSectionData = <K extends keyof FormData>(section: K, data: Partial<FormData[K]>) => {
        setFormData((prev) => {
            const prevSectionData = prev[section];
            if (typeof prevSectionData === 'object' && prevSectionData !== null && !Array.isArray(prevSectionData)) {
                return {
                    ...prev,
                    [section]: { ...prevSectionData, ...data },
                };
            } else {
                return {
                    ...prev,
                    [section]: data,
                };
            }
        });
    };

    const validateStep = (data: any, stepIndex: number): Errors<any> => {
        let newErrors: Errors<any> = {};
        if (stepIndex === 0) { // Personal Details
            if (!data.accountType) newErrors.accountType = "Account Type is required";
            if (!data.title) newErrors.title = "Title is required";
            if (!data.firstName) newErrors.firstName = "First Name is required";
            if (!data.grandfatherName) newErrors.grandfatherName = "Grandfather's Name is required";
            if (!data.sex) newErrors.sex = "Sex is required";
            if (!data.dateOfBirth) {
                newErrors.dateOfBirth = "Date of Birth is required";
            } else {
                // Check if user is at least 18 years old
                const dob = new Date(data.dateOfBirth);
                const today = new Date();
                const age = today.getFullYear() - dob.getFullYear();
                const m = today.getMonth() - dob.getMonth();
                const d = today.getDate() - dob.getDate();
                let is18 = age > 18 || (age === 18 && (m > 0 || (m === 0 && d >= 0)));
                if (!is18) {
                    newErrors.dateOfBirth = "You must be at least 18 years old to open an account.";
                }
            }
            if (!data.maritalStatus) newErrors.maritalStatus = "Marital Status is required";
            if (!data.nationality) newErrors.nationality = "Nationality is required";
        } else if (stepIndex === 1) { // Address Details
            if (!data.regionCityAdministration) newErrors.regionCityAdministration = "Region / City is required"; 
            if (!data.mobilePhone) newErrors.mobilePhone = "Mobile Phone is required"; 
            // Do not require officePhone, only validate if present (handled in StepAddress)
        } else if (stepIndex === 2) { // Financial Details
            if (!data.typeOfWork) newErrors.typeOfWork = "Type of Work is required";
            if (data.typeOfWork === "Private") {
                if (!data.businessSector) newErrors.businessSector = "Business Sector is required";
                if (!data.incomeDetails_Private) newErrors.incomeDetails_Private = "Income Details are required";
                // Require at least one income frequency
                if (!data.incomeFrequencyAnnual_Private && !data.incomeFrequencyMonthly_Private && !data.incomeFrequencyDaily_Private) {
                    newErrors.incomeFrequencyAnnual_Private = "Select an income frequency";
                }
            } else if (data.typeOfWork === "Employee") {
                if (!data.sectorOfEmployer) newErrors.sectorOfEmployer = "Sector of Employer is required";
                if (!data.jobPosition) newErrors.jobPosition = "Job Position is required";
                if (!data.incomeDetails_Employee) newErrors.incomeDetails_Employee = "Income Details are required";
                // Require at least one income frequency
                if (!data.incomeFrequencyAnnual_Employee && !data.incomeFrequencyMonthly_Employee && !data.incomeFrequencyDaily_Employee) {
                    newErrors.incomeFrequencyAnnual_Employee = "Select an income frequency";
                }
            }
        } else if (stepIndex === 3) { // Other Details
            if (data.hasBeenConvicted && !data.convictionReason) newErrors.convictionReason = "Reason for conviction is required";
            if (data.isPoliticallyExposed && !data.pepPosition) newErrors.pepPosition = "PEP Position is required";
            if (!data.sourceOfFund) newErrors.sourceOfFund = "Source of Fund is required";
            if (data.sourceOfFund === "Other" && !data.otherSourceOfFund) newErrors.otherSourceOfFund = "Please specify other source of fund";
        } else if (stepIndex === 4) { // Document Details
            if (!data.idType) newErrors.idType = "ID Type is required";
            if (!data.idPassportNo) newErrors.idPassportNo = "ID / Passport No. is required";
            if (!data.issuedBy) newErrors.issuedBy = "Issued By is required";
            if (!data.issueDate) newErrors.issueDate = "Issue Date is required";
            if (!data.expiryDate) newErrors.expiryDate = "Expiry Date is required";
            if (!data.mobilePhoneNo) newErrors.mobilePhoneNo = "Mobile Phone is required";
            if (!data.photoIdFile && !data.docPhotoUrl) newErrors.docPhotoUrl = "Document photo is required";
        } else if (stepIndex === 5) { // E-Payment Service
            // No required fields, but you can add if needed
        } else if (stepIndex === 6) { // Passbook & Muday Request
            if (data.needsMudayBox && !data.mudayBoxDeliveryBranch) {
                newErrors.mudayBoxDeliveryBranch = "Muday Box Delivery Branch is required";
            }
        } else if (stepIndex === 7) { // Digital Signature
            if (!data.signatureFile && !data.signatureUrl) newErrors.signatureUrl = "Digital signature is required";
            if (!data.termsAccepted) newErrors.termsAccepted = "You must accept the terms and conditions";
        }
        // Check for any required fields that are empty (generic check)
        Object.keys(data).forEach((key) => {
            // Do not require officePhone or houseNumber
            if (key === "officePhone" || key === "houseNumber") return;
            if ((data[key] === undefined || data[key] === null || data[key] === "") && !newErrors[key]) {
                // Only add error if not already set for this field
                newErrors[key] = "This field is required";
            }
        });
        return newErrors;
    };

    function isValidPhoneNumber(phone: string) {
        // Ethiopian mobile: starts with 09 or +2519, 10 digits
        return /^09\d{8}$|^\+2519\d{8}$/.test(phone);
    }

    const handleNext = async () => {
        const stepDataKey = stepKeys[currentStep];
        const currentStepData = formData[stepDataKey as keyof FormData];

        if (!currentStepData) {
            console.error(`Data for step ${currentStep} (${stepDataKey}) is undefined.`);
            return;
        }

        const currentStepErrors = validateStep(currentStepData, currentStep);
        setErrors((prevErrors) => ({
            ...prevErrors,
            [stepDataKey]: currentStepErrors,
        }));

        if (Object.keys(currentStepErrors).length > 0) {
            // Prevent going to next step if any required field is missing
            return;
        }

        setSubmitting(true);

        try {
            let response: any;
            let updatedCustomerData: Partial<FormData> = {};

            // Type guard: Ensure customerId is present for all steps after 0
            if (currentStep > 0 && !formData.customerId) {
                throw new Error("Customer ID is missing. Please complete the Personal Details step first.");
            }

            // Helper to map camelCase to PascalCase for backend
            const toPascal = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
            const mapKeys = (obj: any): any => {
                if (!obj || typeof obj !== 'object') return obj;
                if (Array.isArray(obj)) return obj.map(mapKeys);
                const mapped: any = {};
                for (const key in obj) {
                    if (obj[key] !== undefined) {
                        mapped[toPascal(key)] = obj[key];
                    }
                }
                return mapped;
            };

            switch (currentStep) {
                case 0: // Personal Details
                    response = await accountOpeningService.savePersonalDetails(mapKeys(formData.personalDetails), phoneNumberInput);
                    updatedCustomerData = { 
                        customerId: response.id,
                        personalDetails: { ...formData.personalDetails, id: response.id }
                    };
                    break;
                case 1: // Address Details
                    response = await accountOpeningService.saveAddressDetails({
                        ...mapKeys(formData.addressDetails),
                        CustomerId: formData.customerId,
                        MobilePhone: formData.addressDetails.mobilePhone
                    });
                    updatedCustomerData = { addressDetails: { ...formData.addressDetails, id: response.id } };
                    break;
                case 2: // Financial Details
                    response = await accountOpeningService.saveFinancialDetails({
                        ...mapKeys(formData.financialDetails),
                        CustomerId: formData.customerId
                    });
                    updatedCustomerData = { financialDetails: { ...formData.financialDetails, id: response.id } };
                    break;
                case 3: // Other Details
                    response = await accountOpeningService.saveOtherDetails({
                        ...mapKeys(formData.otherDetails),
                        CustomerId: formData.customerId
                    });
                    updatedCustomerData = { otherDetails: { ...formData.otherDetails, id: response.id } };
                    break;
                case 4: // Document Details
                    let docPhotoUrl = formData.documentDetails.docPhotoUrl;
                    if (formData.documentDetails.photoIdFile) {
                        docPhotoUrl = await accountOpeningService.uploadDocumentPhoto(formData.documentDetails.photoIdFile);
                    }
                    response = await accountOpeningService.saveDocumentDetails({
                        ...mapKeys(formData.documentDetails),
                        CustomerId: formData.customerId,
                        DocPhotoUrl: docPhotoUrl
                    });
                    updatedCustomerData = { documentDetails: { ...formData.documentDetails, id: response.id, docPhotoUrl: docPhotoUrl } };
                    break;
                case 5: // E-Payment Service
                    response = await accountOpeningService.saveEPaymentService(mapKeys(formData.ePaymentService));
                    updatedCustomerData = { ePaymentService: { ...formData.ePaymentService, id: response.id } };
                    break;
                case 6: // Passbook & Muday Request
                    response = await accountOpeningService.savePassbookMudayRequest(mapKeys(formData.passbookMudayRequest));
                    updatedCustomerData = { passbookMudayRequest: { ...formData.passbookMudayRequest, id: response.id } };
                    break;
                case 7: // Digital Signature
                    let signatureUrl = formData.digitalSignature.signatureUrl;
                    if (formData.digitalSignature.signatureFile) {
                        signatureUrl = await accountOpeningService.uploadDigitalSignature(formData.digitalSignature.signatureFile);
                    }
                    response = await accountOpeningService.saveDigitalSignature({
                        ...mapKeys(formData.digitalSignature),
                        SignatureUrl: signatureUrl
                    });
                    updatedCustomerData = { digitalSignature: { ...formData.digitalSignature, id: response.id, signatureUrl: signatureUrl } };
                    break;
                default:
                    break;
            }

            setFormData(prev => ({
                ...prev,
                ...updatedCustomerData
            }));
            setCurrentStep(prev => prev + 1);
        } catch (error) {
            console.error("Error saving form data:", error);
            setErrors((prevErrors) => ({
                ...prevErrors,
                apiError: "Failed to save data. Please try again.",
            }));
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handlePhoneNumberSubmit = async () => {
        if (!phoneNumberInput.trim()) {
            setPhoneInputError("Mobile phone number is required.");
            return;
        }
        if (!isValidPhoneNumber(phoneNumberInput.trim())) {
            setPhoneInputError("Please enter a valid Ethiopian mobile phone number.");
            return;
        }
        setPhoneInputError(undefined);
        setPhoneCheckLoading(true);

        try {
            const savedFormData: FormSummary | null = await accountOpeningService.getSavedForm(phoneNumberInput);

            if (savedFormData) {
                // Form found, populate data and move to the last filled step
                const transformedData: FormData = {
                    customerId: savedFormData.customerId,
                    personalDetails: savedFormData.personalDetails || INITIAL_DATA.personalDetails,
                    addressDetails: {
                        ...INITIAL_DATA.addressDetails,
                        ...savedFormData.addressDetails,
                        mobilePhone: savedFormData.addressDetails?.mobilePhone || phoneNumberInput
                    },
                    financialDetails: savedFormData.financialDetails || INITIAL_DATA.financialDetails,
                    otherDetails: savedFormData.otherDetails || INITIAL_DATA.otherDetails,
                    documentDetails: {
                        ...INITIAL_DATA.documentDetails,
                        ...savedFormData.documentDetails,
                        mobilePhoneNo: savedFormData.documentDetails?.mobilePhoneNo || phoneNumberInput
                    },
                    ePaymentService: savedFormData.ePaymentService || INITIAL_DATA.ePaymentService,
                    passbookMudayRequest: savedFormData.passbookMudayRequest || INITIAL_DATA.passbookMudayRequest,
                    digitalSignature: savedFormData.digitalSignature || INITIAL_DATA.digitalSignature,
                };
                setFormData(transformedData);

                let lastFilledStep = 0;
                if (savedFormData.personalDetails?.id) lastFilledStep = Math.max(lastFilledStep, 0);
                if (savedFormData.addressDetails?.id) lastFilledStep = Math.max(lastFilledStep, 1);
                if (savedFormData.financialDetails?.id) lastFilledStep = Math.max(lastFilledStep, 2);
                if (savedFormData.otherDetails?.id) lastFilledStep = Math.max(lastFilledStep, 3);
                if (savedFormData.documentDetails?.id) lastFilledStep = Math.max(lastFilledStep, 4);
                if (savedFormData.ePaymentService?.id) lastFilledStep = Math.max(lastFilledStep, 5);
                if (savedFormData.passbookMudayRequest?.id) lastFilledStep = Math.max(lastFilledStep, 6);
                if (savedFormData.digitalSignature?.id) lastFilledStep = Math.max(lastFilledStep, 7);

                setCurrentStep(lastFilledStep);
            } else {
                // No form found, start a new form and autofill phone
                setFormData({
                    ...INITIAL_DATA,
                    addressDetails: {
                        ...INITIAL_DATA.addressDetails,
                        mobilePhone: phoneNumberInput
                    },
                    documentDetails: {
                        ...INITIAL_DATA.documentDetails,
                        mobilePhoneNo: phoneNumberInput
                    }
                });
                setCurrentStep(0);
            }
            setPhoneNumberScreenActive(false);
        } catch (error: any) {
            console.error("Error checking phone number:", error);
            if (error.response && error.response.data && error.response.data.errors) {
                setPhoneInputError(error.response.data.errors.phoneNumber || "Validation error.");
            } else if (error.response && error.response.data) {
                setPhoneInputError(error.response.data);
            } else {
                setPhoneInputError("An unexpected error occurred. Please check your internet connection and try again.");
            }
        } finally {
            setPhoneCheckLoading(false);
        }
    };

    const handleUpdateApplication = () => { // Renamed from handleStartNewApplication
        // Keep existing formData, just navigate back to the first step of the form
        setCurrentStep(0);
        setPhoneNumberScreenActive(false); // Ensure form steps are active
        setPhoneInputError(undefined); // Clear any errors
    };


    const renderStep = () => {
        console.log("Current Step Index:", currentStep);
        console.log("Current formData.customerId:", formData.customerId);

        if (phoneNumberScreenActive) {
            const isValid = isValidPhoneNumber(phoneNumberInput.trim());
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <h2 className="text-2xl font-bold mb-4 text-fuchsia-800">Welcome!</h2>
                    <p className="mb-6 text-gray-700 text-center">
                        Enter your <b>mobile phone number</b> to begin.
                    </p>
                    <Field label="Mobile Phone Number" error={phoneInputError}>
                        <div className="relative w-full">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fuchsia-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0-1.243 1.007-2.25 2.25-2.25h2.386c.51 0 .994.192 1.366.54l1.32 1.22a2.25 2.25 0 0 1 .728 1.66v2.09c0 .621-.504 1.125-1.125 1.125H6.75A2.25 2.25 0 0 1 4.5 9.75V6.75zM21.75 17.25c0 1.243-1.007 2.25-2.25 2.25h-2.386a2.25 2.25 0 0 1-1.366-.54l-1.32-1.22a2.25 2.25 0 0 1-.728-1.66v-2.09c0-.621.504-1.125 1.125-1.125h2.25a2.25 2.25 0 0 1 2.25 2.25v3z" />
                                </svg>
                            </span>
                            <input
                                type="tel"
                                name="phoneNumberInput"
                                className={`form-input w-full p-3 pl-12 rounded border text-center text-lg transition focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 ${phoneNumberInput ? (isValid ? 'border-green-500' : 'border-red-500') : ''}`}
                                value={phoneNumberInput}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumberInput(e.target.value)}
                                placeholder="09XXXXXXXX or +2519XXXXXXXX"
                                autoFocus
                                inputMode="tel"
                                pattern="^09\d{8}$|^\+2519\d{8}$"
                                aria-invalid={!!phoneInputError || (!!phoneNumberInput && !isValid) ? "true" : undefined}
                                aria-describedby="phone-error-text"
                                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === 'Enter') {
                                        handlePhoneNumberSubmit();
                                    }
                                }}
                            />
                            {phoneNumberInput && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {isValid ? (
                                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    )}
                                </span>
                            )}
                        </div>
                        <div id="phone-helper-text" className="text-xs text-gray-500 mt-1 text-center">
                            <span className="sr-only">Format: 09XXXXXXXX or +2519XXXXXXXX (Ethiopian mobile)</span>
                        </div>
                    </Field>
                    {phoneInputError && (
                        <div id="phone-error-text" className="text-sm text-red-600 text-center mt-2 font-medium" aria-live="assertive">
                            {phoneInputError}
                        </div>
                    )}
                    <div className="flex gap-4 mt-6">
                        <button
                            type="button"
                            className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg shadow-md hover:bg-fuchsia-800 transition disabled:opacity-50 text-lg font-semibold"
                            onClick={handlePhoneNumberSubmit}
                            disabled={phoneCheckLoading || !isValid}
                        >
                            {phoneCheckLoading ? "Checking..." : "Continue"}
                        </button>
                    </div>
                </div>
            );
        }

        switch (currentStep) {
            case 0:
                return (
                    <StepPersonal
                        data={formData.personalDetails}
                        setData={(d) => updateSectionData("personalDetails", d)}
                        errors={errors.personalDetails}
                        onNext={handleNext}
                        submitting={submitting}
                    />
                );
            case 1:
                return (
                    <StepAddress
                        data={formData.addressDetails}
                        setData={(d) => updateSectionData("addressDetails", d)}
                        errors={errors.addressDetails}
                        onNext={handleNext}
                        onBack={handleBack}
                        submitting={submitting}
                    />
                );
            case 2:
                return (
                    <StepFinancial
                        data={formData.financialDetails}
                        setData={(d) => updateSectionData("financialDetails", d)}
                        errors={errors.financialDetails}
                        onNext={handleNext}
                        onBack={handleBack}
                        submitting={submitting}
                    />
                );
            case 3:
                return (
                    <StepOther
                        data={formData.otherDetails}
                        setData={(d) => updateSectionData("otherDetails", d)}
                        errors={errors.otherDetails}
                        onNext={handleNext}
                        onBack={handleBack}
                        submitting={submitting}
                    />
                );
            case 4:
                return (
                    <StepDocument
                        data={formData.documentDetails}
                        setData={(d) => updateSectionData("documentDetails", d)}
                        errors={errors.documentDetails}
                        onNext={handleNext}
                        onBack={handleBack}
                        submitting={submitting}
                    />
                );
            case 5:
                return (
                    <StepEPayment
                        data={formData.ePaymentService}
                        setData={(d) => updateSectionData("ePaymentService", d)}
                        errors={errors.ePaymentService}
                        onNext={handleNext}
                        onBack={handleBack}
                        submitting={submitting}
                    />
                );
            case 6:
                return (
                    <StepPassbook
                        data={formData.passbookMudayRequest}
                        setData={(d) => updateSectionData("passbookMudayRequest", d)}
                        errors={errors.passbookMudayRequest}
                        onNext={handleNext}
                        onBack={handleBack}
                        submitting={submitting}
                    />
                );
            case 7:
                return (
                    <StepSignature
                        data={formData.digitalSignature}
                        setData={(d) => updateSectionData("digitalSignature", d)}
                        errors={errors.digitalSignature}
                        onNext={handleNext}
                        onBack={handleBack}
                        submitting={submitting}
                    />
                );
            default:
                // This is the success screen
                return (
                    <div className="text-center p-8">
                        <svg
                            className="mx-auto h-24 w-24 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                        </svg>
                        <h2 className="text-3xl font-extrabold text-fuchsia-800 mt-4 mb-2">
                            Application Submitted Successfully!
                        </h2>
                        <p className="text-lg text-gray-700 mb-6">
                            Thank you for completing your account opening application.
                            We've received your details and will process them shortly.
                            Your application reference ID is: <span className="font-semibold text-fuchsia-700">{formData.personalDetails.id}</span>
                        </p>

                        <div className="text-left bg-gray-50 p-6 rounded-lg shadow-inner max-h-96 overflow-y-auto mb-6">
                            <h3 className="text-xl font-bold text-fuchsia-700 mb-4">Summary of Your Application:</h3>
                            {Object.entries(formData).map(([key, value]) => {
                                // Skip customerId as it's often an internal ID, and File objects
                                if (key === 'customerId' || key.endsWith('File')) {
                                    return null;
                                }

                                return (
                                    <div key={key} className="mb-4 last:mb-0">
                                        <h4 className="font-semibold text-fuchsia-600 capitalize mb-1">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                                        </h4>
                                        <ul className="list-disc list-inside text-gray-700">
                                            {Object.entries(value || {}).map(([subKey, subValue]) => {
                                                // Skip internal IDs and File objects within sub-sections
                                                if (subKey === 'id' || subKey === 'customerId' || subKey.endsWith('File')) {
                                                    return null;
                                                }

                                                let displayValue = subValue;
                                                if (typeof subValue === 'boolean') {
                                                    displayValue = subValue ? 'Yes' : 'No';
                                                } else if (subValue instanceof Date) {
                                                    displayValue = subValue.toLocaleDateString();
                                                } else if (typeof subValue === 'string' && (subKey.includes('DateOfBirth') || subKey.includes('issueDate') || subKey.includes('expiryDate')) && subValue) {
                                                    try {
                                                        displayValue = new Date(subValue).toLocaleDateString();
                                                    } catch (e) {
                                                        displayValue = subValue; // Fallback if date parsing fails
                                                    }
                                                } else if (subValue === null || subValue === undefined || subValue === '') {
                                                    displayValue = 'Not provided';
                                                }

                                                // Clean up camelCase for display
                                                const cleanedSubKey = subKey.replace(/([A-Z])/g, ' $1').replace(/_([A-Z])/g, ' $1').trim();

                                                // Only display if value is not 'Not provided' or a meaningful value
                                                if (displayValue === 'Not provided' && (subValue === null || subValue === undefined || subValue === '')) {
                                                    return null;
                                                }

                                                return (
                                                    <li key={subKey}>
                                                        <span className="font-medium">{cleanedSubKey}:</span> {String(displayValue)}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                            <button
                                onClick={handleUpdateApplication} // Changed to handleUpdateApplication
                                className="bg-fuchsia-700 text-white px-8 py-3 rounded-lg shadow-md hover:bg-fuchsia-800 transition transform hover:scale-105"
                            >
                                Update Application
                            </button>
                            <button
                                onClick={() => navigate("/")}
                                className="bg-gray-300 text-fuchsia-700 px-8 py-3 rounded-lg shadow-md hover:bg-gray-400 transition transform hover:scale-105"
                            >
                                Go to Home
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-4">
                            For any inquiries, please contact our support team.
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            {/* Desktop: show full progress bar, Mobile: show only current step title */}
            {!phoneNumberScreenActive && currentStep < steps.length && (
                <>
                    <div className="hidden sm:block">
                        <ProgressBar currentStep={currentStep} totalSteps={steps.length} stepTitles={steps} />
                    </div>
                    <div className="block sm:hidden mb-4">
                        <div className="text-lg font-semibold text-fuchsia-700 bg-fuchsia-50 rounded px-4 py-2 border border-fuchsia-100 text-center">
                            {steps[currentStep]} Details
                        </div>
                    </div>
                </>
            )}
            <hr className="my-6" />
            <form onSubmit={(e) => e.preventDefault()}>
                {renderStep()}
            </form>
        </div>
    );
}
export default AccountOpeningForm;