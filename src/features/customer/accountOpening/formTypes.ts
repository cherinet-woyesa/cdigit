// src/types/formTypes.ts

export interface PersonalDetail {
    id?: number; // Changed to camelCase
    accountType: string; // Changed to camelCase
    title: string; // Changed to camelCase
    firstName: string; // Changed to camelCase
    middleName?: string; // Changed to camelCase
    grandfatherName: string; // Changed to camelCase
    motherFullName?: string; // Changed to camelCase
    sex: string; // Changed to camelCase
    dateOfBirth: string; // Changed to camelCase
    placeOfBirth?: string; // Changed to camelCase
    maritalStatus: string; // Changed to camelCase
    educationQualification?: string; // Changed to camelCase
    nationality: string; // Changed to camelCase
}

export interface AddressDetail {
    id?: number; // Changed to camelCase
    customerId?: number; // Changed to camelCase
    regionCityAdministration: string; // Changed to camelCase
    zone?: string; // Changed to camelCase
    subCity?: string; // Changed to camelCase
    weredaKebele?: string; // Changed to camelCase
    houseNumber?: string; // Changed to camelCase
    mobilePhone: string; // Changed to camelCase
    officePhone?: string; // Changed to camelCase
    emailAddress?: string; // Changed to camelCase
}

export interface FinancialDetail {
    id?: number; // Changed to camelCase
    customerId?: number; // Changed to camelCase
    typeOfWork: "Private" | "Employee"; // Changed to camelCase
    businessSector?: string; // Changed to camelCase
    incomeFrequencyAnnual_Private?: boolean; // Changed to camelCase
    incomeFrequencyMonthly_Private?: boolean; // Changed to camelCase
    incomeFrequencyDaily_Private?: boolean; // Changed to camelCase
    incomeDetails_Private?: string; // Changed to camelCase
    otherIncome?: string; // Changed to camelCase
    sectorOfEmployer?: string; // Changed to camelCase
    jobPosition?: string; // Changed to camelCase
    incomeFrequencyAnnual_Employee?: boolean; // Changed to camelCase
    incomeFrequencyMonthly_Employee?: boolean; // Changed to camelCase
    incomeFrequencyDaily_Employee?: boolean; // Changed to camelCase
    incomeDetails_Employee?: string; // Changed to camelCase
}

export interface OtherDetail {
    id?: number; // Changed to camelCase
    customerId?: number; // Changed to camelCase
    hasBeenConvicted?: boolean; // Changed to camelCase
    convictionReason?: string; // Changed to camelCase
    isPoliticallyExposed?: boolean; // Changed to camelCase
    pepPosition?: string; // Changed to camelCase
    sourceOfFund: string; // Changed to camelCase
    otherSourceOfFund?: string; // Changed to camelCase
}

export interface DocumentDetail {
    id?: number; // Changed to camelCase
    customerId?: number; // Changed to camelCase
    docRegionCitySubCity?: string; // Changed to camelCase
    docWeredaKebele?: string; // Changed to camelCase
    docHouseNumber?: string; // Changed to camelCase
    docEmail?: string; // Changed to camelCase
    docOfficeTelephone?: string; // Changed to camelCase
    idType: string; // Changed to camelCase
    idPassportNo: string; // Changed to camelCase
    issuedBy: string; // Changed to camelCase
    issueDate: string; // Changed to camelCase
    expiryDate: string; // Changed to camelCase
    mobilePhoneNo: string; // Changed to camelCase
    photoIdFile?: File; // Keep as is, this is a File object, not a JSON property
    docPhotoUrl?: string; // Changed to camelCase
}

export interface EPaymentService {
    id?: number; // Changed to camelCase
    customerId?: number; // Changed to camelCase
    hasAtmCard: boolean; // Changed to camelCase
    atmCardType?: string; // Changed to camelCase
    atmCardDeliveryBranch?: string; // Changed to camelCase
    hasMobileBanking: boolean; // Changed to camelCase
    hasInternetBanking: boolean; // Changed to camelCase
    hasCbeBirr: boolean; // Changed to camelCase
    hasSmsBanking: boolean; // Changed to camelCase
}

export interface PassbookMudayRequest {
    id?: number; // Changed to camelCase
    customerId?: number; // Changed to camelCase
    needsPassbook: boolean; // Changed to camelCase
    needsMudayBox: boolean; // Changed to camelCase
    mudayBoxDeliveryBranch?: string; // Changed to camelCase
}

export interface DigitalSignature {
    id?: number; // Changed to camelCase
    customerId?: number; // Changed to camelCase
    signatureFile?: File; // Keep as is, this is a File object
    signatureUrl: string; // Changed to camelCase
    termsAccepted: boolean; // Changed to camelCase
}

