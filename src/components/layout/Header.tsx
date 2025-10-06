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
    <header className="bg-purple-800 text-white py-12 px-6 flex justify-between items-center shadow-md">
      <div>
        <h1 className="text-2xl font-extrabold">Maker Dashboard</h1>
        <p className="text-purple-100 text-sm">
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
            className="ml-4 bg-purple-700 text-white font-semibold px-4 py-2 rounded-xl shadow hover:bg-purple-800 transition disabled:opacity-60"
          >
            {assignedWindow ? "Change Window" : "Select Window"}
          </button>
        </p>
      </div>
    </header>
  );
};

export default Header;





