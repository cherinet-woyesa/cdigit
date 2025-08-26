// services/accountTypeService.ts

type ApiResponse<T> = {
    success: boolean;
    message: string;
    data: T;
};

export type AccountType = {
    id: number;
    name: string;
    description?: string;
};

export async function getAccountTypes(): Promise<AccountType[]> {
    const response = await fetch('/api/AccountTypes');
    if (!response.ok) throw new Error('Failed to fetch account types');
    const payload: ApiResponse<AccountType[]> = await response.json();
    if (!payload.success) throw new Error(payload.message || 'Failed to fetch account types');
    return payload.data || [];
}