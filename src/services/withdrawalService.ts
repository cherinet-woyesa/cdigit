// src/services/withdrawalService.ts

export interface WithdrawalRequest {
  branchId: string;
  customerFullName: string;
  phoneNumber: string;
  accountNumber: string;
  accountHolderName: string;
  withdrawalAmount: number;
  otpCode: string; // For now, string; backend expects Guid or 6-digit code
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
  // Map payload keys to PascalCase as many backend endpoints expect that casing
  const toPascal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const payload: Record<string, unknown> = {};
  Object.entries(data).forEach(([k, v]) => {
    payload[toPascal(k)] = v;
  });

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
