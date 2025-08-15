// src/auth/depositService.ts (or your specified path)

const API_BASE_URL = 'http://localhost:5268/api/Deposits';// Make sure this matches your backend URL

// Define the shape of the data you'll send to the backend for submitting a deposit

// The backend expects { depositForm: { ...fields... } }
type DepositFormFields = {
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
type SubmitDepositData = { depositForm: DepositFormFields };

// Define the shape of the response from the backend after submitting a deposit
type SubmitDepositResponse = {
    message: string;
    depositId?: number; // depositId is optional because it might not be present on error
};

// Define the shape of a generic error response from the backend
type ErrorResponse = {
    Message?: string; // Common for backend error messages
    errors?: Record<string, string[]>; // For validation errors from ModelState
};

const depositService = {
    /**
     * Submits a new cash deposit form to the backend.
     * @param data The deposit data from the frontend form.
     * @returns A promise that resolves with the backend's response message and depositId.
     * @throws An error if the submission fails.
     */
    submitDeposit: async (data: SubmitDepositData): Promise<SubmitDepositResponse> => {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${YOUR_AUTH_TOKEN}`,
                },
                body: JSON.stringify(data), // data should be { depositForm: { ...fields... } }
            });

            // Check if the response is OK (2xx status code)
            if (response.ok) {
                const responseData: SubmitDepositResponse = await response.json();
                return responseData;
            } else {
                // Handle non-2xx responses (e.g., 400 Bad Request, 401 Unauthorized, 500 Internal Server Error)
                const errorData: ErrorResponse = await response.json();
                let errorMessage = errorData.Message || 'Failed to submit deposit.';

                // If there are specific validation errors, append them
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
            // Re-throw the error for the component to handle
            throw error;
        }
    },

    /**
     * Fetches details of a specific deposit by its ID.
     * This is useful if you want to display deposit details after submission or for a lookup.
     * @param id The ID of the deposit.
     * @returns A promise that resolves with the deposit details.
     * @throws An error if the fetch fails or deposit is not found.
     */
    getDepositById: async (id: number): Promise<any> => { // You might want to define a type for Deposit entity
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${YOUR_AUTH_TOKEN}`, // Add if you have authentication
                },
            });

            if (response.ok) {
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

    /**
     * Fetches all deposits. Typically for admin/frontmaker views.
     * @returns A promise that resolves with an array of all deposits.
     * @throws An error if the fetch fails.
     */
    getAllDeposits: async (): Promise<any[]> => { // You might want to define a type for Deposit entity
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${YOUR_AUTH_TOKEN}`, // Add if you have authentication
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

    // You can add more methods here for other API calls, e.g.,
    // updateDepositByCustomer, cancelDepositByCustomer, updateDenominations, etc.
    // Example:
    /*
    updateDepositByCustomer: async (id: number, formKey: string, updateData: any): Promise<void> => {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}/customer-update?formkey=${formKey}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${YOUR_AUTH_TOKEN}`,
                },
                body: JSON.stringify(updateData),
            });
            if (!response.ok) {
                const errorData: ErrorResponse = await response.json();
                const errorMessage = errorData.Message || `Failed to update deposit ${id}.`;
                throw new Error(errorMessage);
            }
            // No content to return for 204
        } catch (error) {
            console.error(`Error updating deposit ${id} by customer:`, error);
            throw error;
        }
    },
    */
};

export default depositService;