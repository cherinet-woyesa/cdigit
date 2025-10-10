import React from "react";
import { useAuth } from "../../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import type { DecodedToken } from "types/DecodedToken";
import type { WindowDto } from "types/WindowDto";
import { 
  UserCircleIcon, 
  WifiIcon,
  CogIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

interface HeaderProps {
  assignedWindow?: WindowDto | null;
  handleOpenChangeWindow: () => void;
}

const Header: React.FC<HeaderProps> = ({ assignedWindow, handleOpenChangeWindow }) => {
  const { token, user } = useAuth();
  const [decoded, setDecoded] = React.useState<DecodedToken | null>(null);

  /** Decode token for branch info */
  React.useEffect(() => {
    if (!token) return;
    try {
      const d = jwtDecode<DecodedToken>(token);
      setDecoded(d);
    } catch (error) {
      console.error('Failed to decode token in Header:', error);
    }
  }, [token]);

  return (
    <header className="bg-gradient-to-r from-fuchsia-700 to-purple-700 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          {/* Left Side - Brand & Welcome */}
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Maker Dashboard</h1>
              <p className="text-fuchsia-100 text-xs">
                Welcome, {user?.firstName || decoded?.unique_name || 'Maker'}
                {assignedWindow && ` • Window #${assignedWindow.windowNumber}`}
              </p>
            </div>
          </div>
          
          {/* Right Side - User Info & Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            {/* User Role & Branch */}
            <div className="text-right">
              <div className="flex items-center gap-2 text-fuchsia-100 text-sm">
                <UserCircleIcon className="h-4 w-4" />
                <span className="font-semibold">Role: Maker</span>
              </div>
              <div className="text-xs text-fuchsia-200 mt-1">
                Branch: {decoded?.BranchId || 'N/A'}
              </div>
            </div>
            
            {/* Window Status */}
            {assignedWindow && (
              <div className="bg-white/20 px-3 py-1.5 rounded-md">
                <div className="text-xs text-fuchsia-200">Active Window</div>
                <div className="font-bold text-white text-sm">#{assignedWindow.windowNumber}</div>
              </div>
            )}

            {/* Change Window Button */}
            <button
              onClick={handleOpenChangeWindow}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-1.5 rounded-md text-xs transition-all duration-200 flex items-center gap-2"
            >
              <CogIcon className="h-3 w-3" />
              {assignedWindow ? "Change Window" : "Select Window"}
            </button>

            {/* Connection Status */}
            <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-md">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <WifiIcon className="h-3 w-3 text-green-400" />
              <span className="text-green-100 text-xs font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;