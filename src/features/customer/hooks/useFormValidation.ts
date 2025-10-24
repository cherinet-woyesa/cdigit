// hooks/useFormValidation.ts
import { useState, useCallback } from 'react';

interface ValidationRules {
  [key: string]: (value: any, formData?: any) => string | undefined;
}

export function useFormValidation(rules: ValidationRules) {
  // Allow undefined values in the errors state
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const validateField = useCallback((field: string, value: any, formData?: any) => {
    const rule = rules[field];
    if (rule) {
      const error = rule(value, formData);
      setErrors(prev => ({
        ...prev,
        [field]: error
      }));
      return !error;
    }
    return true;
  }, [rules]);

  const validateForm = useCallback((formData: any) => {
    const newErrors: Record<string, string | undefined> = {};
    
    Object.keys(rules).forEach(field => {
      const rule = rules[field];
      const value = formData[field];
      const error = rule(value, formData);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [rules]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field]; // Remove the field entirely instead of setting to undefined
      return newErrors;
    });
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    hasErrors: Object.keys(errors).length > 0,
  };
}