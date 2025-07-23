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
    depositedBy: string;
    sourceOfProceeds: string;
    telephoneNumber: string;
    signatureImageBase64?: string;
    frontMakerId?: number;
    windowNumber?: number;
    queueNumber?: number;
}

interface DepositResponse {
    message: string;
    depositId: number;
}

interface DepositService {
    submitDeposit: (depositData: DepositFormDto) => Promise<DepositResponse>;
    validateAccountNumber: (accountNumber: string) => Promise<boolean>;
}

const depositService: DepositService = {
    submitDeposit: async (depositData: DepositFormDto) => {
        try {
            const response = await axios.post<DepositResponse>(`${API_BASE_URL}/deposits`, depositData);
            return response.data;
        } catch (error: unknown) { // Specify that error is of type unknown
            if (axios.isAxiosError(error)) {
                // Handle Axios error
                console.error("Deposit submission error:", error.response?.data || error.message);
                throw error.response?.data?.message || "Deposit submission failed";
            } else {
                // Handle non-Axios error
                console.error("Unexpected error:", error);
                throw new Error("Deposit submission failed");
            }
        }
    },
    validateAccountNumber: async (accountNumber: string) => {
        try {
            const response = await axios.get<boolean>(`${API_BASE_URL}/deposits/validate-account/${accountNumber}`);
            return response.data;
        } catch (error: unknown) { // Specify that error is of type unknown
            if (axios.isAxiosError(error)) {
                // Handle Axios error
                console.error("Account validation error:", error.response?.data || error.message);
                throw new Error("Account validation failed");
            } else {
                // Handle non-Axios error
                console.error("Unexpected error:", error);
                throw new Error("Account validation failed");
            }
        }
    }
};

export default depositService;