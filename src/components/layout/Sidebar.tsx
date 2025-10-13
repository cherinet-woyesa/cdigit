import React from "react";
import { 
  CurrencyDollarIcon,
  CogIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  DocumentTextIcon,
  HandRaisedIcon,
  DocumentCheckIcon
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
    { id: "vouchers", label: "Voucher Dashboard", icon: DocumentCheckIcon },
    { id: "petty", label: "Petty Cash", icon: DocumentTextIcon, badgeCount: 3 },
    { id: "other", label: "Other Services", icon: HandRaisedIcon, badgeCount: 5 },
    { id: "performance", label: "My Performance", icon: ChartBarIcon },
    { id: "settings", label: "Settings", icon: CogIcon },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-fuchsia-700 via-fuchsia-600 to-fuchsia-700 min-h-screen flex flex-col shadow-xl">
      <div className="flex-1">
        {/* Logo & Brand */}
        <div className="px-6 py-6 border-b border-fuchsia-500/30">
          <div className="flex items-center space-x-3">
            <img
              src={cbelogo}
              alt="CBE Logo"
              className="h-12 w-12 object-contain rounded-lg bg-white/10 p-1"
            />
            <div>
              <h2 className="font-bold text-lg text-white">CBE Digital</h2>
              <p className="text-fuchsia-100 text-xs font-medium mt-0.5">Maker Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-all duration-200 group ${
                      isActive
                        ? "bg-white text-fuchsia-700 shadow-lg"
                        : "text-fuchsia-50 hover:bg-fuchsia-600/50 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center">
                      <IconComponent className={`h-5 w-5 mr-3 ${
                        isActive ? "text-fuchsia-700" : "text-fuchsia-100"
                      }`} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    
                    {/* Badge Count */}
                    {item.badgeCount && item.badgeCount > 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full min-w-6 text-center ${
                        isActive 
                          ? "bg-fuchsia-700 text-white" 
                          : "bg-white/20 text-white"
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
      <div className="p-4 border-t border-fuchsia-500/30">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 group border border-white/20"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-sm">Logout</span>
        </button>
        
        {/* Footer Info */}
        <div className="mt-3 px-2 text-center">
          <p className="text-xs text-fuchsia-200">
            &copy; {new Date().getFullYear()} CBE
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;