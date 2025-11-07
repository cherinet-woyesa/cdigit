// Consolidated HTTP client using axios with unified error handling
import axios, { type AxiosInstance, AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getAuthToken, removeAuthToken } from '@utils/authUtils';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

class ApiClient {
  private axiosInstance: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = getAuthToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle 401 and errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const status = error?.response?.status;
        if (status === 401) {
          // Token invalid/expired. Clear and redirect to OTP.
          removeAuthToken();
          try {
            const url = new URL(window.location.href);
            if (!url.pathname.startsWith('/otp-login')) {
              window.location.assign('/otp-login');
            }
          } catch {}
        }
        return Promise.reject(error);
      }
    );
  }

  private handleAxiosError(error: AxiosError): ApiResponse {
    if (error.response) {
      const responseData: any = error.response.data;
      let errorMessage = error.response.statusText;

      if (responseData) {
        errorMessage = responseData.message || responseData.Message || errorMessage;

        if (responseData.errors) {
          const validationErrors = Object.values(responseData.errors).flat();
          errorMessage = (validationErrors as string[]).join(', ') || errorMessage;
        }
      }

      return {
        success: false,
        message: errorMessage,
        errors: responseData?.errors ? Object.values(responseData.errors).flat() as string[] : [errorMessage],
      };
    }

    return {
      success: false,
      message: error.message || 'Network error occurred',
      errors: [error.message || 'Network error occurred'],
    };
  }

  private normalizeResponse<T>(response: any): ApiResponse<T> {
    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true, message: 'Operation completed successfully' };
    }

    const data = response.data;

    // If response already has success field, return as is
    if (data && data.success !== undefined) {
      return data;
    }

    // If response has data field, wrap it
    if (data && data.data !== undefined) {
      return { success: true, data: data.data, message: data.message };
    }

    // If response has token field (auth responses)
    if (data && data.token !== undefined) {
      return { success: true, data: data, message: data.message };
    }

    // Default: treat response data as the data payload
    return { success: true, data: data, message: 'Operation completed successfully' };
  }

  setAuthToken(token: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('userToken', token);
  }

  clearAuthToken() {
    removeAuthToken();
  }

  getAuthToken(): string | null {
    return getAuthToken();
  }

  async get<T>(endpoint: string, customHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get(endpoint, {
        headers: customHeaders,
      });
      return this.normalizeResponse<T>(response);
    } catch (error) {
      return this.handleAxiosError(error as AxiosError);
    }
  }

  async post<T>(endpoint: string, data?: any, customHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post(endpoint, data, {
        headers: customHeaders,
      });
      return this.normalizeResponse<T>(response);
    } catch (error) {
      return this.handleAxiosError(error as AxiosError);
    }
  }

  async put<T>(endpoint: string, data?: any, customHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put(endpoint, data, {
        headers: customHeaders,
      });
      return this.normalizeResponse<T>(response);
    } catch (error) {
      return this.handleAxiosError(error as AxiosError);
    }
  }

  async delete<T>(endpoint: string, customHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete(endpoint, {
        headers: customHeaders,
      });
      return this.normalizeResponse<T>(response);
    } catch (error) {
      return this.handleAxiosError(error as AxiosError);
    }
  }

  // Expose the raw axios instance for services that need direct access
  get axios(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Export singleton instance
export const apiClient = new ApiClient('http://localhost:5268/api');

// Export raw axios instance for backward compatibility with services using http.ts
export const api = apiClient.axios;

export default api;
