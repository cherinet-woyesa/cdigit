import React from "react";
import { 
  CurrencyDollarIcon,
  CogIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  DocumentTextIcon,
  HandRaisedIcon
} from "@heroicons/react/24/outline";
import cbelogo from '../../assets/logo.jpg';

interface SidebarProps {
  onNavigate: (section: string) => void;
  activeSection: string;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, activeSection, onLogout }) => {
  const navItems = [
    { id: "transactions", label: "Transactions", icon: CurrencyDollarIcon, badgeCount: 12 },
    { id: "petty", label: "Petty Cash", icon: DocumentTextIcon, badgeCount: 3 },
    { id: "other", label: "Other Services", icon: HandRaisedIcon, badgeCount: 5 },
    { id: "performance", label: "My Performance", icon: ChartBarIcon },
    { id: "settings", label: "Settings", icon: CogIcon },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-fuchsia-700 to-purple-800 text-white min-h-screen flex flex-col justify-between shadow-xl">
      <div>
        {/* Logo & Brand */}
        <div className="px-6 py-6 text-center border-b border-fuchsia-600/50">
          <div className="flex items-center justify-center space-x-3">
            <img
              src={cbelogo}
              alt="CBE Logo"
              className="h-12 w-12 object-contain rounded-full border-2 border-fuchsia-200/50"
            />
            <div className="text-left">
              <h2 className="font-bold text-lg leading-tight">CBE Digital</h2>
              <p className="text-fuchsia-100 text-xs mt-1">Maker Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-white text-fuchsia-700 shadow-lg transform scale-105"
                        : "text-fuchsia-100 hover:bg-fuchsia-600/50 hover:text-white hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center">
                      <IconComponent className={`h-5 w-5 mr-3 ${
                        isActive ? "text-fuchsia-600" : "text-fuchsia-200"
                      }`} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    
                    {/* Badge Count */}
                    {item.badgeCount && item.badgeCount > 0 && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full min-w-6 text-center ${
                        isActive 
                          ? "bg-fuchsia-100 text-fuchsia-700" 
                          : "bg-fuchsia-500/30 text-fuchsia-100"
                      }`}>
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Logout Section */}
      <div className="p-4 border-t border-fuchsia-600/50">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-100 hover:text-white rounded-xl transition-all duration-200 group border border-red-500/30"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
          <span className="font-semibold">Logout</span>
        </button>
        
        {/* Quick Status */}
        <div className="mt-3 px-2">
          <div className="flex items-center justify-between text-xs text-fuchsia-200/70">
            <span>Status</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Online</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;