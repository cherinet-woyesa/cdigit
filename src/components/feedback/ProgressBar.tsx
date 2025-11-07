import React from "react";

type ProgressBarProps = {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
};

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, stepTitles }) => {
  return (
    <div className="flex justify-between items-start mb-6">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                index <= currentStep ? "bg-fuchsia-600" : "bg-gray-400"
              }`}
            >
              {index + 1}
            </div>
            <div
              className={`text-xs mt-1 text-center break-words ${
                index <= currentStep ? "text-fuchsia-700 font-semibold" : "text-gray-500"
              }`}
            >
              {stepTitles[index]}
            </div>
          </div>
          {index < totalSteps - 1 && (
            <div
              className={`flex-1 h-1 mt-4 ${
                index < currentStep ? "bg-fuchsia-600" : "bg-gray-300"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ProgressBar;
