import Entrypoint from './Entrypoint';
import Welcome from './components/Welcome';
import ReceptionistDashboard from './features/receptionist/ReceptionistDashboard';
import QRLogin from './features/auth/QRLogin';
import VipBooking from './features/vip/VipBooking';
import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTokenRefresh } from './hooks/useTokenRefresh';
import ProtectedRoute from './components/ProtectedRoute';
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
import DocumentManagement from './features/documents/DocumentManagement';
import KioskMode from './features/customer/KioskMode';
import LostPassbookReplacementForm from './features/customer/forms/lostPassbookReplacement/LostPassbookReplacementForm';
import MerchantAccountOpeningApplicationForm from './features/customer/forms/merchantAccountOpening/MerchantAccountOpeningApplicationForm';
import FixedTimeDepositAccountRequestForm from './features/customer/forms/fixedTimeDepositAccountRequest/FixedTimeDepositAccountRequestForm';
import AgentAccountOpeningForm from './features/customer/forms/agentAccountOpening/AgentAccountOpeningForm';
import AdditionalPOSRequestForm from './features/customer/forms/additionalPosRequest/AdditionalPosRequest';
import ChequeReturnSlipForm from './features/customer/forms/chequeReturnSlip/ChequeReturnSlip';
import BalanceConfirmation from './features/customer/forms/balanceConfirmation/BalanceConfirmation';
import BalanceConfirmationConfirmation from './features/customer/forms/balanceConfirmation/BalanceConfirmationConfirmation';
import CheckDeposit from './features/customer/forms/checkDeposit/CheckDeposit';
import CheckDepositConfirmation from './features/customer/forms/checkDeposit/CheckDepositConfirmation';
import ChequeBookRequest from './features/customer/forms/chequeBookRequest/ChequeBookRequest';
import ChequeBookRequestConfirmation from './features/customer/forms/chequeBookRequest/ChequeBookRequestConfirmation';
import CheckWithdrawal from './features/customer/forms/checkWithdrawal/CheckWithdrawal';
import CheckWithdrawalConfirmation from './features/customer/forms/checkWithdrawal/CheckWithdrawalConfirmation';
import CashDiscrepancyReport from './features/customer/forms/cashDiscrepancyReport/CashDiscrepancyReport';
import CashDiscrepancyReportConfirmation from './features/customer/forms/cashDiscrepancyReport/CashDiscrepancyReportConfirmation';
import CorporateCustomer from './features/customer/forms/corporateCustomer/CorporateCustomer';
import CorporateCustomerConfirmation from './features/customer/forms/corporateCustomer/CorporateCustomerConfirmation';
import CustomerIdMerge from './features/customer/forms/customerIdMerge/CustomerIdMerge';
import CustomerIdMergeConfirmation from './features/customer/forms/customerIdMerge/CustomerIdMergeConfirmation';
import CustomerProfileChange from './features/customer/forms/customerProfileChange/CustomerProfileChange';
import CustomerProfileChangeConfirmation from './features/customer/forms/customerProfileChange/CustomerProfileChangeConfirmation';
import POSDeliveryForm from './features/customer/forms/posDeliveryForm/POSDeliveryForm';
import POSDeliveryFormConfirmation from './features/customer/forms/posDeliveryForm/POSDeliveryFormConfirmation';
import SpecialChequeClearance from './features/customer/forms/specialChequeClearance/SpecialChequeClearance';
import SpecialChequeClearanceConfirmation from './features/customer/forms/specialChequeClearance/SpecialChequeClearanceConfirmation';
import TicketMandateRequest from './features/customer/forms/ticketMandateRequest/TicketMandateRequest';
import TicketMandateRequestConfirmation from './features/customer/forms/ticketMandateRequest/TicketMandateRequestConfirmation';

// Import the new providers
import { NotificationProvider } from './context/NotificationContext';
import { FeedbackProvider } from './context/FeedbackContext';
import { MultiChannelBranchProvider } from './context/MultiChannelBranchContext';
import { QRCodeScanFlow } from './components/QRCodeScanFlow';
import { TabletConfigScreen } from './components/TabletConfigScreen';

