// Extended validation schemas for new form types
import {
  accountValidation,
  amountValidation,
  otpValidation,
  personalInfoValidation,
} from "@features/customer/utils/validationSchemas";

// Date validation utilities
export const dateValidation = {
  pastDate: (value: string | undefined) => {
    if (!value?.trim()) return "Date is required";

    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (isNaN(selectedDate.getTime())) return "Please enter a valid date";
    if (selectedDate > today) return "Date cannot be in the future";

    return undefined;
  },

  pastOrPresentDate: (value: string | undefined) => {
    if (!value?.trim()) return "Date is required";

    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (isNaN(selectedDate.getTime())) return "Please enter a valid date";
    if (selectedDate > today) return "Date cannot be in the future";

    return undefined;
  },

  futureDate: (value: string | undefined) => {
    if (!value?.trim()) return "Date is required";

    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    if (isNaN(selectedDate.getTime())) return "Please enter a valid date";
    if (selectedDate < today) return "Date must be in the future";

    return undefined;
  },

  dateRange: (startDate: string | undefined, endDate: string | undefined) => {
    if (!startDate?.trim()) return "Start date is required";
    if (!endDate?.trim()) return "End date is required";

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) return "Please enter a valid start date";
    if (isNaN(end.getTime())) return "Please enter a valid end date";
    if (start > end) return "Start date must be before end date";

    return undefined;
  },
};

// Business validation utilities
export const businessValidation = {
  chequeNumber: (value: string | undefined) => {
    if (!value?.trim()) return "Cheque number is required";
    if (value.length < 6) return "Cheque number is too short";
    if (value.length > 20) return "Cheque number is too long";
    if (!/^[A-Za-z0-9]+$/.test(value))
      return "Cheque number must contain only letters and numbers";
    return undefined;
  },

  numberOfBooks: (value: string | number | undefined) => {
    const num = typeof value === "string" ? parseInt(value) : value;
    if (!num || isNaN(num)) return "Number of books is required";
    if (num < 1) return "Must request at least 1 book";
    if (num > 10) return "Cannot request more than 10 books";
    return undefined;
  },

  leavesPerBook: (value: string | number | undefined) => {
    const num = typeof value === "string" ? parseInt(value) : value;
    if (!num || isNaN(num)) return "Leaves per book is required";
    if (num < 25) return "Minimum 25 leaves per book";
    if (num > 100) return "Maximum 100 leaves per book";
    return undefined;
  },

  organizationName: (value: string | undefined) => {
    if (!value?.trim()) return undefined; // Optional field
    if (value.length < 2) return "Organization name is too short";
    if (value.length > 100) return "Organization name is too long";
    return undefined;
  },

  location: (value: string | undefined) => {
    if (!value?.trim()) return undefined; // Optional field
    if (value.length < 2) return "Location is too short";
    if (value.length > 100) return "Location is too long";
    return undefined;
  },

  description: (value: string | undefined, required: boolean = false) => {
    if (required && !value?.trim()) return "Description is required";
    if (!value?.trim()) return undefined; // Optional field
    if (value.length < 10)
      return "Description is too short (minimum 10 characters)";
    if (value.length > 500)
      return "Description is too long (maximum 500 characters)";
    return undefined;
  },

  reason: (value: string | undefined) => {
    if (!value?.trim()) return "Reason is required";
    if (value.length < 5) return "Reason is too short (minimum 5 characters)";
    if (value.length > 200)
      return "Reason is too long (maximum 200 characters)";
    return undefined;
  },

  urgencyLevel: (value: string | undefined) => {
    if (!value) return "Urgency level is required";
    const validLevels = ["Low", "Medium", "High", "Critical"];
    if (!validLevels.includes(value))
      return "Please select a valid urgency level";
    return undefined;
  },

  checkType: (value: string | undefined) => {
    if (!value) return "Check type is required";
    const validTypes = ["EG", "Foreign", "Traveler"];
    if (!validTypes.includes(value)) return "Please select a valid check type";
    return undefined;
  },
};

// Document validation utilities
export const documentValidation = {
  documentReference: (value: string | undefined, required: boolean = false) => {
    if (required && !value?.trim()) return "Document reference is required";
    if (!value?.trim()) return undefined; // Optional field
    if (value.length < 3) return "Document reference is too short";
    if (value.length > 50) return "Document reference is too long";
    return undefined;
  },

  signature: (value: string | undefined, required: boolean = true) => {
    if (required && !value?.trim()) return "Digital signature is required";
    if (!value?.trim()) return undefined; // Optional field
    return undefined;
  },
};

