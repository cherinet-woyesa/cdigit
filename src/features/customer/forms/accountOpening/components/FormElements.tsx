// src/features/customer/forms/accountOpening/components/FormElements.tsx
import React from "react";
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

type FieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

export function Field({ label, required, error, children, className = "" }: FieldProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500 text-lg">*</span>}
      </label>
      <div className="relative">
        {children}
        {error && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
            <span className="text-xs text-red-700">{error}</span>
          </div>
        )}
      </div>
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
    <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
      <div 
        className="bg-fuchsia-600 h-2 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
      ></div>
    </div>
  );
}

export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 className="h-8 w-8 text-fuchsia-700 animate-spin mb-2" />
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
}

export function SuccessState({ message, icon: Icon = CheckCircle2 }: { 
  message: string; 
  icon?: React.ComponentType<any>;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
      <Icon className="h-5 w-5 text-green-500 flex-shrink-0" />
      <span className="text-green-700 text-sm">{message}</span>
    </div>
  );
}