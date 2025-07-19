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

interface AuthService {
    login: (email: string, password: string) => Promise<LoginResponse>;
    register: (email: string, password: string, phoneNumber: string) => Promise<RegisterResponse>;
    logout: () => void;
    getCurrentUserToken: () => string | null;
    requestOtp: (phoneNumber: string) => Promise<RequestOtpResponse>;
    loginWithOtp: (phoneNumber: string, otp: string) => Promise<LoginResponse>;
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
    }
};

export default authService;