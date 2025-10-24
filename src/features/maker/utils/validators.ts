/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Ethiopian format)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(?:\+251|251|0)?9\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate account number format
 */
export const isValidAccountNumber = (accountNumber: string): boolean => {
  const accountRegex = /^\d{10,15}$/;
  return accountRegex.test(accountNumber.replace(/\s/g, ''));
};

/**
 * Validate amount (positive number)
 */
export const isValidAmount = (amount: number | string): boolean => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0;
};

/**
 * Validate required field
 */
export const isRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== undefined && value !== null && value !== '';
};

/**
 * Validate form reference ID format
 */
export const isValidFormReference = (ref: string): boolean => {
  const refRegex = /^[A-Z0-9]{8,20}$/;
  return refRegex.test(ref);
};