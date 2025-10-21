/**
 * usePermissions Hook
 * Provides RBAC permission checking utilities
 */

import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Permission, UserRole } from '../config/rbacMatrix';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  getRolePermissions 
} from '../config/rbacMatrix';
import authorizationAuditService from '../services/authorizationAuditService';

interface UsePermissionsReturn {
  /**
   * Check if current user has a specific permission
   */
  can: (permission: Permission, options?: { logDenial?: boolean }) => boolean;
  
  /**
   * Check if current user has any of the specified permissions
   */
  canAny: (permissions: Permission[], options?: { logDenial?: boolean }) => boolean;
  
  /**
   * Check if current user has all of the specified permissions
   */
  canAll: (permissions: Permission[], options?: { logDenial?: boolean }) => boolean;
  
  /**
   * Get all permissions for current user
   */
  permissions: Permission[];
  
  /**
   * Current user role
   */
  role: UserRole | null;
  
  /**
   * Check if user is staff (Maker, Manager, or Admin)
   */
  isStaff: boolean;
  
  /**
   * Check if user is manager or admin
   */
  canApprove: boolean;
  
  /**
   * Check if user is admin
   */
  isAdmin: boolean;
}

export const usePermissions = (): UsePermissionsReturn => {
  const { user } = useAuth();
  const userRole = (user?.role as UserRole) || null;

  const permissions = useMemo(() => {
    if (!userRole) return [];
    return getRolePermissions(userRole);
  }, [userRole]);

  const can = (permission: Permission, options?: { logDenial?: boolean }): boolean => {
    if (!userRole) {
      if (options?.logDenial) {
        authorizationAuditService.logAuthorization({
          userId: user?.id || 'anonymous',
          userRole: 'Customer' as UserRole,
          action: 'permission_check',
          resource: permission,
          permission,
          granted: false,
          denialReason: 'User not authenticated',
        });
      }
      return false;
    }

    const granted = hasPermission(userRole, permission);

    if (!granted && options?.logDenial && user) {
      authorizationAuditService.logAuthorization({
        userId: user.id,
        userRole,
        action: 'permission_check',
        resource: permission,
        permission,
        granted: false,
        denialReason: `Role ${userRole} does not have ${permission} permission`,
      });
    }

    return granted;
  };

  const canAny = (permissions: Permission[], options?: { logDenial?: boolean }): boolean => {
    if (!userRole) {
      if (options?.logDenial) {
        authorizationAuditService.logAuthorization({
          userId: user?.id || 'anonymous',
          userRole: 'Customer' as UserRole,
          action: 'permission_check',
          resource: permissions.join(','),
          granted: false,
          denialReason: 'User not authenticated',
        });
      }
      return false;
    }

    const granted = hasAnyPermission(userRole, permissions);

    if (!granted && options?.logDenial && user) {
      authorizationAuditService.logAuthorization({
        userId: user.id,
        userRole,
        action: 'permission_check',
        resource: permissions.join(','),
        granted: false,
        denialReason: `Role ${userRole} does not have any of the required permissions`,
      });
    }

    return granted;
  };

  const canAll = (permissions: Permission[], options?: { logDenial?: boolean }): boolean => {
    if (!userRole) {
      if (options?.logDenial) {
        authorizationAuditService.logAuthorization({
          userId: user?.id || 'anonymous',
          userRole: 'Customer' as UserRole,
          action: 'permission_check',
          resource: permissions.join(','),
          granted: false,
          denialReason: 'User not authenticated',
        });
      }
      return false;
    }

    const granted = hasAllPermissions(userRole, permissions);

    if (!granted && options?.logDenial && user) {
      const missingPermissions = permissions.filter(p => !hasPermission(userRole, p));
      authorizationAuditService.logAuthorization({
        userId: user.id,
        userRole,
        action: 'permission_check',
        resource: permissions.join(','),
        granted: false,
        denialReason: `Role ${userRole} missing permissions: ${missingPermissions.join(', ')}`,
      });
    }

    return granted;
  };

  const isStaff = useMemo(() => {
    return userRole !== null && ['Maker', 'Manager', 'Admin', 'Auditor', 'Authorizer', 'Greeter'].includes(userRole);
  }, [userRole]);

  const canApprove = useMemo(() => {
    return userRole !== null && ['Manager', 'Admin', 'Authorizer'].includes(userRole);
  }, [userRole]);

  const isAdmin = useMemo(() => {
    return userRole === 'Admin';
  }, [userRole]);

  return {
    can,
    canAny,
    canAll,
    permissions,
    role: userRole,
    isStaff,
    canApprove,
    isAdmin,
  };
};

export default usePermissions;