import React from "react";
import { BellIcon, UserCircleIcon } from "@heroicons/react/24/outline";

interface HeaderProps {
  handleOpenChangeWindow: () => void;
  branchName?: string;
  decoded?: any;
}

const Header: React.FC<HeaderProps> = ({ 
  handleOpenChangeWindow, 
  branchName = "Your Branch",
  decoded 
}) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Maker Dashboard</h1>
              <p className="text-sm text-gray-500">
                {branchName} • {decoded?.name || "Maker User"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleOpenChangeWindow}
              className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Change Window
            </button>

            <button className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors">
              <BellIcon className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-2">
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {decoded?.name || "Maker"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;