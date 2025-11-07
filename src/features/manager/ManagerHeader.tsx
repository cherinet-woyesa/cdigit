import React from "react";
import { useAuth } from "@context/AuthContext";
import { jwtDecode } from "jwt-decode";
import type { DecodedToken } from "@types";
import type { WindowDto } from "@services/makerService";
import { CogIcon} from "@heroicons/react/24/outline";

interface HeaderProps {
  assignedWindow?: WindowDto | null;
  handleOpenChangeWindow: () => void;
  branchName?: string; // Add this
  decoded?: DecodedToken | null; // Add this
}

const Header: React.FC<HeaderProps> = ({ 
  assignedWindow, 
  handleOpenChangeWindow,
  branchName, // Add to destructuring
  decoded // Add to destructuring
}) => {
  const { token, user } = useAuth();
  const [localDecoded, setLocalDecoded] = React.useState<DecodedToken | null>(decoded || null);

  /** Decode token for branch info - only if not passed as prop */
  React.useEffect(() => {
    if (!token || decoded) return; // Skip if decoded is already provided
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
    <header className="bg-gradient-to-r from-fuchsia-700 to-fuchsia-600 text-white shadow-md sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Left Side - Welcome */}
          <div>
            <h1 className="text-xl font-bold text-white">
              Welcome, {user?.firstName || currentDecoded?.unique_name || 'Maker'}
            </h1>
            <p className="text-sm text-fuchsia-50 mt-0.5">
              Branch: <span className="font-semibold text-white">{displayBranchName}</span>
            </p>
          </div>
          
          {/* Right Side - Actions & Status */}
          <div className="flex items-center gap-3">
            {/* Window Status Badge */}
            {/* Change Window Button */}

            {/* Connection Status */}
            <div className="flex items-center gap-2 bg-green-500/20 backdrop-blur-sm border border-green-400/30 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
              <span className="text-green-50 text-sm font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;