import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useBranch } from './context/BranchContext';
import { useTokenRefresh } from './hooks/useTokenRefresh';
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
import AssignMakerRoute from './features/manager/AssignMakerRoute';
import CreateUserManagerRoute from './features/manager/CreateStaffRoute';
import AdminDashboard from './features/admin/AdminDashboard';
import ManagerDashboard from './features/manager/ManagerDashboard';
import MakerDashboard from './features/maker/MakerDashboard'; // CHANGED: Import MakerDashboard instead of MakerLayout
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
import LanguageSelection from './components/LanguageSelection';
import StaffRouteGuard from './components/StaffRouteGuard';
import OfflineBanner from './components/OfflineBanner';

// Updated ProtectedRoute component
const ProtectedRoute: React.FC<{ role?: string; children: React.ReactNode }> = ({ role, children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const { branch, isLoading: isBranchLoading } = useBranch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is staff (doesn't need branch selection)
    const isStaffRole = user?.role && ['Maker', 'Admin', 'Manager'].includes(user.role);
    
    // Only redirect non-staff users to branch selection
    if (isAuthenticated && user && !branch && !isBranchLoading && 
        !location.pathname.startsWith('/select-branch') &&
        !isStaffRole &&
        user.role === 'Customer') {
      navigate('/select-branch', { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, user, branch, isBranchLoading, location, navigate]);

  if (loading || isBranchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Determine which login page to redirect to based on the current path
    const redirectTo = location.pathname.includes('dashboard') || 
                      ['admin', 'manager', 'maker'].some(role => location.pathname.includes(role))
                      ? '/staff-login' : '/otp-login';
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 mt-2">Required role: {role}, Your role: {user?.role}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// FIXED: DashboardRouter with better role handling
const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log('DashboardRouter - User role:', user?.role);

  // Redirect staff users to their specific dashboards
  useEffect(() => {
    if (user?.role) {
      switch (user.role) {
        case 'Admin':
          if (window.location.pathname === '/dashboard') {
            navigate('/admin-dashboard', { replace: true });
          }
          break;
        case 'Manager':
          if (window.location.pathname === '/dashboard') {
            navigate('/manager-dashboard', { replace: true });
          }
          break;
        case 'Maker':
          if (window.location.pathname === '/dashboard') {
            navigate('/maker-dashboard', { replace: true });
          }
          break;
      }
    }
  }, [user?.role, navigate]);

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
  // Initialize token refresh monitoring
  useTokenRefresh();
  
  return (
    <>
      <OfflineBanner />
      <StaffRouteGuard>
        <Routes>
          {/* Default entry point for CUSTOMERS */}
          <Route path="/" element={<Navigate to="/language-selection" replace />} />
          <Route path="/language-selection" element={<LanguageSelection />} />
          <Route path="/select-branch" element={<BranchSelectionEnhanced />} />
          <Route path="/otp-login" element={<OTPLogin />} />
          
          {/* Staff login route (accessed via link on language selection) */}
          <Route path="/staff-login" element={<StaffLogin />} />
          
          {/* Direct dashboard routes for staff roles - UPDATED to use MakerDashboard */}
          <Route path="/maker-dashboard" element={
            <ProtectedRoute role="Maker">
              <MakerDashboard /> {/* CHANGED: Use MakerDashboard instead of MakerLayout */}
            </ProtectedRoute>
          } />
          <Route path="/admin-dashboard" element={
            <ProtectedRoute role="Admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/manager-dashboard" element={
            <ProtectedRoute role="Manager">
              <ManagerDashboard />
            </ProtectedRoute>
          } />

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

          {/* Main dashboard route */}
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

          {/* Role-specific dashboard routes (alternative paths) */}
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
              <MakerDashboard /> {/* CHANGED: Use MakerDashboard instead of MakerLayout */}
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

          {/* Fallback route - default to customer flow (language selection) */}
          <Route path="*" element={<Navigate to="/language-selection" replace />} />
        </Routes>
      </StaffRouteGuard>
    </>
  );
}

export default App;