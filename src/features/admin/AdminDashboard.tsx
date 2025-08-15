// src/components/dashboards/AdminDashboard.tsx
import React, { useEffect } from 'react';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchList = await authService.getBranches();
        // setBranches(branchList); // Removed unused state setter
      } catch (err) {
        console.error('Failed to fetch branches:', err);
      }
    };
    fetchBranches();
  }, []);

  // Removed unused effect for account types

  // Removed unused variables and their setters

  // Removed unused functions

  // Updated AdminDashboard to include navigation buttons for admin actions
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-fuchsia-700 text-white py-5 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          {user && (
            <p className="text-sm bg-fuchsia-800 px-3 py-1 rounded-full">
              Welcome, {user.firstName} {user.lastName} ({user.role})
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Welcome Banner */}
        <div className="bg-fuchsia-700 text-white p-6 rounded-xl mb-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Admin Actions</h2>
          <p className="opacity-90">Manage branches, users, and account types efficiently.</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => navigate('/admin/create-branch')}
            className="w-full bg-fuchsia-600 text-white py-6 px-8 rounded-lg shadow-md hover:bg-fuchsia-700 transition duration-150 ease-in-out text-lg font-semibold"
          >
            Create Branch
          </button>

          <button
            onClick={() => navigate('/admin/create-user')}
            className="w-full bg-fuchsia-600 text-white py-6 px-8 rounded-lg shadow-md hover:bg-fuchsia-700 transition duration-150 ease-in-out text-lg font-semibold"
          >
            Create Manager/Staff
          </button>

          <button
            onClick={() => navigate('/admin/manage-account-types')}
            className="w-full bg-fuchsia-600 text-white py-6 px-8 rounded-lg shadow-md hover:bg-fuchsia-700 transition duration-150 ease-in-out text-lg font-semibold"
          >
            Manage Account Types
          </button>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;