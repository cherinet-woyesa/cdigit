import React from "react";
import { useAuth } from "../../../../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import type { DecodedToken } from "types/DecodedToken";
import type { WindowDto } from "../../../../services/makerService";
import { 
  UserCircleIcon, 
  CogIcon
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
    <header className="bg-fuchsia-700 text-white shadow-md sticky top-0 z-40 border-b border-fuchsia-300">
      <div className="px-6 py-3">
        <div className="flex justify-between items-center">
          {/* Left Side - Simplified Welcome */}
          <div>
            <h1 className="text-xl font-bold text-white">
              Welcome, {user?.firstName || currentDecoded?.unique_name || 'Maker'}!
            </h1>
          </div>
          
          {/* Right Side - Essential Actions Only */}
          <div className="flex items-center gap-3">
            {/* Change Window Button - Minimal */}
            <button
              onClick={handleOpenChangeWindow}
              className="bg-amber-500 hover:bg-amber-600 border border-amber-400 text-white font-medium px-3 py-1.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-2"
            >
              <CogIcon className="h-4 w-4" />
              {assignedWindow ? "Change Window" : "Select Window"}
            </button>

            {/* Connection Status - Minimal */}
            <div className="flex items-center gap-2 bg-fuchsia-600 border border-fuchsia-500 px-2 py-1 rounded-lg">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;