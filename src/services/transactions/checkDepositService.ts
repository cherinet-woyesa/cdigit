// services/checkDepositService.ts
import { apiClient } from '@services/http';

export interface CheckDepositData {
  phoneNumber: string;
  branchId: string;
  accountNumber: string;
  amount: number;
  chequeNumber: string;
  drawerAccountNumber: string;
  checkType: string;
  checkValueDate: string;
  otpCode: string;
  signature: string;
}

export interface CheckDepositResponse {
  id: string;
  formReferenceId: string;
  accountNumber: string;
  amount: number;
  chequeNumber: string;
  status: string;
  submittedAt: string;
}

export interface SignatureData {
  SignatoryName: string | null;
  SignatureData: string | null;
}

class CheckDepositService {
  async submitCheckDeposit(data: CheckDepositData, token?: string) {
    // Format the date to ensure compatibility with ASP.NET Core model binding
    // Convert the date to ISO format to ensure proper parsing
    const dateObj = new Date(data.checkValueDate);
    // Set time to start of day to avoid timezone issues
    dateObj.setHours(0, 0, 0, 0);
    const isoDate = dateObj.toISOString();

    // Ensure we have valid signature data
    const signatureData = data.signature || "";

    const payload = {
      PhoneNumber: data.phoneNumber,
      BranchId: data.branchId,
      AccountNumber: data.accountNumber,
      Amount: data.amount,
      ChequeNo: data.chequeNumber,
      DrawerAccNum: data.drawerAccountNumber,
      CheckType: data.checkType,
      CheckValueDate: isoDate,
      OtpCode: data.otpCode,
      Signatures: [
        {
          SignatoryName: "Customer", // Provide a default signatory name instead of null
          SignatureData: signatureData // Ensure we have valid signature data
        }
      ]
    };

    console.log("=== Check Deposit Service Debug ===");
    console.log("Sending payload to backend:", payload);
    
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    
    try {
      console.log("Making API call to /CheckDeposit/submit");
      const response = await apiClient.post<CheckDepositResponse>('/CheckDeposit/submit', payload, headers);
      console.log("Received successful response from backend:", response);
      return response;
    } catch (error: any) {
      console.error("API call failed:", error);
      console.error("Error details:", {
        message: error?.message,
        status: error?.status,
        statusText: error?.statusText,
        response: error?.response,
        stack: error?.stack
      });
      
      // If it's an HTTP error, try to extract the error message
      if (error?.response) {
        console.error("HTTP error response:", error.response);
        // Re-throw with a more descriptive message
        throw new Error(error.response?.data?.message || error.response?.data || error?.message || "Submission failed");
      }
      
      throw error;
    }
  }

  async getCheckDepositById(id: string) {
    return apiClient.get<CheckDepositResponse>(`/CheckDeposit/${id}`);
  }
}

export const checkDepositService = new CheckDepositService();
export const getCheckDepositById = checkDepositService.getCheckDepositById.bind(checkDepositService);
export default checkDepositService;