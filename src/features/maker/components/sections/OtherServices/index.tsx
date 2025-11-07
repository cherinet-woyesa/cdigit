import React from 'react';
import { useOtherServices } from '@features/maker/hooks/useOtherServices';
import ServicesHeader from '@features/maker/components/sections/OtherServices/ServicesHeader';
import ServicesGrid from '@features/maker/components/sections/OtherServices/ServicesGrid';
import LoadingState from '@features/maker/components/sections/OtherServices/LoadingState';
import ErrorState from '@features/maker/components/sections/OtherServices/ErrorState';

interface OtherServicesProps {
  onServiceClick?: (serviceType: string, endpoint: string) => void;
}

const OtherServices: React.FC<OtherServicesProps> = ({ onServiceClick }) => {
  const {
    services,
    totalCount,
    loading,
    error,
    fetchServicesData,
    servicesData
  } = useOtherServices();

  // Show loading skeleton on initial load
  if (loading && !servicesData) {
    return <LoadingState />;
  }

  // Show error state if there's an error and no data
  if (error && !servicesData) {
    return <ErrorState error={error} onRetry={fetchServicesData} />;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <ServicesHeader totalCount={totalCount} loading={loading && !!servicesData} />
      
      <ServicesGrid 
        services={services} 
        onServiceClick={onServiceClick} 
      />

      {/* Refresh indicator */}
      {loading && servicesData && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="w-4 h-4 border-2 border-fuchsia-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Updating...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OtherServices;