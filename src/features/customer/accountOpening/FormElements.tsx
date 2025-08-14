// src/components/common/FormElements.tsx
import React from "react";

type FieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
};

export function Field({ label, required, error, children }: FieldProps) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
}

type ProgressBarProps = {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
};

export function ProgressBar({ currentStep, totalSteps, stepTitles }: ProgressBarProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                index <= currentStep ? "bg-purple-600" : "bg-gray-400"
              }`}
            >
              {index + 1}
            </div>
            <div
              className={`text-xs mt-1 text-center ${
                index <= currentStep ? "text-purple-700" : "text-gray-500"
              }`}
            >
              {stepTitles[index]}
            </div>
          </div>
          {index < totalSteps - 1 && (
            <div
              className={`flex-1 h-1 ${
                index < currentStep ? "bg-purple-600" : "bg-gray-300"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}