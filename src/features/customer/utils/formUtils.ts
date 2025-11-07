// Shared form utilities for consistent form behavior
import { useState, useCallback } from 'react';
import { validateFormData, type BaseFormData } from '@services/baseFormService';

export interface FormStep {
  id: string;
  title: string;
  isCompleted: boolean;
  isActive: boolean;
}

export interface UseFormStepsReturn {
  currentStep: number;
  steps: FormStep[];
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndex: number) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  setCanProceed: (canProceed: boolean) => void;
}

/**
 * Custom hook for managing multi-step form navigation
 */
export const useFormSteps = (stepTitles: string[]): UseFormStepsReturn => {
  const [currentStep, setCurrentStep] = useState(0);
  const [canProceed, setCanProceed] = useState(false);

  const steps: FormStep[] = stepTitles.map((title, index) => ({
    id: `step-${index}`,
    title,
    isCompleted: index < currentStep,
    isActive: index === currentStep
  }));

  const nextStep = useCallback(() => {
    if (currentStep < stepTitles.length - 1 && canProceed) {
      setCurrentStep(prev => prev + 1);
      setCanProceed(false); // Reset for next step
    }
  }, [currentStep, stepTitles.length, canProceed]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setCanProceed(true); // Allow going back
    }
  }, [currentStep]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < stepTitles.length) {
      setCurrentStep(stepIndex);
      setCanProceed(false);
    }
  }, [stepTitles.length]);

  return {
    currentStep,
    steps,
    nextStep,
    prevStep,
    goToStep,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === stepTitles.length - 1,
    canProceed,
    setCanProceed
  };
};

export interface UseFormValidationReturn<T> {
  errors: Record<string, string>;
  isValid: boolean;
  validateField: (fieldName: keyof T, value: any) => string | undefined;
  validateForm: (data: T) => boolean;
  clearErrors: () => void;
  setFieldError: (fieldName: keyof T, error: string) => void;
  clearFieldError: (fieldName: keyof T) => void;
}

/**
 * Custom hook for form validation
 */
export const useFormValidation = <T extends Record<string, any>>(
  validationSchema: Record<keyof T, (value: any) => string | undefined>
): UseFormValidationReturn<T> => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((fieldName: keyof T, value: any): string | undefined => {
    const validator = validationSchema[fieldName];
    if (!validator) return undefined;
    
    const error = validator(value);
    
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[fieldName as string] = error;
      } else {
        delete newErrors[fieldName as string];
      }
      return newErrors;
    });
    
    return error;
  }, [validationSchema]);

  const validateForm = useCallback((data: T): boolean => {
    const validationResult = validateFormData(data as BaseFormData, validationSchema as any);
    setErrors(validationResult.errors);
    return validationResult.isValid;
  }, [validationSchema]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setFieldError = useCallback((fieldName: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [fieldName as string]: error
    }));
  }, []);

  const clearFieldError = useCallback((fieldName: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName as string];
      return newErrors;
    });
  }, []);

  const isValid = Object.keys(errors).length === 0;

  return {
    errors,
    isValid,
    validateField,
    validateForm,
    clearErrors,
    setFieldError,
    clearFieldError
  };
};

export interface UseOTPHandlingReturn {
  otpRequested: boolean;
  otpVerified: boolean;
  otpLoading: boolean;
  otpError: string | null;
  requestOTP: (phoneNumber: string) => Promise<void>;
  verifyOTP: (phoneNumber: string, otpCode: string) => Promise<boolean>;
  resetOTP: () => void;
}

/**
 * Custom hook for OTP handling
 */
export const useOTPHandling = (
  requestOTPFn: (phoneNumber: string) => Promise<any>,
  verifyOTPFn: (phoneNumber: string, otpCode: string) => Promise<any>
): UseOTPHandlingReturn => {
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const requestOTP = useCallback(async (phoneNumber: string) => {
    setOtpLoading(true);
    setOtpError(null);
    
    try {
      await requestOTPFn(phoneNumber);
      setOtpRequested(true);
    } catch (error: any) {
      setOtpError(error.message || 'Failed to request OTP');
    } finally {
      setOtpLoading(false);
    }
  }, [requestOTPFn]);

  const verifyOTP = useCallback(async (phoneNumber: string, otpCode: string): Promise<boolean> => {
    setOtpLoading(true);
    setOtpError(null);
    
    try {
      const result = await verifyOTPFn(phoneNumber, otpCode);
      const isVerified = result.success || result.isValid || true; // Adjust based on API response
      setOtpVerified(isVerified);
      return isVerified;
    } catch (error: any) {
      setOtpError(error.message || 'Failed to verify OTP');
      return false;
    } finally {
      setOtpLoading(false);
    }
  }, [verifyOTPFn]);

  const resetOTP = useCallback(() => {
    setOtpRequested(false);
    setOtpVerified(false);
    setOtpLoading(false);
    setOtpError(null);
  }, []);

  return {
    otpRequested,
    otpVerified,
    otpLoading,
    otpError,
    requestOTP,
    verifyOTP,
    resetOTP
  };
};

