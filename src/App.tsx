import { Routes, Route } from 'react-router-dom';
import OTPLogin from './features/auth/OTPLogin';
import Dashboard from './features/dashboard/Dashboard';
import CashDeposit from './features/forms/cashDeposit/CashDeposit';
import CashDepositConfirmation from './features/forms/cashDeposit/CashDepositConfirmation';
import CashWithdrawal from './features/forms/cashWithdrawal/CashWithDrawal';
import CashWithDrawalConfirmation from './features/forms/cashWithdrawal/CashWithDrawalConfirmation';
import AccountOpening from './features/forms/accountOpening/AccountOpening';
import LanguageSwitcher from './components/LanguageSwitcher';
import './i18n';


function App() {
  return (
    <>
      <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 1000 }}>
        <LanguageSwitcher />
      </div>
      <Routes>
        <Route path="/" element={<OTPLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/form/cash-deposit" element={<CashDeposit />} />
        <Route path="/form/cash-deposit/cashdepositconfirmation" element={<CashDepositConfirmation />} />
        <Route path="/form/cash-withdrawal" element={<CashWithdrawal />} />
        <Route path="/form/cash-withdrawal/cashwithdrawalconfirmation" element={<CashWithDrawalConfirmation />} />
        <Route path="/form/account-opening" element={<AccountOpening />} />
      </Routes>
    </>
  );
}

export default App;