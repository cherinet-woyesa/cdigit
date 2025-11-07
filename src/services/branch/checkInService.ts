// services/checkInService.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api';

export type CheckInRequest = {
  branchId: string;
  customerType: 'individual' | 'corporate';
  serviceType: string;
  phoneNumber?: string;
  accountNumber?: string;
  customerName?: string;
  idNumber?: string;
  otpCode?: string;
  checkInMethod: 'kiosk' | 'receptionist' | 'mobile_app' | 'sms_link' | 'internet_banking';
  additionalData?: Record<string, any>;
};

export type CheckInResponse = {
  queueNumber: string;
  tokenNumber: string;
  branchId: string;
  branchName: string;
  serviceType: string;
  customerType: 'individual' | 'corporate';
  estimatedWaitTime?: number; // in minutes
  priority?: boolean;
  checkInTime: string;
  message: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

// Unified check-in function that handles all check-in methods
export async function processCheckIn(request: CheckInRequest): Promise<ApiResponse<CheckInResponse>> {
  try {
    const response = await axios.post<ApiResponse<CheckInResponse>>(
      `${API_BASE_URL}/checkin`,
      request
    );
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process check-in',
        data: undefined
      };
    }
    
    return {
      success: false,
      message: 'An unexpected error occurred',
      data: undefined
    };
  }
}

// Get queue status for a specific token
export async function getQueueStatus(tokenNumber: string): Promise<ApiResponse<CheckInResponse>> {
  try {
    const response = await axios.get<ApiResponse<CheckInResponse>>(
      `${API_BASE_URL}/checkin/status/${tokenNumber}`
    );
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get queue status',
        data: undefined
      };
    }
    
    return {
      success: false,
      message: 'An unexpected error occurred',
      data: undefined
    };
  }
}

// Cancel a check-in
export async function cancelCheckIn(tokenNumber: string): Promise<ApiResponse<boolean>> {
  try {
    const response = await axios.delete<ApiResponse<boolean>>(
      `${API_BASE_URL}/checkin/${tokenNumber}`
    );
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to cancel check-in',
        data: false
      };
    }
    
    return {
      success: false,
      message: 'An unexpected error occurred',
      data: false
    };
  }
}

// Get estimated wait time for a service type at a branch
export async function getEstimatedWaitTime(branchId: string, serviceType: string): Promise<ApiResponse<number>> {
  try {
    const response = await axios.get<ApiResponse<number>>(
      `${API_BASE_URL}/checkin/estimate/${branchId}/${serviceType}`
    );
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get estimated wait time',
        data: undefined
      };
    }
    
    return {
      success: false,
      message: 'An unexpected error occurred',
      data: undefined
    };
  }
}

// Get all active services at a branch
export async function getBranchServices(branchId: string): Promise<ApiResponse<string[]>> {
  try {
    const response = await axios.get<ApiResponse<string[]>>(
      `${API_BASE_URL}/branches/${branchId}/services`
    );
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get branch services',
        data: undefined
      };
    }
    
    return {
      success: false,
      message: 'An unexpected error occurred',
      data: undefined
    };
  }
}