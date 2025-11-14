import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';

interface AuditorSidebarProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
  metrics: {
    total: number;
    preAudit: number;
    audit: number;
    audited: number;
  };
}

export const AuditorSidebar: React.FC<AuditorSidebarProps> = ({
  currentSection,
  onSectionChange,
  metrics
}) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/staff-login');
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      badge: metrics.total
    },
    {
      id: 'pre-audit',
      label: 'Pre-Audit Queue',
      icon: '📋',
      badge: metrics.preAudit
    },
    {
      id: 'audit',
      label: 'Audit Queue',
      icon: '✅',
      badge: metrics.audit
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: '✓',
      badge: metrics.audited
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: '📈',
      badge: null
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-fuchsia-700">Auditor Panel</h2>
        <p className="text-sm text-gray-600 mt-1">{user?.firstName} {user?.lastName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
              currentSection === item.id
                ? 'bg-fuchsia-50 text-fuchsia-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </div>
            {item.badge !== null && item.badge > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                currentSection === item.id
                  ? 'bg-fuchsia-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className="text-xl">⚙️</span>
          <span className="text-sm">Settings</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};
