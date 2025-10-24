/**
 * Format currency amount with ETB symbol
 */
export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return "—";
  return `ETB ${amount.toFixed(2)}`;
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return "—";
  
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as +251 XX XXX XXXX for Ethiopian numbers
  if (cleaned.length === 12 && cleaned.startsWith('251')) {
    return `+251 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  
  // Format as XXX-XXX-XXXX for other formats
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  
  return phone;
};

/**
 * Format account number with spacing
 */
export const formatAccountNumber = (accountNumber: string | number): string => {
  if (!accountNumber) return "—";
  
  const str = accountNumber.toString();
  // Format as XXXX XXXX XXXX for better readability
  return str.replace(/(\d{4})(?=\d)/g, '$1 ');
};

/**
 * Format date to readable string
 */
export const formatDate = (dateString: string | Date): string => {
  if (!dateString) return "—";
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ET', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Truncate long text with ellipsis
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text) return "—";
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (text: string): string => {
  if (!text) return "—";
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};