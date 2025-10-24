import React from 'react';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Other Services</h3>
        <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
          Error
        </span>
      </div>
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-red-600 font-medium mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition-colors shadow-sm font-medium"
        >
          Retry
        </button>
      </div>
    </div>
  );
};

export default ErrorState;