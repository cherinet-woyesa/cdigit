import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api';

interface DepositFormDto {
    formKey: string;
    branchId: number;
    accountHolderName: string;
    accountNumber: string;
    typeOfAccount: string;
    amount: number;
    amountInWords: string;
    DepositedBy: string;
    sourceOfProceeds: string;
    telephoneNumber: string;
}

interface DepositResponse {
    message: string;
    depositId: number;
}

const depositService = {
    submitDeposit: async (depositData: DepositFormDto): Promise<DepositResponse> => {
        try {
            const response = await axios.post<DepositResponse>(`${API_BASE_URL}/deposits`, depositData);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Deposit submission error:", error.response?.data || error.message);
                throw new Error(error.response?.data?.message || "Deposit submission failed");
            } else {
                console.error("Unexpected error:", error);
                throw new Error("Deposit submission failed");
            }
        }
    },
    validateAccountNumber: async (accountNumber: string): Promise<boolean> => {
        try {
            const response = await axios.get<boolean>(`${API_BASE_URL}/deposits/validate-account/${accountNumber}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Account validation error:", error.response?.data || error.message);
                throw new Error("Account validation failed");
            } else {
                console.error("Unexpected error:", error);
                throw new Error("Account validation failed");
            }
        }
    }
};

export default depositService;