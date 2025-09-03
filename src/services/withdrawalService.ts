// src/services/withdrawalService.ts

// Align request with backend WithdrawalRequestDto
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
  referenceId?: string;
  accountNumber?: string | number;
  Withdrawal_Amount?: number;
  withdrawa_Amount?: number;
  TokenNumber?: string;
  tokenNumber?: string;
  QueueNumber?: number;
  windowNumber?: number;
  message?: string;
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

  const response = await fetch('http://localhost:5268/api/Withdrawal/Submit', {
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

  return json as WithdrawalResponse;
}
