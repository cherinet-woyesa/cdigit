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
  const response = await fetch('http://localhost:5268/api/withdrawal/Submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to submit withdrawal');
  }
  return response.json();
}
