import React from "react";
import { 
  CurrencyDollarIcon,
  CogIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  DocumentTextIcon,
  HandRaisedIcon,
  DocumentCheckIcon
} from "@heroicons/react/24/outline";
import cbelogo from '../../../../assets/logo.jpg';

interface SidebarProps {
  onNavigate: (section: string) => void;
  activeSection: string;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, activeSection, onLogout }) => {
  // Custom icon component for search
  const MagnifyingGlassIcon = (props: any) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const navItems = [
    { id: "transactions", label: "Transactions", icon: CurrencyDollarIcon, badgeCount: 12 },
    { id: "vouchers", label: "Voucher Dashboard", icon: DocumentCheckIcon },
    { id: "petty", label: "Petty Cash", icon: DocumentTextIcon, badgeCount: 3 },
    { id: "other", label: "Other Services", icon: HandRaisedIcon, badgeCount: 5 },
    { id: "account-search", label: "Account Search", icon: MagnifyingGlassIcon },
    { id: "performance", label: "My Performance", icon: ChartBarIcon },
    { id: "settings", label: "Settings", icon: CogIcon },
  ];

  return (
    <aside className="w-64 bg-gray-800 min-h-screen flex flex-col shadow-xl">
      <div className="flex-1">
        {/* Logo & Brand */}
        <div className="px-6 py-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <img
              src={cbelogo}
              alt="CBE Logo"
              className="h-12 w-12 object-contain rounded-lg bg-white/10 p-1"
            />
            <div>
              <h2 className="font-bold text-lg text-white">CBE Digital</h2>
              <p className="text-gray-300 text-xs font-medium mt-0.5">Maker Portal</p>
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
                        ? "bg-amber-500 text-white shadow-md"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center">
                      <IconComponent className={`h-5 w-5 mr-3 ${
                        isActive ? "text-white" : "text-gray-400"
                      }`} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    
                    {/* Badge Count */}
                    {item.badgeCount && item.badgeCount > 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full min-w-6 text-center ${
                        isActive 
                          ? "bg-white text-amber-600" 
                          : "bg-gray-700 text-gray-300"
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
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 group"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-sm">Logout</span>
        </button>
        
        {/* Footer Info */}
        <div className="mt-3 px-2 text-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} CBE
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;