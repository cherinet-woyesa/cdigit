import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className }) => (
  <div className={`bg-gray-200 rounded-md animate-pulse ${className}`}></div>
);

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header Skeleton */}
      <header className="bg-fuchsia-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center space-x-4">
              <SkeletonLoader className="h-16 w-16 rounded-xl" />
              <div>
                <SkeletonLoader className="h-8 w-48 mb-2" />
                <SkeletonLoader className="h-5 w-64" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <SkeletonLoader className="h-12 w-24 rounded-lg" />
              <SkeletonLoader className="h-12 w-24 rounded-lg" />
              <SkeletonLoader className="h-12 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs Skeleton */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex space-x-1">
            <SkeletonLoader className="h-16 w-48" />
            <SkeletonLoader className="h-16 w-48" />
            <SkeletonLoader className="h-16 w-48" />
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Transaction Type Stats Skeleton */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <SkeletonLoader className="h-8 w-1/2 mb-6" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <SkeletonLoader className="h-32 rounded-xl" />
              <SkeletonLoader className="h-32 rounded-xl" />
              <SkeletonLoader className="h-32 rounded-xl" />
              <SkeletonLoader className="h-32 rounded-xl" />
            </div>
          </div>

          {/* Transactions Component Skeleton */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200">
              <SkeletonLoader className="h-8 w-1/3 mb-2" />
              <SkeletonLoader className="h-5 w-2/3" />
            </div>
            <div className="p-8">
              <SkeletonLoader className="h-48" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardSkeleton;