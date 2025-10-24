import React from "react";
import { useAuth } from "../../../../context/AuthContext";
import type { WindowDto } from "../../../../services/makerService";
import type { DecodedToken } from "types/DecodedToken";
import type { ActionMessage } from "types/ActionMessage";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import { ActionMessage as ActionMessageComponent } from "../common";

interface MainLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  assignedWindow?: WindowDto | null;
  onWindowChange: () => void;
  branchName?: string;
  decoded?: DecodedToken | null;
  actionMessage?: ActionMessage | null;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeSection,
  onSectionChange,
  assignedWindow,
  onWindowChange,
  branchName,
  decoded,
  actionMessage
}) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Only navigation */}
      <Sidebar 
        activeSection={activeSection}
        onNavigate={onSectionChange}
        onLogout={handleLogout}
      />
      
      {/* Main Content Area - Only this area gets children */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Only user info */}
        <Header 
          assignedWindow={assignedWindow}
          handleOpenChangeWindow={onWindowChange}
          branchName={branchName}
          decoded={decoded}
        />
        
        {/* Main Content - This is where MakerDashboard content goes */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
        
        {/* Footer - Only brand footer */}
        <Footer />
      </div>

      {/* Global Action Message */}
      {actionMessage && (
        <ActionMessageComponent 
          message={actionMessage}
          className="fixed top-4 right-4 z-50 shadow-lg animate-in slide-in-from-right-2 max-w-md"
        />
      )}
    </div>
  );
};

export default MainLayout;