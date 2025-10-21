/**
 * Role-Based Access Control (RBAC) Matrix
 * Defines permissions for all user roles in the system
 */

export type UserRole = 'Customer' | 'Maker' | 'Manager' | 'Admin' | 'Auditor' | 'Authorizer' | 'Greeter';

export type Permission =
  // Voucher permissions
  | 'voucher.create'
  | 'voucher.view'
  | 'voucher.edit'
  | 'voucher.delete'
  | 'voucher.approve'
  | 'voucher.reject'
  | 'voucher.verify'
  | 'voucher.forward'
  | 'voucher.audit' // New permission for auditors
  
  // Transaction permissions
  | 'transaction.deposit.create'
  | 'transaction.deposit.approve'
  | 'transaction.withdrawal.create'
  | 'transaction.withdrawal.approve'
  | 'transaction.transfer.create'
  | 'transaction.transfer.approve'
  | 'transaction.rtgs.create'
  | 'transaction.rtgs.approve'
  
  // Account permissions
  | 'account.opening.create'
  | 'account.opening.approve'
  | 'account.view'
  | 'account.modify'
  | 'account.close'
  
  // High-value transaction permissions
  | 'highvalue.approve'
  | 'fx.approve'
  | 'largecash.approve'
  
  // User management permissions
  | 'user.create'
  | 'user.view'
  | 'user.edit'
  | 'user.delete'
  | 'user.assignRole'
  
  // Branch and window management
  | 'branch.manage'
  | 'window.assign'
  | 'window.reassign'
  
  // Audit and reports
  | 'audit.view'
  | 'audit.export'
  | 'reports.generate'
  | 'reports.view'
  | 'audit.compliance' // New permission for auditors
  | 'audit.transactions' // New permission for auditors
  
  // Stop payment and other services
  | 'stoppayment.create'
  | 'stoppayment.approve'
  | 'cheque.request'
  | 'cheque.approve'
  
  // System administration
  | 'system.config'
  | 'system.backup'
  | 'system.restore'
  
  // Authorization permissions
  | 'authorization.approve' // New permission for authorizers
  | 'authorization.reject'  // New permission for authorizers
  | 'authorization.review'  // New permission for authorizers
  
  // Greeter permissions
  | 'customer.greet'        // New permission for greeters
  | 'customer.direct'       // New permission for greeters
  | 'queue.manage'          // New permission for greeters
  | 'information.provide';  // New permission for greeters

/**
 * RBAC Permission Matrix
 * Maps each role to their allowed permissions
 */
export const RBAC_MATRIX: Record<UserRole, Permission[]> = {
  Customer: [
    // Customers can create transactions but not approve
    'voucher.create',
    'voucher.view',
    'transaction.deposit.create',
    'transaction.withdrawal.create',
    'transaction.transfer.create',
    'transaction.rtgs.create',
    'account.opening.create',
    'account.view',
    'stoppayment.create',
    'cheque.request',
  ],
  
  Maker: [
    // Makers (Tellers) can create, view, and verify transactions
    'voucher.create',
    'voucher.view',
    'voucher.edit',
    'voucher.verify',
    'voucher.forward',
    'transaction.deposit.create',
    'transaction.withdrawal.create',
    'transaction.transfer.create',
    'transaction.rtgs.create',
    'account.opening.create',
    'account.view',
    'account.modify',
    'stoppayment.create',
    'cheque.request',
    'reports.view',
  ],
  
  Manager: [
    // Managers can approve transactions and manage operations
    'voucher.create',
    'voucher.view',
    'voucher.edit',
    'voucher.approve',
    'voucher.reject',
    'voucher.verify',
    'voucher.forward',
    'transaction.deposit.create',
    'transaction.deposit.approve',
    'transaction.withdrawal.create',
    'transaction.withdrawal.approve',
    'transaction.transfer.create',
    'transaction.transfer.approve',
    'transaction.rtgs.create',
    'transaction.rtgs.approve',
    'account.opening.create',
    'account.opening.approve',
    'account.view',
    'account.modify',
    'account.close',
    'highvalue.approve',
    'fx.approve',
    'largecash.approve',
    'user.view',
    'window.assign',
    'window.reassign',
    'audit.view',
    'reports.generate',
    'reports.view',
    'stoppayment.create',
    'stoppayment.approve',
    'cheque.request',
    'cheque.approve',
  ],
  
  Admin: [
    // Admins have all permissions
    'voucher.create',
    'voucher.view',
    'voucher.edit',
    'voucher.delete',
    'voucher.approve',
    'voucher.reject',
    'voucher.verify',
    'voucher.forward',
    'transaction.deposit.create',
    'transaction.deposit.approve',
    'transaction.withdrawal.create',
    'transaction.withdrawal.approve',
    'transaction.transfer.create',
    'transaction.transfer.approve',
    'transaction.rtgs.create',
    'transaction.rtgs.approve',
    'account.opening.create',
    'account.opening.approve',
    'account.view',
    'account.modify',
    'account.close',
    'highvalue.approve',
    'fx.approve',
    'largecash.approve',
    'user.create',
    'user.view',
    'user.edit',
    'user.delete',
    'user.assignRole',
    'branch.manage',
    'window.assign',
    'window.reassign',
    'audit.view',
    'audit.export',
    'reports.generate',
    'reports.view',
    'stoppayment.create',
    'stoppayment.approve',
    'cheque.request',
    'cheque.approve',
    'system.config',
    'system.backup',
    'system.restore',
  ],
  
  Auditor: [
    // Auditors can view and audit transactions
    'voucher.view',
    'voucher.audit',
    'transaction.deposit.create',
    'transaction.withdrawal.create',
    'transaction.transfer.create',
    'transaction.rtgs.create',
    'account.view',
    'audit.view',
    'audit.compliance',
    'audit.transactions',
    'audit.export',
    'reports.view',
    'reports.generate',
  ],
  
  Authorizer: [
    // Authorizers can approve specific high-value transactions
    'voucher.view',
    'voucher.approve',
    'voucher.reject',
    'authorization.approve',
    'authorization.reject',
    'authorization.review',
    'transaction.deposit.approve',
    'transaction.withdrawal.approve',
    'transaction.transfer.approve',
    'transaction.rtgs.approve',
    'highvalue.approve',
    'fx.approve',
    'largecash.approve',
    'account.opening.approve',
    'stoppayment.approve',
    'cheque.approve',
    'reports.view',
  ],
  
  Greeter: [
    // Greeters can greet customers and provide basic information
    'customer.greet',
    'customer.direct',
    'queue.manage',
    'information.provide',
    'reports.view',
  ],
};

