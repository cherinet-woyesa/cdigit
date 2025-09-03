// src/services/withdrawalService.ts

const API_BASE_URL = 'http://localhost:5268/api/Withdrawal';

export interface WithdrawalRequest {
  phoneNumber: string;
  branchId: string; // Guid as string
  accountNumber: string | number; // long on backend
  accountHolderName: string;
  withdrawal_Amount: number; // will map to Withdrawal_Amount
  remark?: string;
  OtpCode: string;
}

export interface WithdrawalResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    branchId: string;
    formReferenceId: string;
    accountNumber: string;
    accountHolderName?: string;
    withdrawal_Amount: number;
    tokenNumber: string;
    queueNumber: number;
    remark?: string;
    transactionType: string;
    status: string;
  };
}

export async function submitWithdrawal(data: WithdrawalRequest): Promise<WithdrawalResponse> {
  // Backend expects PascalCase keys per DTO
  const payload = {
    PhoneNumber: data.phoneNumber,
    BranchId: data.branchId,
    AccountNumber: data.accountNumber,
    AccountHolderName: data.accountHolderName,
    Withdrawal_Amount: data.withdrawal_Amount,
    Remark: data.remark ?? '',
    OtpCode: data.OtpCode,
  };

  const response = await fetch(`${API_BASE_URL}/Submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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

  // Handle wrapped responses: { success, message, data }
  if (typeof json === 'object' && json !== null && 'success' in json) {
    if ((json as any).success === false) {
      throw new Error((json as any).message || 'Withdrawal submission failed');
    }
    if ((json as any).data) {
      return (json as any).data as WithdrawalResponse;
    }
  }

  return {
    success: true,
    message: 'Withdrawal submitted successfully',
    data: json
  };
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

export async function cancelWithdrawalByCustomer(id: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/cancel-by-customer/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.message || 'Failed to cancel withdrawal.';
    throw new Error(errorMessage);
  }
  return response.json();
}
