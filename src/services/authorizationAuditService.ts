/**
 * Authorization Audit Service
 * Securely logs all authentication and authorization events for regulatory compliance
 */

import type { UserRole, Permission } from '../config/rbacMatrix';

export interface AuthenticationLog {
  timestamp: Date;
  userId?: string;
  phoneNumber?: string;
  email?: string;
  authenticationType: 'PIN' | 'OTP' | 'PASSWORD' | 'BIOMETRIC';
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  deviceInfo?: string;
  sessionId?: string;
}

export interface AuthorizationLog {
  timestamp: Date;
  userId: string;
  userRole: UserRole;
  action: string;
  resource: string;
  permission?: Permission;
  granted: boolean;
  denialReason?: string;
  context?: Record<string, any>;
}

export interface ApprovalLog {
  timestamp: Date;
  approverId: string;
  approverRole: UserRole;
  voucherId: string;
  voucherType: string;
  action: 'approve' | 'reject' | 'verify';
  amount?: number;
  currency?: string;
  reason?: string;
  digitalSignature?: string;
}

export interface SignatureBindingLog {
  timestamp: Date;
  voucherId: string;
  voucherType: string;
  signatureType: 'customer' | 'teller' | 'approver';
  userId: string;
  signatureHash: string;
  voucherHash: string;
  bindingHash: string;
  verified: boolean;
}

export interface AuditAnalytics {
  totalAuthAttempts: number;
  successfulAuths: number;
  failedAuths: number;
  successRate: number;
  authByType: Record<string, number>;
  totalAuthzChecks: number;
  grantedAuthz: number;
  deniedAuthz: number;
  authzSuccessRate: number;
  commonDenials: Array<{ resource: string; count: number }>;
  totalApprovals: number;
  approvedCount: number;
  rejectedCount: number;
  approvalsByRole: Record<UserRole, number>;
  recentActivity: Array<AuthenticationLog | AuthorizationLog | ApprovalLog>;
}

class AuthorizationAuditService {
  private authenticationLog: AuthenticationLog[] = [];
  private authorizationLog: AuthorizationLog[] = [];
  private approvalLog: ApprovalLog[] = [];
  private signatureBindingLog: SignatureBindingLog[] = [];
  
  private readonly MAX_LOG_SIZE = 5000;
  private readonly STORAGE_KEY_AUTH = 'authorization_audit_auth';
  private readonly STORAGE_KEY_AUTHZ = 'authorization_audit_authz';
  private readonly STORAGE_KEY_APPROVAL = 'authorization_audit_approval';
  private readonly STORAGE_KEY_SIGNATURE = 'authorization_audit_signature';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Log authentication attempt (PIN, OTP, Password)
   */
  logAuthentication(auth: Omit<AuthenticationLog, 'timestamp'>): void {
    const log: AuthenticationLog = {
      ...auth,
      timestamp: new Date(),
    };

    this.authenticationLog.push(log);
    this.trimLog(this.authenticationLog);
    this.saveToStorage();
    
    // Send to backend for secure storage
    this.sendAuthLogToBackend(log).catch(console.error);
  }

  /**
   * Log authorization check (permission verification)
   */
  logAuthorization(authz: Omit<AuthorizationLog, 'timestamp'>): void {
    const log: AuthorizationLog = {
      ...authz,
      timestamp: new Date(),
    };

    this.authorizationLog.push(log);
    this.trimLog(this.authorizationLog);
    this.saveToStorage();
    
    // Send to backend
    this.sendAuthzLogToBackend(log).catch(console.error);
  }

  /**
   * Log approval workflow action
   */
  logApproval(approval: Omit<ApprovalLog, 'timestamp'>): void {
    const log: ApprovalLog = {
      ...approval,
      timestamp: new Date(),
    };

    this.approvalLog.push(log);
    this.trimLog(this.approvalLog);
    this.saveToStorage();
    
    // Send to backend
    this.sendApprovalLogToBackend(log).catch(console.error);
  }

  /**
   * Log signature cryptographic binding
   */
  logSignatureBinding(binding: Omit<SignatureBindingLog, 'timestamp'>): void {
    const log: SignatureBindingLog = {
      ...binding,
      timestamp: new Date(),
    };

    this.signatureBindingLog.push(log);
    this.trimLog(this.signatureBindingLog);
    this.saveToStorage();
    
    // Send to backend
    this.sendSignatureLogToBackend(log).catch(console.error);
  }

