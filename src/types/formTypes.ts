export interface FormData {
  // Personal Details
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  countryOfBirth: string;
  maritalStatus: string;

  // Contact Information
  phoneNumber: string;
  email: string;

  // Identification
  idType: string;
  idNumber: string;
  idIssueDate: string;
  idExpiryDate: string;
  idIssuingAuthority: string;

  // Address
  country: string;
  region: string;
  city: string;
  woreda: string;
  houseNumber: string;

  // Employment
  employmentStatus: string;
  occupation: string;
  employerName: string;

  // Financials
  sourceOfFunds: string;
  estimatedMonthlyIncome: string;

  // Documents & Images
  selfie: string; // Base64 string
  idFront: string; // Base64 string
  idBack: string; // Base64 string
  signature: string; // Base64 string
}

export const INITIAL_DATA: FormData = {
  title: '',
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  nationality: 'Ethiopian',
  countryOfBirth: 'Ethiopia',
  maritalStatus: '',
  phoneNumber: '',
  email: '',
  idType: '',
  idNumber: '',
  idIssueDate: '',
  idExpiryDate: '',
  idIssuingAuthority: '',
  country: 'Ethiopia',
  region: '',
  city: '',
  woreda: '',
  houseNumber: '',
  employmentStatus: '',
  occupation: '',
  employerName: '',
  sourceOfFunds: '',
  estimatedMonthlyIncome: '',
  selfie: '',
  idFront: '',
  idBack: '',
  signature: '',
};
