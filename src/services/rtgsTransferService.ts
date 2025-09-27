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

export async function requestRtgsTransferOtp(phoneNumber: string): Promise<ApiResponse<null>> {
    try {
        console.log(`Requesting RTGS OTP for phone: ${phoneNumber}`);
        const res = await axios.post(`${API_BASE_URL}/RtgsTransfer/request-otp`, { phoneNumber }, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000,
            validateStatus: (status) => status < 500,
        });

        if (!res.data) {
            console.error('Empty OTP response from server');
            throw new Error('Empty OTP response from server');
        }

        return res.data;
    } catch (error: any) {
        console.error('Error in requestRtgsTransferOtp:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
        });

        if (error.response) {
            throw {
                ...error,
                message: error.response.data?.message || 'Server responded with an error during OTP request',
                status: error.response.status,
            };
        } else if (error.request) {
            throw new Error('No response received from OTP server. Please check your connection.');
        } else {
            throw new Error(`OTP request failed: ${error.message}`);
        }
    }
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