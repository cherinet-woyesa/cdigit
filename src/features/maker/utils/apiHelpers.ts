import type { ActionMessage } from '@types';

/**
 * Handle API errors consistently
 */
export const handleApiError = (error: any, defaultMessage: string = 'An error occurred'): ActionMessage => {
  console.error('API Error:', error);
  
  if (error.response?.data?.message) {
    return {
      type: 'error',
      content: error.response.data.message
    };
  }
  
  if (error.message) {
    return {
      type: 'error',
      content: error.message
    };
  }
  
  return {
    type: 'error',
    content: defaultMessage
  };
};

/**
 * Handle API success messages
 */
export const handleApiSuccess = (message: string): ActionMessage => {
  return {
    type: 'success',
    content: message
  };
};

/**
 * Generic API response handler
 */
export const handleApiResponse = (response: any, successMessage?: string): ActionMessage => {
  if (response.success) {
    return handleApiSuccess(successMessage || response.message || 'Operation completed successfully');
  } else {
    return handleApiError(new Error(response.message || 'Operation failed'));
  }
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};