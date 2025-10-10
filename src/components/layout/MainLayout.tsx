import React from "react";
import { useAuth } from "../../context/AuthContext";
import type { WindowDto } from "types/WindowDto";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";

interface MainLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  assignedWindow?: WindowDto | null;
  onWindowChange: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeSection,
  onSectionChange,
  assignedWindow,
  onWindowChange
}) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-50">
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
        />
        
        {/* Main Content - This is where MakerDashboard content goes */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        
        {/* Footer - Only brand footer */}
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;