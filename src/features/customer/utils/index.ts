// Export all validation schemas and utilities
export * from '@features/customer/utils/validationSchemas';
export * from '@features/customer/utils/extendedValidationSchemas';
export * from '@features/customer/utils/formUtils';

// Re-export commonly used validation functions
export {
  validateRequired,
  validateEthiopianPhone,
  validateEmail,
  validateAccountNumber,
  validateAmount,
  validateOTP,
  formatValidationError,
  sanitizeInput,
  validateFields
} from '@utils/validation';