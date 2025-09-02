import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as accountOpeningService from "../../../services/accountOpeningService";
import { checkAccountExistsByPhone } from "../../../services/accountsService";
import { ProgressBar, Field } from "./components/FormElements";
import type {
    Errors,
    FormData,
    FormErrors,
    FormSummary,
} from "./types/formTypes";
import { INITIAL_DATA } from "./types/formTypes";
import { StepPersonal, validate as validatePersonalDetail } from "./components/StepPersonal";
import { StepAddress, validate as validateAddressDetail } from "./components/StepAddress";
import { StepFinancial, validate as validateFinancialDetail } from "./components/StepFinancial";
import { StepOther, validate as validateOtherDetail } from "./components/StepOther";
import { StepDocument, validate as validateDocumentDetail } from "./components/StepDocument";
import { StepEPayment, validate as validateEPaymentDetail } from "./components/StepEPayment";
import { StepPassbook, validate as validatePassbookDetail } from "./components/StepPassbook";
import { StepSignature, validate as validateSignatureDetail } from "./components/StepSignature";
import { StepReview } from "./components/StepReview"; // Import the new review step
import { useMultiStepForm } from "../../../hooks/useMultiStepForm";

const steps = [
    "Personal",
    "Address",
    "Financial",
    "Other",
    "Document",
    "Payment", // Shortened from E-Payment
    "Items",   // Shortened from Passbook
    "Signature",
    "Review",
];

