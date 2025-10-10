import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';

// This component ensures staff users bypass branch selection and go to correct dashboards
const StaffRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { branch, isLoading } = useBranch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isStaffRole = user?.role && ['Maker', 'Admin', 'Manager'].includes(user.role);
    
    if (isAuthenticated && isStaffRole && !isLoading) {
      console.log('StaffRouteGuard: Staff user detected, checking redirects');
      console.log('StaffRouteGuard: Current path:', location.pathname);
      console.log('StaffRouteGuard: User role:', user.role);
      
      // If staff user is on branch selection page, redirect to their dashboard
      if (location.pathname === '/select-branch') {
        console.log('StaffRouteGuard: Redirecting staff user from branch selection');
        switch (user.role) {
          case 'Maker':
            navigate('/maker-dashboard', { replace: true });
            break;
          case 'Admin':
            navigate('/admin-dashboard', { replace: true });
            break;
          case 'Manager':
            navigate('/manager-dashboard', { replace: true });
            break;
          default:
            navigate('/dashboard', { replace: true });
        }
        return;
      }
      
      // Also redirect if staff user ends up on customer dashboard or generic dashboard
      if (location.pathname === '/dashboard' || location.pathname === '/customer/dashboard') {
        console.log('StaffRouteGuard: Redirecting staff user from customer dashboard');
        switch (user.role) {
          case 'Maker':
            navigate('/maker-dashboard', { replace: true });
            break;
          case 'Admin':
            navigate('/admin-dashboard', { replace: true });
            break;
          case 'Manager':
            navigate('/manager-dashboard', { replace: true });
            break;
        }
        return;
      }
      
      // Redirect from OTP login if staff user somehow gets there
      if (location.pathname === '/otp-login') {
        console.log('StaffRouteGuard: Redirecting staff user from OTP login to staff login');
        navigate('/staff-login', { replace: true });
        return;
      }
    }
    
    // If customer user ends up on staff login, redirect to OTP login
    if (isAuthenticated && user?.role === 'Customer' && location.pathname === '/staff-login') {
      console.log('StaffRouteGuard: Redirecting customer from staff login to OTP login');
      navigate('/otp-login', { replace: true });
      return;
    }
  }, [user, isAuthenticated, isLoading, location, navigate]);

  return <>{children}</>;
};

export default StaffRouteGuard;