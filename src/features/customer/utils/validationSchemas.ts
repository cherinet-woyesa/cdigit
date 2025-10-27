// utils/validationSchemas.ts
export const accountValidation = {
  accountNumber: (value: string | undefined) => {
    if (!value?.trim()) return 'Account number is required';
    if (value.length < 10) return 'Account number is too short';
    if (value.length > 16) return 'Account number is too long';
    if (!/^\d+$/.test(value)) return 'Account number must contain only digits';
    return undefined;
  },
  
  accountHolderName: (value: string | undefined) => {
    if (!value?.trim()) return 'Account holder name is required';
    return undefined;
  }
};

export const amountValidation = {
  amount: (value: string | undefined, formData?: any) => {
    if (!value?.trim()) return 'Amount is required';
    
    const amountNum = parseFloat(value);
    if (isNaN(amountNum) || amountNum <= 0) return 'Please enter a valid amount greater than 0';
    if (amountNum > 10000000) return 'Amount is too large';
    
    return undefined;
  }
};

export const otpValidation = {
  otp: (value: string | undefined) => {
    if (!value) return 'OTP is required';
    if (value.length !== 6) return 'OTP must be 6 digits';
    if (!/^\d{6}$/.test(value)) return 'OTP must contain only digits';
    return undefined;
  }
};

export const personalInfoValidation = {
  fullName: (value: string | undefined) => {
    if (!value?.trim()) return 'Full name is required';
    if (value.length < 2) return 'Full name is too short';
    return undefined;
  },
  
  phoneNumber: (value: string | undefined) => {
    if (!value?.trim()) return 'Phone number is required';
    if (!/^\+?[\d\s-]+$/.test(value)) return 'Please enter a valid phone number';
    return undefined;
  },
  
  email: (value: string | undefined) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  }
};

// CBE Birr Registration specific validation
export const cbeBirrRegistrationValidationSchema = {
  phoneNumber: (value: string | undefined) => {
    if (!value?.trim()) return 'Phone number is required';
    if (!/^\+?[\d\s-]+$/.test(value)) return 'Please enter a valid phone number';
    return undefined;
  },

  fullName: (value: string | undefined) => {
    if (!value?.trim()) return 'First name is required';
    if (value.length < 2) return 'First name is too short';
    return undefined;
  },

  fatherName: (value: string | undefined) => {
    if (!value?.trim()) return "Father's name is required";
    if (value.length < 2) return 'Father name is too short';
    return undefined;
  },

  grandfatherName: (value: string | undefined) => {
    if (!value?.trim()) return "Grandfather's name is required";
    if (value.length < 2) return 'Grandfather name is too short';
    return undefined;
  },

  placeOfBirth: (value: string | undefined) => {
    if (!value?.trim()) return 'Place of birth is required';
    if (value.length < 2) return 'Place of birth is too short';
    return undefined;
  },

  dateOfBirth: (value: string | undefined) => {
    if (!value?.trim()) return 'Date of birth is required';
    
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      return 'Date of birth cannot be in the future';
    }
    return undefined;
  },

  gender: (value: string | undefined) => {
    if (!value) return 'Gender is required';
    return undefined;
  },

  city: (value: string | undefined) => {
    if (!value?.trim()) return 'City is required';
    if (value.length < 2) return 'City is too short';
    return undefined;
  },

  wereda: (value: string | undefined) => {
    if (!value?.trim()) return 'Wereda is required';
    return undefined;
  },

  kebele: (value: string | undefined) => {
    if (!value?.trim()) return 'Kebele is required';
    return undefined;
  },

  email: (value: string | undefined) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  },

  idNumber: (value: string | undefined) => {
    if (!value?.trim()) return 'ID number is required';
    if (value.length < 5) return 'ID number is too short';
    return undefined;
  },

  issuedBy: (value: string | undefined) => {
    if (!value?.trim()) return 'Issued by is required';
    if (value.length < 2) return 'Issued by is too short';
    return undefined;
  },

  maritalStatus: (value: string | undefined) => {
    if (!value) return 'Marital status is required';
    return undefined;
  },

  educationLevel: (value: string | undefined) => {
    if (!value) return 'Education level is required';
    return undefined;
  },

  motherName: (value: string | undefined) => {
    if (!value?.trim()) return "Mother's name is required";
    if (value.length < 2) return 'Mother name is too short';
    return undefined;
  },

  motherFatherName: (value: string | undefined) => {
    if (!value?.trim()) return "Mother's father name is required";
    if (value.length < 2) return 'Mother father name is too short';
    return undefined;
  },

  motherGrandfatherName: (value: string | undefined) => {
    if (!value?.trim()) return "Mother's grandfather name is required";
    if (value.length < 2) return 'Mother grandfather name is too short';
    return undefined;
  },

  otpCode: otpValidation.otp,
};

// Combined schemas for different form types
export const depositValidationSchema = {
  ...accountValidation,
  ...amountValidation
};

export const withdrawalStep1ValidationSchema = {
    ...accountValidation,
    ...amountValidation
};

export const withdrawalValidationSchema = {
  ...accountValidation,
  ...amountValidation,
  ...otpValidation
};

export const transferValidationSchema = {
  debitAccountNumber: accountValidation.accountNumber,
  creditAccountNumber: accountValidation.accountNumber,
  ...amountValidation,
  ...otpValidation
};