// Import test utilities for development
import './utils/testApprovalWorkflows';
import QrLoginPage from './features/auth/QrLoginPage';
import AuditorDashboard from './features/auditor/AuditorDashboard';
import AuthorizerDashboard from './features/authorizer/AuthorizerDashboard';
// import GreeterDashboard from './features/greeter/GreeterDashboard';

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
        case 'Auditor':
          if (window.location.pathname === '/dashboard') {
            navigate('/auditor-dashboard', { replace: true });
          }
          break;
        case 'Authorizer':
          if (window.location.pathname === '/dashboard') {
            navigate('/authorizer-dashboard', { replace: true });
          }
          break;
        case 'Greeter':
          if (window.location.pathname === '/dashboard') {
            navigate('/greeter-dashboard', { replace: true });
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
  if (user?.role === 'Auditor') {
    return <AuditorDashboard />;
  }
  if (user?.role === 'Authorizer') {
    return <AuthorizerDashboard />;
  }
  // if (user?.role === 'Greeter') {
  //   return <GreeterDashboard />;
  // }
  // Always show customer dashboard for unauthenticated users or customers
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
    <NotificationProvider>
      <FeedbackProvider>
        <MultiChannelBranchProvider>
          <StaffRouteGuard>
            <Routes>
            {/* Default entry point for ALL users */}
            <Route path="/" element={<Entrypoint />} />
            <Route path="/welcome" element={<Welcome />} />
            {/* Default entry point for CUSTOMERS */}
            <Route path="/language-selection" element={<LanguageSelection />} />
            <Route path="/select-branch" element={<BranchSelectionEnhanced />} />
            <Route path="/otp-login" element={<OTPLogin />} />
            <Route path="/qr-login" element={<QRLogin />} />
            <Route path="/qr-login/:branchId/:token" element={<QRCodeScanFlow />} />
            <Route path="/tablet-config" element={<TabletConfigScreen />} />
            <Route path="/vip-booking" element={<VipBooking />} />
            
            {/* Staff login route (accessed via link on language selection) */}
            <Route path="/staff-login" element={<StaffLogin />} />
            
            {/* Direct dashboard routes for staff roles */}
            <Route path="/maker-dashboard" element={<MakerDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/manager-dashboard" element={<ManagerDashboard />} />
            {/* New routes for Auditor and Authorizer roles */}
            <Route path="/auditor-dashboard" element={<AuditorDashboard />} />
            <Route path="/authorizer-dashboard" element={<AuthorizerDashboard />} />
            {/* New route for Greeter role */}
            {/* <Route path="/greeter-dashboard" element={
              <ProtectedRoute role="Greeter">
                <GreeterDashboard />
              </ProtectedRoute>
            } /> */}

            {/* Public forms */}
            <Route path="/form/account-opening" element={<AccountOpeningForm />} />
            <Route path="/form/rtgs-transfer" element={<RTGSTransfer />} />
            <Route path="/form/ebanking" element={<EBankingApplication />} />
            <Route path="/form/cbe-birr" element={<CbeBirrRegistration />} />

            {/* Protected forms */}
            <Route path="/form/cbe-birr/confirmation" element={<CbeBirrRegistrationConfirmation />} />
            <Route path="/form/rtgs-transfer/confirmation" element={<RTGSTransferConfirmation />} />
            <Route path="/form/ebanking/confirmation" element={<EBankingConfirmation />} />

            {/* Main dashboard route */}
            <Route path="/dashboard" element={<DashboardRouter />} />

            {/* Customer forms */}
            <Route path="/form/cash-deposit" element={<CashDeposit />} />
            <Route path="/form/cash-deposit/cashdepositconfirmation" element={<CashDepositConfirmation />} />
            <Route path="/form/cash-withdrawal" element={<CashWithdrawal />} />
            <Route path="/form/cash-withdrawal/cashwithdrawalconfirmation" element={
              <CashWithDrawalConfirmation />
            } />
            <Route path="/form/fund-transfer" element={<FundTransfer />} />
            <Route path="/form/fund-transfer/confirmation" element={<FundTransferConfirmation />} />
            <Route path="/customer/transaction-history" element={<TransactionHistory />} />

            {/* Direct customer dashboard route */}
            <Route path="/customer/dashboard" element={<Dashboard />} />

            {/* Manager routes */}
            <Route path="/manager/create-user" element={<CreateUserManagerRoute />} />
            <Route path="/manager/assign-maker" element={<AssignMakerRoute />} />

            {/* Role-specific dashboard routes (alternative paths) */}
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/manager" element={<ManagerDashboard />} />
            <Route path="/dashboard/maker" element={<MakerDashboard />} />
            
            {/* New routes for Auditor and Authorizer roles */}
            <Route path="/dashboard/auditor" element={<AuditorDashboard />} />
            <Route path="/dashboard/authorizer" element={<AuthorizerDashboard />} />
            {/* New route for Greeter role */}
            {/* <Route path="/dashboard/greeter" element={
              <ProtectedRoute role="Greeter">
                <GreeterDashboard />
              </ProtectedRoute>
            } /> */}
            
            {/* Additional forms */}
            <Route path="/form/pos-request" element={<POSRequest />} />
            <Route path="/form/pos-request/confirmation" element={<POSRequestConfirmation />} />
            
            {/* Staff dashboard routes */}
            <Route path="/staff-dashboard" element={<MakerDashboard />} />
            
            {/* Kiosk mode */}
            <Route path="/kiosk" element={<KioskMode />} />

            {/* Newly added forms */}
            <Route path="/form/lost-passbook-replacement" element={<LostPassbookReplacementForm />} />
            <Route path="/form/merchant-account-opening" element={<MerchantAccountOpeningApplicationForm />} />
            <Route path="/form/fixed-time-deposit" element={<FixedTimeDepositAccountRequestForm />} />
            <Route path="/form/agent-account-opening" element={<AgentAccountOpeningForm />} />
            <Route path="/form/additional-pos-request" element={<AdditionalPOSRequestForm />} />
            <Route path="/form/cheque-return-slip" element={<ChequeReturnSlipForm />} />
            
            {/* Missing frontend forms - placeholders for future implementation */}
            <Route path="/form/balance-confirmation" element={<BalanceConfirmation />} />
            <Route path="/form/balance-confirmation/confirmation" element={<BalanceConfirmationConfirmation />} />
            <Route path="/form/check-deposit" element={<CheckDeposit />} />
            <Route path="/form/check-deposit/confirmation" element={<CheckDepositConfirmation />} />
            <Route path="/form/check-withdrawal" element={<CheckWithdrawal />} />
            <Route path="/form/check-withdrawal/confirmation" element={<CheckWithdrawalConfirmation />} />
            <Route path="/form/cheque-book-request" element={<ChequeBookRequest />} />
            <Route path="/form/cheque-book-request/confirmation" element={<ChequeBookRequestConfirmation />} />
            <Route path="/form/cash-discrepancy-report" element={<CashDiscrepancyReport />} />
            <Route path="/form/cash-discrepancy-report/confirmation" element={<CashDiscrepancyReportConfirmation />} />
            <Route path="/form/corporate-customer" element={<CorporateCustomer />} />
            <Route path="/form/corporate-customer/confirmation" element={<CorporateCustomerConfirmation />} />
            <Route path="/form/customer-id-merge" element={<CustomerIdMerge />} />
            <Route path="/form/customer-id-merge/confirmation" element={<CustomerIdMergeConfirmation />} />
            <Route path="/form/customer-profile-change" element={<CustomerProfileChange />} />
            <Route path="/form/customer-profile-change/confirmation" element={<CustomerProfileChangeConfirmation />} />
            <Route path="/form/petty-cash" element={<div>Petty Cash Form - Coming Soon</div>} />
            <Route path="/form/petty-cash/confirmation" element={<div>Petty Cash Form Success - Coming Soon</div>} />
            <Route path="/form/phone-block" element={<div>Phone Block - Coming Soon</div>} />
            <Route path="/form/phone-block/confirmation" element={<div>Phone Block Success - Coming Soon</div>} />
            <Route path="/form/pos-delivery" element={<POSDeliveryForm />} />
            <Route path="/form/pos-delivery/confirmation" element={<POSDeliveryFormConfirmation />} />
            <Route path="/form/special-cheque-clearance" element={<SpecialChequeClearance />} />
            <Route path="/form/special-cheque-clearance/confirmation" element={<SpecialChequeClearanceConfirmation />} />
            <Route path="/form/ticket-mandate-request" element={<TicketMandateRequest />} />
            <Route path="/form/ticket-mandate-request/confirmation" element={<TicketMandateRequestConfirmation />} />
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </StaffRouteGuard>
        </MultiChannelBranchProvider>
      </FeedbackProvider>
    </NotificationProvider>
  );
}

export default App;