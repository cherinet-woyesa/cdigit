import React from 'react';
import { DashboardErrorBoundary } from "@components/dashboard/ErrorBoundary";
import WindowChangeModal from "@components/modals/WindowChangeModal";
import MainLayout from "@features/maker/components/layout/MakerLayout";
import { useMakerDashboard } from '@features/maker/hooks/useMakerDashboard';
import DashboardContent from '@features/maker/components/sections/DashboardContent';

interface MakerDashboardProps {
  activeSection?: string;
  assignedWindow?: any;
}

const MakerDashboardContent: React.FC<MakerDashboardProps> = ({
  activeSection = "transactions",
  assignedWindow = null
}) => {
  const {
    // State
    isLoading,
    actionMessage,
    currentSection,
    currentAssignedWindow,
    dashboardMetrics,
    decodedToken,
    isWindowModalOpen,
    handleSectionChange,
    handleWindowChange,
    handleSelectWindow,
    setWindowModalOpen
  } = useMakerDashboard(activeSection, assignedWindow);

  const handleServiceClick = (serviceType: string, endpoint: string) => {
    localStorage.setItem('selectedServiceType', serviceType);
    localStorage.setItem('selectedServiceEndpoint', endpoint);
    handleSectionChange("service-detail");
  };

  const handleBackToServices = () => {
    handleSectionChange("other");
  };

  // Get branch name - this might come from a different source
  const branchName = "Your Branch"; // Default value for now

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600 mx-auto"></div>
          <p className="mt-4 text-fuchsia-700 font-medium">Loading Maker Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout
      activeSection={currentSection}
      onSectionChange={handleSectionChange}
      onWindowChange={handleWindowChange}
      branchName={branchName}
      decoded={decodedToken}
      actionMessage={actionMessage}
    >
      <DashboardContent
        state={{
          isLoading,
          actionMessage,
          currentSection,
          assignedWindow: currentAssignedWindow,
          dashboardMetrics: dashboardMetrics as any, // Type cast to avoid conflict
          branchName
        }}
        decodedToken={decodedToken}
        serviceRequestParams={null} // This might need to be implemented
        onServiceClick={handleServiceClick}
        onBackToServices={handleBackToServices}
        assignedWindow={assignedWindow}
      />
      
      <WindowChangeModal
        isOpen={isWindowModalOpen}
        onClose={() => setWindowModalOpen(false)}
        onSelectWindow={handleSelectWindow}
        branchId={decodedToken?.BranchId || null}
      />
    </MainLayout>
  );
};

const MakerDashboard: React.FC<MakerDashboardProps> = (props) => {
  return (
    <DashboardErrorBoundary>
      <MakerDashboardContent {...props} />
    </DashboardErrorBoundary>
  );
};

export default MakerDashboard;