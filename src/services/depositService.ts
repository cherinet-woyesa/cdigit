// src/auth/depositService.ts

const API_BASE_URL = 'http://localhost:5268/api/Deposits';

async function parseJsonSafe<T>(response: Response): Promise<T | null> {
    const contentType = response.headers.get('content-type') || '';
    if (response.status === 204) return null;
    // Some servers may omit content-type; guard with try/catch
    if (!contentType.includes('application/json')) {
        try {
            const text = await response.text();
            if (!text) return null;
            return JSON.parse(text) as T;
        } catch {
            return null;
        }
    }
    try {
        return (await response.json()) as T;
    } catch {
        return null;
    }
}

async function parseErrorMessage(response: Response): Promise<string> {
    try {
        const data = await parseJsonSafe<ErrorResponse>(response);
        if (data) {
            let msg = data.Message || 'Request failed.';
            if (data.errors) {
                const validation = Object.values(data.errors).flat().join('; ');
                if (validation) msg += ` Details: ${validation}`;
            }
            return msg;
        }
    } catch {}
    return response.statusText || 'Request failed.';
}

// The backend expects the form fields at the top level, NOT wrapped
export type DepositFormFields = {
    formKey: string;
    branchId: string; // Guid as string
    accountHolderName: string;
    accountNumber: string;
    typeOfAccount?: string;
    amount: number;
    amountInWords?: string;
    DepositedBy?: string;
    sourceOfProceeds?: string;
    telephoneNumber?: string;
    // Additional fields that might be required by the API
    transactionType?: string;
    status?: string;
    tokenNumber?: string;
    id?: string;
    formReferenceId?: string;
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
    branchId?: string;
    sourceOfProceeds?: string;
    typeOfAccount?: string;
    DepositedBy?: string;
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
            // Format the data with correct casing for the API
            const requestData = {
                Id: data.id || '',
                AccountNumber: data.accountNumber,
                AccountHolderName: data.accountHolderName,
                Amount: data.amount,
                BranchId: data.branchId,
                TelephoneNumber: data.telephoneNumber || '',
                // Required fields with default values
                AmountInWords: data.amountInWords || 'N/A',
                SourceOfProceeds: data.sourceOfProceeds || 'N/A',
                TypeOfAccount: data.typeOfAccount || 'N/A',
                DepositedBy: data.DepositedBy || 'N/A',
                // Additional fields with default values
                TransactionType: 'Cash Deposit',
                Status: 'Pending',
                TokenNumber: '',
                FormReferenceId: data.formReferenceId || `dep-${Date.now()}`,
                QueueNumber: 0
            };

            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorMessage = await parseErrorMessage(response);
                throw new Error(errorMessage || 'Failed to submit deposit.');
            }

            const json = await parseJsonSafe<SubmitDepositResponse>(response);
            if (json) return json;
            // Fallback if server returned empty body
            return { success: true, message: 'Submitted successfully.', data: undefined as any } as SubmitDepositResponse;
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
                const errorMessage = await parseErrorMessage(response);
                throw new Error(errorMessage || 'Deposit not found.');
            }

            const json = await parseJsonSafe<SubmitDepositResponse>(response);
            if (json) return json;
            throw new Error('Empty response from server.');
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
                const errorMessage = await parseErrorMessage(response);
                throw new Error(errorMessage || 'Failed to fetch all deposits.');
            }

            const json = await parseJsonSafe<SubmitDepositResponse[]>(response);
            if (json) return json;
            return [] as SubmitDepositResponse[];
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
                const errorMessage = await parseErrorMessage(response);
                throw new Error(errorMessage || 'Failed to cancel deposit.');
            }

            const json = await parseJsonSafe<{ success: boolean; message: string }>(response);
            if (json) return json;
            return { success: true, message: 'Cancelled successfully.' };
        } catch (error) {
            console.error('Error cancelling deposit:', error);
            throw error;
        }
    },

    async updateDeposit(id: string, data: DepositFormFields): Promise<SubmitDepositResponse> {
        try {
            // Ensure we have all required fields with proper fallbacks and correct casing
            const requestData = {
                Id: id,
                AccountNumber: data.accountNumber,
                AccountHolderName: data.accountHolderName,
                Amount: data.amount,
                BranchId: data.branchId,
                TelephoneNumber: data.telephoneNumber || '',
                // Required fields with empty string as fallback and correct casing
                AmountInWords: data.amountInWords || 'N/A',
                SourceOfProceeds: data.sourceOfProceeds || 'N/A',
                DepositedBy: data.DepositedBy || 'N/A',
                TypeOfAccount: data.typeOfAccount || 'N/A',
                // Additional required fields with default values
                TransactionType: data.transactionType || 'Cash Deposit',
                Status: data.status || 'Pending',
                TokenNumber: data.tokenNumber || '',
                // Ensure these are included with default values if needed
                FormReferenceId: data.formReferenceId || id,
                QueueNumber: (data as any).queueNumber || 0
            };

            const response = await fetch(`${API_BASE_URL}/update-By-Customer/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                // If we get a 405 Method Not Allowed, try with POST as fallback
                if (response.status === 405) {
                    return this.updateDepositWithPost(id, data);
                }
                const errorMessage = await parseErrorMessage(response);
                throw new Error(errorMessage || 'Failed to update deposit.');
            }

            const json = await parseJsonSafe<SubmitDepositResponse>(response);
            if (json) {
                return {
                    success: true,
                    message: 'Deposit updated successfully',
                    data: {
                        ...json.data,
                        id: id,
                        formReferenceId: id
                    }
                };
            }

            // Fallback response if no data is returned
            return { 
                success: true, 
                message: 'Deposit updated successfully', 
                data: { 
                    ...data, 
                    id,
                    formReferenceId: id,
                    status: 'Updated',
                    tokenNumber: '',
                    transactionType: 'Cash Deposit',
                    amountInWords: '',
                    depositedBy: null,
                    telephoneNumber: data.telephoneNumber || ''
                } as DepositResponseData 
            };
        } catch (error) {
            console.error('Error updating deposit:', error);
            throw error;
        }
    },

    async updateDepositWithPost(id: string, data: DepositFormFields): Promise<SubmitDepositResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}?_action=update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorMessage = await parseErrorMessage(response);
                throw new Error(errorMessage || 'Failed to update deposit using fallback method.');
            }

            const json = await parseJsonSafe<SubmitDepositResponse>(response);
            if (json) {
                return {
                    ...json,
                    data: {
                        ...json.data,
                        id: id,
                        formReferenceId: id
                    }
                };
            }

            throw new Error('Empty response from server when updating deposit.');
        } catch (error) {
            console.error('Error in fallback update method:', error);
            throw error;
        }
    },
};

export default depositService;