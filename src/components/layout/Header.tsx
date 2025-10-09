import React from "react";
import type { DecodedToken } from "types/DecodedToken";
import type { WindowDto } from "types/WindowDto";

interface HeaderProps {
  decoded: DecodedToken | null
  branchName?: string;
  assignedWindow?: WindowDto | null
  handleOpenChangeWindow: () => void;
}

const Header: React.FC<HeaderProps> = ({ branchName, assignedWindow, handleOpenChangeWindow, decoded }) => {
  return (
    <header className="bg-fuchsia-700 text-white py-4 px-6 flex justify-between items-center shadow-md">
      <div>
        <h1 className="text-xl font-bold">Maker Dashboard</h1>
        <p className="text-fuchsia-100 text-sm mt-1">
          Branch:{" "}
          <span className="font-semibold">
            {branchName || decoded?.BranchId}
          </span>
          {assignedWindow && (
            <span className="ml-3">
              • Window{" "}
              <span className="font-semibold">
                {assignedWindow.windowNumber}
              </span>
            </span>
          )}

          <button
            onClick={handleOpenChangeWindow}
            className="ml-4 bg-fuchsia-600 text-white font-semibold px-3 py-1 rounded-md shadow hover:bg-fuchsia-800 transition disabled:opacity-60 text-xs"
          >
            {assignedWindow ? "Change Window" : "Select Window"}
          </button>
        </p>
      </div>
    </header>
  );
};

export default Header;




