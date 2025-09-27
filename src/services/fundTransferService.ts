import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // or get from your auth context
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Types based on your backend model
export interface FundTransferRequestDto {
  PhoneNumber: string;
  BranchId: string;
  DebitAccountNumber: string;
  BeneficiaryAccountNumber: string;
  TransferAmount: number;
  Reason?: string;
  OtpCode: string;
}

export interface FundTransferResponseDto {
  Id: string;
  FormReferenceId: string;
  DebitAccountNumber: string;
  DebitAccountName: string;
  BeneficiaryAccountNumber: string;
  BeneficiaryName: string;
  TransferAmount: number;
  TokenNumber: string;
  QueueNumber?: number;
  Reason?: string;
  Status: string;
  SubmittedAt: string;
  CalledAt?: string;
  DepositedToCBSAt?: string;
}

export interface FundTransferUpdateDto {
  PhoneNumber?: string;
  BranchId: string;
  DebitAccountNumber: string;
  BeneficiaryAccountNumber: string;
  TransferAmount: number;
  Reason?: string;
  OtpCode: string;
}

// Account validation
export const validateAccountWithCBS = async (accountNumber: string): Promise<any> => {
  try {
    const res = await apiClient.get(`/Accounts/AccountNumExist/${accountNumber}`);
    return res.data?.data ?? res.data;
  } catch (error) {
    console.error('Account validation error:', error);
    throw error;
  }
};

// OTP servicess
export const sendFundTransferOTP = async (phone: string): Promise<any> => {
  try {
    const res = await apiClient.post('/auth/request-otp', { PhoneNumber: phone });
    return res.data;
  } catch (error) {
    console.error('OTP send error:', error);
    throw error;
  }
};

export const verifyFundTransferOTP = async (phone: string, otp: string): Promise<any> => {
  try {
    const res = await apiClient.post('/auth/verify-otp', { 
      PhoneNumber: phone, 
      OtpCode: otp 
    });
    return res.data;
  } catch (error) {
    console.error('OTP verification error:', error);
    throw error;
  }
};

// Fund Transfer CRUD operations
export const getFundTransferById = async (id: string): Promise<FundTransferResponseDto> => {
  try {
    const res = await apiClient.get(`/FundTransfer/${id}`);
    return res.data;
  } catch (error) {
    console.error('Get fund transfer error:', error);
    throw error;
  }
};

// Update the service functions to return ApiResponse type
export const submitFundTransfer = async (data: {
  phoneNumber: string;
  branchId: string;
  debitAccountNumber: string;
  creditAccountNumber: string;
  amount: number;
  remark?: string;
  otp: string;
}): Promise<ApiResponse<FundTransferResponseDto>> => {
  try {
    const payload: FundTransferRequestDto = {
      PhoneNumber: data.phoneNumber,
      BranchId: data.branchId,
      DebitAccountNumber: data.debitAccountNumber,
      BeneficiaryAccountNumber: data.creditAccountNumber,
      TransferAmount: data.amount,
      Reason: data.remark || '',
      OtpCode: data.otp,
    };

    console.log('Submitting payload:', payload); // Debug log

    // Send directly without wrapping
    const res = await apiClient.post('/FundTransfer/submit', payload);
    return res.data;
  } catch (error: any) {
    console.error('Submit fund transfer error:', error);
    
    // Enhanced error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    
    throw error;
  }
};

export const updateFundTransfer = async (
  id: string,
  data: {
    phoneNumber?: string;
    branchId: string;
    debitAccountNumber: string;
    creditAccountNumber: string;
    amount: number;
    remark?: string;
    otp: string;
  }
): Promise<any> => {
  try {
    // Convert to PascalCase to match backend DTO
    const payload: FundTransferUpdateDto = {
      PhoneNumber: data.phoneNumber,
      BranchId: data.branchId,
      DebitAccountNumber: data.debitAccountNumber,
      BeneficiaryAccountNumber: data.creditAccountNumber,
      TransferAmount: data.amount,
      Reason: data.remark || '',
      OtpCode: data.otp,
    };

    console.log('Updating with payload:', payload); // Debug log

    const res = await apiClient.put(`/FundTransfer/${id}`, payload);
    return res.data;
  } catch (error: any) {
    console.error('Update fund transfer error:', error);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    
    throw error;
  }
};

export const cancelFundTransferByCustomer = async (id: string): Promise<any> => {
  try {
    const res = await apiClient.put(`/FundTransfer/cancel-by-customer/${id}`);
    return res.data;
  } catch (error) {
    console.error('Cancel fund transfer error:', error);
    throw error;
  }
};

// Additional utility functions
export const getFundTransferHistory = async (phoneNumber: string): Promise<FundTransferResponseDto[]> => {
  try {
    const res = await apiClient.get(`/FundTransfer/history/${phoneNumber}`);
    return res.data;
  } catch (error) {
    console.error('Get history error:', error);
    throw error;
  }
};

export const getFundTransferByToken = async (tokenNumber: string): Promise<FundTransferResponseDto> => {
  try {
    const res = await apiClient.get(`/FundTransfer/token/${tokenNumber}`);
    return res.data;
  } catch (error) {
    console.error('Get by token error:', error);
    throw error;
  }
};