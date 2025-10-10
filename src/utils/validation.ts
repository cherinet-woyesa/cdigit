/**
 * Common validation rules for forms
 * These can be used with React Hook Form or standalone
 */

export const validationRules = {
  // Required field validation
  required: (fieldName: string = 'This field') => ({
    required: `${fieldName} is required`,
  }),

  // Email validation
  email: {
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address',
    },
  },

  // Phone number validation (Ethiopian format)
  phone: {
    pattern: {
      value: /^(\+251|0)[97]\d{8}$/,
      message: 'Invalid phone number. Use format: 09XXXXXXXX or +2519XXXXXXXX',
    },
  },

  // Account number validation
  accountNumber: {
    pattern: {
      value: /^\d{10,16}$/,
      message: 'Account number must be 10-16 digits',
    },
  },

  // Amount validation
  amount: (min: number = 0, max?: number) => ({
    min: {
      value: min,
      message: `Amount must be at least ${min}`,
    },
    ...(max && {
      max: {
        value: max,
        message: `Amount cannot exceed ${max}`,
      },
    }),
    pattern: {
      value: /^\d+(\.\d{1,2})?$/,
      message: 'Invalid amount format',
    },
  }),

  // Password validation
  password: {
    minLength: {
      value: 8,
      message: 'Password must be at least 8 characters',
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      message: 'Password must contain uppercase, lowercase, number and special character',
    },
  },

  // Text length validation
  textLength: (min: number, max: number) => ({
    minLength: {
      value: min,
      message: `Minimum ${min} characters required`,
    },
    maxLength: {
      value: max,
      message: `Maximum ${max} characters allowed`,
    },
  }),

  // Numeric validation
  numeric: {
    pattern: {
      value: /^\d+$/,
      message: 'Only numbers are allowed',
    },
  },

  // Alphanumeric validation
  alphanumeric: {
    pattern: {
      value: /^[a-zA-Z0-9]+$/,
      message: 'Only letters and numbers are allowed',
    },
  },
};

/**
 * Custom validation functions
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateRequired = (value: string, fieldName: string = 'This field'): ValidationResult => {
  const trimmed = value?.trim() || '';
  return {
    isValid: trimmed.length > 0,
    error: trimmed.length > 0 ? undefined : `${fieldName} is required`,
  };
};

export const validateEthiopianPhone = (phone: string): ValidationResult => {
  const isValid = /^(\+251|0)[97]\d{8}$/.test(phone);
  return {
    isValid,
    error: isValid ? undefined : 'Invalid phone number. Use format: 09XXXXXXXX or +2519XXXXXXXX',
  };
};

export const validateEmail = (email: string): ValidationResult => {
  const isValid = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
  return {
    isValid,
    error: isValid ? undefined : 'Invalid email address',
  };
};

export const validateAccountNumber = (accountNumber: string): ValidationResult => {
  const isValid = /^\d{10,16}$/.test(accountNumber);
  return {
    isValid,
    error: isValid ? undefined : 'Account number must be 10-16 digits',
  };
};

export const validateAmount = (
  amount: string | number,
  options: { min?: number; max?: number } = {}
): ValidationResult => {
  const amountStr = typeof amount === 'number' ? amount.toString() : amount;
  const numValue = parseFloat(amountStr);
  
  // Check format
  if (!/^\d+(\.\d{1,2})?$/.test(amountStr)) {
    return {
      isValid: false,
      error: 'Invalid amount format. Use numbers with up to 2 decimal places',
    };
  }
  
  // Check if positive
  if (isNaN(numValue) || numValue <= 0) {
    return {
      isValid: false,
      error: 'Amount must be greater than 0',
    };
  }
  
  // Check minimum
  if (options.min !== undefined && numValue < options.min) {
    return {
      isValid: false,
      error: `Amount must be at least ${options.min.toLocaleString()}`,
    };
  }
  
  // Check maximum
  if (options.max !== undefined && numValue > options.max) {
    return {
      isValid: false,
      error: `Amount cannot exceed ${options.max.toLocaleString()}`,
    };
  }
  
  return { isValid: true };
};

export const validateOTP = (otp: string): ValidationResult => {
  const isValid = /^\d{6}$/.test(otp);
  return {
    isValid,
    error: isValid ? undefined : 'OTP must be exactly 6 digits',
  };
};

/**
 * Format validation messages
 */
export const formatValidationError = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'Validation error';
};

/**
 * Sanitize input values
 */
export const sanitizeInput = {
  removeWhitespace: (value: string) => value.replace(/\s/g, ''),
  trimWhitespace: (value: string) => value.trim(),
  removeSpecialChars: (value: string) => value.replace(/[^a-zA-Z0-9\s]/g, ''),
  numbersOnly: (value: string) => value.replace(/\D/g, ''),
  lettersOnly: (value: string) => value.replace(/[^a-zA-Z\s]/g, ''),
};

/**
 * Validate multiple fields
 */
export const validateFields = (
  data: Record<string, any>,
  rules: Record<string, (value: any) => boolean | string>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach((field) => {
    const value = data[field];
    const result = rules[field](value);

    if (typeof result === 'string') {
      errors[field] = result;
    } else if (result === false) {
      errors[field] = `Invalid ${field}`;
    }
  });

  return errors;
};
