import React from "react";
import { useAuth } from "@context/AuthContext";
import Footer from "@features/maker/components/layout/Footer";
import type { DecodedToken } from "@types";
import type { ActionMessage } from "@types";
import ManagerHeader from "@features/manager/ManagerHeader";
import ManagerSidebar from "@features/manager/ManagerSidebar";

interface MainLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onWindowChange: () => void;
  branchName?: string;
  decoded?: DecodedToken | null;
  actionMessage?: ActionMessage | null;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeSection,
  onSectionChange,
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
      <ManagerSidebar 
        activeSection={activeSection}
        onNavigate={onSectionChange}
        onLogout={handleLogout}
      />
      
      {/* Main Content Area - Only this area gets children */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Only user info */}
        <ManagerHeader 
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
      {actionMessage?.content && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg p-4 border-l-4 shadow-lg animate-in slide-in-from-right-2 ${
          actionMessage.type === 'success' 
            ? 'bg-green-50 border-green-500 text-green-800'
            : actionMessage.type === 'error'
            ? 'bg-red-50 border-red-500 text-red-800'
            : actionMessage.type === 'warning'
            ? 'bg-amber-50 border-amber-500 text-amber-800'
            : 'bg-blue-50 border-blue-500 text-blue-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{actionMessage.content}</span>
            </div>
            <button
              onClick={() => {}} // This will be handled by parent
              className="ml-4 p-1 hover:bg-black/5 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;