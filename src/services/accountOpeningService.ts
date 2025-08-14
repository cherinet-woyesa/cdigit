import axios from "axios";
import type {
    PersonalDetail,
    AddressDetail,
    FinancialDetail,
    OtherDetail,
    DocumentDetail,
    EPaymentService,
    PassbookMudayRequest,
    DigitalSignature,
    IdResponse,
    FormSummary,
} from "../types/formTypes";

// Base URL for your backend API
const API_URL = "http://localhost:5268/api/AccountOpening"; // Adjust port if needed

const api = axios.create({
    baseURL: API_URL,
});

/**
 * Retrieves a saved form summary by mobile phone number.
 * Returns FormSummary if found, null if not found (404), or throws other errors.
 * @param phoneNumber The mobile phone number to search for.
 * @returns A promise that resolves to the FormSummary or null.
 */
export const getSavedForm = async (phoneNumber: string): Promise<FormSummary | null> => {
    try {
        const response = await api.get<FormSummary>(`/status?phoneNumber=${phoneNumber}`);
        return response.data;
    } catch (error) {
        // If it's an Axios error and the status is 404, it means no form was found.
        // Return null to indicate this specific scenario.
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            console.log("No saved form found for this phone number.");
            return null;
        }
        // Re-throw any other errors (network issues, 500 errors, etc.)
        throw error;
    }
};

/**
 * Saves the personal details step.
 * Now accepts the phone number to send as a query parameter.
 * @param data The personal details form data.
 * @param phoneNumber The mobile phone number associated with the form.
 * @returns A promise that resolves to the saved details with the generated ID.
 */
export const savePersonalDetails = async (data: PersonalDetail, phoneNumber: string): Promise<IdResponse> => {
    // Pass the phone number as a query parameter
    const response = await api.post<IdResponse>(`/personal-details?phoneNumber=${phoneNumber}`, data);
    return response.data;
};

/**
 * Saves the address details step.
 * @param data The address details form data.
 * @returns A promise that resolves to the saved details with the generated ID.
 */
export const saveAddressDetails = async (data: any): Promise<IdResponse> => {
    // Assuming the backend expects a 'CustomerId' field directly in the payload
    const payload = {
        ...data,
        CustomerId: data.customerId // Ensure CustomerId is passed directly if that's what backend expects
    };
    console.log("ID DATA OF CUSTOMER:", data.customerId);
    const response = await api.post<IdResponse>(`/address-details`, payload);
    return response.data;
};

/**
 * Saves the financial details step.
 * @param data The financial details form data.
 * @returns A promise that resolves to the saved details with the generated ID.
 */
export const saveFinancialDetails = async (data: FinancialDetail): Promise<IdResponse> => {
    const response = await api.post<IdResponse>(`/financial-details`, data);
    return response.data;
};

/**
 * Saves the other details step.
 * @param data The other details form data.
 * @returns A promise that resolves to the saved details with the generated ID.
 */
export const saveOtherDetails = async (data: OtherDetail): Promise<IdResponse> => {
    const response = await api.post<IdResponse>(`/other-details`, data);
    return response.data;
};

/**
 * Uploads a document photo and returns the URL.
 * @param file The file to upload.
 * @returns A promise that resolves to the URL of the uploaded file.
 */
export const uploadDocumentPhoto = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ url: string }>(`/upload-document-photo`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data.url;
};

/**
 * Saves the document details step.
 * @param data The document details form data.
 * @returns A promise that resolves to the saved details with the generated ID.
 */
export const saveDocumentDetails = async (data: DocumentDetail): Promise<IdResponse> => {
    const response = await api.post<IdResponse>(`/document-details`, data);
    return response.data;
};

/**
 * Saves the e-payment service request step.
 * @param data The e-payment services form data.
 * @returns A promise that resolves to the saved details with the generated ID.
 */
export const saveEPaymentService = async (data: EPaymentService): Promise<IdResponse> => {
    const response = await api.post<IdResponse>(`/e-payment-service`, data);
    return response.data;
};

/**
 * Saves the passbook and muday request step.
 * @param data The passbook and muday box request form data.
 * @returns A promise that resolves to the saved details with the generated ID.
 */
export const savePassbookMudayRequest = async (data: PassbookMudayRequest): Promise<IdResponse> => {
    const response = await api.post<IdResponse>(`/passbook-muday-request`, data);
    return response.data;
};

/**
 * Uploads the digital signature and returns the URL.
 * @param file The signature file to upload.
 * @returns A promise that resolves to the URL of the uploaded signature.
 */
export const uploadDigitalSignature = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ url: string }>(`/upload-digital-signature`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data.url;
};

/**
 * Saves the digital signature and declaration step.
 * @param data The digital signature and declaration form data.
 * @returns A promise that resolves to the saved details with the generated ID.
 */
export const saveDigitalSignature = async (data: DigitalSignature): Promise<IdResponse> => {
    const response = await api.post<IdResponse>(`/digital-signature`, data);
    return response.data;
};
