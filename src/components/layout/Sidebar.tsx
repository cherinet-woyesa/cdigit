import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import cbelogo from '../../assets/logo.jpg';
import {
  faMoneyBillWave,
  faSackDollar,
  faShuffle,
  faList,
  faHandHoldingDollar,
  faChartLine,
  faCog,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";

interface SidebarProps {
  onNavigate: (section: string) => void;
  activeSection: string;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, activeSection, onLogout }) => {
  const navItems = [
    { id: "transactions", label: "Transactions", icon: faMoneyBillWave },
    { id: "other", label: "Other Requests", icon: faList },
    { id: "petty", label: "Petty Cash", icon: faHandHoldingDollar },
    { id: "performance", label: "My Performance", icon: faChartLine },
    { id: "settings", label: "Settings", icon: faCog },
  ];

  return (
    <aside className="w-64 bg-fuchsia-700 text-white min-h-screen flex flex-col justify-between shadow-lg">
      <div>
        <div className="px-6 py-4 text-center border-b border-fuchsia-600">
          <img
            src={cbelogo}
            alt="CBE Logo"
            className="h-16 w-16 object-contain rounded-full mx-auto border-2 border-fuchsia-200/50 mb-2"
          />
          <h2 className="font-semibold text-lg">CBE Digital</h2>
        </div>
        <nav className="mt-6">
          <ul>
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center px-6 py-3 text-left hover:bg-fuchsia-600 transition rounded-md ${activeSection === item.id ? "bg-fuchsia-800" : ""
                    }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="mr-3" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="px-6 py-4 border-t border-fuchsia-600">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700"
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;