// Address validation utilities
export const addressValidation = {
  address: (value: string | undefined) => {
    if (!value?.trim()) return "Address is required";
    if (value.length < 10)
      return "Address is too short (minimum 10 characters)";
    if (value.length > 200)
      return "Address is too long (maximum 200 characters)";
    return undefined;
  },

  city: (value: string | undefined) => {
    if (!value?.trim()) return "City is required";
    if (value.length < 2) return "City name is too short";
    if (value.length > 50) return "City name is too long";
    return undefined;
  },

  postalCode: (value: string | undefined) => {
    if (!value?.trim()) return undefined; // Optional field
    if (!/^\d{4,6}$/.test(value)) return "Postal code must be 4-6 digits";
    return undefined;
  },
};

// Corporate validation utilities
export const corporateValidation = {
  businessName: (value: string | undefined) => {
    if (!value?.trim()) return "Business name is required";
    if (value.length < 2) return "Business name is too short";
    if (value.length > 100) return "Business name is too long";
    return undefined;
  },

  businessRegistrationNumber: (value: string | undefined) => {
    if (!value?.trim()) return "Business registration number is required";
    if (value.length < 5) return "Registration number is too short";
    if (value.length > 20) return "Registration number is too long";
    return undefined;
  },

  taxIdentificationNumber: (value: string | undefined) => {
    if (!value?.trim()) return "Tax identification number is required";
    if (!/^\d{10}$/.test(value)) return "Tax ID must be exactly 10 digits";
    return undefined;
  },

  businessType: (value: string | undefined) => {
    if (!value) return "Business type is required";
    const validTypes = [
      "Sole Proprietorship",
      "Partnership",
      "Corporation",
      "LLC",
      "NGO",
      "Government",
    ];
    if (!validTypes.includes(value))
      return "Please select a valid business type";
    return undefined;
  },
};

// Denomination validation for petty cash
export const denominationValidation = {
  denominationAmount: (value: string | number | undefined) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (!num || isNaN(num)) return "Denomination amount is required";
    if (num <= 0) return "Denomination amount must be greater than 0";
    return undefined;
  },

  denominationCount: (value: string | number | undefined) => {
    const num = typeof value === "string" ? parseInt(value) : value;
    if (num === undefined || num === null || isNaN(num))
      return "Count is required";
    if (num < 0) return "Count cannot be negative";
    return undefined;
  },
};

// Form-specific validation schemas
export const balanceConfirmationValidationSchema = {
  ...accountValidation,
  customerName: personalInfoValidation.fullName,
  accountOpenedDate: dateValidation.pastDate,
  balanceAsOfDate: dateValidation.pastOrPresentDate,
  creditBalance: amountValidation.amount,
  embassyOrConcernedOrgan: businessValidation.organizationName,
  location: businessValidation.location,
  ...otpValidation,
};

export const checkDepositValidationSchema = {
  ...accountValidation,
  ...amountValidation,
  chequeNumber: businessValidation.chequeNumber,
  drawerAccountNumber: (value: string | undefined) => {
    // More lenient validation for drawer account numbers
    if (!value?.trim()) return 'Drawer account number is required';
    if (value.length < 5) return 'Account number is too short';
    if (value.length > 16) return 'Account number is too long';
    if (!/^\d+$/.test(value)) return 'Account number must contain only digits';
    return undefined;
  },
  checkType: businessValidation.checkType,
  checkValueDate: dateValidation.pastOrPresentDate,
  signature: documentValidation.signature,
  ...otpValidation,
};

export const chequeBookRequestValidationSchema = {
  ...accountValidation,
  numberOfChequeBooks: businessValidation.numberOfBooks,
  leavesPerChequeBook: businessValidation.leavesPerBook,
  digitalSignature: documentValidation.signature,
  ...otpValidation,
};

export const checkWithdrawalValidationSchema = {
  ...accountValidation,
  ...amountValidation,
  chequeNo: businessValidation.chequeNumber,
  checkType: businessValidation.checkType,
  checkValueDate: dateValidation.pastOrPresentDate,
  signature: documentValidation.signature,
  ...otpValidation,
};

export const cashDiscrepancyReportValidationSchema = {
  discrepancyAmount: amountValidation.amount,
  description: (value: string | undefined) =>
    businessValidation.description(value, true),
  reason: businessValidation.reason,
  documentReference: (value: string | undefined) =>
    documentValidation.documentReference(value, false),
};

export const corporateCustomerValidationSchema = {
  businessName: corporateValidation.businessName,
  businessRegistrationNumber: corporateValidation.businessRegistrationNumber,
  taxIdentificationNumber: corporateValidation.taxIdentificationNumber,
  businessType: corporateValidation.businessType,
  ...addressValidation,
  ...personalInfoValidation,
};

export const customerIdMergeValidationSchema = {
  sourceCustomerId: (value: string | undefined) => {
    if (!value?.trim()) return "Source customer ID is required";
    if (value.length < 5) return "Customer ID is too short";
    return undefined;
  },
  targetCustomerId: (value: string | undefined) => {
    if (!value?.trim()) return "Target customer ID is required";
    if (value.length < 5) return "Customer ID is too short";
    return undefined;
  },
  reason: businessValidation.reason,
  ...otpValidation,
};