export function AccountOpeningForm() {
    const navigate = useNavigate();
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
        "review", // Add a key for the review step (though it has no data)
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
        setErrors((prev) => ({ ...prev, [section]: {} }));
    };

    function isValidPhoneNumber(phone: string) {
        return /^09\d{8}$|^\+2519\d{8}$/.test(phone);
    }

    const handleNext = async () => {
        // If we are on the review step, just proceed to the success screen.
        if (currentStep === 8) {
            next();
            return;
        }

        const stepDataKey = stepKeys[currentStep];
        const currentStepData = formData[stepDataKey as keyof FormData];

        if (!currentStepData) {
            console.error(`Data for step ${currentStep} (${stepDataKey}) is undefined.`);
            return;
        }

        let currentStepErrors;
        if (currentStep === 0) currentStepErrors = validatePersonalDetail(formData.personalDetails);
        else if (currentStep === 1) currentStepErrors = validateAddressDetail(formData.addressDetails);
        else if (currentStep === 2) currentStepErrors = validateFinancialDetail(formData.financialDetails);
        else if (currentStep === 3) currentStepErrors = validateOtherDetail(formData.otherDetails);
        else if (currentStep === 4) currentStepErrors = validateDocumentDetail(formData.documentDetails);
        else if (currentStep === 5) currentStepErrors = validateEPaymentDetail(formData.ePaymentService);
        else if (currentStep === 6) currentStepErrors = validatePassbookDetail(formData.passbookMudayRequest);
        else if (currentStep === 7) currentStepErrors = validateSignatureDetail(formData.digitalSignature);
        else currentStepErrors = {};

        setErrors((prevErrors) => ({ ...prevErrors, [stepDataKey]: currentStepErrors }));

        if (Object.keys(currentStepErrors).length > 0) {
            return;
        }

        setSubmitting(true);

        try {
            let response: any;
            let updatedCustomerData: Partial<FormData> = {};
            let nextCustomerId = formData.customerId;

            if (currentStep > 0 && (!formData.customerId || formData.customerId <= 0)) {
                setErrors((prev) => ({ ...prev, apiError: "Customer ID is missing. Please complete Personal Details first." }));
                setSubmitting(false);
                return;
            }

            const toPascal = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
            const mapKeys = (obj: any): any => {
                if (!obj || typeof obj !== 'object') return obj;
                if (Array.isArray(obj)) return obj.map(mapKeys);
                const mapped: any = {};
                for (const key in obj) {
                    if (obj[key] !== undefined) mapped[toPascal(key)] = obj[key];
                }
                return mapped;
            };

            switch (currentStep) {
                case 0: // Personal
                    response = await accountOpeningService.savePersonalDetails(mapKeys(formData.personalDetails), phoneNumberInput);
                    nextCustomerId = response.id;
                    updatedCustomerData = { customerId: nextCustomerId, personalDetails: { ...formData.personalDetails, id: response.id } };
                    break;
                case 1: // Address
                    response = await accountOpeningService.saveAddressDetails({ ...mapKeys(formData.addressDetails), CustomerId: nextCustomerId, MobilePhone: formData.addressDetails.mobilePhone });
                    updatedCustomerData = { addressDetails: { ...formData.addressDetails, id: response.id } };
                    break;
                case 2: // Financial
                    response = await accountOpeningService.saveFinancialDetails({ ...mapKeys(formData.financialDetails), CustomerId: nextCustomerId });
                    updatedCustomerData = { financialDetails: { ...formData.financialDetails, id: response.id } };
                    break;
                case 3: // Other
                    response = await accountOpeningService.saveOtherDetails({ ...mapKeys(formData.otherDetails), CustomerId: nextCustomerId });
                    updatedCustomerData = { otherDetails: { ...formData.otherDetails, id: response.id } };
                    break;
                case 4: // Document
                    let docPhotoUrl = formData.documentDetails.docPhotoUrl;
                    if (formData.documentDetails.photoIdFile) {
                        docPhotoUrl = await accountOpeningService.uploadDocumentPhoto(formData.documentDetails.photoIdFile);
                    }
                    response = await accountOpeningService.saveDocumentDetails({ ...mapKeys(formData.documentDetails), CustomerId: nextCustomerId, DocPhotoUrl: docPhotoUrl });
                    updatedCustomerData = { documentDetails: { ...formData.documentDetails, id: response.id, docPhotoUrl: docPhotoUrl } };
                    break;
                case 5: // E-Payment
                    response = await accountOpeningService.saveEPaymentService({ ...mapKeys(formData.ePaymentService), CustomerId: nextCustomerId });
                    updatedCustomerData = { ePaymentService: { ...formData.ePaymentService, id: response.id } };
                    break;
                case 6: // Passbook
                    response = await accountOpeningService.savePassbookMudayRequest({ ...mapKeys(formData.passbookMudayRequest), CustomerId: nextCustomerId });
                    updatedCustomerData = { passbookMudayRequest: { ...formData.passbookMudayRequest, id: response.id } };
                    break;
                case 7: // Signature
                    let signatureUrl = formData.digitalSignature.signatureUrl;
                    if (formData.digitalSignature.signatureFile) {
                        signatureUrl = await accountOpeningService.uploadDigitalSignature(formData.digitalSignature.signatureFile);
                    }
                    response = await accountOpeningService.saveDigitalSignature({ ...mapKeys(formData.digitalSignature), SignatureUrl: signatureUrl, CustomerId: nextCustomerId });
                    updatedCustomerData = { digitalSignature: { ...formData.digitalSignature, id: response.id, signatureUrl: signatureUrl } };
                    break;
            }

            setFormData(prev => ({ ...prev, ...updatedCustomerData, customerId: nextCustomerId }));
            next();
        } catch (error) {
            console.error("Error saving form data:", error);
            setErrors((prevErrors) => ({ ...prevErrors, apiError: "Failed to save data. Please try again." }));
        } finally {
            setSubmitting(false);
        }
    };

    const handleFinalSubmit = async () => {
        setSubmitting(true);
        // Here you could add a final API call to mark the application as complete
        // For now, we'll just proceed to the success screen.
        console.log("Finalizing application...");
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate final API call
        setSubmitting(false);
        next(); // Go to success screen
    };

    const handleBack = () => {
        const prevStep = currentStep - 1;
        if (prevStep >= 0) {
            setErrors((prev) => ({ ...prev, [stepKeys[prevStep]]: {} }));
        }
        back();
    };

    const handlePhoneNumberSubmit = async () => {
        if (!phoneNumberInput.trim() || !isValidPhoneNumber(phoneNumberInput.trim())) {
            setPhoneInputError("Please enter a valid Ethiopian mobile phone number.");
            return;
        }
        setPhoneInputError(undefined);
        setPhoneCheckLoading(true);
        try {
            const accountExists = await checkAccountExistsByPhone(phoneNumberInput.trim());
            if (accountExists) {
                setPhoneInputError("An account already exists for this phone number.");
                setPhoneCheckLoading(false);
                return;
            }
            const savedFormData: FormSummary | null = await accountOpeningService.getSavedForm(phoneNumberInput);
            if (savedFormData) {
                const transformedData: FormData = {
                    customerId: savedFormData.customerId,
                    personalDetails: savedFormData.personalDetails || INITIAL_DATA.personalDetails,
                    addressDetails: { ...INITIAL_DATA.addressDetails, ...savedFormData.addressDetails, mobilePhone: savedFormData.addressDetails?.mobilePhone || phoneNumberInput },
                    financialDetails: savedFormData.financialDetails || INITIAL_DATA.financialDetails,
                    otherDetails: savedFormData.otherDetails || INITIAL_DATA.otherDetails,
                    documentDetails: { ...INITIAL_DATA.documentDetails, ...savedFormData.documentDetails, mobilePhoneNo: savedFormData.documentDetails?.mobilePhoneNo || phoneNumberInput },
                    ePaymentService: savedFormData.ePaymentService || INITIAL_DATA.ePaymentService,
                    passbookMudayRequest: savedFormData.passbookMudayRequest || INITIAL_DATA.passbookMudayRequest,
                    digitalSignature: savedFormData.digitalSignature || INITIAL_DATA.digitalSignature,
                };
                setFormData(transformedData);
                let lastFilledStep = 0;
                if (savedFormData.digitalSignature?.id) lastFilledStep = 8; // Go to review if fully complete
                else if (savedFormData.passbookMudayRequest?.id) lastFilledStep = 7;
                else if (savedFormData.ePaymentService?.id) lastFilledStep = 6;
                else if (savedFormData.documentDetails?.id) lastFilledStep = 5;
                else if (savedFormData.otherDetails?.id) lastFilledStep = 4;
                else if (savedFormData.financialDetails?.id) lastFilledStep = 3;
                else if (savedFormData.addressDetails?.id) lastFilledStep = 2;
                else if (savedFormData.personalDetails?.id) lastFilledStep = 1;
                goTo(lastFilledStep);
            } else {
                setFormData({ ...INITIAL_DATA, addressDetails: { ...INITIAL_DATA.addressDetails, mobilePhone: phoneNumberInput }, documentDetails: { ...INITIAL_DATA.documentDetails, mobilePhoneNo: phoneNumberInput } });
                goTo(0);
            }
            setPhoneNumberScreenActive(false);
        } catch (error: any) {
            setPhoneInputError("An unexpected error occurred. Please try again.");
        } finally {
            setPhoneCheckLoading(false);
        }
    };

    const handleUpdateApplication = () => {
        goTo(0);
        setPhoneNumberScreenActive(false);
        setPhoneInputError(undefined);
    };

    const renderStep = () => {
        if (phoneNumberScreenActive) {
            const isValid = isValidPhoneNumber(phoneNumberInput.trim());
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <h2 className="text-2xl font-bold mb-4 text-fuchsia-800">Welcome!</h2>
                    <p className="mb-6 text-gray-700 text-center">Enter your <b>mobile phone number</b> to begin or resume an application.</p>
                    <Field label="Mobile Phone Number" error={phoneInputError}>
                        <input
                            type="tel"
                            name="phoneNumberInput"
                            className={`form-input w-full p-3 pl-4 rounded border text-center text-lg transition focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 ${phoneNumberInput ? (isValid ? 'border-green-500' : 'border-red-500') : ''}`}
                            value={phoneNumberInput}
                            onChange={(e) => setPhoneNumberInput(e.target.value)}
                            placeholder="09XXXXXXXX"
                            autoFocus
                            onKeyPress={(e) => e.key === 'Enter' && handlePhoneNumberSubmit()}
                        />
                    </Field>
                    <button
                        type="button"
                        className="bg-fuchsia-700 text-white px-6 py-3 mt-4 rounded-lg shadow-md hover:bg-fuchsia-800 transition disabled:opacity-50 text-lg font-semibold"
                        onClick={handlePhoneNumberSubmit}
                        disabled={phoneCheckLoading || !isValid}
                    >
                        {phoneCheckLoading ? "Checking..." : "Continue"}
                    </button>
                </div>
            );
        }

        switch (currentStep) {
            case 0: return <StepPersonal data={formData.personalDetails} setData={(d) => updateSectionData("personalDetails", d)} errors={errors.personalDetails} onNext={handleNext} submitting={submitting} />;
            case 1: return <StepAddress data={formData.addressDetails} setData={(d) => updateSectionData("addressDetails", d)} errors={errors.addressDetails} setErrors={(e) => setErrors((prev) => ({ ...prev, addressDetails: e }))} onNext={handleNext} onBack={handleBack} submitting={submitting} />;
            case 2: return <StepFinancial data={formData.financialDetails} setData={(d) => updateSectionData("financialDetails", d)} errors={errors.financialDetails} onNext={handleNext} onBack={handleBack} submitting={submitting} />;
            case 3: return <StepOther data={formData.otherDetails} setData={(d) => updateSectionData("otherDetails", d)} errors={errors.otherDetails} onNext={handleNext} onBack={handleBack} submitting={submitting} />;
            case 4: return <StepDocument data={formData.documentDetails} setData={(d) => updateSectionData("documentDetails", d)} errors={errors.documentDetails} onNext={handleNext} onBack={handleBack} submitting={submitting} />;
            case 5: return <StepEPayment data={formData.ePaymentService} setData={(d) => updateSectionData("ePaymentService", d)} errors={errors.ePaymentService} onNext={handleNext} onBack={handleBack} submitting={submitting} />;
            case 6: return <StepPassbook data={formData.passbookMudayRequest} setData={(d) => updateSectionData("passbookMudayRequest", d)} errors={errors.passbookMudayRequest} onNext={handleNext} onBack={handleBack} submitting={submitting} />;
            case 7: return <StepSignature data={formData.digitalSignature} setData={(d) => updateSectionData("digitalSignature", d)} errors={errors.digitalSignature} onNext={handleNext} onBack={handleBack} submitting={submitting} />;
            case 8: return <StepReview formData={formData} goTo={goTo} onBack={handleBack} onSubmit={handleFinalSubmit} submitting={submitting} />;
            default:
                return (
                    <div className="text-center p-8">
                        <svg className="mx-auto h-24 w-24 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <h2 className="text-3xl font-extrabold text-fuchsia-800 mt-4 mb-2">Application Submitted Successfully!</h2>
                        <p className="text-lg text-gray-700 mb-6">Your application reference ID is: <span className="font-semibold text-fuchsia-700">{formData.customerId}</span></p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                            <button onClick={() => navigate("/")} className="bg-gray-300 text-fuchsia-700 px-8 py-3 rounded-lg shadow-md hover:bg-gray-400 transition">Go to Home</button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            {!phoneNumberScreenActive && currentStep < steps.length && (
                <>
                    <div className="hidden sm:block">
                        <ProgressBar currentStep={currentStep} totalSteps={steps.length} stepTitles={steps} />
                    </div>
                    <div className="block sm:hidden mb-4">
                        <div className="text-lg font-semibold text-fuchsia-700 bg-fuchsia-50 rounded px-4 py-2 border border-fuchsia-100 text-center">
                            {steps[currentStep]}
                        </div>
                    </div>
                </>
            )}
            <hr className="my-6" />
            <form onSubmit={(e) => e.preventDefault()}>{renderStep()}</form>
        </div>
    );
}
export default AccountOpeningForm;