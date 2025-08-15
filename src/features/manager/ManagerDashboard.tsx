// src/components/dashboards/ManagerDashboard.tsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  if (!user) {
    return <div className="p-8">Loading user data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-fuchsia-700 text-white py-5 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          {user && (
            <p className="text-sm bg-fuchsia-800 px-3 py-1 rounded-full">
              Welcome, {user.firstName} {user.lastName} ({user.role})
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Navigation Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            onClick={() => handleNavigation('/manager/create-user')}
            className="bg-fuchsia-600 text-white py-6 px-8 rounded-lg shadow-md hover:bg-fuchsia-700 transition text-xl font-semibold"
          >
            Create User/Staff
          </button>
          <button
            onClick={() => handleNavigation('/manager/assign-maker')}
            className="bg-fuchsia-600 text-white py-6 px-8 rounded-lg shadow-md hover:bg-fuchsia-700 transition text-xl font-semibold"
          >
            Assign Maker to Window
          </button>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;