/**
 * Transaction amount thresholds that trigger approval workflows
 */
export const APPROVAL_THRESHOLDS = {
  withdrawal: {
    normal: 500000, // ETB - requires manager approval
    corporate: 5000000, // ETB - requires manager approval
  },
  deposit: {
    normal: 1000000,
    corporate: 10000000,
  },
  transfer: {
    normal: 1000000,
    corporate: 10000000,
  },
  rtgs: {
    normal: 50000000, // Above this requires manager approval
    corporate: 100000000,
  },
  fx: {
    usd: 5000, // USD - Foreign exchange threshold
    eur: 4500,
    gbp: 4000,
  },
};

/**
 * Check if a user role has a specific permission
 */
export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  const permissions = RBAC_MATRIX[role];
  return permissions.includes(permission);
};

/**
 * Check if a user role has any of the specified permissions
 */
export const hasAnyPermission = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if a user role has all of the specified permissions
 */
export const hasAllPermissions = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Get all permissions for a specific role
 */
export const getRolePermissions = (role: UserRole): Permission[] => {
  return RBAC_MATRIX[role] || [];
};

/**
 * Check if a transaction requires approval based on amount and type
 */
export interface ApprovalRequirement {
  required: boolean;
  reason?: string;
  approverRole: UserRole[];
}

export const requiresTransactionApproval = (
  transactionType: 'withdrawal' | 'deposit' | 'transfer' | 'rtgs',
  amount: number,
  currency: string = 'ETB',
  customerSegment: 'normal' | 'corporate' = 'normal'
): ApprovalRequirement => {
  const thresholds = APPROVAL_THRESHOLDS[transactionType];
  const threshold = thresholds[customerSegment];

  // Check FX approval for non-ETB currencies
  if (currency !== 'ETB') {
    const fxThreshold = APPROVAL_THRESHOLDS.fx[currency.toLowerCase() as keyof typeof APPROVAL_THRESHOLDS.fx];
    if (fxThreshold && amount > fxThreshold) {
      return {
        required: true,
        reason: `Foreign exchange amount exceeds ${currency} ${fxThreshold} threshold`,
        approverRole: ['Manager', 'Admin'],
      };
    }
  }

  // Check transaction amount threshold
  if (amount > threshold) {
    return {
      required: true,
      reason: `${transactionType} amount exceeds ${customerSegment} customer limit of ${currency} ${threshold.toLocaleString()}`,
      approverRole: ['Manager', 'Admin'],
    };
  }

  return {
    required: false,
    approverRole: [],
  };
};

/**
 * Voucher status types for approval workflow
 */
export type VoucherStatus = 
  | 'draft'
  | 'pending_verification'
  | 'verified'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'completed';

/**
 * Workflow state transitions
 */
export const WORKFLOW_TRANSITIONS: Record<VoucherStatus, VoucherStatus[]> = {
  draft: ['pending_verification'],
  pending_verification: ['verified', 'rejected'],
  verified: ['pending_approval', 'completed'],
  pending_approval: ['approved', 'rejected'],
  approved: ['completed'],
  rejected: [],
  completed: [],
};

/**
 * Check if a status transition is valid
 */
export const isValidTransition = (from: VoucherStatus, to: VoucherStatus): boolean => {
  return WORKFLOW_TRANSITIONS[from]?.includes(to) || false;
};