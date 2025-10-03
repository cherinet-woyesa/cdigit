// src/services/stopPaymentService.ts

// Types matching backend DTOs
export interface StopPaymentOrderCreateDto {
  accountNumber: string;
  chequeNumber: string;
  chequeBookRequestId: string;
  chequeAmount: number;
  chequeDate: string;
  reason: string;
  signature: string;
  branchId: string;
  otpCode: string;
  phoneNumber: string;
}

export interface RevokeStopPaymentOrderDto {
  stopPaymentOrderId: string;
  chequeNumber: string;
  signature: string;
  otpCode: string;
  phoneNumber: string;
}

export interface StopPaymentOrderResponseDto {
  id: string;
  formReferenceId: string;
  accountNumber: string;
  customerName: string;
  chequeNumber: string;
  chequeAmount: number;
  chequeDate: string;
  reason: string;
  isRevoked: boolean;
  revokedAt?: string;
  revokedBy?: string;
  branchName?: string;
  windowNumber?: number;
  frontMakerName?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Revoked';
}

export interface StopPaymentOrder {
  id: string;
  formReferenceId: string;
  accountNumber: string;
  customerName: string;
  chequeNumber: string;
  chequeAmount: number;
  chequeDate: string;
  reason: string;
  isRevoked: boolean;
  revokedAt?: string;
  revokedBy?: string;
  branchName?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Revoked';
  dateCreated: string;
  signature?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Service methods
class StopPaymentService {
  private baseURL = '/api/StopPaymentOrder'; // Adjust based on your API base URL

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error.message || 'Network request failed',
      };
    }
  }

  // Submit Stop Payment Order
  async submitStopPaymentOrder(data: StopPaymentOrderCreateDto): Promise<ApiResponse<StopPaymentOrderResponseDto>> {
    return this.request<StopPaymentOrderResponseDto>('/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Revoke Stop Payment Order
  async submitRevokeStopPaymentOrder(data: RevokeStopPaymentOrderDto): Promise<ApiResponse<{ spo: StopPaymentOrderResponseDto; rspo: StopPaymentOrderResponseDto }>> {
    return this.request<{ spo: StopPaymentOrderResponseDto; rspo: StopPaymentOrderResponseDto }>('/revoke', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get all Stop Payment Orders
  async getAllStopPaymentOrders(): Promise<ApiResponse<StopPaymentOrderResponseDto[]>> {
    return this.request<StopPaymentOrderResponseDto[]>('', {
      method: 'GET',
    });
  }

  // Get Stop Payment Order by ID
  async getStopPaymentOrderById(id: string): Promise<ApiResponse<StopPaymentOrderResponseDto>> {
    return this.request<StopPaymentOrderResponseDto>(`/${id}`, {
      method: 'GET',
    });
  }

  // Cancel Stop Payment Order
  async cancelStopPaymentOrder(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/${id}`, {
      method: 'DELETE',
    });
  }

  // Get Stop Payment Orders by Branch
  async getStopPaymentOrdersByBranch(branchId: string): Promise<ApiResponse<StopPaymentOrderResponseDto[]>> {
    return this.request<StopPaymentOrderResponseDto[]>(`/branch/${branchId}`, {
      method: 'GET',
    });
  }

  // Get Stop Payment Orders by Maker and Branch
  async getStopPaymentOrdersByMakerAndBranch(makerId: string, branchId: string): Promise<ApiResponse<StopPaymentOrderResponseDto[]>> {
    return this.request<StopPaymentOrderResponseDto[]>(`/maker/${makerId}/branch/${branchId}`, {
      method: 'GET',
    });
  }

  // Search Stop Payment Orders
  async searchStopPaymentOrders(criteria: {
    accountNumber?: string;
    chequeNumber?: string;
    customerName?: string;
  }): Promise<ApiResponse<StopPaymentOrderResponseDto[]>> {
    // Since backend doesn't have a dedicated search endpoint, we'll filter client-side from all orders
    try {
      const response = await this.getAllStopPaymentOrders();
      
      if (!response.success || !response.data) {
        return response;
      }

      let results = response.data;
      
      if (criteria.accountNumber) {
        results = results.filter(order => 
          order.accountNumber.includes(criteria.accountNumber!)
        );
      }
      
      if (criteria.chequeNumber) {
        results = results.filter(order => 
          order.chequeNumber.includes(criteria.chequeNumber!)
        );
      }
      
      if (criteria.customerName) {
        const searchTerm = criteria.customerName.toLowerCase();
        results = results.filter(order => 
          order.customerName.toLowerCase().includes(searchTerm)
        );
      }

      return {
        success: true,
        data: results,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get active (not revoked) Stop Payment Orders for an account
  async getActiveStopPaymentOrders(accountNumber: string): Promise<ApiResponse<StopPaymentOrderResponseDto[]>> {
    try {
      const response = await this.getAllStopPaymentOrders();
      
      if (!response.success || !response.data) {
        return response;
      }

      const activeOrders = response.data.filter(
        order => 
          order.accountNumber === accountNumber && 
          !order.isRevoked &&
          order.status === 'Approved'
      );

      return {
        success: true,
        data: activeOrders,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update Stop Payment Order
  async updateStopPaymentOrder(id: string, data: { reason: string; signature: string }): Promise<ApiResponse<StopPaymentOrderResponseDto>> {
    return this.request<StopPaymentOrderResponseDto>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete Stop Payment Order
  async deleteStopPaymentOrder(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/${id}`, {
      method: 'DELETE',
    });
  }

  // OTP Service Integration (Mock - replace with actual OTP service)
  async requestOtp(phoneNumber: string): Promise<ApiResponse<{ message: string }>> {
    // TODO: Replace with actual OTP service integration
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: { message: 'OTP sent successfully' },
        });
      }, 1000);
    });
  }

  // Verify OTP (Mock - replace with actual OTP service)
  async verifyOtp(phoneNumber: string, otpCode: string): Promise<ApiResponse<{ verified: boolean }>> {
    // TODO: Replace with actual OTP service integration
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: { verified: otpCode.length === 6 }, // Simple mock verification
        });
      }, 500);
    });
  }
}

