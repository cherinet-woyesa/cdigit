/**
 * Common validation rules for forms
 * These can be used with React Hook Form or standalone
 */

import {
  TRANSACTION_LIMITS,
  CURRENCY_LIMITS,
  ACCOUNT_NUMBER_RULES,
  VALIDATION_MESSAGES,
  getTransactionLimits,
  requiresApproval,
} from '@config/businessRules';
import { validationAuditService } from '@services/validationAuditService';
import type { ValidationResult as AuditValidationResult } from '@services/validationAuditService';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  guidedPrompt?: string; // NEW: Guided help for users
  requiresApproval?: boolean; // NEW: Indicates if transaction needs approval
  context?: Record<string, any>; // NEW: Additional context
}

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

/**
 * Enhanced account number validation with business rules
 */
export const validateAccountNumber = (
  accountNumber: string,
  options: { auditContext?: Partial<AuditValidationResult> } = {}
): ValidationResult => {
  const value = accountNumber.trim();
  const { guidedPrompts } = VALIDATION_MESSAGES;
  
  let result: ValidationResult;
  
  // Check if empty
  if (!value) {
    result = {
      isValid: false,
      error: 'Account number is required',
      guidedPrompt: guidedPrompts.accountNumber.hint,
    };
  }
  // Check length
  else if (value.length < ACCOUNT_NUMBER_RULES.minLength) {
    result = {
      isValid: false,
      error: guidedPrompts.accountNumber.tooShort,
      guidedPrompt: guidedPrompts.accountNumber.hint,
    };
  }
  else if (value.length > ACCOUNT_NUMBER_RULES.maxLength) {
    result = {
      isValid: false,
      error: guidedPrompts.accountNumber.tooLong,
      guidedPrompt: guidedPrompts.accountNumber.hint,
    };
  }
  // Check pattern
  else if (!ACCOUNT_NUMBER_RULES.pattern.test(value)) {
    result = {
      isValid: false,
      error: guidedPrompts.accountNumber.invalid,
      guidedPrompt: guidedPrompts.accountNumber.hint,
    };
  }
  // Check prefix (if configured)
  else if (ACCOUNT_NUMBER_RULES.allowedPrefixes && ACCOUNT_NUMBER_RULES.allowedPrefixes.length > 0) {
    const hasValidPrefix = ACCOUNT_NUMBER_RULES.allowedPrefixes.some(prefix => value.startsWith(prefix));
    if (!hasValidPrefix) {
      result = {
        isValid: false,
        error: guidedPrompts.accountNumber.invalidPrefix,
        guidedPrompt: guidedPrompts.accountNumber.hint,
      };
    } else {
      result = { isValid: true };
    }
  }
  else {
    result = { isValid: true };
  }
  
  // Audit validation
  if (options.auditContext) {
    validationAuditService.logValidation({
      ...options.auditContext,
      fieldName: options.auditContext.fieldName || 'accountNumber',
      fieldValue: value,
      validationRule: 'accountNumberFormat',
      isValid: result.isValid,
      errorMessage: result.error,
      guidedPrompt: result.guidedPrompt,
    } as any);
  }
  
  return result;
};

/**
 * Enhanced amount validation with business rules and currency support
 */
export const validateAmount = (
  amount: string | number,
  options: {
    min?: number;
    max?: number;
    currency?: string;
    transactionType?: 'withdrawal' | 'deposit' | 'fundTransfer' | 'rtgs';
    customerSegment?: 'Normal' | 'Corporate';
    auditContext?: Partial<AuditValidationResult>;
  } = {}
): ValidationResult => {
  const amountStr = typeof amount === 'number' ? amount.toString() : amount;
  const numValue = parseFloat(amountStr);
  const { guidedPrompts } = VALIDATION_MESSAGES;
  const currency = options.currency || 'ETB';
  
  let result: ValidationResult;
  
  // Check format
  if (!/^\d+(\.\d{1,2})?$/.test(amountStr)) {
    result = {
      isValid: false,
      error: 'Invalid amount format. Use numbers with up to 2 decimal places',
      guidedPrompt: guidedPrompts.amount.hint,
    };
  }
  // Check if positive
  else if (isNaN(numValue) || numValue <= 0) {
    result = {
      isValid: false,
      error: 'Amount must be greater than 0',
      guidedPrompt: guidedPrompts.amount.hint,
    };
  }
  else {
    // Get limits from business rules
    let limits: { min: number; max: number; dailyLimit?: number } = {
      min: options.min || 0,
      max: options.max || Number.MAX_SAFE_INTEGER,
    };
    
    if (options.transactionType) {
      limits = getTransactionLimits(options.transactionType, options.customerSegment);
    }
    
    // Check minimum
    if (numValue < limits.min) {
      result = {
        isValid: false,
        error: `${guidedPrompts.amount.belowMin}. Minimum is ${limits.min.toLocaleString()} ${currency}`,
        guidedPrompt: `Enter an amount of at least ${limits.min.toLocaleString()} ${currency}`,
      };
    }
    // Check maximum
    else if (numValue > limits.max) {
      result = {
        isValid: false,
        error: `${guidedPrompts.amount.aboveMax}. Maximum is ${limits.max.toLocaleString()} ${currency}`,
        guidedPrompt: `Enter an amount up to ${limits.max.toLocaleString()} ${currency}`,
      };
    }
    else {
      // Check if requires approval
      const approvalCheck = options.transactionType
        ? requiresApproval(numValue, currency, options.transactionType)
        : { required: false };
      
      // Check currency limits for FX
      if (currency !== 'ETB') {
        const currencyLimit = CURRENCY_LIMITS[currency];
        if (!currencyLimit) {
          result = {
            isValid: false,
            error: `${guidedPrompts.currency.unsupported}: ${currency}`,
            guidedPrompt: `Supported currencies: ${Object.keys(CURRENCY_LIMITS).join(', ')}`,
          };
        } else if (numValue > currencyLimit.transactionLimit) {
          result = {
            isValid: false,
            error: `Amount exceeds ${currency} transaction limit of ${currencyLimit.transactionLimit.toLocaleString()}`,
            guidedPrompt: guidedPrompts.currency.hint,
            requiresApproval: true,
          };
        } else if (approvalCheck.required) {
          result = {
            isValid: true,
            requiresApproval: true,
            context: { approvalReason: approvalCheck.reason },
            guidedPrompt: `⚠️ ${approvalCheck.reason}. Transaction will require manager approval.`,
          };
        } else {
          result = { isValid: true };
        }
      } else if (approvalCheck.required) {
        result = {
          isValid: true,
          requiresApproval: true,
          context: { approvalReason: approvalCheck.reason },
          guidedPrompt: `⚠️ ${approvalCheck.reason}. Transaction will require approval.`,
        };
      } else {
        result = { isValid: true };
      }
    }
  }
  
  // Audit validation
  if (options.auditContext) {
    validationAuditService.logValidation({
      ...options.auditContext,
      fieldName: options.auditContext.fieldName || 'amount',
      fieldValue: amountStr,
      validationRule: `amountRange_${currency}_${options.transactionType || 'general'}`,
      isValid: result.isValid,
      errorMessage: result.error,
      guidedPrompt: result.guidedPrompt,
      context: {
        currency,
        transactionType: options.transactionType,
        customerSegment: options.customerSegment,
        requiresApproval: result.requiresApproval,
      },
    } as any);
  }
  
  return result;
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
