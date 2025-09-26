export interface OtpRequestResponse {
  success: boolean;
  message: string;
  data?: {
    phoneNumber: string;
    expiryTime?: string;
  };
}

export interface OtpVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    isVerified: boolean;
    token?: string;
    otp?: string;
  };
}

export interface WithdrawalUpdateDto {
  withdrawal_Amount?: number;
  remark?: string;
  status?: string;
}

export interface WithdrawalResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface WithdrawalRequest {
  phoneNumber: string;
  branchId: string;
  accountNumber: string | number;
  accountHolderName: string;
  withdrawal_Amount: number;
  remark?: string;
  otpCode: string; // Now required
}

const API_BASE_URL = 'http://localhost:5268/api/Withdrawal';
const AUTH_API_URL = 'http://localhost:5268/api/Auth';

export async function updateWithdrawal(id: string, data: WithdrawalUpdateDto): Promise<WithdrawalResponse> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const json = await response.json().catch(async () => {
    const text = await response.text();
    return { success: false, message: text } as any;
  });

  if (!response.ok) {
    const message = json?.message || json || 'Failed to update withdrawal';
    throw new Error(message);
  }

  if (typeof json === 'object' && json !== null && 'success' in json) {
    if ((json as any).success === false) {
      throw new Error((json as any).message || 'Withdrawal update failed');
    }
    if ((json as any).data) {
      return (json as any).data as WithdrawalResponse;
    }
  }

  return {
    success: true,
    message: 'Withdrawal updated successfully',
    data: json
  };
}

export async function submitWithdrawal(data: WithdrawalRequest, token?: string): Promise<WithdrawalResponse> {
  // Backend expects PascalCase keys per DTO
  const payload = {
    PhoneNumber: data.phoneNumber,
    BranchId: data.branchId,
    AccountNumber: data.accountNumber,
    AccountHolderName: data.accountHolderName,
    Withdrawal_Amount: data.withdrawal_Amount,
    Remark: data.remark ?? '',
    OtpCode: data.otpCode,
  };

  console.log('Submitting withdrawal with payload:', payload); // Debug log

  const headers: any = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/Submit`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const json = await response.json().catch(async () => {
    const text = await response.text();
    return { success: false, message: text } as any;
  });

  if (!response.ok) {
    const message = json?.message || json || 'Failed to submit withdrawal';
    throw new Error(message);
  }

  // Always return the full backend response (with success/message/data)
  return json;
}

export async function getWithdrawalById(id: string): Promise<WithdrawalResponse> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.message || 'Failed to fetch withdrawal details');
  }

  return response.json();
}

export interface CancelWithdrawalResponse {
  success: boolean;
  message: string;
  data?: any;
}

export async function requestWithdrawalOtp(phoneNumber: string): Promise<OtpRequestResponse> {
  try {
    const response = await fetch(`${AUTH_API_URL}/request-otp`, {
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
        return {
          success: false,
          message: 'No account found with this phone number',
        };
      }
      throw new Error(responseData?.message || 'Failed to request OTP');
    }

    return {
      success: true,
      message: responseData.message || 'OTP sent successfully',
      data: responseData.data,
    };
  } catch (error: any) {
    console.error('Error requesting OTP:', error);
    return {
      success: false,
      message: error.message || 'Failed to request OTP',
    };
  }
}

export async function cancelWithdrawalByCustomer(id: string): Promise<CancelWithdrawalResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/cancel-by-customer/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.json().catch(() => ({
      success: false,
      message: 'Invalid response from server'
    }));

    if (!response.ok) {
      throw new Error(responseData?.message || 'Failed to cancel withdrawal');
    }

    return {
      success: true,
      message: responseData.message || 'Withdrawal cancelled successfully',
      data: responseData.data
    };
  } catch (error: any) {
    console.error('Error cancelling withdrawal:', error);
    return {
      success: false,
      message: error.message || 'Failed to cancel withdrawal',
      data: null
    };
  }
}