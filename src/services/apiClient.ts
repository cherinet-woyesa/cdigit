// services/apiClient.ts
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

class ApiClient {
  private baseURL: string;
  private authToken?: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.initializeToken();
  }

  private initializeToken() {
    const token = localStorage.getItem('userToken');
    if (token) {
      this.authToken = token;
    }
  }

  setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem('userToken', token);
  }

  clearAuthToken() {
    this.authToken = undefined;
    localStorage.removeItem('userToken');
  }

  getAuthToken(): string | undefined {
    return this.authToken;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = response.statusText;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.Message || errorMessage;
        
        if (errorData.errors) {
          const validationErrors = Object.values(errorData.errors).flat();
          errorMessage = validationErrors.join(', ') || errorMessage;
        }
      } catch {
        errorMessage = errorText || response.statusText;
      }

      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return { success: true, message: 'Operation completed successfully' };
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (data.success !== undefined) {
        return data;
      } else if (data.data !== undefined) {
        return { success: true, data: data.data, message: data.message };
      } else if (data.token !== undefined) {
        return { success: true, data: data, message: data.message };
      } else {
        return { success: true, data: data, message: 'Operation completed successfully' };
      }
    }

    return { success: true, message: 'Operation completed successfully' };
  }

  private getHeaders(customHeaders?: Record<string, string>): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  async get<T>(endpoint: string, customHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(customHeaders),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any, customHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(customHeaders),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any, customHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(customHeaders),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, customHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(customHeaders),
    });
    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient('http://localhost:5268/api');