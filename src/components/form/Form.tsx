
import React from 'react';

interface FormProps {
  children: React.ReactNode[];
  currentStep: number;
  next: () => void;
  back: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function Form({ children, currentStep, next, back, isFirstStep, isLastStep }: FormProps) {
  return (
    <div>
      {children[currentStep]}
      <div>
        {!isFirstStep && <button onClick={back}>Back</button>}
        <button onClick={next}>{isLastStep ? 'Finish' : 'Next'}</button>
      </div>
    </div>
  );
}
