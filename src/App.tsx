import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import OTPLogin from './features/auth/OTPLogin';
import StaffLogin from './features/auth/StaffLogin';
import CashDeposit from './features/customer/forms/cashDeposit/CashDeposit';
import CashDepositConfirmation from './features/customer/forms/cashDeposit/CashDepositConfirmation';
import CashWithdrawal from './features/customer/forms/cashWithdrawal/CashWithDrawal';
import CashWithDrawalConfirmation from './features/customer/forms/cashWithdrawal/CashWithDrawalConfirmation';
import FundTransfer from './features/customer/forms/fundTransfer/FundTransfer';
import FundTransferConfirmation from './features/customer/forms/fundTransfer/FundTransferConfirmation';
import AccountOpeningForm from './features/customer/forms/accountOpening/AccountOpeningForm';
import RTGSTransfer from './features/customer/forms/RTGSTransfer/RTGSTransfer';
import EBankingApplication from './features/customer/forms/EBankingApplication/EBankingApplication';
import CbeBirrRegistration from './features/customer/forms/CbeBirrRegistration/CbeBirrRegistration';
import LanguageSwitcher from './components/LanguageSwitcher';
import './i18n';
import CreateBranch from './features/admin/CreateBranch';
import CreateUser from './features/admin/CreateUser';
import ManageAccountTypes from './features/admin/ManageAccountTypes';
import AssignMakerRoute from './features/manager/AssignMakerRoute';
import CreateUserManagerRoute from './features/manager/CreateStaffRoute';
import AdminDashboard from './features/admin/AdminDashboard';
import ManagerDashboard from './features/manager/ManagerDashboard';
import MakerDashboard from './features/maker/MakerDashboard';
import Dashboard from './features/customer/Dashboard';
import TransactionHistory from './features/customer/TransactionHistory';
import CbeBirrRegistrationConfirmation from './features/customer/forms/CbeBirrRegistration/CbeBirrRegistrationConfirmation';
import RTGSTransferConfirmation from './features/customer/forms/RTGSTransfer/RTGSTransferConfirmation';
import EBankingConfirmation from './features/customer/forms/EBankingApplication/EBankingConfirmation';
// import ChequeBookRequest from './features/customer/forms/chequeBookRequest/ChequeBookRequest';
// import ChequeBookRequestConfirmation from './features/customer/forms/chequeBookRequest/ChequeBookRequestConfirmation';
import POSRequest from './features/customer/forms/posRequest/POSRequest';
import POSRequestConfirmation from './features/customer/forms/posRequest/POSRequestConfirmation';
import StatementRequestForm from './features/customer/forms/statementRequest/StatementRequestForm';
import StatementRequestConfirmation from './features/customer/forms/statementRequest/StatementRequestConfirmation';
import CbeBirrLinkForm from './features/customer/forms/cbeBirrLink/CbeBirrLinkForm';
import CbeBirrLinkConfirmation from './features/customer/forms/cbeBirrLink/CbeBirrLinkConfirmation';
import StopPaymentForm from './features/customer/forms/stopPayment/StopPaymentForm';
import StopPaymentConfirmation from './features/customer/forms/stopPayment/StopPaymentConfirmation';
import PettyCashForm from './features/internal/forms/pettyCash/PettyCashForm';
import PettyCashConfirmation from './features/internal/forms/pettyCash/PettyCashConfirmation';

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
        <Route path="/form/cbe-birr" element={
          <ProtectedRoute>
            <CbeBirrRegistration />
          </ProtectedRoute>
        } />
        <Route path="/form/cbe-birr/confirmation" element={
          <ProtectedRoute>
            <CbeBirrRegistrationConfirmation />
          </ProtectedRoute>
        } />
        <Route path="/form/rtgs-transfer" element={
          <ProtectedRoute>
            <RTGSTransfer />
          </ProtectedRoute>
        } />
        <Route path="/form/rtgs-transfer/confirmation" element={
          <ProtectedRoute>
            <RTGSTransferConfirmation />
          </ProtectedRoute>
        } />
        <Route path="/form/ebanking" element={
          <ProtectedRoute>
            <EBankingApplication />
          </ProtectedRoute>
        } />
        <Route path="/form/ebanking/confirmation" element={
          <ProtectedRoute>
            <EBankingConfirmation />
          </ProtectedRoute>
        } />  
        <Route path="/form/rtgs-transfer" element={<RTGSTransfer />} />
        <Route path="/form/ebanking" element={<EBankingApplication />} />
        <Route path="/form/cbe-birr" element={<CbeBirrRegistration />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        } />

        <Route path="/form/cash-deposit" element={
          <ProtectedRoute>
            <CashDeposit />
          </ProtectedRoute>
        } />
        <Route path="/form/cash-deposit/cashdepositconfirmation" element={
          <ProtectedRoute>
            <CashDepositConfirmation />
          </ProtectedRoute>
        } />
        <Route path="/form/cash-withdrawal" element={
          <ProtectedRoute>
            <CashWithdrawal />
          </ProtectedRoute>
        } />
        <Route path="/form/cash-withdrawal/cashwithdrawalconfirmation" element={
          <ProtectedRoute>
            <CashWithDrawalConfirmation />
          </ProtectedRoute>
        } />

        <Route path="/form/fund-transfer" element={
          <ProtectedRoute>
            <FundTransfer />
          </ProtectedRoute>
        } />
        <Route path="/fund-transfer-confirmation" element={
          <ProtectedRoute>
            <FundTransferConfirmation />
          </ProtectedRoute>
        } />
        <Route path="/customer/transaction-history" element={
          <ProtectedRoute>
            <TransactionHistory />
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
            <CreateUserManagerRoute />
          </ProtectedRoute>
        } />
        <Route path="/manager/assign-maker" element={
          <ProtectedRoute role="Manager">
            <AssignMakerRoute />
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
        
        <Route path="/form/pos-request" element={
          <ProtectedRoute>
            <POSRequest />
          </ProtectedRoute>
        } />
        <Route path="/form/pos-request/confirmation" element={
          <ProtectedRoute>
            <POSRequestConfirmation />
          </ProtectedRoute>
        } />
        
        {/* Statement Request Routes */}
        <Route path="/form/statement-request" element={
          <ProtectedRoute>
            <StatementRequestForm />
          </ProtectedRoute>
        } />
        <Route path="/form/statement-request/confirmation" element={
          <ProtectedRoute>
            <StatementRequestConfirmation />
          </ProtectedRoute>
        } />
        
        {/* CBE-Birr Link Routes */}
        <Route path="/form/cbe-birr-link" element={
          <ProtectedRoute>
            <CbeBirrLinkForm />
          </ProtectedRoute>
        } />
        <Route path="/form/cbe-birr-link/confirmation" element={
          <ProtectedRoute>
            <CbeBirrLinkConfirmation />
          </ProtectedRoute>
        } />
        
        {/* Stop Payment Order Routes */}
        <Route path="/form/stop-payment" element={
          <ProtectedRoute>
            <StopPaymentForm />
          </ProtectedRoute>
        } />
        <Route path="/form/stop-payment/confirmation" element={
          <ProtectedRoute>
            <StopPaymentConfirmation />
          </ProtectedRoute>
        } />
        
        {/* Internal Routes - Petty Cash */}
        <Route path="/internal/petty-cash" element={
          <ProtectedRoute role="internal">
            <PettyCashForm />
          </ProtectedRoute>
        } />
        <Route path="/internal/petty-cash/confirmation" element={
          <ProtectedRoute role="internal">
            <PettyCashConfirmation />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

export default App;