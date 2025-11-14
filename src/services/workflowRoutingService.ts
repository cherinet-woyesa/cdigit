// services/workflowRoutingService.ts
import { apiClient, type ApiResponse } from '@services/http';

/**
 * Workflow action types that can be performed on vouchers
 */
export type WorkflowActionType = 
  | 'ToAuthorizer' 
  | 'ToPreAuthorizer' 
  | 'ToAuditor' 
  | 'ToPreAuditor' 
  | 'ToKYC';

/**
 * Workflow stage types representing the current state of a voucher
 */
export type WorkflowStage = 
  | 'Created'
  | 'ToPreAuditor'
  | 'PreAudited'
  | 'ToAuditor'
  | 'Audited'
  | 'ToPreAuthorizer'
  | 'PreAuthorized'
  | 'ToAuthorizer'
  | 'Authorized'
  | 'ToKYC'
  | 'KYCApproved'
  | 'Completed';

/**
 * Workflow action definition with metadata
 */
export interface WorkflowAction {
  value: WorkflowActionType;
  label: string;
  description: string;
}

/**
 * DTO for sending a voucher to a specific workflow stage
 */
export interface SendToStageDto {
  serviceName: string;
  voucherId: string;
  action: WorkflowActionType;
}

/**
 * DTO for voucher status information
 */
export interface VoucherStatusDto {
  voucherId: string;
  serviceName: string;
  currentStage: WorkflowStage;
  lastAction: string;
  lastActionBy: string;
  lastActionAt: string;
  isPending: boolean;
}

/**
 * Workflow history entry representing a single action in the workflow
 */
export interface WorkflowHistoryEntry {
  action: string;
  performedBy: string;
  performedAt: string;
  stage: string;
  remarks?: string;
}

/**
 * Available workflow actions with their metadata
 */
const WORKFLOW_ACTIONS: WorkflowAction[] = [
  {
    value: 'ToAuthorizer',
    label: 'To Authorizer',
    description: 'Send directly to authorizer for final approval'
  },
  {
    value: 'ToPreAuthorizer',
    label: 'To Pre-Authorizer',
    description: 'Send to pre-authorization for preliminary approval'
  },
  {
    value: 'ToAuditor',
    label: 'To Auditor',
    description: 'Send for audit verification'
  },
  {
    value: 'ToPreAuditor',
    label: 'To Pre-Auditor',
    description: 'Send for preliminary audit check'
  },
  {
    value: 'ToKYC',
    label: 'To KYC',
    description: 'Send for Know Your Customer verification'
  }
];

/**
 * Service for managing voucher workflow routing
 */
