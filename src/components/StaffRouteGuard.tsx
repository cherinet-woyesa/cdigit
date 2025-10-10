import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';

// This component ensures staff users bypass branch selection
const StaffRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { branch, isLoading } = useBranch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isStaffRole = user?.role && ['Maker', 'Admin', 'Manager'].includes(user.role);
    
    if (isAuthenticated && isStaffRole && !isLoading) {
      console.log('StaffRouteGuard: Staff user detected, checking redirects');
      
      // If staff user is on branch selection page, redirect to their dashboard
      /* if (location.pathname === '/select-branch') {
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
      } */
      
      // Also redirect if staff user ends up on customer dashboard
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
    }
  }, [user, isAuthenticated, isLoading, location, navigate]);

  return <>{children}</>;
};

export default StaffRouteGuard;