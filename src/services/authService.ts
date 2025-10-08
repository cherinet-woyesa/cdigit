import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api';

// Generic backend API response shape
interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface LoginResponse {
    message: string;
    token?: string;
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
    // Add data property to match the actual backend response structure
    data?: {
        token: string;
        expiration: string;
        accounts?: any[];
    };
}

export interface RegisterResponse {}

export interface RequestOtpResponse {
    success: boolean;
    message: string;
    accounts?: any[];
}

interface VerifyOtpResponse {
    verified: boolean;
    message: string;
    token?: string;
}

interface NewLoginResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        role?: string;
        expiration: string;
    };
}

// Specific interface for OTP login response
export interface OtpLoginResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        expiration: string;
        accounts?: any[];
    };
}

/////////////////////////////////////
interface AuthService {
    loginWithOtp(phoneNumber: string, otp: string, selectedAccountNum?: string): Promise<LoginResponse>;
    customerLogin: (email: string, password: string) => Promise<LoginResponse>;
    registerCustomer: (email: string, password: string, phoneNumber: string) => Promise<RegisterResponse>;
    requestOtp: (phoneNumber: string) => Promise<RequestOtpResponse>;
    verifyOtp: (phoneNumber: string, otp: string, token?: string) => Promise<VerifyOtpResponse>;

    staffLogin: (email: string, password: string) => Promise<LoginResponse>;
    
    registerStaff: (staffData: any, token: string) => Promise<RegisterResponse>;

    getWindowAssignments: (token: string) => Promise<any>;
    assignMakerToWindow: (makerId: string, windowId: string, token: string) => Promise<any>;

    getBranches: () => Promise<any>;
}

const authService: AuthService = {
    // Customer login
    customerLogin: async (email: string, password: string) => {
        try {
            const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/customer-login`, { email, password });
            if (response.data.token) {
                localStorage.setItem('userToken', response.data.token);
            }
            return response.data;
        } catch (error: any) {
            console.error("Customer login error:", error.response?.data || error.message);
            throw error.response?.data?.message || "Customer login failed";
        }
    },

    // Customer registration
    registerCustomer: async (email: string, password: string, phoneNumber: string) => {
        try {
            const response = await axios.post<RegisterResponse>(`${API_BASE_URL}/auth/customer-register`, { email, password, phoneNumber });
            return response.data;
        } catch (error: any) {
            console.error("Customer registration error:", error.response?.data || error.message);
            throw error.response?.data?.message || "Customer registration failed";
        }
    },

    // Request OTP for customer
    requestOtp: async (phoneNumber: string) => {
        try {
            const response = await axios.post<ApiResponse<{ accounts: any[] }>>(`${API_BASE_URL}/auth/request-otp`, { phoneNumber });
            return {
                success: response.data.success,
                message: response.data.message,
                accounts: response.data.data?.accounts,
            };
        } catch (error: any) {
            console.error("Error requesting OTP:", error.response?.data || error.message);
            throw error.response?.data || { message: "Failed to request OTP" };
        }
    },

    // Verify OTP for customer
    verifyOtp: async (phoneNumber: string, otp: string, token?: string) => {
        try {
            const headers: any = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
            const response = await axios.post<ApiResponse<boolean>>(`${API_BASE_URL}/auth/verify-otp`, { PhoneNumber: phoneNumber, OtpCode: otp }, { headers });
            return {
                verified: response.data.data === true,
                message: response.data.message || 'OTP verification result',
                token: undefined,
            };
        } catch (error: any) {
            console.error("Error verifying OTP:", error.response?.data || error.message);
            return {
                verified: false,
                message: error.response?.data?.message || error.response?.data?.errors?.OtpCode?.[0] || 'OTP verification failed',
                token: undefined,
            };
        }
    },

    // Staff login
    staffLogin: async (email: string, password: string) => {
        try {
            const response = await axios.post<NewLoginResponse>(`${API_BASE_URL}/auth/staff-login`, { email, password });
            const apiResponse = response.data;
            if (apiResponse.success && apiResponse.data?.token) {
                localStorage.setItem('userToken', apiResponse.data.token);
                console.log("at Staff login method, successful, token:", apiResponse.data.token);

                return {
                    message: apiResponse.message,
                    token: apiResponse.data.token,
                    role: apiResponse.data.role, // Make sure to return the role
                } as LoginResponse;
            }
            
            throw new Error(apiResponse.message || "Staff login failed");
        }
        catch (error: any) {
            console.error("Staff login error:", error.response?.data || error.message);
            throw error.response?.data?.message || "Staff login failed";
        }
    },

    // Staff registration
    registerStaff: async (staffData: any, token: string) => {
        try {
            const response = await axios.post<RegisterResponse>(`${API_BASE_URL}/auth/staff-register`, staffData, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return response.data;
        } catch (error: any) {
            console.error("Staff registration error:", error.response?.data || error.message);
            throw error.response?.data?.message || "Staff registration failed";
        }
    },

    // Fetch window assignments
    getWindowAssignments: async (token: string) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/windows/assignments`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return response.data;
        } catch (error: any) {
            console.error("Error fetching window assignments:", error.response?.data || error.message);
            throw error.response?.data?.message || "Failed to fetch window assignments";
        }
    },

    // Assign maker to a window
    assignMakerToWindow: async (makerId: string, windowId: string, token: string) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/windows/assign`, { makerId, windowId }, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return response.data;
        } catch (error: any) {
            console.error("Error assigning maker to window:", error.response?.data || error.message);
            throw error.response?.data?.message || "Failed to assign maker to window";
        }
    },

    // Login with OTP - FIXED: Return proper structure with data property
    loginWithOtp: async (phoneNumber: string, otp: string, selectedAccountNum?: string): Promise<LoginResponse> => {
        try {
            const response = await axios.post<ApiResponse<{ token: string; expiration: string; accounts: any[] }>>(
                `${API_BASE_URL}/auth/login-with-otp`,
                selectedAccountNum ? { phoneNumber, otp, selectedAccountNum } : { phoneNumber, otp }
            );
            
            const token = response.data.data?.token;
            if (token) {
                localStorage.setItem('userToken', token);
            }
            
            // FIX: Return the full response structure that includes the data property
            return {
                message: response.data.message || 'Login successful',
                token: token,
                // Include the data property to match the backend structure
                data: response.data.data
            };
        } catch (error: any) {
            console.error("Login with OTP error:", error.response?.data || error.message);
            throw error.response?.data?.message || "Login with OTP failed";
        }
    },

    // Fetch branches
    getBranches: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/branches`);
            return response.data;
        } catch (error: any) {
            console.error("Error fetching branches:", error.response?.data || error.message);
            throw error.response?.data?.message || "Failed to fetch branches";
        }
    },
};

export default authService;