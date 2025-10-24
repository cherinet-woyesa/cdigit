// hooks/useFormSteps.ts
import { useState, useCallback } from 'react';

export function useFormSteps(totalSteps: number) {
  const [step, setStep] = useState(1);

  const next = useCallback(() => {
    setStep(prev => Math.min(prev + 1, totalSteps));
  }, [totalSteps]);

  const prev = useCallback(() => {
    setStep(prev => Math.max(prev - 1, 1));
  }, []);

  const goTo = useCallback((stepNumber: number) => {
    setStep(Math.max(1, Math.min(stepNumber, totalSteps)));
  }, [totalSteps]);

  return {
    step,
    next,
    prev,
    goTo,
    isFirst: step === 1,
    isLast: step === totalSteps,
    canGoNext: step < totalSteps,
    canGoBack: step > 1,
  };
}