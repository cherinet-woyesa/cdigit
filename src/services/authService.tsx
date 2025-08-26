import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api';

// Generic backend API response shape
type ApiResponse<T> = {
    success: boolean;
    message: string;
    data: T;
};

interface LoginResponse {
    message: string;
    token?: string;
    role?: string;
}

interface RegisterResponse {}

interface RequestOtpResponse {
    message: string;
    accounts?: any[];
}

interface VerifyOtpResponse {
    verified: boolean;
    message: string;
    token?: string;
}

interface AuthService {
    loginWithOtp(phoneNumber: string, otp: string, selectedAccountNum?: string): Promise<LoginResponse>;
    customerLogin: (email: string, password: string) => Promise<LoginResponse>;
    registerCustomer: (email: string, password: string, phoneNumber: string) => Promise<RegisterResponse>;
    requestOtp: (phoneNumber: string) => Promise<RequestOtpResponse>;
    verifyOtp: (phoneNumber: string, otp: string) => Promise<VerifyOtpResponse>;

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
                message: response.data.message,
                accounts: response.data.data?.accounts,
            };
        } catch (error: any) {
            console.error("Error requesting OTP:", error.response?.data || error.message);
            throw error.response?.data || { message: "Failed to request OTP" };
        }
    },

    // Verify OTP for customer
    verifyOtp: async (phoneNumber: string, otp: string) => {
        try {
            const response = await axios.post<ApiResponse<boolean>>(`${API_BASE_URL}/auth/verify-otp`, { PhoneNumber: phoneNumber, OtpCode: otp });
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
            const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/staff-login`, { email, password });
            if (response.data.token) {
                localStorage.setItem('userToken', response.data.token);
            }
            return response.data;
        } catch (error: any) {
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

    // Login with OTP
    loginWithOtp: async (phoneNumber: string, otp: string, selectedAccountNum?: string) => {
        try {
            const response = await axios.post<ApiResponse<{ token: string; expiration: string; accounts: any[] }>>(
                `${API_BASE_URL}/auth/login-with-otp`,
                selectedAccountNum ? { phoneNumber, otp, selectedAccountNum } : { phoneNumber, otp }
            );
            const token = response.data.data?.token;
            if (token) {
                localStorage.setItem('userToken', token);
            }
            return {
                message: response.data.message || 'Login successful',
                token,
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