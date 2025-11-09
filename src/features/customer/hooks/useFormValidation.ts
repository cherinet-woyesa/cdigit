// hooks/useFormValidation.ts
import { useState, useCallback } from "react";

interface ValidationRules {
  [key: string]: (value: any, formData?: any) => string | undefined;
}

export function useFormValidation(rules: ValidationRules) {
  // Allow undefined values in the errors state
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const validateField = useCallback(
    (field: string, value: any, formData?: any) => {
      const rule = rules[field];
      if (rule) {
        const error = rule(value, formData);
        setErrors((prev) => ({
          ...prev,
          [field]: error,
        }));
        return !error;
      }
      return true;
    },
    [rules],
  );

  const validateForm = useCallback(
    (formData: any, fieldsToValidate?: string[]) => {
      console.log("=== Form Validation Debug ===");
      console.log("Form data:", formData);
      console.log("Validation rules:", rules);
      console.log("Fields to validate:", fieldsToValidate);
      
      const fields = fieldsToValidate || Object.keys(rules);
      let isValid = true;
      
      // Use a temporary error object to collect new errors
      const newErrors: Record<string, string | undefined> = {};

      fields.forEach((field) => {
        const rule = rules[field];
        console.log(`Validating field ${field}:`, formData[field]);
        if (rule) {
          const error = rule(formData[field], formData);
          console.log(`Validation result for ${field}:`, error);
          if (error) {
            isValid = false;
            newErrors[field] = error;
          }
        } else {
          console.log(`No validation rule found for field ${field}`);
        }
      });

      if (fieldsToValidate) {
        // If validating a subset, merge new errors with existing ones
        setErrors(prevErrors => {
            const updatedErrors = {...prevErrors};
            fieldsToValidate.forEach(field => {
                if (newErrors[field]) {
                    updatedErrors[field] = newErrors[field];
                } else {
                    // if there is no new error, remove the old one for that field
                    delete updatedErrors[field];
                }
            });
            return updatedErrors;
        });
      } else {
        // If validating the whole form, just set the new errors
        const filteredErrors = Object.entries(newErrors).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, string>);
        setErrors(filteredErrors);
      }
      
      console.log("Validation result:", isValid);
      console.log("New errors:", newErrors);
      console.log("Final errors:", errors);

      return isValid;
    },
    [rules],
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
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