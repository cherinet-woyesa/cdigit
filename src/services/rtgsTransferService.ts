import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api';

export type RtgsTransferRequestDto = {
  BranchId: string; // Guid string
  OrderingAccountNumber: string;
  BeneficiaryBank: string;
  BeneficiaryBranch: string;
  BeneficiaryAccountNumber: string;
  BeneficiaryName: string;
  TransferAmount: number;
  PaymentNarrative: string;
  CustomerTelephone?: string | null;
  PhoneNumber?: string | null; // Some endpoints expect PhoneNumber with OtpCode
  DigitalSignature: string;
  OtpCode: string;
  // REMOVED: Success: boolean; // This should only be in response
};

export type RtgsTransferResponseDto = {
  Id: string;
  FormReferenceId: string;
  BranchName: string;
  SubmittedAt: string;
  OrderingAccountNumber: string;
  OrderingCustomerName?: string;
  BeneficiaryBank: string;
  BeneficiaryBranch: string;
  BeneficiaryAccountNumber: string;
  BeneficiaryName: string;
  TransferAmount: number;
  PaymentNarrative: string;
  CustomerTelephone?: string | null;
  Status: string;
  Success: boolean; // This stays here - it's a response property
};

export type ApiResponse<T> = { success: boolean; message?: string; data?: T };

type RtgsOtpAttempt =
  | { method: 'POST'; url: string; body: { phoneNumber: string } }
  | { method: 'GET'; url: string; params: { phoneNumber: string } };

export async function requestRtgsTransferOtp(phoneNumber: string): Promise<ApiResponse<null>> {
  const endpoints: RtgsOtpAttempt[] = [
    { method: 'POST', url: `${API_BASE_URL}/RtgsTransfer/request-otp`, body: { phoneNumber } },
    { method: 'POST', url: `${API_BASE_URL}/RtgsTransfer/RequestOtp`, body: { phoneNumber } },
    { method: 'GET', url: `${API_BASE_URL}/RtgsTransfer/request-otp`, params: { phoneNumber } },
  ];

  let lastError: any = null;

  for (const attempt of endpoints) {
    try {
      console.log(`Requesting RTGS OTP via ${attempt.method} ${attempt.url}`);
      const config: any = {
        method: attempt.method,
        url: attempt.url,
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
        validateStatus: (status: number) => status < 500,
      };
      if (attempt.method === 'POST') {
        config.data = (attempt as Extract<RtgsOtpAttempt, { method: 'POST' }>).body;
      } else {
        config.params = (attempt as Extract<RtgsOtpAttempt, { method: 'GET' }>).params;
      }
      const res = await axios.request(config);

      if (!res.data) {
        throw new Error('Empty OTP response from server');
      }
      return res.data;
    } catch (error: any) {
      lastError = error;
      console.warn('RTGS OTP attempt failed:', {
        methodTried: attempt.method,
        urlTried: attempt.url,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      // Try next pattern
    }
  }

  console.error('All RTGS OTP request attempts failed');
  if (lastError?.response) {
    throw {
      ...lastError,
      message: lastError.response.data?.message || 'RTGS OTP request failed',
      status: lastError.response.status,
    };
  }
  if (lastError?.request) {
    throw new Error('No response received from RTGS OTP server. Please check your connection.');
  }
  throw new Error(`RTGS OTP request failed: ${lastError?.message || 'Unknown error'}`);
}

export async function submitRtgsTransfer(payload: RtgsTransferRequestDto): Promise<ApiResponse<RtgsTransferResponseDto>> {
  try {
    console.log(`Sending RTGS transfer request to: ${API_BASE_URL}/RtgsTransfer/submit`);
    const res = await axios.post(`${API_BASE_URL}/RtgsTransfer/submit`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
      validateStatus: (status) => status < 500, // Don't throw for 4xx errors
    });
    
    console.log('RTGS transfer response status:', res.status);
    
    if (!res.data) {
      console.error('Empty response from server');
      throw new Error('Empty response from server');
    }
    
    return res.data;
  } catch (error: any) {
    console.error('Error in submitRtgsTransfer:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      code: error.code,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
      },
    });
    
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw {
        ...error,
        message: error.response.data?.message || 'Server responded with an error',
        status: error.response.status,
      };
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from server. Please check your connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

export async function getRtgsTransferById(id: string): Promise<ApiResponse<RtgsTransferResponseDto>> {
  const res = await axios.get(`${API_BASE_URL}/RtgsTransfer/${id}`);
  return res.data;
}

export async function listRtgsTransfers(): Promise<ApiResponse<RtgsTransferResponseDto[]>> {
  const res = await axios.get(`${API_BASE_URL}/RtgsTransfer`);
  return res.data;
}

export async function updateRtgsStatus(id: string, status: string): Promise<ApiResponse<RtgsTransferResponseDto>> {
  const res = await axios.put(`${API_BASE_URL}/RtgsTransfer/${id}/status`, null, { params: { status } });
  return res.data;
}