class WorkflowRoutingService {
  /**
   * Send a voucher to a specific workflow stage
   * @param dto - The send to stage data transfer object
   * @returns Promise with API response
   */
  async sendToStage(dto: SendToStageDto): Promise<ApiResponse> {
    try {
      // Validate input
      if (!dto.voucherId || !dto.serviceName || !dto.action) {
        return {
          success: false,
          message: 'Missing required fields: voucherId, serviceName, and action are required',
          errors: ['Validation failed']
        };
      }

      // Determine which endpoint to use based on the action
      const endpoint = this.getEndpointForAction(dto.action);
      
      // Send the request to the appropriate controller
      // Note: Backend expects PascalCase property names (VoucherId, ServiceName, Action)
      const response = await apiClient.post(endpoint, {
        ServiceName: dto.serviceName,
        VoucherId: dto.voucherId,
        Action: dto.action
      });

      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send voucher to stage',
        errors: [error.message || 'Unknown error occurred']
      };
    }
  }

  /**
   * Get the current status of a voucher
   * @param serviceName - The service name
   * @param voucherId - The voucher ID
   * @returns Promise with voucher status
   */
  async getVoucherStatus(serviceName: string, voucherId: string): Promise<VoucherStatusDto | null> {
    try {
      // Try to get voucher from auditor endpoint first
      const auditorResponse = await apiClient.post('/Auditor/id', {
        serviceName,
        voucherId,
        branchId: '' // Will be handled by backend from auth context
      });

      if (auditorResponse.success && auditorResponse.data && Array.isArray(auditorResponse.data) && auditorResponse.data.length > 0) {
        const voucher = auditorResponse.data[0];
        return this.mapToVoucherStatus(voucher, serviceName);
      }

      // Try authorizer endpoint
      const authorizerResponse = await apiClient.post('/Authorizer/id', {
        serviceName,
        voucherId,
        branchId: ''
      });

      if (authorizerResponse.success && authorizerResponse.data && Array.isArray(authorizerResponse.data) && authorizerResponse.data.length > 0) {
        const voucher = authorizerResponse.data[0];
        return this.mapToVoucherStatus(voucher, serviceName);
      }

      return null;
    } catch (error: any) {
      console.error('Error fetching voucher status:', error);
      return null;
    }
  }

  /**
   * Get the workflow history for a voucher
   * @param serviceName - The service name
   * @param voucherId - The voucher ID
   * @returns Promise with workflow history entries
   */
  async getWorkflowHistory(serviceName: string, voucherId: string): Promise<WorkflowHistoryEntry[]> {
    try {
      // Note: This endpoint may need to be implemented on the backend
      // For now, we'll return an empty array as a placeholder
      // TODO: Implement backend endpoint for workflow history
      
      const response = await apiClient.post('/Workflow/history', {
        serviceName,
        voucherId
      });

      if (response.success && response.data) {
        return response.data as WorkflowHistoryEntry[];
      }

      return [];
    } catch (error: any) {
      console.error('Error fetching workflow history:', error);
      // Return empty array instead of throwing to allow graceful degradation
      return [];
    }
  }

  /**
   * Get available workflow actions for the current voucher state
   * @param _currentStage - The current workflow stage (optional, reserved for future use)
   * @returns Array of available workflow actions
   */
  getAvailableActions(_currentStage?: WorkflowStage): WorkflowAction[] {
    // For now, return all actions
    // In the future, this can be enhanced to filter based on current stage
    // and business rules
    return WORKFLOW_ACTIONS;
  }

  /**
   * Get all workflow actions
   * @returns Array of all workflow actions
   */
  getAllActions(): WorkflowAction[] {
    return WORKFLOW_ACTIONS;
  }

  /**
   * Get a specific workflow action by value
   * @param value - The workflow action type
   * @returns The workflow action or undefined
   */
  getActionByValue(value: WorkflowActionType): WorkflowAction | undefined {
    return WORKFLOW_ACTIONS.find(action => action.value === value);
  }

  /**
   * Determine the API endpoint based on the workflow action
   * @param action - The workflow action type
   * @returns The API endpoint path
   */
  private getEndpointForAction(action: WorkflowActionType): string {
    switch (action) {
      case 'ToAuditor':
      case 'ToPreAuditor':
        return '/Auditor/send';
      case 'ToAuthorizer':
      case 'ToPreAuthorizer':
        return '/Authorizer/send';
      case 'ToKYC':
        return '/Kyc/send';
      default:
        throw new Error(`Unknown workflow action: ${action}`);
    }
  }

  /**
   * Map a voucher object to VoucherStatusDto
   * @param voucher - The voucher object from API
   * @param serviceName - The service name
   * @returns VoucherStatusDto
   */
  private mapToVoucherStatus(voucher: any, serviceName: string): VoucherStatusDto {
    // Determine current stage based on voucher properties
    let currentStage: WorkflowStage = 'Created';
    let lastAction = 'Created';
    let lastActionBy = voucher.makerName || 'Unknown';
    let lastActionAt = voucher.submittedAt || new Date().toISOString();

    if (voucher.isAuthorized) {
      currentStage = 'Authorized';
      lastAction = 'Authorized';
      lastActionBy = voucher.authorizerName || 'Unknown';
    } else if (voucher.isAudited) {
      currentStage = 'Audited';
      lastAction = 'Audited';
      lastActionBy = voucher.auditorName || 'Unknown';
    } else if (voucher.auditerId) {
      currentStage = 'ToAuditor';
      lastAction = 'Sent to Auditor';
    } else if (voucher.authorizerId) {
      currentStage = 'ToAuthorizer';
      lastAction = 'Sent to Authorizer';
    }

    // Check if pending (not yet processed)
    const isPending = !voucher.isAuthorized && !voucher.isAudited && !voucher.isRejected;

    return {
      voucherId: voucher.id,
      serviceName,
      currentStage,
      lastAction,
      lastActionBy,
      lastActionAt,
      isPending
    };
  }
}

// Export singleton instance
export const workflowRoutingService = new WorkflowRoutingService();
export default workflowRoutingService;
