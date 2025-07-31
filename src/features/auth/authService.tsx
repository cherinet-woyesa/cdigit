import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api'; // Adjust to your API base URL

interface LoginResponse {
    message: string;
    token?: string;
    // Add other response properties as needed
}

interface RegisterResponse {
    // Define properties based on your API response for registration
}

interface RequestOtpResponse {
    otp: string;
    message: string;
    // Define properties based on your API response for OTP request
}

interface VerifyOtpResponse {
    verified: boolean;
    message: string;
    token?: string;
}

interface AuthService {
    login: (email: string, password: string) => Promise<LoginResponse>;
    register: (email: string, password: string, phoneNumber: string) => Promise<RegisterResponse>;
    logout: () => void;
    getCurrentUserToken: () => string | null;
    requestOtp: (phoneNumber: string) => Promise<RequestOtpResponse>;
    loginWithOtp: (phoneNumber: string, otp: string) => Promise<LoginResponse>;
    verifyOtp: (phoneNumber: string, otp: string) => Promise<VerifyOtpResponse>;
}

const authService: AuthService = {
    login: async (email: string, password: string) => {
        try {
            const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, { email, password });
            if (response.data.token) {
                localStorage.setItem('userToken', response.data.token);
            }
            return response.data;
        } catch (error: any) {
            console.error("Login error:", error.response?.data || error.message);
            throw error.response?.data?.message || "Login failed";
        }
    },

    register: async (email: string, password: string, phoneNumber: string) => {
        try {
            const response = await axios.post<RegisterResponse>(`${API_BASE_URL}/auth/register`, { email, password, phoneNumber });
            return response.data;
        } catch (error: any) {
            console.error("Registration error:", error.response?.data || error.message);
            throw error.response?.data?.message || "Registration failed";
        }
    },

    logout: () => {
        localStorage.removeItem('userToken');
    },

    getCurrentUserToken: () => {
        return localStorage.getItem('userToken');
    },

    requestOtp: async (phoneNumber: string) => {
        try {
            const response = await axios.post<RequestOtpResponse>(`${API_BASE_URL}/auth/request-otp`, { phoneNumber });
            console.log('OTP requested successfully:', response.data);  
            return response.data;
        } catch (error: any) {
            console.error('Error requesting OTP:', error);
            throw error;
        }
    },

    loginWithOtp: async (phoneNumber: string, otp: string) => {
        try {
            const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login-with-otp`, { phoneNumber, otp });
            if (response.data.token) {
                localStorage.setItem('userToken', response.data.token);
            }
            return response.data;
        } catch (error: any) {
            console.error('Error logging in with OTP:', error);
            throw error;
        }
    },

    verifyOtp: async (phoneNumber: string, otp: string) => {
        try {
            // Use the login-with-otp endpoint which is already implemented in the backend
            const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login-with-otp`, { 
                phoneNumber, 
                otp 
            });
            
            if (response.data.token) {
                localStorage.setItem('userToken', response.data.token);
                // Return a verified response that matches the expected interface
                return {
                    verified: true,
                    message: response.data.message || 'OTP verified successfully',
                    token: response.data.token
                };
            }
            
            throw new Error('Verification failed: No token received');
        } catch (error: any) {
            console.error('Error verifying OTP:', error);
            // Return a failed verification response
            return {
                verified: false,
                message: error.response?.data?.message || 'OTP verification failed',
                token: undefined
            };
        }
    }
};

export default authService;