// Interface for the comprehensive form summary from the backend
export interface FormSummary {
    customerId: number; // Stays camelCase as it's from backend response
    personalDetails: PersonalDetail;
    addressDetails: AddressDetail;
    financialDetails: FinancialDetail;
    otherDetails: OtherDetail;
    documentDetails: DocumentDetail;
    ePaymentService: EPaymentService;
    passbookMudayRequest: PassbookMudayRequest;
    digitalSignature: DigitalSignature;
}

// Define the full form state on the frontend
export type FormData = {
    customerId?: number; // Stays camelCase
    personalDetails: PersonalDetail;
    addressDetails: AddressDetail;
    financialDetails: FinancialDetail;
    otherDetails: OtherDetail;
    documentDetails: DocumentDetail;
    ePaymentService: EPaymentService;
    passbookMudayRequest: PassbookMudayRequest;
    digitalSignature: DigitalSignature;
};

// Generic errors type for individual step data
export type Errors<T> = {
    [K in keyof T]?: string;
};

// Define a new type for the full errors state
export type FormErrors = {
    personalDetails: Errors<PersonalDetail>;
    addressDetails: Errors<AddressDetail>;
    financialDetails: Errors<FinancialDetail>;
    otherDetails: Errors<OtherDetail>;
    documentDetails: Errors<DocumentDetail>;
    ePaymentService: Errors<EPaymentService>;
    passbookMudayRequest: Errors<PassbookMudayRequest>;
    digitalSignature: Errors<DigitalSignature>;
    apiError?: string;
};

// Initial data for the entire form (ensure all properties are initialized with camelCase)
export const INITIAL_DATA: FormData = {
    customerId: undefined,
    personalDetails: {
        accountType: "", // Changed to camelCase
        title: "", // Changed to camelCase
        firstName: "", // Changed to camelCase
        grandfatherName: "", // Changed to camelCase
        sex: "", // Changed to camelCase
        dateOfBirth: "", // Changed to camelCase
        maritalStatus: "", // Changed to camelCase
        nationality: "" // Changed to camelCase
    },
    addressDetails: {
        regionCityAdministration: "", // Changed to camelCase
        mobilePhone: "", // Changed to camelCase
        zone: "", // Changed to camelCase
        subCity: "", // Changed to camelCase
        weredaKebele: "", // Changed to camelCase
        houseNumber: "", // Changed to camelCase
        officePhone: "", // Changed to camelCase
        emailAddress: "", // Changed to camelCase
    },
    financialDetails: {
        typeOfWork: "Private", // Changed to camelCase
        businessSector: "", // Changed to camelCase
        incomeFrequencyAnnual_Private: false, // Changed to camelCase
        incomeFrequencyMonthly_Private: false, // Changed to camelCase
        incomeFrequencyDaily_Private: false, // Changed to camelCase
        incomeDetails_Private: "", // Changed to camelCase
        otherIncome: "", // Changed to camelCase
        sectorOfEmployer: "", // Changed to camelCase
        jobPosition: "", // Changed to camelCase
        incomeFrequencyAnnual_Employee: false, // Changed to camelCase
        incomeFrequencyMonthly_Employee: false, // Changed to camelCase
        incomeFrequencyDaily_Employee: false, // Changed to camelCase
        incomeDetails_Employee: "", // Changed to camelCase
    },
    otherDetails: {
        sourceOfFund: "", // Changed to camelCase
        hasBeenConvicted: false, // Changed to camelCase
        convictionReason: "", // Changed to camelCase
        isPoliticallyExposed: false, // Changed to camelCase
        pepPosition: "", // Changed to camelCase
        otherSourceOfFund: "", // Changed to camelCase
    },
    documentDetails: {
        idType: "", // Changed to camelCase
        idPassportNo: "", // Changed to camelCase
        issuedBy: "", // Changed to camelCase
        issueDate: "", // Changed to camelCase
        expiryDate: "", // Changed to camelCase
        mobilePhoneNo: "", // Changed to camelCase
        docPhotoUrl: "", // Changed to camelCase
        docRegionCitySubCity: "", // Changed to camelCase
        docWeredaKebele: "", // Changed to camelCase
        docHouseNumber: "", // Changed to camelCase
        docEmail: "", // Changed to camelCase
        docOfficeTelephone: "", // Changed to camelCase
    },
    ePaymentService: {
        hasAtmCard: false, // Changed to camelCase
        atmCardType: "", // Changed to camelCase
        atmCardDeliveryBranch: "", // Changed to camelCase
        hasMobileBanking: false, // Changed to camelCase
        hasInternetBanking: false, // Changed to camelCase
        hasCbeBirr: false, // Changed to camelCase
        hasSmsBanking: false, // Changed to camelCase
    },
    passbookMudayRequest: {
        needsPassbook: false, // Changed to camelCase
        needsMudayBox: false, // Changed to camelCase
        mudayBoxDeliveryBranch: "", // Changed to camelCase
    },
    digitalSignature: {
        termsAccepted: false, // Changed to camelCase
        signatureUrl: "", // Changed to camelCase
    },
};

export interface IdResponse {
    id: number; // Stays camelCase
}