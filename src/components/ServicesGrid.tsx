
import React from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import type { Service } from 'types/Service';

interface ServicesGridProps {
  services: Service[];
  onServiceClick: (service: Service) => void;
}

const ServicesGrid: React.FC<ServicesGridProps> = ({ services, onServiceClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {services.map((service) => (
        <div
          key={service.id}
          onClick={() => onServiceClick(service)}
          className={`relative rounded-2xl shadow-lg p-6 text-white cursor-pointer bg-gradient-to-br ${service.color} transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group border border-white/20`}
        >
          {service.count && service.count > 0 && (
            <div className="absolute -top-2 -right-2 bg-white text-gray-800 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              {service.count}
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <service.icon className="h-8 w-8 text-white/90" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full capitalize">
              {service.category}
            </span>
          </div>
          <h4 className="text-lg font-bold mb-2 leading-tight">{service.title}</h4>
          <p className="text-sm text-white/80 leading-relaxed mb-4">
            {service.description}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-white/60">
              Click to process
            </span>
            <ArrowRightIcon className="h-4 w-4 text-white/60 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServicesGrid;