  /**
   * Get authentication logs with optional filters
   */
  getAuthenticationLogs(filters?: {
    userId?: string;
    success?: boolean;
    authenticationType?: AuthenticationLog['authenticationType'];
    startDate?: Date;
    endDate?: Date;
  }): AuthenticationLog[] {
    let logs = [...this.authenticationLog];

    if (filters) {
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.success !== undefined) {
        logs = logs.filter(log => log.success === filters.success);
      }
      if (filters.authenticationType) {
        logs = logs.filter(log => log.authenticationType === filters.authenticationType);
      }
      if (filters.startDate) {
        logs = logs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter(log => log.timestamp <= filters.endDate!);
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get authorization logs with optional filters
   */
  getAuthorizationLogs(filters?: {
    userId?: string;
    granted?: boolean;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
  }): AuthorizationLog[] {
    let logs = [...this.authorizationLog];

    if (filters) {
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.granted !== undefined) {
        logs = logs.filter(log => log.granted === filters.granted);
      }
      if (filters.resource) {
        logs = logs.filter(log => log.resource.includes(filters.resource!));
      }
      if (filters.startDate) {
        logs = logs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter(log => log.timestamp <= filters.endDate!);
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get approval logs with optional filters
   */
  getApprovalLogs(filters?: {
    approverId?: string;
    voucherId?: string;
    action?: ApprovalLog['action'];
    startDate?: Date;
    endDate?: Date;
  }): ApprovalLog[] {
    let logs = [...this.approvalLog];

    if (filters) {
      if (filters.approverId) {
        logs = logs.filter(log => log.approverId === filters.approverId);
      }
      if (filters.voucherId) {
        logs = logs.filter(log => log.voucherId === filters.voucherId);
      }
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.startDate) {
        logs = logs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter(log => log.timestamp <= filters.endDate!);
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get signature binding logs
   */
  getSignatureBindingLogs(voucherId?: string): SignatureBindingLog[] {
    let logs = [...this.signatureBindingLog];
    
    if (voucherId) {
      logs = logs.filter(log => log.voucherId === voucherId);
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get analytics for audit dashboard
   */
  getAnalytics(): AuditAnalytics {
    const authAttempts = this.authenticationLog;
    const successfulAuths = authAttempts.filter(log => log.success);
    const failedAuths = authAttempts.filter(log => !log.success);

    const authzChecks = this.authorizationLog;
    const grantedAuthz = authzChecks.filter(log => log.granted);
    const deniedAuthz = authzChecks.filter(log => !log.granted);

    const approvals = this.approvalLog;
    const approved = approvals.filter(log => log.action === 'approve');
    const rejected = approvals.filter(log => log.action === 'reject');

    // Common denials
    const denialMap = new Map<string, number>();
    deniedAuthz.forEach(log => {
      const count = denialMap.get(log.resource) || 0;
      denialMap.set(log.resource, count + 1);
    });
    const commonDenials = Array.from(denialMap.entries())
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Auth by type
    const authByType: Record<string, number> = {};
    authAttempts.forEach(log => {
      authByType[log.authenticationType] = (authByType[log.authenticationType] || 0) + 1;
    });

    // Approvals by role
    const approvalsByRole: Record<UserRole, number> = {} as Record<UserRole, number>;
    approvals.forEach(log => {
      approvalsByRole[log.approverRole] = (approvalsByRole[log.approverRole] || 0) + 1;
    });

    // Recent activity (last 50)
    const recentActivity = [
      ...this.authenticationLog.map(log => ({ ...log, type: 'auth' as const })),
      ...this.authorizationLog.map(log => ({ ...log, type: 'authz' as const })),
      ...this.approvalLog.map(log => ({ ...log, type: 'approval' as const })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50);

    return {
      totalAuthAttempts: authAttempts.length,
      successfulAuths: successfulAuths.length,
      failedAuths: failedAuths.length,
      successRate: authAttempts.length > 0 ? (successfulAuths.length / authAttempts.length) * 100 : 0,
      authByType,
      totalAuthzChecks: authzChecks.length,
      grantedAuthz: grantedAuthz.length,
      deniedAuthz: deniedAuthz.length,
      authzSuccessRate: authzChecks.length > 0 ? (grantedAuthz.length / authzChecks.length) * 100 : 0,
      commonDenials,
      totalApprovals: approvals.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      approvalsByRole,
      recentActivity,
    };
  }

  /**
   * Export audit logs for regulatory compliance
   */
  exportLogs(format: 'json' | 'csv' = 'json', logType?: 'auth' | 'authz' | 'approval' | 'signature'): string {
    const data = {
      authentication: logType === 'auth' || !logType ? this.authenticationLog : [],
      authorization: logType === 'authz' || !logType ? this.authorizationLog : [],
      approval: logType === 'approval' || !logType ? this.approvalLog : [],
      signatureBinding: logType === 'signature' || !logType ? this.signatureBindingLog : [],
      exportedAt: new Date().toISOString(),
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // CSV format
    let csv = '';
    
    if (data.authentication.length > 0) {
      csv += 'AUTHENTICATION LOGS\n';
      csv += 'Timestamp,User ID,Phone,Email,Type,Success,Failure Reason,IP Address,Session ID\n';
      data.authentication.forEach(log => {
        csv += `${log.timestamp},${log.userId || ''},${log.phoneNumber || ''},${log.email || ''},${log.authenticationType},${log.success},${log.failureReason || ''},${log.ipAddress || ''},${log.sessionId || ''}\n`;
      });
      csv += '\n';
    }

    if (data.authorization.length > 0) {
      csv += 'AUTHORIZATION LOGS\n';
      csv += 'Timestamp,User ID,Role,Action,Resource,Permission,Granted,Denial Reason\n';
      data.authorization.forEach(log => {
        csv += `${log.timestamp},${log.userId},${log.userRole},${log.action},${log.resource},${log.permission || ''},${log.granted},${log.denialReason || ''}\n`;
      });
      csv += '\n';
    }

    if (data.approval.length > 0) {
      csv += 'APPROVAL LOGS\n';
      csv += 'Timestamp,Approver ID,Role,Voucher ID,Type,Action,Amount,Currency,Reason\n';
      data.approval.forEach(log => {
        csv += `${log.timestamp},${log.approverId},${log.approverRole},${log.voucherId},${log.voucherType},${log.action},${log.amount || ''},${log.currency || ''},${log.reason || ''}\n`;
      });
      csv += '\n';
    }

    if (data.signatureBinding.length > 0) {
      csv += 'SIGNATURE BINDING LOGS\n';
      csv += 'Timestamp,Voucher ID,Type,Signature Type,User ID,Signature Hash,Voucher Hash,Binding Hash,Verified\n';
      data.signatureBinding.forEach(log => {
        csv += `${log.timestamp},${log.voucherId},${log.voucherType},${log.signatureType},${log.userId},${log.signatureHash},${log.voucherHash},${log.bindingHash},${log.verified}\n`;
      });
    }

    return csv;
  }

  /**
   * Clear all logs (admin only, use with caution)
   */
  clearLogs(): void {
    this.authenticationLog = [];
    this.authorizationLog = [];
    this.approvalLog = [];
    this.signatureBindingLog = [];
    this.saveToStorage();
  }

  // Private helper methods

  private trimLog<T>(log: T[]): void {
    if (log.length > this.MAX_LOG_SIZE) {
      log.splice(0, log.length - this.MAX_LOG_SIZE);
    }
  }

  private saveToStorage(): void {
    try {
      // Store last 500 of each type in localStorage
      localStorage.setItem(
        this.STORAGE_KEY_AUTH,
        JSON.stringify(this.authenticationLog.slice(-500))
      );
      localStorage.setItem(
        this.STORAGE_KEY_AUTHZ,
        JSON.stringify(this.authorizationLog.slice(-500))
      );
      localStorage.setItem(
        this.STORAGE_KEY_APPROVAL,
        JSON.stringify(this.approvalLog.slice(-500))
      );
      localStorage.setItem(
        this.STORAGE_KEY_SIGNATURE,
        JSON.stringify(this.signatureBindingLog.slice(-500))
      );
    } catch (error) {
      console.error('Failed to save audit logs to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const authData = localStorage.getItem(this.STORAGE_KEY_AUTH);
      const authzData = localStorage.getItem(this.STORAGE_KEY_AUTHZ);
      const approvalData = localStorage.getItem(this.STORAGE_KEY_APPROVAL);
      const signatureData = localStorage.getItem(this.STORAGE_KEY_SIGNATURE);

      if (authData) {
        this.authenticationLog = JSON.parse(authData).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
      }
      if (authzData) {
        this.authorizationLog = JSON.parse(authzData).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
      }
      if (approvalData) {
        this.approvalLog = JSON.parse(approvalData).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
      }
      if (signatureData) {
        this.signatureBindingLog = JSON.parse(signatureData).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load audit logs from storage:', error);
    }
  }

  private async sendAuthLogToBackend(log: AuthenticationLog): Promise<void> {
    try {
      // TODO: Implement actual backend API call
      // await api.post('/audit/authentication', log);
      console.log('Authentication log would be sent to backend:', log);
    } catch (error) {
      console.error('Failed to send authentication log to backend:', error);
    }
  }

  private async sendAuthzLogToBackend(log: AuthorizationLog): Promise<void> {
    try {
      // TODO: Implement actual backend API call
      // await api.post('/audit/authorization', log);
      console.log('Authorization log would be sent to backend:', log);
    } catch (error) {
      console.error('Failed to send authorization log to backend:', error);
    }
  }

  private async sendApprovalLogToBackend(log: ApprovalLog): Promise<void> {
    try {
      // TODO: Implement actual backend API call
      // await api.post('/audit/approval', log);
      console.log('Approval log would be sent to backend:', log);
    } catch (error) {
      console.error('Failed to send approval log to backend:', error);
    }
  }

  private async sendSignatureLogToBackend(log: SignatureBindingLog): Promise<void> {
    try {
      // TODO: Implement actual backend API call
      // await api.post('/audit/signature-binding', log);
      console.log('Signature binding log would be sent to backend:', log);
    } catch (error) {
      console.error('Failed to send signature binding log to backend:', error);
    }
  }
}

// Singleton instance
const authorizationAuditService = new AuthorizationAuditService();
export default authorizationAuditService;
