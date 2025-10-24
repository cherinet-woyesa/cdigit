import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 w-16 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 animate-pulse">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-6 w-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingState;