import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api';

export type RtgsTransferRequestDto = {
  BranchId: string; // Guid string
  OrderingAccountNumber: string;
  OrderingCustomerName: string;
  BeneficiaryBank: string;
  BeneficiaryBranch: string;
  BeneficiaryAccountNumber: string;
  BeneficiaryName: string;
  TransferAmount: number;
  PaymentNarrative: string;
  CustomerTelephone?: string | null;
  PhoneNumber?: string | null;
  DigitalSignature: string;
  OtpCode: string;
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
  Success: boolean;
};

export type ApiResponse<T> = { 
  success: boolean; 
  message?: string; 
  data?: T;
};

export async function requestRtgsTransferOtp(phoneNumber: string): Promise<ApiResponse<null>> {
  try {
    console.log(`Requesting RTGS OTP via: http://localhost:5268/api/Auth/request-otp`);
    
    const response = await fetch('http://localhost:5268/api/Auth/request-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
    });

    const responseData = await response.json().catch(() => ({
      success: false,
      message: 'Invalid response from server',
    }));

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No account found with this phone number');
      }
      throw new Error(responseData?.message || 'Failed to request OTP');
    }

    return {
      success: true,
      message: responseData.message || 'OTP sent successfully',
      data: responseData.data,
    };
  } catch (error: any) {
    console.error('Error requesting RTGS OTP:', error);
    throw new Error(error.message || 'Failed to request OTP');
  }
}

export async function submitRtgsTransfer(payload: RtgsTransferRequestDto): Promise<ApiResponse<RtgsTransferResponseDto>> {
  try {
    console.log(`Sending RTGS transfer request to: ${API_BASE_URL}/RtgsTransfer/submit`);
    
    const response = await fetch(`${API_BASE_URL}/RtgsTransfer/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json().catch(async () => {
      const text = await response.text();
      return { success: false, message: text } as any;
    });

    if (!response.ok) {
      const message = responseData?.message || responseData || 'Failed to submit RTGS transfer';
      throw new Error(message);
    }

    // Return the full backend response
    return responseData;
  } catch (error: any) {
    console.error('Error in submitRtgsTransfer:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    
    if (error.response) {
      throw {
        ...error,
        message: error.response.data?.message || 'Server responded with an error',
        status: error.response.status,
      };
    } else if (error.request) {
      throw new Error('No response received from server. Please check your connection.');
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

export async function getRtgsTransferById(id: string): Promise<ApiResponse<RtgsTransferResponseDto>> {
  try {
    const response = await fetch(`${API_BASE_URL}/RtgsTransfer/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || 'Failed to fetch RTGS transfer details');
    }

    return response.json();
  } catch (error: any) {
    console.error('Error fetching RTGS transfer:', error);
    throw new Error(error.message || 'Failed to fetch RTGS transfer details');
  }
}

export async function listRtgsTransfers(): Promise<ApiResponse<RtgsTransferResponseDto[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/RtgsTransfer`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || 'Failed to fetch RTGS transfers');
    }

    return response.json();
  } catch (error: any) {
    console.error('Error listing RTGS transfers:', error);
    throw new Error(error.message || 'Failed to fetch RTGS transfers');
  }
}

export async function updateRtgsStatus(id: string, status: string): Promise<ApiResponse<RtgsTransferResponseDto>> {
  try {
    const response = await fetch(`${API_BASE_URL}/RtgsTransfer/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    const responseData = await response.json().catch(async () => {
      const text = await response.text();
      return { success: false, message: text } as any;
    });

    if (!response.ok) {
      const message = responseData?.message || responseData || 'Failed to update RTGS status';
      throw new Error(message);
    }

    return responseData;
  } catch (error: any) {
    console.error('Error updating RTGS status:', error);
    throw new Error(error.message || 'Failed to update RTGS status');
  }
}