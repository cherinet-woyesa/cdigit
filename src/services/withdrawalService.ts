// src/services/withdrawalService.ts

// Align request with backend WithdrawalRequestDto
export interface WithdrawalRequest {
  phoneNumber: string;
  accountNumber: number; // long on backend
  withdrawa_Amount: number; // matches backend property name
  remark?: string;
  code: number; // int on backend
}

export interface WithdrawalResponse {
  referenceId: string;
  accountNumber: string;
  withdrawa_Amount: number;
  tokenNumber: string;
  windowNumber: number;
  message: string;
}

export async function submitWithdrawal(data: WithdrawalRequest): Promise<WithdrawalResponse> {
  // Backend expects PascalCase keys per DTO
  const payload = {
    PhoneNumber: data.phoneNumber,
    AccountNumber: data.accountNumber,
    Withdrawa_Amount: data.withdrawa_Amount,
    Remark: data.remark ?? '',
    Code: data.code,
  };

  const response = await fetch('http://localhost:5268/api/withdrawal/Submit', {
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
