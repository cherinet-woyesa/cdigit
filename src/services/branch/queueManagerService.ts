// src/services/queueManagerService.ts
import { apiClient } from '@services/http';

export interface QueueItem {
  id: string;
  voucherId: string;
  customerSegment: string;
  serviceType: string;
  serviceName: string;
  formReferenceId: string;
  queueNumber: number;
  orderNumber: number;
  tokenNumber: string;
  phoneNumber: string;
  customerName: string;
  branchId: string;
  windowId?: string;
  frontMakerId?: string;
  status: string;
  submittedAt: string;
  calledAt?: string;
  completedAt?: string;
  canceledAt?: string;
  serviceDurationSeconds?: number;
  isAbandoned: boolean;
  isSpecialNeed?: boolean;
  specialNeedReason?: string;
}

export interface QueueApiResponse<T> {
  data?: T;
  success: boolean;
  message?: string;
}

class QueueManagerService {
  async getOnQueueItems(branchId: string) {
    try {
      const response = await apiClient.get<QueueApiResponse<QueueItem[]>>(
        `/QueueManager/on-queue/${branchId}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching on-queue items:', error);
      throw error;
    }
  }

  async getOnProgressItems(branchId: string) {
    try {
      const response = await apiClient.get<QueueApiResponse<QueueItem[]>>(
        `/QueueManager/on-progress/${branchId}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching on-progress items:', error);
      throw error;
    }
  }

  async getAllItemsByBranch(branchId: string) {
    try {
      const response = await apiClient.get<QueueApiResponse<QueueItem[]>>(
        `/QueueManager/branch/${branchId}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching all items by branch:', error);
      throw error;
    }
  }
}

export const queueManagerService = new QueueManagerService();
export default queueManagerService;