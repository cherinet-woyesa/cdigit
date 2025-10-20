import React from "react";
import { useAuth } from "../../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import type { DecodedToken } from "types/DecodedToken";
import type { WindowDto } from "types/WindowDto";
import { 
  UserCircleIcon, 
  WifiIcon,
  CogIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
  ComputerDesktopIcon
} from "@heroicons/react/24/outline";

interface HeaderProps {
  assignedWindow?: WindowDto | null;
  handleOpenChangeWindow: () => void;
  branchName?: string;
  decoded?: DecodedToken | null;
}

const Header: React.FC<HeaderProps> = ({ 
  assignedWindow, 
  handleOpenChangeWindow,
  branchName,
  decoded
}) => {
  const { token, user } = useAuth();
  const [localDecoded, setLocalDecoded] = React.useState<DecodedToken | null>(decoded || null);

  /** Decode token for branch info - only if not passed as prop */
  React.useEffect(() => {
    if (!token || decoded) return;
    try {
      const d = jwtDecode<DecodedToken>(token);
      setLocalDecoded(d);
    } catch (error) {
      console.error('Failed to decode token in Header:', error);
    }
  }, [token, decoded]);

  // Use the prop if provided, otherwise use local state
  const currentDecoded = decoded || localDecoded;
  
  // Use branchName prop if provided, otherwise fallback to decoded branch ID
  const displayBranchName = branchName || currentDecoded?.BranchId || 'N/A';

  return (
    <header className="bg-white text-gray-800 shadow-md sticky top-0 z-40 border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Left Side - Welcome */}
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-1">
              Welcome, {user?.firstName || currentDecoded?.unique_name || 'Maker'}!
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <BuildingStorefrontIcon className="h-4 w-4 text-amber-500" />
                <span className="text-gray-600">
                  Branch: <span className="font-semibold text-gray-900">{displayBranchName}</span>
                </span>
              </div>
              {assignedWindow && (
                <div className="flex items-center gap-1.5">
                  <ComputerDesktopIcon className="h-4 w-4 text-amber-500" />
                  <span className="text-gray-600">
                    Window <span className="font-semibold text-gray-900">#{assignedWindow.windowNumber}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Side - Actions & Status - Smaller and compact */}
          <div className="flex items-center gap-3">
            {/* Role Badge - Small and in top right */}
            <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              <div className="text-xs font-bold text-amber-700 uppercase tracking-wide">Role</div>
              <div className="text-sm font-bold text-amber-800">Maker</div>
            </div>

            {/* Window Status Badge - Smaller */}
            {assignedWindow && (
              <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                <div className="text-xs text-gray-500 font-medium">Active Window</div>
                <div className="font-bold text-gray-900 text-base">#{assignedWindow.windowNumber}</div>
              </div>
            )}

            {/* Change Window Button - Smaller */}
            <button
              onClick={handleOpenChangeWindow}
              className="bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-2"
            >
              <CogIcon className="h-4 w-4" />
              {assignedWindow ? "Change Window" : "Select Window"}
            </button>

            {/* Connection Status - Smaller */}
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <div className="text-xs text-green-600 font-medium">Status</div>
                <div className="text-sm font-bold text-green-700">Online</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;