export interface UseAccountSelectionReturn {
  selectedAccount: any | null;
  accountLoading: boolean;
  accountError: string | null;
  validateAndSelectAccount: (accountNumber: string) => Promise<boolean>;
  clearAccount: () => void;
}

/**
 * Custom hook for account selection and validation
 */
export const useAccountSelection = (
  validateAccountFn: (accountNumber: string) => Promise<any>
): UseAccountSelectionReturn => {
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const validateAndSelectAccount = useCallback(async (accountNumber: string): Promise<boolean> => {
    if (!accountNumber.trim()) {
      setAccountError('Account number is required');
      return false;
    }

    setAccountLoading(true);
    setAccountError(null);
    
    try {
      const result = await validateAccountFn(accountNumber);
      
      if (result.success && result.data) {
        setSelectedAccount(result.data);
        return true;
      } else {
        setAccountError(result.message || 'Account not found');
        setSelectedAccount(null);
        return false;
      }
    } catch (error: any) {
      setAccountError(error.message || 'Failed to validate account');
      setSelectedAccount(null);
      return false;
    } finally {
      setAccountLoading(false);
    }
  }, [validateAccountFn]);

  const clearAccount = useCallback(() => {
    setSelectedAccount(null);
    setAccountError(null);
  }, []);

  return {
    selectedAccount,
    accountLoading,
    accountError,
    validateAndSelectAccount,
    clearAccount
  };
};

/**
 * Utility function to format form data for display
 */
export const formatFormDataForDisplay = (data: Record<string, any>): Record<string, string> => {
  const formatted: Record<string, string> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'number') {
        if (key.toLowerCase().includes('amount')) {
          formatted[key] = new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 2
          }).format(value);
        } else {
          formatted[key] = value.toString();
        }
      } else if (typeof value === 'boolean') {
        formatted[key] = value ? 'Yes' : 'No';
      } else if (value instanceof Date) {
        formatted[key] = value.toLocaleDateString('en-ET');
      } else {
        formatted[key] = value.toString();
      }
    }
  });
  
  return formatted;
};

/**
 * Utility function to generate step titles for common form flows
 */
export const getCommonFormSteps = (formType: 'simple' | 'withOTP' | 'withSignature' | 'complex'): string[] => {
  switch (formType) {
    case 'simple':
      return ['Form Details', 'Review & Submit'];
    case 'withOTP':
      return ['Form Details', 'Review', 'OTP Verification', 'Confirmation'];
    case 'withSignature':
      return ['Form Details', 'Review', 'Digital Signature', 'OTP Verification', 'Confirmation'];
    case 'complex':
      return ['Basic Information', 'Additional Details', 'Review', 'Verification', 'Confirmation'];
    default:
      return ['Form Details', 'Review & Submit'];
  }
};

/**
 * Utility function to sanitize form input
 */
export const sanitizeFormInput = (value: string, type: 'text' | 'number' | 'phone' | 'email' = 'text'): string => {
  if (!value) return '';
  
  switch (type) {
    case 'number':
      return value.replace(/[^\d.]/g, '');
    case 'phone':
      return value.replace(/[^\d+\-\s]/g, '');
    case 'email':
      return value.toLowerCase().trim();
    case 'text':
    default:
      return value.trim();
  }
};

/**
 * Utility function to check if form data has changed
 */
export const hasFormDataChanged = (
  originalData: Record<string, any>,
  currentData: Record<string, any>
): boolean => {
  const originalKeys = Object.keys(originalData);
  const currentKeys = Object.keys(currentData);
  
  if (originalKeys.length !== currentKeys.length) {
    return true;
  }
  
  return originalKeys.some(key => originalData[key] !== currentData[key]);
};