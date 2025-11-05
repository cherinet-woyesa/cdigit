// Base service class for consistent API integration across all forms
import { apiClient } from './apiClient';

export interface BaseFormData {
  branchId?: string;
  phoneNumber?: string;
  accountNumber?: string;
  accountHolderName?: string;
  amount?: number;
  currency?: string;
  otp?: string;
  signature?: string;
  formReferenceId?: string;
  [key: string]: any;
}

export interface BaseFormResponse {
  id: string;
  formReferenceId: string;
  status: string;
  queueNumber?: number;
  tokenNumber?: string;
  submittedAt?: string;
  [key: string]: any;
}

export interface FormSubmissionResponse extends BaseFormResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface FormValidationResponse {
  success: boolean;
  message: string;
  data?: any;
}

export abstract class BaseFormService<TFormData extends BaseFormData, TFormResponse extends BaseFormResponse> {
  protected abstract endpoint: string;

  /**
   * Submit form data to the API
   */
  async submitForm(data: TFormData, token?: string): Promise<FormSubmissionResponse> {
    try {
      const payload = this.transformSubmissionData(data);
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      
      const response = await apiClient.post<TFormResponse>(
        `/${this.endpoint}`,
        payload,
        headers
      );

      return {
        success: true,
        message: 'Form submitted successfully',
        id: response.data?.id || '',
        formReferenceId: response.data?.formReferenceId || '',
        status: response.data?.status || 'Pending',
        ...response.data
      };
    } catch (error: any) {
      console.error(`Error submitting ${this.endpoint}:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get form by ID
   */
  async getFormById(id: string): Promise<TFormResponse> {
    try {
      const response = await apiClient.get<TFormResponse>(`/${this.endpoint}/${id}`);
      if (!response.data) {
        throw new Error('No data received from server');
      }
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching ${this.endpoint} by ID:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Update form data
   */
  async updateForm(id: string, data: TFormData, token?: string): Promise<FormSubmissionResponse> {
    try {
      const payload = this.transformSubmissionData(data);
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      
      const response = await apiClient.put<TFormResponse>(
        `/${this.endpoint}/update-by-customer/${id}`,
        { ...payload, Id: id },
        headers
      );

      return {
        success: true,
        message: 'Form updated successfully',
        id: response.data?.id || id,
        formReferenceId: response.data?.formReferenceId || id,
        status: response.data?.status || 'Updated',
        ...response.data
      };
    } catch (error: any) {
      console.error(`Error updating ${this.endpoint}:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Cancel form by customer
   */
  async cancelForm(id: string): Promise<FormSubmissionResponse> {
    try {
      const response = await apiClient.put<{ success: boolean; message: string }>(
        `/${this.endpoint}/cancel-by-customer/${id}`
      );

      return {
        success: response.data?.success || false,
        message: response.data?.message || 'Form cancelled successfully',
        id,
        formReferenceId: id,
        status: 'Cancelled'
      };
    } catch (error: any) {
      console.error(`Error cancelling ${this.endpoint}:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Validate account number
   */
  async validateAccount(accountNumber: string): Promise<FormValidationResponse> {
    try {
      const response = await apiClient.get<FormValidationResponse>(
        `/Accounts/AccountNumExist/${accountNumber}`
      );
      
      return response.data || {
        success: false,
        message: 'No response data received'
      };
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      } else {
        return {
          success: false,
          message: error.message || 'Failed to validate account'
        };
      }
    }
  }

  /**
   * Request OTP for form submission
   */
  async requestOTP(phoneNumber: string): Promise<FormValidationResponse> {
    try {
      const response = await apiClient.post<FormValidationResponse>(
        '/OTP/request',
        { phoneNumber }
      );
      
      return response.data || {
        success: false,
        message: 'No response data received'
      };
    } catch (error: any) {
      console.error('Error requesting OTP:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phoneNumber: string, otpCode: string): Promise<FormValidationResponse> {
    try {
      const response = await apiClient.post<FormValidationResponse>(
        '/OTP/verify',
        { phoneNumber, otpCode }
      );
      
      return response.data || {
        success: false,
        message: 'No response data received'
      };
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Transform form data for API submission
   * Override this method in derived classes to customize data transformation
   */
  protected transformSubmissionData(data: TFormData): any {
    return {
      BranchId: data.branchId,
      PhoneNumber: data.phoneNumber,
      AccountNumber: data.accountNumber,
      AccountHolderName: data.accountHolderName,
      Amount: data.amount,
      Currency: data.currency || 'ETB',
      OtpCode: data.otp,
      Signature: data.signature,
      FormReferenceId: data.formReferenceId || `${this.endpoint.toLowerCase()}-${Date.now()}`,
      Status: 'Pending',
      TokenNumber: '',
      QueueNumber: 0,
      ...this.getAdditionalFields(data)
    };
  }

  /**
   * Get additional fields specific to the form type
   * Override this method in derived classes to add form-specific fields
   */
  protected getAdditionalFields(_data: TFormData): any {
    return {};
  }

  /**
   * Handle API errors consistently
   */
  protected handleApiError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    } else if (error.message) {
      return new Error(error.message);
    } else {
      return new Error(`Failed to process ${this.endpoint} request`);
    }
  }

  /**
   * Get forms by branch (for staff dashboards)
   */
  async getFormsByBranch(branchId: string): Promise<TFormResponse[]> {
    try {
      const response = await apiClient.get<TFormResponse[]>(
        `/${this.endpoint}/branch/${branchId}`
      );
      return response.data || [];
    } catch (error: any) {
      console.error(`Error fetching ${this.endpoint} by branch:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get completed forms for today by branch
   */
  async getCompletedTodayByBranch(branchId: string): Promise<TFormResponse[]> {
    try {
      const response = await apiClient.get<TFormResponse[]>(
        `/${this.endpoint}/completed/today?branchId=${branchId}`
      );
      return response.data || [];
    } catch (error: any) {
      console.error(`Error fetching completed ${this.endpoint} for today:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Authorize form (for managers/authorizers)
   */
  async authorizeForm(formId: string, userId: string): Promise<FormSubmissionResponse> {
    try {
      const response = await apiClient.put<FormSubmissionResponse>(
        `/${this.endpoint}/authorize`,
        { formId, userId }
      );
      return response.data || {
        success: false,
        message: 'No response data received',
        id: formId,
        formReferenceId: formId,
        status: 'Error'
      };
    } catch (error: any) {
      console.error(`Error authorizing ${this.endpoint}:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Audit form (for auditors)
   */
  async auditForm(formId: string, userId: string): Promise<FormSubmissionResponse> {
    try {
      const response = await apiClient.put<FormSubmissionResponse>(
        `/${this.endpoint}/audit`,
        { formId, userId }
      );
      return response.data || {
        success: false,
        message: 'No response data received',
        id: formId,
        formReferenceId: formId,
        status: 'Error'
      };
    } catch (error: any) {
      console.error(`Error auditing ${this.endpoint}:`, error);
      throw this.handleApiError(error);
    }
  }
}

/**
 * Utility function to generate form reference ID
 */
export const generateFormReferenceId = (formType: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${formType.toLowerCase()}-${timestamp}-${random}`;
};

/**
 * Utility function to format currency amounts
 */
export const formatCurrency = (amount: number, currency: string = 'ETB'): string => {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: currency === 'ETB' ? 'ETB' : 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Utility function to validate form data before submission
 */
export const validateFormData = <T extends BaseFormData>(
  data: T,
  validationSchema: Record<string, (value: any) => string | undefined>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  Object.keys(validationSchema).forEach((field) => {
    const validator = validationSchema[field];
    const value = data[field];
    const error = validator(value);
    
    if (error) {
      errors[field] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};