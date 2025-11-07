import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { type FormData, INITIAL_DATA } from '@types';

// Define the shape of our context
type AccountOpeningContextType = {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  resetForm: () => void;
  currentStep: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  isStepCompleted: (step: number) => boolean;
  markStepAsCompleted: (step: number) => void;
  isSubmitting: boolean;
  submitForm: () => Promise<{ success: boolean; error?: Error }>;
};

// Create the context with a default value
const AccountOpeningContext = createContext<AccountOpeningContextType | undefined>(undefined);

// Define action types for the reducer
type Action =
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<FormData> }
  | { type: 'RESET_FORM' }
  | { type: 'SET_CURRENT_STEP'; payload: number }
  | { type: 'MARK_STEP_COMPLETED'; payload: number }
  | { type: 'SET_IS_SUBMITTING'; payload: boolean };

// Reducer function to manage state updates
const formReducer = (state: any, action: Action) => {
  switch (action.type) {
    case 'UPDATE_FORM_DATA':
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.payload,
        },
      };
    case 'RESET_FORM':
      return {
        ...state,
        formData: { ...INITIAL_DATA },
        currentStep: 0,
        completedSteps: new Set<number>(),
        isSubmitting: false,
      };
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };
    case 'MARK_STEP_COMPLETED':
      return {
        ...state,
        completedSteps: new Set([...state.completedSteps, action.payload]),
      };
    case 'SET_IS_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload,
      };
    default:
      return state;
  }
};

// Provider component
export const AccountOpeningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(formReducer, {
    formData: { ...INITIAL_DATA },
    currentStep: 0,
    completedSteps: new Set<number>(),
    isSubmitting: false,
  });

  // Load saved form data from localStorage on initial render
  useEffect(() => {
    try {
      const savedFormData = localStorage.getItem('accountOpeningFormData');
      const savedStep = localStorage.getItem('accountOpeningCurrentStep');
      const savedCompletedSteps = localStorage.getItem('accountOpeningCompletedSteps');

      if (savedFormData) {
        dispatch({ type: 'UPDATE_FORM_DATA', payload: JSON.parse(savedFormData) });
      }
      if (savedStep) {
        dispatch({ type: 'SET_CURRENT_STEP', payload: parseInt(savedStep, 10) });
      }
      if (savedCompletedSteps) {
        const steps = new Set(JSON.parse(savedCompletedSteps).map(Number));
  (Array.from(steps) as number[]).forEach(step => dispatch({ type: 'MARK_STEP_COMPLETED', payload: step }));
      }
    } catch (error) {
      console.error('Failed to load saved form data:', error);
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('accountOpeningFormData', JSON.stringify(state.formData));
      localStorage.setItem('accountOpeningCurrentStep', state.currentStep.toString());
      localStorage.setItem(
        'accountOpeningCompletedSteps',
        JSON.stringify(Array.from(state.completedSteps))
      );
    } catch (error) {
      console.error('Failed to save form data:', error);
    }
  }, [state.formData, state.currentStep, state.completedSteps]);

  // Update form data
  const updateFormData = useCallback((data: Partial<FormData>) => {
    dispatch({ type: 'UPDATE_FORM_DATA', payload: data });
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  // Navigate to a specific step
  const goToStep = useCallback((step: number) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: step });
  }, []);

  // Move to next step
  const nextStep = useCallback(() => {
    const nextStep = state.currentStep + 1;
    dispatch({ type: 'SET_CURRENT_STEP', payload: nextStep });
    dispatch({ type: 'MARK_STEP_COMPLETED', payload: state.currentStep });
  }, [state.currentStep]);

  // Move to previous step
  const prevStep = useCallback(() => {
    if (state.currentStep > 0) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep - 1 });
    }
  }, [state.currentStep]);

  // Check if a step is completed
  const isStepCompleted = useCallback(
    (step: number) => {
      return state.completedSteps.has(step);
    },
    [state.completedSteps]
  );

  // Mark a step as completed
  const markStepAsCompleted = useCallback((step: number) => {
    dispatch({ type: 'MARK_STEP_COMPLETED', payload: step });
  }, []);

  // Submit form data
  const submitForm = useCallback(async (): Promise<{ success: boolean; error?: Error }> => {
    try {
      dispatch({ type: 'SET_IS_SUBMITTING', payload: true });
      
      // Here you would typically call your API to submit the form
      // const response = await accountOpeningService.submitForm(state.formData);
      
      // Mark all steps as completed on successful submission
      for (let i = 0; i <= state.currentStep; i++) {
        dispatch({ type: 'MARK_STEP_COMPLETED', payload: i });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Form submission failed:', error);
      return { success: false, error: error as Error };
    } finally {
      dispatch({ type: 'SET_IS_SUBMITTING', payload: false });
    }
  }, [state.formData, state.currentStep]);

  // Context value
  const contextValue = {
    formData: state.formData,
    updateFormData,
    resetForm,
    currentStep: state.currentStep,
    goToStep,
    nextStep,
    prevStep,
    isStepCompleted,
    markStepAsCompleted,
    isSubmitting: state.isSubmitting,
    submitForm,
  };

  return (
    <AccountOpeningContext.Provider value={contextValue}>
      {children}
    </AccountOpeningContext.Provider>
  );
};

// Custom hook to use the account opening context
export const useAccountOpening = (): AccountOpeningContextType => {
  const context = useContext(AccountOpeningContext);
  if (context === undefined) {
    throw new Error('useAccountOpening must be used within an AccountOpeningProvider');
  }
  return context;
};

export default AccountOpeningContext;