// Export singleton instance
const stopPaymentService = new StopPaymentService();

// Export individual methods with different names to avoid conflicts
export const submitStopPaymentOrder = stopPaymentService.submitStopPaymentOrder.bind(stopPaymentService);
export const submitRevokeStopPaymentOrder = stopPaymentService.submitRevokeStopPaymentOrder.bind(stopPaymentService);
export const getAllStopPaymentOrders = stopPaymentService.getAllStopPaymentOrders.bind(stopPaymentService);
export const getStopPaymentOrderById = stopPaymentService.getStopPaymentOrderById.bind(stopPaymentService);
export const cancelStopPaymentOrder = stopPaymentService.cancelStopPaymentOrder.bind(stopPaymentService);
export const getStopPaymentOrdersByBranch = stopPaymentService.getStopPaymentOrdersByBranch.bind(stopPaymentService);
export const getStopPaymentOrdersByMakerAndBranch = stopPaymentService.getStopPaymentOrdersByMakerAndBranch.bind(stopPaymentService);
export const searchStopPaymentOrders = stopPaymentService.searchStopPaymentOrders.bind(stopPaymentService);
export const getActiveStopPaymentOrders = stopPaymentService.getActiveStopPaymentOrders.bind(stopPaymentService);
export const updateStopPaymentOrder = stopPaymentService.updateStopPaymentOrder.bind(stopPaymentService);
export const deleteStopPaymentOrder = stopPaymentService.deleteStopPaymentOrder.bind(stopPaymentService);
export const requestOtp = stopPaymentService.requestOtp.bind(stopPaymentService);
export const verifyOtp = stopPaymentService.verifyOtp.bind(stopPaymentService);

// Export the service instance as default
export default stopPaymentService;