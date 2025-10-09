
import React from 'react';

const Shimmer: React.FC = () => (
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
);

const SkeletonBlock: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`relative overflow-hidden rounded-lg bg-gray-200 ${className}`}>
        <Shimmer />
    </div>
);

const DashboardSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Skeleton */}
            <header className="bg-gray-200 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex items-center space-x-4">
                            <SkeletonBlock className="w-16 h-16 rounded-xl" />
                            <div>
                                <SkeletonBlock className="h-8 w-48 mb-2" />
                                <SkeletonBlock className="h-5 w-64" />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                            <SkeletonBlock className="h-14 w-full sm:w-24" />
                            <SkeletonBlock className="h-14 w-full sm:w-24" />
                            <SkeletonBlock className="h-14 w-full sm:w-24" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs Skeleton */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex space-x-1">
                        <SkeletonBlock className="h-16 w-36 rounded-t-lg" />
                        <SkeletonBlock className="h-16 w-36 rounded-t-lg" />
                        <SkeletonBlock className="h-16 w-36 rounded-t-lg" />
                    </div>
                </div>
            </div>

            {/* Main Content Skeleton */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    {/* Stats Cards Skeleton */}
                    <div className="bg-white rounded-2xl p-8">
                        <SkeletonBlock className="h-8 w-72 mb-6" />
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            <SkeletonBlock className="h-32 rounded-xl" />
                            <SkeletonBlock className="h-32 rounded-xl" />
                            <SkeletonBlock className="h-32 rounded-xl" />
                            <SkeletonBlock className="h-32 rounded-xl" />
                        </div>
                    </div>

                    {/* Transactions Component Skeleton */}
                    <div className="bg-white rounded-2xl p-8">
                        <SkeletonBlock className="h-8 w-64 mb-4" />
                        <SkeletonBlock className="h-5 w-80 mb-8" />
                        <SkeletonBlock className="h-48" />
                    </div>

                    {/* Performance Metrics Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <SkeletonBlock className="h-28 rounded-xl" />
                        <SkeletonBlock className="h-28 rounded-xl" />
                        <SkeletonBlock className="h-28 rounded-xl" />
                        <SkeletonBlock className="h-28 rounded-xl" />
                    </div>
                </div>
            </main>

            {/* Quick Actions Footer Skeleton */}
            <div className="bg-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <SkeletonBlock className="h-8 w-48 mb-6" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <SkeletonBlock className="h-36 rounded-xl" />
                        <SkeletonBlock className="h-36 rounded-xl" />
                        <SkeletonBlock className="h-36 rounded-xl" />
                        <SkeletonBlock className="h-36 rounded-xl" />
                    </div>
                </div>
            </div>

            {/* Footer Skeleton */}
            <footer className="bg-gray-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="text-center md:text-left">
                            <SkeletonBlock className="h-6 w-48 mb-2" />
                            <SkeletonBlock className="h-4 w-64" />
                        </div>
                        <div className="flex items-center space-x-6 mt-4 md:mt-0">
                            <SkeletonBlock className="h-6 w-32" />
                            <SkeletonBlock className="h-6 w-24" />
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default DashboardSkeleton;
