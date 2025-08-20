import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api'; // Adjust this to your API base URL

interface LoginResponse {
    message: string;
    token?: string;
    role?: string; // Added role property to LoginResponse
}

interface RegisterResponse {
    // Define properties based on your API response for registration
}

interface RequestOtpResponse {
    otp: string;
    message: string;
}

interface VerifyOtpResponse {
    verified: boolean;
    message: string;
    token?: string;
}

interface AuthService {
    loginWithOtp(phoneNumber: string, otp: string): Promise<LoginResponse>;
    // Customer Authentication
    customerLogin: (email: string, password: string) => Promise<LoginResponse>;
    registerCustomer: (email: string, password: string, phoneNumber: string) => Promise<RegisterResponse>;
    requestOtp: (phoneNumber: string) => Promise<RequestOtpResponse>;
    verifyOtp: (phoneNumber: string, otp: string) => Promise<VerifyOtpResponse>;

    // Staff Authentication
    staffLogin: (email: string, password: string) => Promise<LoginResponse>;
    registerStaff: (staffData: any, token: string) => Promise<RegisterResponse>;

    // Window Assignments
    getWindowAssignments: (token: string) => Promise<any>;
    assignMakerToWindow: (makerId: string, windowId: string, token: string) => Promise<any>;

    // Branches
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
            const response = await axios.post<RequestOtpResponse>(`${API_BASE_URL}/auth/request-otp`, { phoneNumber });
            return response.data;
        } catch (error: any) {
            console.error("Error requesting OTP:", error);
            throw error;
        }
    },

    // Verify OTP for customer
    verifyOtp: async (phoneNumber: string, otp: string) => {
        try {
            // Backend expects PascalCase for verify-otp
            const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/verify-otp`, { PhoneNumber: phoneNumber, OtpCode: otp });
            if (response.data.token) {
                localStorage.setItem('userToken', response.data.token);
            }
            return {
                verified: true,
                message: response.data.message || 'OTP verified successfully',
                token: response.data.token,
            };
        } catch (error: any) {
            console.error("Error verifying OTP:", error);
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
    loginWithOtp: async (phoneNumber: string, otp: string) => {
        try {
            const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login-with-otp`, { phoneNumber, otp });
            if (response.data.token) {
                localStorage.setItem('userToken', response.data.token);
            }
            return response.data;
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