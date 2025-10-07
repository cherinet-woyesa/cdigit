import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import cbelogo from '../../assets/cbelogo.jpg';
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
    <aside className="w-64 bg-purple-900 text-white min-h-screen flex flex-col justify-between shadow-lg">
      <div>
        <div className="px-6 text-center border-b border-purple-700">
          {/* <img src="assets/logo.jpg" alt="CBE Logo" className="h-12 mx-auto mb-2" /> */}
          <img
            src={cbelogo}
            alt="CBE Logo"
            className="h-13 w-13 object-contain rounded-full border-1 border-fuchsia-200"
          />
          <h2 className="">Commeriacl Bank Of Ethiopia</h2>
        </div>
        <nav className="mt-6">
          <ul>
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center px-6 py-3 text-left hover:bg-purple-800 transition ${activeSection === item.id ? "bg-purple-700" : ""
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
      <div className="px-6 py-4 border-t border-purple-700">
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