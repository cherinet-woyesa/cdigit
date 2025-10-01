// Base form data types aligned with backend models
export interface PersonalDetail {
    id?: number;
    accountType: string;
    title: string;
    firstName: string;
    middleName?: string;
    grandfatherName: string;
    motherFullName?: string;
    sex: string;
    dateOfBirth?: string;
    placeOfBirth?: string;
    maritalStatus: string;
    educationQualification?: string;
    nationality: string;
}

export interface AddressDetail {
    id?: number;
    regionCityAdministration?: string;
    zone?: string;
    subCity?: string;
    weredaKebele?: string;
    houseNumber?: string;
    mobilePhone: string;
    officePhone?: string;
    emailAddress?: string;
}

export interface FinancialDetail {
    id?: number;
    typeOfWork: string;
    businessSector?: string;
    incomeFrequencyAnnual_Private?: boolean;
    incomeFrequencyMonthly_Private?: boolean;
    incomeFrequencyDaily_Private?: boolean;
    incomeDetails_Private?: string;
    otherIncome?: string;
    sectorOfEmployer?: string;
    jobPosition?: string;
    incomeFrequencyAnnual_Employee?: boolean;
    incomeFrequencyMonthly_Employee?: boolean;
    incomeFrequencyDaily_Employee?: boolean;
    incomeDetails_Employee?: string;
}

export interface OtherDetail {
    id?: number;
    isPoliticallyExposed: boolean;
    requiresPepForm?: boolean;
    isUSCitizenOrResident: boolean;
    requiresIRSFormW9?: boolean;
    accountOpenedByLegalDelegate: boolean;
    requiresLegalDelegateForm?: boolean;
    hasBeenConvicted?: boolean;
    convictionReason?: string;
    pepPosition?: string;
    sourceOfFund?: string;
    otherSourceOfFund?: string;
}

export interface DocumentDetail {
    id?: number;
    docRegionCitySubCity?: string;
    docWeredaKebele?: string;
    docHouseNumber?: string;
    docEmail?: string;
    docOfficeTelephone?: string;
    idType: string;
    idPassportNo: string;
    issuedBy: string;
    issueDate?: string;
    expiryDate?: string;
    mobilePhoneNo: string;
    photoIdFile?: File | null;
    docPhotoUrl?: string;
}

export interface EPaymentService {
    id?: number;
    hasAtmCard: boolean;
    atmCardType?: string;
    atmCardDeliveryBranch?: string;
    hasMobileBanking: boolean;
    hasInternetBanking: boolean;
    hasCbeBirr: boolean;
    hasSmsBanking: boolean;
}

export interface PassbookMudayRequest {
    id?: number;
    needsPassbook: boolean;
    needsMudayBox: boolean;
    mudayBoxDeliveryBranch?: string;
}

export interface DigitalSignature {
    id?: number;
    signatureUrl: string; // Backend expects this field
    termsAccepted: boolean;
    signatureData?: string; // For frontend canvas (optional)
}

// Main form data type
export interface FormData {
    customerId?: number;
    personalDetails: PersonalDetail;
    addressDetails: AddressDetail;
    financialDetails: FinancialDetail;
    otherDetails: OtherDetail;
    documentDetails: DocumentDetail;
    ePaymentService: EPaymentService;
    passbookMudayRequest: PassbookMudayRequest;
    digitalSignature: DigitalSignature;
}

// Error types
export interface Errors<T> {
    [key: string]: string;
}

// PERMANENT FIX: Make all error properties required
export interface FormErrors {
    personalDetails: Errors<PersonalDetail>;
    addressDetails: Errors<AddressDetail>;
    financialDetails: Errors<FinancialDetail>;
    otherDetails: Errors<OtherDetail>;
    documentDetails: Errors<DocumentDetail>;
    ePaymentService: Errors<EPaymentService>;
    passbookMudayRequest: Errors<PassbookMudayRequest>;
    digitalSignature: Errors<DigitalSignature>;
    apiError?: string;
}

export interface FormSummary {
    customerId?: number;
    personalDetails?: PersonalDetail;
    addressDetails?: AddressDetail;
    financialDetails?: FinancialDetail;
    otherDetails?: OtherDetail;
    documentDetails?: DocumentDetail;
    ePaymentService?: EPaymentService;
    passbookMudayRequest?: PassbookMudayRequest;
    digitalSignature?: DigitalSignature;
}

// Initial form data aligned with backend DTOs
export const INITIAL_DATA: FormData = {
    customerId: undefined,
    personalDetails: {
        accountType: '',
        title: '',
        firstName: '',
        middleName: '',
        grandfatherName: '',
        motherFullName: '',
        sex: '',
        dateOfBirth: '',
        placeOfBirth: '',
        maritalStatus: '',
        educationQualification: '',
        nationality: ''
    },
    addressDetails: {
        regionCityAdministration: '',
        zone: '',
        subCity: '',
        weredaKebele: '',
        houseNumber: '',
        mobilePhone: '',
        officePhone: '',
        emailAddress: ''
    },
    financialDetails: {
        typeOfWork: '',
        businessSector: '',
        incomeFrequencyAnnual_Private: false,
        incomeFrequencyMonthly_Private: false,
        incomeFrequencyDaily_Private: false,
        incomeDetails_Private: '',
        otherIncome: '',
        sectorOfEmployer: '',
        jobPosition: '',
        incomeFrequencyAnnual_Employee: false,
        incomeFrequencyMonthly_Employee: false,
        incomeFrequencyDaily_Employee: false,
        incomeDetails_Employee: ''
    },
    otherDetails: {
        isPoliticallyExposed: false,
        requiresPepForm: false,
        isUSCitizenOrResident: false,
        requiresIRSFormW9: false,
        accountOpenedByLegalDelegate: false,
        requiresLegalDelegateForm: false,
        hasBeenConvicted: false,
        convictionReason: '',
        pepPosition: '',
        sourceOfFund: '',
        otherSourceOfFund: ''
    },
    documentDetails: {
        docRegionCitySubCity: '',
        docWeredaKebele: '',
        docHouseNumber: '',
        docEmail: '',
        docOfficeTelephone: '',
        idType: '',
        idPassportNo: '',
        issuedBy: '',
        issueDate: '',
        expiryDate: '',
        mobilePhoneNo: '',
        photoIdFile: null,
        docPhotoUrl: ''
    },
    ePaymentService: {
        hasAtmCard: false,
        atmCardType: '',
        atmCardDeliveryBranch: '',
        hasMobileBanking: false,
        hasInternetBanking: false,
        hasCbeBirr: false,
        hasSmsBanking: false
    },
    passbookMudayRequest: {
        needsPassbook: false,
        needsMudayBox: false,
        mudayBoxDeliveryBranch: ''
    },
    digitalSignature: {
        signatureUrl: '', // Backend expects this field
        termsAccepted: false,
        signatureData: '' // For frontend canvas
    }
};

// PERMANENT FIX: Initial errors with empty objects for all required properties
export const INITIAL_FORM_ERRORS: FormErrors = {
    personalDetails: {},
    addressDetails: {},
    financialDetails: {},
    otherDetails: {},
    documentDetails: {},
    ePaymentService: {},
    passbookMudayRequest: {},
    digitalSignature: {},
    apiError: undefined
};