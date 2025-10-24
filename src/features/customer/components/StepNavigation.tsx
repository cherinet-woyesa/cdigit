// components/StepNavigation.tsx
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  nextLabel?: string;
  backLabel?: string;
  hideBack?: boolean;
  nextDisabled?: boolean;
  nextLoading?: boolean;
}

export function StepNavigation({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  nextLabel = "Continue",
  backLabel = "Back",
  hideBack = false,
  nextDisabled = false,
  nextLoading = false
}: StepNavigationProps) {
  return (
    <div className="flex justify-between pt-4">
      {!hideBack && currentStep > 1 ? (
        <button 
          type="button" 
          onClick={onBack}
          className="border border-fuchsia-300 text-fuchsia-700 px-6 py-3 rounded-lg hover:bg-fuchsia-50 flex items-center gap-2 transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          {backLabel}
        </button>
      ) : (
        <div></div>
      )}
      
      <button 
        type="button"
        onClick={onNext}
        disabled={nextDisabled || nextLoading}
        className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800 font-medium disabled:opacity-50 flex items-center gap-2 transition-all shadow-md"
      >
        {nextLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <span>{nextLabel}</span>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}