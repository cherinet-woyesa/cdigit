
import { useState } from 'react';

export function useMultiStepForm<T>(initialData: T, steps: number) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<T>(initialData);

  function next() {
    setCurrentStep(i => {
      if (i >= steps - 1) return i;
      return i + 1;
    });
  }

  function back() {
    setCurrentStep(i => {
      if (i <= 0) return i;
      return i - 1;
    });
  }

  function goTo(index: number) {
    setCurrentStep(index);
  }

  function updateFormData(data: Partial<T>) {
    setFormData(prev => ({ ...prev, ...data }));
  }

  return {
    currentStep,
    steps,
    formData,
    setCurrentStep,
    setFormData,
    next,
    back,
    goTo,
    updateFormData,
  };
}
