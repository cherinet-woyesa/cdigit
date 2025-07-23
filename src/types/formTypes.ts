// src/types/formTypes.ts

// Backend DTO Names (These now directly mirror your C# DTO property names)
export type AccountOpeningFormData = {
  PersonalDetails: PersonalDetail;
  AddressDetails: AddressDetail;
  FinancialDetails: FinancialDetail;
  OtherDetails: OtherDetail;
  DocumentDetails: DocumentDetail;
  EPaymentServices: EPaymentService;
  PassbookMudayRequest: PassbookMudayRequest;
  DigitalSignature: DigitalSignature;
};

// Frontend Step Data Types (All properties are now PascalCase)
// --- Step 1: Personal Details ---
export type PersonalDetail = {
  AccountType: "Savings" | "Current" | "IFB" | "";
  Title: "Mr." | "Mrs." | "Miss" | "Ms." | "Dr." | "";
  YourName: string; // Changed from 'name'
  FatherName: string;
  GrandfatherName: string;
  MotherFullName: string;
  Sex: "Male" | "Female" | "";
  DateOfBirth: string; // Changed from 'dob' - YYYY-MM-DD format
  PlaceOfBirth: string;
  MaritalStatus: "Single" | "Married" | "Divorced" | "Widowed" | "";
  EducationQualification: string; // Changed from 'education'
  Nationality: "Ethiopian" | "Foreign National" | "";
};

// --- Step 2: Address Details ---
export type AddressDetail = {
  RegionCityAdministration: string;
  Zone: string;
  SubCity: string;
  WeredaKebele: string;
  HouseNumber: string;
  MobilePhone: string;
  OfficePhone: string;
  EmailAddress: string; // Changed from 'email'
};

// --- Step 3: Financial Details ---
export type FinancialDetail = {
  TypeOfWork: "Private" | "Employee" | ""; // Changed from 'workType'
  BusinessSector: string;
  IncomeFrequency: "Annual" | "Monthly" | "Daily" | "";
  IncomeAmount: string;
  OtherIncome: string;
  SectorOfEmployer: string; // Changed from 'employerSector'
  JobPosition: string;
};

// --- Step 4: Other Details ---
export type OtherDetail = {
  HasBeenConvicted: boolean; // Changed from 'hasBeenConvicted'
  ConvictionReason: string;
  IsPoliticallyExposed: boolean; // Changed from 'isPoliticallyExposed'
  PepPosition: string;
  SourceOfFund: "Salary" | "Business Income" | "Gift" | "Inheritance" | "Loan" | "Pension" | "Other" | "";
  OtherSourceOfFund: string;
};

// --- Step 5: Document Details ---
export type DocumentDetail = {
  IdType: "National ID" | "Passport" | "Driver's License" | "Resident Permit" | ""; // Changed from 'idType'
  IdPassportNo: string; // Changed from 'idPassportNo'
  IdIssueDate: string; // Changed from 'idIssueDate' - YYYY-MM-DD format
  IdExpiryDate: string; // Changed from 'idExpiryDate' - YYYY-MM-DD format
  IdIssuePlace: string; // Changed from 'idIssuePlace'
  PhotoIdFile: File | null; // Changed from 'photoIdFile'
};

// --- Step 6: E-Payment Services ---
export type EPaymentService = {
  HasAtmCard: boolean; // Changed from 'hasAtmCard'
  AtmCardType: "Visa" | "MasterCard" | "UnionPay" | ""; // Changed from 'atmCardType'
  AtmCardDeliveryBranch: string; // Changed from 'atmCardDeliveryBranch'
  HasMobileBanking: boolean; // Changed from 'hasMobileBanking'
  HasInternetBanking: boolean; // Changed from 'hasInternetBanking'
  HasSmsBanking: boolean; // Changed from 'hasSmsBanking'
};

// --- Step 7: Passbook & Muday Box Request ---
export type PassbookMudayRequest = {
  NeedsPassbook: boolean; // Changed from 'needsPassbook'
  NeedsMudayBox: boolean; // Changed from 'needsMudayBox'
  MudayBoxDeliveryBranch: string; // Changed from 'mudayBoxDeliveryBranch'
};

// --- Step 8: Digital Signature & Submission ---
export type DigitalSignature = {
  TermsAccepted: boolean; // Changed from 'termsAccepted'
  PhotoFile: File | null; // Changed from 'photoFile'
};

// Utility type for errors (keys will now be PascalCase)
export type Errors<T> = Partial<Record<keyof T, string>>;