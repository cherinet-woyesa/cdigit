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
        const response = await api.get<FormSummary>(`/form-summary/${encodeURIComponent(phoneNumber)}`);
        // Backend may wrap in { success, message, data }
        const payload: any = response.data as any;
        return (payload && 'data' in payload) ? payload.data as FormSummary : (response.data as any);
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
    const response = await api.post<IdResponse>(`/personal-details/${encodeURIComponent(phoneNumber)}`, data);
    const payload: any = response.data as any;
    return (payload && 'data' in payload) ? payload.data as IdResponse : (response.data as any);
};

/**
 * Saves the address details step.
 * @param data The address details form data.
 * @returns A promise that resolves to the saved details with the generated ID.
 */
export const saveAddressDetails = async (data: any): Promise<IdResponse> => {
    // Ensure the correct CustomerId is sent. Prefer already-pascal-cased CustomerId if present,
    // otherwise fall back to camelCase customerId.
    const payload = {
        ...data,
        CustomerId: data?.CustomerId ?? data?.customerId,
    };
    console.log("Address payload CustomerId:", payload.CustomerId);
    const response = await api.post<IdResponse>(`/address-details`, payload);
    const body: any = response.data as any;
    return (body && 'data' in body) ? body.data as IdResponse : (response.data as any);
};

/**
 * Saves the financial details step.
 * @param data The financial details form data.
 * @returns A promise that resolves to the saved details with the generated ID.
 */
export const saveFinancialDetails = async (data: FinancialDetail): Promise<IdResponse> => {
    const response = await api.post<IdResponse>(`/financial-details`, data);
    const body: any = response.data as any;
    return (body && 'data' in body) ? body.data as IdResponse : (response.data as any);
};

/**
 * Saves the other details step.
 * @param data The other details form data.
 * @returns A promise that resolves to the saved details with the generated ID.
 */
export const saveOtherDetails = async (data: OtherDetail): Promise<IdResponse> => {
    const response = await api.post<IdResponse>(`/other-details`, data);
    const body: any = response.data as any;
    return (body && 'data' in body) ? body.data as IdResponse : (response.data as any);
};

/**
 * Uploads a document photo and returns the URL.
 * @param file The file to upload.
 * @returns A promise that resolves to the URL of the uploaded file.
 */
export const uploadDocumentPhoto = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<any>(`/upload-file`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    const body: any = response.data as any;
    return body?.data?.url || body?.url || body?.data || '';
};

/**
 * Saves the document details step.
 * @param data The document details form data.
 * @returns A promise that resolves to the saved details with the generated ID.
 */
export const saveDocumentDetails = async (data: DocumentDetail): Promise<IdResponse> => {
    const response = await api.post<IdResponse>(`/document-details`, data);
    const body: any = response.data as any;
    return (body && 'data' in body) ? body.data as IdResponse : (response.data as any);
};

/**
 * Saves the e-payment service request step.
 * @param data The e-payment services form data.
 * @returns A promise that resolves to the saved details with the generated ID.
 */
export const saveEPaymentService = async (data: any): Promise<IdResponse> => {
    const payload = {
        ...data,
        CustomerId: data?.CustomerId ?? data?.customerId,
    };
    const response = await api.post<IdResponse>(`/epayment-service`, payload);
    const body: any = response.data as any;
    return (body && 'data' in body) ? body.data as IdResponse : (response.data as any);
};

/**
 * Saves the passbook and muday request step.
 * @param data The passbook and muday box request form data.
 * @returns A promise that resolves to the saved details with the generated ID.
 */
export const savePassbookMudayRequest = async (data: any): Promise<IdResponse> => {
    const payload = {
        ...data,
        CustomerId: data?.CustomerId ?? data?.customerId,
    };
    const response = await api.post<IdResponse>(`/passbook-muday`, payload);
    const body: any = response.data as any;
    return (body && 'data' in body) ? body.data as IdResponse : (response.data as any);
};

/**
 * Uploads the digital signature and returns the URL.
 * @param file The signature file to upload.
 * @returns A promise that resolves to the URL of the uploaded signature.
 */
export const uploadDigitalSignature = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<any>(`/upload-file`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    const body: any = response.data as any;
    return body?.data?.url || body?.url || body?.data || '';
};

/**
 * Saves the digital signature and declaration step.
 * @param data The digital signature and declaration form data.
 * @returns A promise that resolves to the saved details with the generated ID.
 */
export const saveDigitalSignature = async (data: any): Promise<IdResponse> => {
    const payload = {
        ...data,
        CustomerId: data?.CustomerId ?? data?.customerId,
    };
    const response = await api.post<IdResponse>(`/digital-signature`, payload);
    const body: any = response.data as any;
    return (body && 'data' in body) ? body.data as IdResponse : (response.data as any);
};

/**
 * Submits the entire application after all steps are completed.
 * @param customerId The ID of the customer application to submit.
 * @returns A promise that resolves on successful submission.
 */
export const submitApplication = async (customerId: number): Promise<void> => {
    await api.post(`/submit/${customerId}`);
};
