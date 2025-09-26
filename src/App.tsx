import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useBranch } from './context/BranchContext';
import OTPLogin from './features/auth/OTPLogin';
import QRTestPage from './features/branch/QRTestPage';
import QRCodeGenerator from './features/branch/QRCodeGenerator';
import BranchSelectionEnhanced from './features/branch/BranchSelectionEnhanced';
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
  const { branch, isLoading: isBranchLoading } = useBranch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated but doesn't have a branch selected
    if (isAuthenticated && user && !branch && !isBranchLoading && !location.pathname.startsWith('/select-branch')) {
      navigate('/select-branch', { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, user, branch, isBranchLoading, location, navigate]);

  if (loading || isBranchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Store the attempted URL for redirecting after login
    return <Navigate to="/otp-login" state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// FIXED: DashboardRouter now handles Customer role properly
const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  console.log('DashboardRouter - User role:', user?.role); // Debug log

  if (user?.role === 'Admin') {
    return <AdminDashboard />;
  }
  if (user?.role === 'Manager') {
    return <ManagerDashboard />;
  }
  if (user?.role === 'Maker') {
    return <MakerDashboard />;
  }
  if (user?.role === 'Customer' || !user?.role) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600">Unknown user role: {user?.role}</p>
      </div>
    </div>
  );
};

// Main App component
function App() {
  return (
    <>
      {/* <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 1000 }}>
        <LanguageSwitcher />
      </div> */}
      <Routes>
        <Route path="/" element={<Navigate to="/select-branch" replace />} />
        <Route path="/select-branch" element={<BranchSelectionEnhanced />} />
        <Route path="/otp-login" element={<OTPLogin />} />
        <Route path="/staff-login" element={<StaffLogin />} />
        
        {/* Public forms */}
        <Route path="/form/account-opening" element={<AccountOpeningForm />} />
        <Route path="/form/rtgs-transfer" element={<RTGSTransfer />} />
        <Route path="/form/ebanking" element={<EBankingApplication />} />
        <Route path="/form/cbe-birr" element={<CbeBirrRegistration />} />

        {/* Protected forms */}
        <Route path="/form/cbe-birr/confirmation" element={
          <ProtectedRoute>
            <CbeBirrRegistrationConfirmation />
          </ProtectedRoute>
        } />
        <Route path="/form/rtgs-transfer/confirmation" element={
          <ProtectedRoute>
            <RTGSTransferConfirmation />
          </ProtectedRoute>
        } />
        <Route path="/form/ebanking/confirmation" element={
          <ProtectedRoute>
            <EBankingConfirmation />
          </ProtectedRoute>
        } />

        {/* Main dashboard route - FIXED: Now handles Customer role */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        } />

        {/* Customer forms */}
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

        {/* Direct customer dashboard route */}
        <Route path="/customer/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Admin routes */}
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

        {/* Manager routes */}
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

        {/* Role-specific dashboard routes */}
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
        
        {/* Additional forms */}
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

        {/* Utility routes */}
        <Route path="/qr-generator" element={<QRCodeGenerator />} />
        <Route path="/qr-test" element={<QRTestPage />} />

        {/* Internal routes */}
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

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/select-branch" replace />} />
      </Routes>
    </>
  );
}

export default App;