export const customerProfileChangeValidationSchema = {
  // Account Information is validated through AccountSelector component
  dateRequested: dateValidation.pastOrPresentDate,
  phoneNumber: personalInfoValidation.phoneNumber,
  ...otpValidation,
};

export const pettyCashFormValidationSchema = {
  frontMakerId: (value: string | undefined) => {
    if (!value?.trim()) return "Front maker ID is required";
    return undefined;
  },
  denominationAmount: denominationValidation.denominationAmount,
  denominationCount: denominationValidation.denominationCount,
};

export const phoneBlockValidationSchema = {
  phoneNumber: personalInfoValidation.phoneNumber,
  blockingReason: businessValidation.reason,
  alternativeVerification: (value: string | undefined) => {
    if (!value) return "Alternative verification method is required";
    const validMethods = ["Email", "Security Questions", "Branch Visit"];
    if (!validMethods.includes(value))
      return "Please select a valid verification method";
    return undefined;
  },
};

export const posDeliveryFormValidationSchema = {
  ...accountValidation,
  registeredName: (value: string | undefined) => {
    if (!value?.trim()) return "Registered name is required";
    if (value.length < 2) return "Registered name is too short";
    if (value.length > 100) return "Registered name is too long";
    return undefined;
  },
  tradeName: (value: string | undefined) => {
    if (!value?.trim()) return "Trade name is required";
    if (value.length < 2) return "Trade name is too short";
    if (value.length > 100) return "Trade name is too long";
    return undefined;
  },
  tinNumber: (value: string | undefined) => {
    if (!value?.trim()) return undefined; // Optional field
    if (!/^\d{10}$/.test(value)) return "TIN must be exactly 10 digits";
    return undefined;
  },
  merchantId: (value: string | undefined) => {
    if (!value?.trim()) return undefined; // Optional field
    if (value.length < 5) return "Merchant ID is too short";
    if (value.length > 50) return "Merchant ID is too long";
    return undefined;
  },
  address: addressValidation.address,
  typeOfPOSTerminal: (value: string | undefined) => {
    if (!value) return undefined; // Optional field
    const validTypes = ["Desktop", "Mobile"];
    if (!validTypes.includes(value)) return "Please select a valid POS terminal type";
    return undefined;
  },
  equipmentType: (value: string | undefined) => {
    if (!value?.trim()) return undefined; // Optional field
    if (value.length < 2) return "Equipment type is too short";
    if (value.length > 100) return "Equipment type is too long";
    return undefined;
  },
  serialNumber: (value: string | undefined) => {
    if (!value?.trim()) return undefined; // Optional field
    if (value.length < 5) return "Serial number is too short";
    if (value.length > 50) return "Serial number is too long";
    return undefined;
  },
  posId: (value: string | undefined) => {
    if (!value?.trim()) return undefined; // Optional field
    if (value.length < 5) return "POS ID is too short";
    if (value.length > 50) return "POS ID is too long";
    return undefined;
  },
  posAccessories: (value: string | undefined) => {
    if (!value?.trim()) return undefined; // Optional field
    if (value.length < 2) return "POS accessories is too short";
    if (value.length > 200) return "POS accessories is too long";
    return undefined;
  },
  deliveredBy: (value: string | undefined) => {
    if (!value?.trim()) return undefined; // Optional field
    if (value.length < 2) return "Delivered by is too short";
    if (value.length > 100) return "Delivered by is too long";
    return undefined;
  },
  deliveredTo: (value: string | undefined) => {
    if (!value?.trim()) return undefined; // Optional field
    if (value.length < 2) return "Delivered to is too short";
    if (value.length > 100) return "Delivered to is too long";
    return undefined;
  },
  deliveredByDate: dateValidation.pastOrPresentDate,
  deliveredToDate: dateValidation.pastOrPresentDate,
  ...otpValidation,
};

export const specialChequeClearanceValidationSchema = {
  chequeNumber: businessValidation.chequeNumber,
  chequeAmount: amountValidation.amount,
  urgencyLevel: businessValidation.urgencyLevel,
  clearanceReason: businessValidation.reason,
  documentReference: (value: string | undefined) =>
    documentValidation.documentReference(value, false),
};

export const ticketMandateRequestValidationSchema = {
  ...accountValidation,
  mandateType: (value: string | undefined) => {
    if (!value) return "Mandate type is required";
    const validTypes = [
      "Single Transaction",
      "Multiple Transactions",
      "Standing Order",
    ];
    if (!validTypes.includes(value))
      return "Please select a valid mandate type";
    return undefined;
  },
  authorizationScope: businessValidation.description,
  mandateStartDate: dateValidation.futureDate,
  mandateEndDate: dateValidation.futureDate,
  signature: documentValidation.signature,
};
