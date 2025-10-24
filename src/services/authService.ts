// services/authService.ts
import { apiClient } from './apiClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface OTPCredentials {
  phoneNumber: string;
  otp: string;
  selectedAccountNum?: string;
}

export interface StaffRegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  branchId: string;
}

export interface LoginResponse {
  token: string;
  role?: string;
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  branchId?: string;
  accounts?: Array<{
    accountNumber: string;
    accountType: string;
    balance: number;
  }>;
  expiration?: string;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  data?: {
    accounts?: any[];
    phoneNumber?: string;
    expiryTime?: string;
  };
}

export interface VerificationResponse {
  verified: boolean;
  message: string;
  token?: string;
}

class AuthService {
  async customerLogin(credentials: LoginCredentials) {
    return apiClient.post<LoginResponse>('/auth/customer-login', credentials);
  }

  async customerRegister(email: string, password: string, phoneNumber: string) {
    return apiClient.post('/auth/customer-register', { 
      Email: email, 
      Password: password, 
      PhoneNumber: phoneNumber 
    });
  }

  async requestOTP(phoneNumber: string) {
    return apiClient.post<OTPResponse>('/auth/request-otp', { 
      PhoneNumber: phoneNumber 
    });
  }

  async verifyOTP(phoneNumber: string, otpCode: string) {
    return apiClient.post<VerificationResponse>('/auth/verify-otp', { 
      PhoneNumber: phoneNumber, 
      OtpCode: otpCode 
    });
  }

  async loginWithOtp(credentials: OTPCredentials) {
    const payload = credentials.selectedAccountNum 
      ? { 
          PhoneNumber: credentials.phoneNumber, 
          Otp: credentials.otp, 
          SelectedAccountNum: credentials.selectedAccountNum 
        }
      : { 
          PhoneNumber: credentials.phoneNumber, 
          Otp: credentials.otp 
        };

    const response = await apiClient.post<LoginResponse>('/auth/login-with-otp', payload);
    
    if (response.data?.token) {
      localStorage.setItem('userToken', response.data.token);
      apiClient.setAuthToken(response.data.token);
    }
    
    return response;
  }

  async staffLogin(credentials: LoginCredentials) {
    const apiCredentials = {
      Email: credentials.email,
      Password: credentials.password,
    };
    const response = await apiClient.post<LoginResponse>('/auth/staff-login', apiCredentials);
    
    if (response.data?.token) {
      localStorage.setItem('userToken', response.data.token);
      apiClient.setAuthToken(response.data.token);
    }
    
    return response;
  }

  async staffRegister(staffData: StaffRegistrationData, token: string) {
    // Convert to PascalCase for API
    const apiData = {
      Email: staffData.email,
      Password: staffData.password,
      FirstName: staffData.firstName,
      LastName: staffData.lastName,
      Role: staffData.role,
      BranchId: staffData.branchId
    };
    
    // Pass Authorization header directly as customHeaders
    return apiClient.post('/auth/staff-register', apiData, {
      Authorization: `Bearer ${token}`
    });
  }

  async getWindowAssignments() {
    return apiClient.get('/windows/assignments');
  }

  async assignMakerToWindow(makerId: string, windowId: string) {
    return apiClient.post('/windows/assign', { 
      MakerId: makerId, 
      WindowId: windowId 
    });
  }

  async getBranches() {
    return apiClient.get('/branches');
  }

  async logout() {
    localStorage.removeItem('userToken');
    apiClient.clearAuthToken();
    return { success: true, message: 'Logged out successfully' };
  }

  async requestWithdrawalOTP(phoneNumber: string) {
    return this.requestOTP(phoneNumber);
  }

  async requestFundTransferOTP(phoneNumber: string) {
    return this.requestOTP(phoneNumber);
  }

  async requestCbeBirrOTP(phoneNumber: string) {
    return this.requestOTP(phoneNumber);
  }

  // Alias for backward compatibility (if you have code using requestOtp)
  async requestOtp(phoneNumber: string) {
    return this.requestOTP(phoneNumber);
  }
}

export const authService = new AuthService();
export default authService;