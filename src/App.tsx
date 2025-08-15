import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import OTPLogin from './features/customer/OTPLogin';
import StaffLogin from './components/StaffLogin';
import CashDeposit from './features/customer/cashDeposit/CashDeposit';
import CashDepositConfirmation from './features/customer/cashDeposit/CashDepositConfirmation';
import CashWithdrawal from './features/customer/cashWithdrawal/CashWithDrawal';
import CashWithDrawalConfirmation from './features/customer/cashWithdrawal/CashWithDrawalConfirmation';
import FundTransfer from './features/customer/fundTransfer/FundTransfer';
import AccountOpeningForm from './features/customer/accountOpening/AccountOpeningForm';
import LanguageSwitcher from './components/LanguageSwitcher';
import './i18n';
import CreateBranch from './features/admin/CreateBranch';
import CreateUser from './features/admin/CreateUser';
import ManageAccountTypes from './features/admin/ManageAccountTypes';
import AssignMaker from './features/manager/AssignMaker';
import CreateUserManager from './features/manager/CreateUser';
import AdminDashboard from './features/admin/AdminDashboard';
import ManagerDashboard from './features/manager/ManagerDashboard';
import MakerDashboard from './features/maker/MakerDashboard';
import Dashboard from './features/customer/Dashboard';

// A simple protected route component
const ProtectedRoute: React.FC<{ role?: string; children: React.ReactNode }> = ({ role, children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner
  }

  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'User:', user); // Log authentication state and user

  if (!isAuthenticated) {
    return <Navigate to="/otp-login" replace />; // Redirect to OTP Login if not authenticated
  }

  if (role && user?.role !== role) {
    return <div>Access Denied</div>; // Handle unauthorized access
  }

  return <>{children}</>;
};

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'Admin') {
    return <AdminDashboard />;
  }
  if (user?.role === 'Manager') {
    return <ManagerDashboard />;
  }
  if (user?.role === 'Maker') {
    return <MakerDashboard />;
  }

  return <div>Access Denied</div>; // Handle unexpected roles
};

// Main App component
function App() {
  return (
    <>
      <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 1000 }}>
        <LanguageSwitcher />
      </div>
      <Routes>
        <Route path="/" element={<Navigate to="/otp-login" replace />} /> {/* Redirect to OTP Login */}
        <Route path="/otp-login" element={<OTPLogin />} />
        <Route path="/staff-login" element={<StaffLogin />} />
        <Route path="/form/account-opening" element={<AccountOpeningForm />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        } />

        <Route path="/form/cash-deposit" element={
          <ProtectedRoute role="Maker">
            <CashDeposit />
          </ProtectedRoute>
        } />
        <Route path="/form/cash-deposit/cashdepositconfirmation" element={
          <ProtectedRoute role="Maker">
            <CashDepositConfirmation />
          </ProtectedRoute>
        } />
        <Route path="/form/cash-withdrawal" element={
          <ProtectedRoute role="Maker">
            <CashWithdrawal />
          </ProtectedRoute>
        } />
        <Route path="/form/cash-withdrawal/cashwithdrawalconfirmation" element={
          <ProtectedRoute role="Maker">
            <CashWithDrawalConfirmation />
          </ProtectedRoute>
        } />

        <Route path="/form/fund-transfer" element={
          <ProtectedRoute>
            <FundTransfer />
          </ProtectedRoute>
        } />

        {/* Added routes for admin actions */}
        <Route path="/admin/create-branch" element={
          <ProtectedRoute role="Admin">
            <CreateBranch />
          </ProtectedRoute>
        } />
        <Route path="/admin/create-user" element={
          <ProtectedRoute role="Admin">
            <CreateUser />
          </ProtectedRoute>
        } />
        <Route path="/admin/manage-account-types" element={
          <ProtectedRoute role="Admin">
            <ManageAccountTypes />
          </ProtectedRoute>
        } />

        {/* Added routes for manager actions */}
        <Route path="/manager/create-user" element={
          <ProtectedRoute role="Manager">
            <CreateUserManager />
          </ProtectedRoute>
        } />
        <Route path="/manager/assign-maker" element={
          <ProtectedRoute role="Manager">
            <AssignMaker />
          </ProtectedRoute>
        } />

        {/* Added routes for role-based dashboards */}
        <Route path="/dashboard/admin" element={
          <ProtectedRoute role="Admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/manager" element={
          <ProtectedRoute role="Manager">
            <ManagerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/maker" element={
          <ProtectedRoute role="Maker">
            <MakerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/customer/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

export default App;