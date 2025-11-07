import React from 'react';
import type { Service } from '@features/maker/types';

interface ServiceCardProps {
  service: Service;
  onClick?: (serviceType: string, endpoint: string) => void;
}

// Icon mapping - we'll use actual Heroicons components
const IconComponent: React.FC<{ iconName: string; className?: string }> = ({ iconName, className }) => {
  // This is a placeholder - you'll need to import actual Heroicons
  const getIcon = () => {
    switch (iconName) {
      case 'DocumentTextIcon':
        return <div className={`bg-blue-100 text-blue-600 ${className}`}>📄</div>;
      case 'CurrencyDollarIcon':
        return <div className={`bg-green-100 text-green-600 ${className}`}>💰</div>;
      case 'DevicePhoneMobileIcon':
        return <div className={`bg-purple-100 text-purple-600 ${className}`}>📱</div>;
      case 'ReceiptPercentIcon':
        return <div className={`bg-indigo-100 text-indigo-600 ${className}`}>🧾</div>;
      case 'DocumentDuplicateIcon':
        return <div className={`bg-orange-100 text-orange-600 ${className}`}>📑</div>;
      case 'HandRaisedIcon':
        return <div className={`bg-red-100 text-red-600 ${className}`}>✋</div>;
      case 'LinkIcon':
        return <div className={`bg-teal-100 text-teal-600 ${className}`}>🔗</div>;
      case 'ArrowsRightLeftIcon':
        return <div className={`bg-pink-100 text-pink-600 ${className}`}>🔄</div>;
      default:
        return <div className={`bg-gray-100 text-gray-600 ${className}`}>📦</div>;
    }
  };

  return getIcon();
};

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onClick }) => {
  return (
    <div
      onClick={() => onClick?.(service.name, service.endpoint)}
      className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 border border-gray-100 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-fuchsia-50 transition-colors border border-gray-200">
          <IconComponent iconName={service.icon} className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
          {service.name}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${
          service.count > 0 ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-gray-100 text-gray-400'
        }`}>
          {service.count}
        </span>
        <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

export default ServiceCard;