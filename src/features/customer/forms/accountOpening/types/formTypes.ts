// Base form data types
export interface PersonalDetails {
    id?: number;
    // Add personal details fields here
    firstName: string;
    lastName: string;
    // Add other personal details fields as needed
}

export interface AddressDetails {
    id?: number;
    mobilePhone: string;
    // Add other address details fields as needed
}

export interface FinancialDetails {
    id?: number;
    // Add financial details fields here
}

export interface OtherDetails {
    id?: number;
    // Add other details fields here
}

export interface DocumentDetails {
    id?: number;
    mobilePhoneNo: string;
    photoIdFile?: File | null;
    docPhotoUrl?: string;
    // Add other document details fields here
}

export interface EPaymentService {
    id?: number;
    // Add e-payment service fields here
}

export interface PassbookMudayRequest {
    id?: number;
    // Add passbook muday request fields here
}

export interface DigitalSignature {
    id?: number;
    signatureFile?: File | null;
    signatureUrl?: string;
    // Add digital signature fields here
}

// Main form data type
export interface FormData {
    customerId?: number;
    personalDetails: PersonalDetails;
    addressDetails: AddressDetails;
    financialDetails: FinancialDetails;
    otherDetails: OtherDetails;
    documentDetails: DocumentDetails;
    ePaymentService: EPaymentService;
    passbookMudayRequest: PassbookMudayRequest;
    digitalSignature: DigitalSignature;
}

// Error types
export interface Errors {
    [key: string]: string;
}

export interface FormErrors {
    personalDetails?: Errors;
    addressDetails?: Errors;
    financialDetails?: Errors;
    otherDetails?: Errors;
    documentDetails?: Errors;
    ePaymentService?: Errors;
    passbookMudayRequest?: Errors;
    digitalSignature?: Errors;
    apiError?: string;
}

export interface FormSummary {
    customerId?: number;
    personalDetails?: PersonalDetails;
    addressDetails?: AddressDetails;
    financialDetails?: FinancialDetails;
    otherDetails?: OtherDetails;
    documentDetails?: DocumentDetails;
    ePaymentService?: EPaymentService;
    passbookMudayRequest?: PassbookMudayRequest;
    digitalSignature?: DigitalSignature;
}

// Initial form data
export const INITIAL_DATA: FormData = {
    customerId: undefined,
    personalDetails: {
        firstName: '',
        lastName: '',
        // Initialize other personal details fields with default values
    },
    addressDetails: {
        mobilePhone: '',
        // Initialize other address details with default values
    },
    financialDetails: {
        // Initialize financial details with default values
    },
    otherDetails: {
        // Initialize other details with default values
    },
    documentDetails: {
        mobilePhoneNo: '',
        photoIdFile: null,
        docPhotoUrl: '',
        // Initialize other document details with default values
    },
    ePaymentService: {
        // Initialize e-payment service with default values
    },
    passbookMudayRequest: {
        // Initialize passbook muday request with default values
    },
    digitalSignature: {
        signatureFile: null,
        signatureUrl: '',
        // Initialize digital signature with default values
    },
};