// src/auth/depositService.ts

const API_BASE_URL = 'http://localhost:5268/api/Deposits';

// The backend expects the form fields at the top level, NOT wrapped
export type DepositFormFields = {
    formKey: string;
    branchId: string; // Guid as string
    accountHolderName: string;
    accountNumber: string;
    typeOfAccount: 'Savings' | 'Current' | 'Special Demand';
    amount: number;
    amountInWords: string;
    DepositedBy: string;
    sourceOfProceeds: string;
    telephoneNumber: string;
};

type SubmitDepositResponse = {
    message: string;
    depositId?: number;
};

type ErrorResponse = {
    Message?: string;
    errors?: Record<string, string[]>;
};

const depositService = {
    /**
     * Submits a new cash deposit form to the backend.
     * @param data The deposit data from the frontend form.
     * @returns A promise that resolves with the backend's response message and depositId.
     * @throws An error if the submission fails.
     */
    submitDeposit: async (data: DepositFormFields): Promise<SubmitDepositResponse> => {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${YOUR_AUTH_TOKEN}`,
                },
                body: JSON.stringify(data), // <-- send raw fields, not wrapped!
            });

            if (response.ok) {
                // Backend responds with { Message, Deposit } so adapt accordingly
                const responseData = await response.json();
                // Extract message and depositId if present
                return {
                    message: responseData.Message ?? 'Submission successful.',
                    depositId: responseData.Deposit?.Id,
                };
            } else {
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
        } catch (error) {
            console.error('Error submitting deposit:', error);
            throw error;
        }
    },

    getDepositById: async (id: string): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                // Expecting { success, message, data }
                return await response.json();
            } else {
                const errorData: ErrorResponse = await response.json();
                const errorMessage = errorData.Message || 'Deposit not found.';
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error(`Error fetching deposit by ID ${id}:`, error);
            throw error;
        }
    },

    getAllDeposits: async (): Promise<any[]> => {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                return await response.json();
            } else {
                const errorData: ErrorResponse = await response.json();
                const errorMessage = errorData.Message || 'Failed to fetch all deposits.';
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Error fetching all deposits:', error);
            throw error;
        }
    },
};

export default depositService;