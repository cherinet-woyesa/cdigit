// src/auth/depositService.ts

const API_BASE_URL = 'http://localhost:5268/api/Deposits';

// The backend expects the form fields at the top level, NOT wrapped
export type DepositFormFields = {
    formKey: string;
    branchId: string; // Guid as string
    accountHolderName: string;
    accountNumber: string;
    // typeOfAccount?: 'Savings' | 'Current' | 'Special Demand';
    amount: number;
    amountInWords?: string;
    DepositedBy?: string;
    sourceOfProceeds?: string;
    telephoneNumber?: string;
};

type DepositResponseData = {
    id: string;
    formReferenceId: string;
    queueNumber?: number;
    accountHolderName: string;
    accountNumber: string;
    amount: number;
    amountInWords: string | null;
    depositedBy: string | null;
    telephoneNumber: string;
    tokenNumber: string;
    transactionType: string;
    status: string;
};

type SubmitDepositResponse = {
    success: boolean;
    message: string;
    data: DepositResponseData;
};

type ErrorResponse = {
    Message?: string;
    errors?: Record<string, string[]>;
};

const depositService = {
    /**
     * Submits a new cash deposit form to the backend.
     * @param data The deposit data from the frontend form.
     * @returns A promise that resolves with the backend's response.
     * @throws An error if the submission fails.
     */
    async submitDeposit(data: DepositFormFields): Promise<SubmitDepositResponse> {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData: ErrorResponse = await response.json();
                let errorMessage = errorData.Message || 'Failed to submit deposit.';
                if (errorData.errors) {
                    const validationErrors = Object.values(errorData.errors).flat().join('; ');
                    if (validationErrors) {
                        errorMessage += ` Details: ${validationErrors}`;
                    }
                }
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            console.error('Error submitting deposit:', error);
            throw error;
        }
    },

    async getDepositById(id: string): Promise<SubmitDepositResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData: ErrorResponse = await response.json();
                const errorMessage = errorData.Message || 'Deposit not found.';
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching deposit by ID ${id}:`, error);
            throw error;
        }
    },

    async getAllDeposits(): Promise<SubmitDepositResponse[]> {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData: ErrorResponse = await response.json();
                const errorMessage = errorData.Message || 'Failed to fetch all deposits.';
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching all deposits:', error);
            throw error;
        }
    },

    async cancelDepositByCustomer(id: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/cancel-by-customer/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData: ErrorResponse = await response.json();
                const errorMessage = errorData.Message || 'Failed to cancel deposit.';
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            console.error('Error cancelling deposit:', error);
            throw error;
        }
    },
};

export default depositService;