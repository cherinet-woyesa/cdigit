import React from 'react';

import OtherServices from '@features/maker/components/sections/OtherServices';
import ServiceDetailPanel from '@features/maker/components/ServiceDetailPanel';
import ServiceRequestDetailPanel from '@features/maker/components/ServiceRequestDetailPanel';
import VoucherDashboard from '@features/maker/pages/VoucherDashboard';
import DashboardMetrics from '@components/dashboard/DashboardMetrics';
import MakerPerformance from '@features/maker/pages/MakerPerformance';
import AccountSearch from '@features/maker/components/AccountSearch';
import { Transactions } from '@features/maker';
import { type DashboardState } from '@features/maker/types';

interface DashboardContentProps {
  state: DashboardState;
  decodedToken: any;
  serviceRequestParams: { endpoint: string; requestId: string } | null;
  onServiceClick: (serviceType: string, endpoint: string) => void;
  onBackToServices: () => void;
  assignedWindow: any;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  state,
  decodedToken,
  serviceRequestParams,
  onServiceClick,
  onBackToServices,
  assignedWindow
}) => {
  const { currentSection, dashboardMetrics, actionMessage, assignedWindow: stateWindow } = state;

  const renderContent = () => {
    switch (currentSection) {
      case "transactions":
        return dashboardMetrics.length > 0 ? (
          <div className="space-y-6">
            <DashboardMetrics metrics={dashboardMetrics} />
            <Transactions
              activeSection={currentSection}
              assignedWindow={assignedWindow || stateWindow}
            />
          </div>
        ) : (
          <Transactions
            activeSection={currentSection}
            assignedWindow={assignedWindow || stateWindow}
          />
        );

    

      case "other":
        return <OtherServices onServiceClick={onServiceClick} />;

      case "service-detail":
        return <ServiceDetailPanel onBack={onBackToServices} />;

      case "service-request-detail":
        return serviceRequestParams ? (
          <ServiceRequestDetailPanel 
            endpoint={serviceRequestParams.endpoint}
            requestId={serviceRequestParams.requestId}
          />
        ) : null;

      case "vouchers":
        return <VoucherDashboard />;

      case "performance":
        return decodedToken ? (
          <MakerPerformance 
            makerId={decodedToken.nameid} 
            branchId={decodedToken.BranchId} 
          />
        ) : null;

      case "account-search":
        return <AccountSearch />;

      case "settings":
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31 2.37 2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Settings</h2>
              <p className="text-gray-600">Configuration and preferences coming soon...</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-gray-50">
      {actionMessage && (
        <ActionMessage 
          message={actionMessage} 
          onClose={() => {}} // Will be handled by parent
        />
      )}
      {renderContent()}
    </div>
  );
};

// Simple ActionMessage component for now
const ActionMessage: React.FC<{ message: any; onClose: () => void }> = ({ message, onClose }) => (
  <div className={`rounded-lg p-4 mb-6 border-l-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
    message.type === 'success' 
      ? 'bg-green-50 border-green-500 text-green-800'
      : message.type === 'error'
      ? 'bg-red-50 border-red-500 text-red-800'
      : message.type === 'warning'
      ? 'bg-amber-50 border-amber-500 text-amber-800'
      : 'bg-blue-50 border-blue-500 text-blue-800'
  }`}>
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {message.type === 'success' && <SuccessIcon />}
          {message.type === 'error' && <ErrorIcon />}
          {message.type === 'warning' && <WarningIcon />}
          {message.type === 'info' && <InfoIcon />}
        </div>
        <p className="text-sm font-medium">{message.content}</p>
      </div>
      <button onClick={onClose} className="flex-shrink-0 ml-4 p-1 hover:bg-black/5 rounded-lg transition-colors">
        ×
      </button>
    </div>
  </div>
);

// Icon components
const SuccessIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

const WarningIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const InfoIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

export default DashboardContent;