import React from 'react';
import ServiceRequestDetail from './ServiceRequestDetail';

interface ServiceRequestDetailPanelProps {
  endpoint: string;
  requestId: string;
}

const ServiceRequestDetailPanel: React.FC<ServiceRequestDetailPanelProps> = ({ endpoint, requestId }) => {
  // Get service type from localStorage
  const serviceType = localStorage.getItem('selectedServiceType') || '';

  return (
    <ServiceRequestDetail 
      serviceType={serviceType}
      endpoint={endpoint}
      requestId={requestId}
    />
  );
};

export default ServiceRequestDetailPanel;