/**
 * Approval Workflow Service
 * Manages role-based approval workflows for high-value and sensitive transactions
 */

import type { UserRole, VoucherStatus } from '../config/rbacMatrix';
import { requiresTransactionApproval, isValidTransition } from '../config/rbacMatrix';
import authorizationAuditService from './authorizationAuditService';
import api from './http';

export interface ApprovalRequest {
  voucherId: string;
  voucherType: 'withdrawal' | 'deposit' | 'transfer' | 'rtgs' | 'account_opening' | 'stop_payment' | 'other';
  transactionType?: 'withdrawal' | 'deposit' | 'transfer' | 'rtgs';
  amount?: number;
  currency?: string;
  customerSegment?: 'normal' | 'corporate';
  requestedBy: string;
  requestedByRole: UserRole;
  reason: string;
  voucherData: Record<string, any>;
  customerSignature?: string;
  tellerSignature?: string;
}

export interface ApprovalAction {
  voucherId: string;
  action: 'approve' | 'reject' | 'verify';
  approvedBy: string;
  approverRole: UserRole;
  reason?: string;
  digitalSignature?: string;
  timestamp: Date;
}

export interface ApprovalWorkflow {
  id: string;
  voucherId: string;
  voucherType: string;
  status: VoucherStatus;
  currentApprover?: UserRole[];
  approvalChain: ApprovalAction[];
  createdAt: Date;
  updatedAt: Date;
  requiresApproval: boolean;
  approvalReason?: string;
}

class ApprovalWorkflowService {
  private workflows: Map<string, ApprovalWorkflow> = new Map();
  private readonly STORAGE_KEY = 'approval_workflows';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Create a new approval workflow for a voucher
   */
  async createWorkflow(request: ApprovalRequest): Promise<ApprovalWorkflow> {
    // Check if approval is required
    const approvalCheck = request.transactionType && request.amount
      ? requiresTransactionApproval(
          request.transactionType,
          request.amount,
          request.currency || 'ETB',
          request.customerSegment || 'normal'
        )
      : { required: false, reason: '', approverRole: [] as UserRole[] };

    const workflow: ApprovalWorkflow = {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      voucherId: request.voucherId,
      voucherType: request.voucherType,
      status: approvalCheck.required ? 'pending_verification' : 'verified',
      currentApprover: approvalCheck.required ? approvalCheck.approverRole : undefined,
      approvalChain: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      requiresApproval: approvalCheck.required,
      approvalReason: approvalCheck.reason,
    };

    // Store workflow
    this.workflows.set(workflow.id, workflow);
    this.saveToStorage();

    // Log to audit
    authorizationAuditService.logAuthorization({
      userId: request.requestedBy,
      userRole: request.requestedByRole,
      action: 'create_workflow',
      resource: `voucher:${request.voucherId}`,
      granted: true,
      context: {
        requiresApproval: approvalCheck.required,
        approvalReason: approvalCheck.reason,
      },
    });

    // Send to backend
    try {
      await this.sendWorkflowToBackend(workflow);
    } catch (error) {
      console.error('Failed to send workflow to backend:', error);
    }

    return workflow;
  }

  /**
   * Process approval action (approve/reject/verify)
   */
  async processApproval(action: ApprovalAction): Promise<{
    success: boolean;
    message: string;
    workflow?: ApprovalWorkflow;
  }> {
    // Find workflow by voucher ID
    const workflow = Array.from(this.workflows.values()).find(
      w => w.voucherId === action.voucherId
    );

    if (!workflow) {
      return {
        success: false,
        message: 'Workflow not found for this voucher',
      };
    }

    // Check if approver has permission
    if (workflow.currentApprover && !workflow.currentApprover.includes(action.approverRole)) {
      authorizationAuditService.logAuthorization({
        userId: action.approvedBy,
        userRole: action.approverRole,
        action: `approval_${action.action}`,
        resource: `voucher:${action.voucherId}`,
        granted: false,
        denialReason: `Role ${action.approverRole} not authorized to ${action.action} this voucher`,
      });

      return {
        success: false,
        message: `You are not authorized to ${action.action} this transaction`,
      };
    }

    // Determine new status based on action
    let newStatus: VoucherStatus;
    switch (action.action) {
      case 'verify':
        newStatus = workflow.requiresApproval ? 'pending_approval' : 'completed';
        break;
      case 'approve':
        newStatus = 'approved';
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      default:
        return {
          success: false,
          message: 'Invalid approval action',
        };
    }

    // Validate status transition
    if (!isValidTransition(workflow.status, newStatus)) {
      return {
        success: false,
        message: `Cannot transition from ${workflow.status} to ${newStatus}`,
      };
    }

    // Update workflow
    workflow.status = newStatus;
    workflow.approvalChain.push({
      ...action,
      timestamp: new Date(),
    });
    workflow.updatedAt = new Date();

    // Update current approver
    if (newStatus === 'pending_approval') {
      workflow.currentApprover = ['Manager', 'Admin'];
    } else if (newStatus === 'approved' || newStatus === 'rejected' || newStatus === 'completed') {
      workflow.currentApprover = undefined;
    }

    // Save workflow
    this.workflows.set(workflow.id, workflow);
    this.saveToStorage();

    // Log to audit
    authorizationAuditService.logApproval({
      approverId: action.approvedBy,
      approverRole: action.approverRole,
      voucherId: action.voucherId,
      voucherType: workflow.voucherType,
      action: action.action,
      reason: action.reason,
      digitalSignature: action.digitalSignature,
    });

    // Send to backend
    try {
      await this.sendApprovalToBackend(action, workflow);
    } catch (error) {
      console.error('Failed to send approval to backend:', error);
    }

    return {
      success: true,
      message: `Voucher ${action.action === 'approve' ? 'approved' : action.action === 'reject' ? 'rejected' : 'verified'} successfully`,
      workflow,
    };
  }

