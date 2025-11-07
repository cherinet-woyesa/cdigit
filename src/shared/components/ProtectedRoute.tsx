/**
 * Enhanced ProtectedRoute with RBAC Permission Checking
 */

import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { useBranch } from '@context/BranchContext';
import { usePermissions } from '@shared/hooks/usePermissions';
import type { Permission } from '@config/rbacMatrix';
import { AlertCircle, Lock, ShieldOff } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Required user role (legacy support) */
  role?: string;
  /** Required permission(s) for access */
  permission?: Permission;
  /** Multiple permissions (user must have ANY of these) */
  anyPermission?: Permission[];
  /** Multiple permissions (user must have ALL of these) */
  allPermissions?: Permission[];
  /** Require branch selection for customers */
  requireBranch?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  role,
  permission,
  anyPermission,
  allPermissions,
  requireBranch = true,
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const { branch, isLoading: isBranchLoading } = useBranch();
  const { can, canAny, canAll } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();

  // Branch selection logic for customers
  useEffect(() => {
    const isStaffRole = user?.role && ['Maker', 'Admin', 'Manager'].includes(user.role);
    
    if (
      requireBranch &&
      isAuthenticated &&
      user &&
      !branch &&
      !isBranchLoading &&
      !location.pathname.startsWith('/select-branch') &&
      !isStaffRole &&
      user.role === 'Customer'
    ) {
      navigate('/select-branch', { state: { from: location }, replace: true });
    }
  }, [
    requireBranch,
    isAuthenticated,
    user,
    branch,
    isBranchLoading,
    location,
    navigate,
  ]);

  // Loading state
  if (loading || isBranchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fuchsia-50 via-white to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-fuchsia-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Authentication check
  if (!isAuthenticated) {
    const redirectTo = location.pathname.includes('dashboard') || 
                      ['admin', 'manager', 'maker'].some(r => location.pathname.includes(r))
                      ? '/staff-login' 
                      : '/otp-login';
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Role-based check (legacy support)
  if (role && user?.role !== role) {
    return (
      <AccessDenied
        title="Access Denied"
        message={`You don't have permission to access this page.`}
        details={`Required role: ${role}, Your role: ${user?.role}`}
      />
    );
  }

  // Permission-based checks (new RBAC system)
  let hasAccess = true;
  let denialReason = '';

  if (permission) {
    hasAccess = can(permission, { logDenial: true });
    if (!hasAccess) {
      denialReason = `This action requires the "${permission}" permission.`;
    }
  }

  if (anyPermission && anyPermission.length > 0) {
    hasAccess = canAny(anyPermission, { logDenial: true });
    if (!hasAccess) {
      denialReason = `This action requires one of the following permissions: ${anyPermission.join(', ')}`;
    }
  }

  if (allPermissions && allPermissions.length > 0) {
    hasAccess = canAll(allPermissions, { logDenial: true });
    if (!hasAccess) {
      denialReason = `This action requires all of the following permissions: ${allPermissions.join(', ')}`;
    }
  }

  if (!hasAccess) {
    return (
      <AccessDenied
        title="Insufficient Permissions"
        message="You don't have the required permissions to access this resource."
        details={denialReason}
        showContactAdmin
      />
    );
  }

  return <>{children}</>;
};

// Access Denied Component
interface AccessDeniedProps {
  title: string;
  message: string;
  details?: string;
  showContactAdmin?: boolean;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  title,
  message,
  details,
  showContactAdmin = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 px-4">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl p-8 border border-red-100">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldOff className="h-10 w-10 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-red-600 mb-3 text-center">
          {title}
        </h1>

        {/* Message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">{message}</p>
              {details && (
                <p className="text-sm text-red-700 mt-2">{details}</p>
              )}
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
            <p className="text-gray-600">
              <span className="font-medium">Current User:</span> {user.firstName} {user.lastName}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Role:</span> {user.role}
            </p>
          </div>
        )}

        {/* Contact Admin Message */}
        {showContactAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                If you believe you should have access to this resource, please contact your system administrator.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition-colors font-medium"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;
