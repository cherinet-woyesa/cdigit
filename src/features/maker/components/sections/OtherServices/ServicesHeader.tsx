import React from 'react';

interface ServicesHeaderProps {
  totalCount: number;
  loading?: boolean;
}

const ServicesHeader: React.FC<ServicesHeaderProps> = ({ totalCount, loading = false }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-fuchsia-700 rounded-full"></div>
        <h3 className="text-lg font-bold text-gray-900">Other Services</h3>
      </div>
      
      {loading ? (
        <div className="w-8 h-6 bg-gray-200 rounded-full animate-pulse"></div>
      ) : (
        <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${
          totalCount > 0 
            ? 'bg-fuchsia-700 text-white' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {totalCount}
        </span>
      )}
    </div>
  );
};

export default ServicesHeader;