  /**
   * Get workflow for a voucher
   */
  getWorkflowByVoucher(voucherId: string): ApprovalWorkflow | undefined {
    return Array.from(this.workflows.values()).find(w => w.voucherId === voucherId);
  }

  /**
   * Get all workflows by status
   */
  getWorkflowsByStatus(status: VoucherStatus): ApprovalWorkflow[] {
    return Array.from(this.workflows.values())
      .filter(w => w.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get pending approvals for a specific approver role
   */
  getPendingApprovalsForRole(role: UserRole): ApprovalWorkflow[] {
    return Array.from(this.workflows.values())
      .filter(w => 
        (w.status === 'pending_verification' || w.status === 'pending_approval') &&
        w.currentApprover?.includes(role)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get approval history for a voucher
   */
  getApprovalHistory(voucherId: string): ApprovalAction[] {
    const workflow = this.getWorkflowByVoucher(voucherId);
    return workflow?.approvalChain || [];
  }

  /**
   * Get approval statistics
   */
  getApprovalStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
    voucherType?: string;
    approverRole?: UserRole;
  }): {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byType: Record<string, number>;
    byApprover: Record<string, number>;
    avgApprovalTime: number;
  } {
    let workflows = Array.from(this.workflows.values());

    // Apply filters
    if (filters) {
      if (filters.startDate) {
        workflows = workflows.filter(w => w.createdAt >= filters.startDate!);
      }
      if (filters.endDate) {
        workflows = workflows.filter(w => w.createdAt <= filters.endDate!);
      }
      if (filters.voucherType) {
        workflows = workflows.filter(w => w.voucherType === filters.voucherType);
      }
      if (filters.approverRole) {
        workflows = workflows.filter(w => 
          w.approvalChain.some(a => a.approverRole === filters.approverRole)
        );
      }
    }

    // Calculate statistics
    const byType: Record<string, number> = {};
    const byApprover: Record<string, number> = {};
    let totalApprovalTime = 0;
    let approvedCount = 0;

    workflows.forEach(w => {
      byType[w.voucherType] = (byType[w.voucherType] || 0) + 1;

      w.approvalChain.forEach(a => {
        const key = `${a.approverRole}:${a.action}`;
        byApprover[key] = (byApprover[key] || 0) + 1;
      });

      // Calculate approval time
      if (w.status === 'approved' || w.status === 'rejected') {
        const approvalTime = w.updatedAt.getTime() - w.createdAt.getTime();
        totalApprovalTime += approvalTime;
        approvedCount++;
      }
    });

    return {
      total: workflows.length,
      pending: workflows.filter(w => w.status === 'pending_verification' || w.status === 'pending_approval').length,
      approved: workflows.filter(w => w.status === 'approved').length,
      rejected: workflows.filter(w => w.status === 'rejected').length,
      byType,
      byApprover,
      avgApprovalTime: approvedCount > 0 ? totalApprovalTime / approvedCount : 0,
    };
  }

  // Private helper methods

  private saveToStorage(): void {
    try {
      const workflowsArray = Array.from(this.workflows.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(workflowsArray));
    } catch (error) {
      console.error('Failed to save workflows to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const workflowsArray = JSON.parse(stored);
        this.workflows = new Map(
          workflowsArray.map(([id, w]: [string, any]) => [
            id,
            {
              ...w,
              createdAt: new Date(w.createdAt),
              updatedAt: new Date(w.updatedAt),
              approvalChain: w.approvalChain.map((a: any) => ({
                ...a,
                timestamp: new Date(a.timestamp),
              })),
            },
          ])
        );
      }
    } catch (error) {
      console.error('Failed to load workflows from storage:', error);
    }
  }

  private async sendWorkflowToBackend(workflow: ApprovalWorkflow): Promise<void> {
    try {
      // TODO: Implement actual backend API call
      // await api.post('/approval/workflow', workflow);
      console.log('Workflow would be sent to backend:', workflow);
    } catch (error) {
      console.error('Failed to send workflow to backend:', error);
    }
  }

  private async sendApprovalToBackend(action: ApprovalAction, workflow: ApprovalWorkflow): Promise<void> {
    try {
      // TODO: Implement actual backend API call
      // await api.post('/approval/action', { action, workflow });
      console.log('Approval action would be sent to backend:', { action, workflow });
    } catch (error) {
      console.error('Failed to send approval to backend:', error);
    }
  }
}

// Singleton instance
const approvalWorkflowService = new ApprovalWorkflowService();
export default approvalWorkflowService;
