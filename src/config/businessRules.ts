/**
 * Configurable Business Rules for Voucher Validation
 * Centralized configuration for all transaction limits and validation rules
 */

export interface CurrencyLimit {
  code: string;
  name: string;
  dailyLimit: number;
  transactionLimit: number;
  fxThreshold: number; // Amount above which FX approval is required
  requiresApproval: boolean;
}

export interface TransactionLimits {
  withdrawal: {
    min: number;
    max: number;
    dailyLimit: number;
    corporateMax: number;
  };
  deposit: {
    min: number;
    max: number;
    dailyLimit: number;
    corporateMax: number;
  };
  fundTransfer: {
    min: number;
    max: number;
    dailyLimit: number;
    sameBankMax: number;
    interBankMax: number;
  };
  rtgs: {
    min: number;
    max: number;
    requiresApproval: number; // Amount above which approval is required
  };
}

export interface AccountNumberRules {
  minLength: number;
  maxLength: number;
  pattern: RegExp;
  allowedPrefixes?: string[];
}

export interface ValidationMessages {
  guidedPrompts: {
    accountNumber: {
      invalid: string;
      tooShort: string;
      tooLong: string;
      invalidPrefix: string;
      hint: string;
    };
    amount: {
      belowMin: string;
      aboveMax: string;
      aboveDailyLimit: string;
      requiresApproval: string;
      hint: string;
    };
    currency: {
      unsupported: string;
      aboveFxThreshold: string;
      requiresApproval: string;
      hint: string;
    };
  };
}

// Currency configurations with FX limits
export const CURRENCY_LIMITS: Record<string, CurrencyLimit> = {
  ETB: {
    code: 'ETB',
    name: 'Ethiopian Birr',
    dailyLimit: 1000000,
    transactionLimit: 500000,
    fxThreshold: 0, // Not FX
    requiresApproval: false,
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    dailyLimit: 25000,
    transactionLimit: 10000,
    fxThreshold: 5000, // Above $5000 requires FX approval
    requiresApproval: true,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    dailyLimit: 20000,
    transactionLimit: 8000,
    fxThreshold: 4000,
    requiresApproval: true,
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    dailyLimit: 15000,
    transactionLimit: 6000,
    fxThreshold: 3000,
    requiresApproval: true,
  },
};

// Transaction limits by type
export const TRANSACTION_LIMITS: TransactionLimits = {
  withdrawal: {
    min: 100,
    max: 500000, // ETB
    dailyLimit: 1000000,
    corporateMax: 5000000,
  },
  deposit: {
    min: 50,
    max: 1000000,
    dailyLimit: 5000000,
    corporateMax: 50000000,
  },
  fundTransfer: {
    min: 1,
    max: 10000000,
    dailyLimit: 20000000,
    sameBankMax: 10000000,
    interBankMax: 5000000,
  },
  rtgs: {
    min: 100000, // RTGS typically for large amounts
    max: 100000000,
    requiresApproval: 50000000, // Above 50M requires approval
  },
};

// Account number validation rules
export const ACCOUNT_NUMBER_RULES: AccountNumberRules = {
  minLength: 10,
  maxLength: 16,
  pattern: /^\d{10,16}$/,
  allowedPrefixes: ['1000', '2000', '3000', '4000'], // Example: Different account types
};

// Guided validation messages
export const VALIDATION_MESSAGES: ValidationMessages = {
  guidedPrompts: {
    accountNumber: {
      invalid: 'Invalid account number format',
      tooShort: 'Account number must be at least 10 digits',
      tooLong: 'Account number cannot exceed 16 digits',
      invalidPrefix: 'Account number prefix is not recognized',
      hint: 'Please enter a valid 10-16 digit account number starting with 1000, 2000, 3000, or 4000',
    },
    amount: {
      belowMin: 'Amount is below the minimum allowed',
      aboveMax: 'Amount exceeds the maximum limit',
      aboveDailyLimit: 'This transaction would exceed your daily limit',
      requiresApproval: 'This amount requires manager approval',
      hint: 'Enter an amount within the allowed range for this transaction type',
    },
    currency: {
      unsupported: 'This currency is not supported',
      aboveFxThreshold: 'This FX amount exceeds the threshold and requires approval',
      requiresApproval: 'Foreign currency transactions above the threshold require approval',
      hint: 'Check the currency code and ensure the amount is within FX limits',
    },
  },
};

// Helper function to get limits based on customer segment
export const getTransactionLimits = (
  transactionType: keyof TransactionLimits,
  customerSegment: 'Normal' | 'Corporate' = 'Normal'
) => {
  const limits = TRANSACTION_LIMITS[transactionType];
  
  if (customerSegment === 'Corporate') {
    if ('corporateMax' in limits) {
      return {
        ...limits,
        max: limits.corporateMax,
      };
    }
  }
  
  return limits;
};

// Helper function to check if amount requires approval
export const requiresApproval = (
  amount: number,
  currency: string = 'ETB',
  transactionType: keyof TransactionLimits
): { required: boolean; reason?: string } => {
  // Check FX threshold
  if (currency !== 'ETB') {
    const currencyLimit = CURRENCY_LIMITS[currency];
    if (!currencyLimit) {
      return { required: true, reason: 'Unsupported currency requires approval' };
    }
    
    if (currencyLimit.requiresApproval && amount > currencyLimit.fxThreshold) {
      return {
        required: true,
        reason: `Amount exceeds FX threshold of ${currencyLimit.fxThreshold} ${currency}`,
      };
    }
  }
  
  // Check RTGS approval threshold
  if (transactionType === 'rtgs' && amount > TRANSACTION_LIMITS.rtgs.requiresApproval) {
    return {
      required: true,
      reason: `RTGS amount exceeds approval threshold of ${TRANSACTION_LIMITS.rtgs.requiresApproval.toLocaleString()} ETB`,
    };
  }
  
  return { required: false };
};

// Export for external configuration updates
export const updateBusinessRules = {
  updateCurrencyLimit: (currencyCode: string, updates: Partial<CurrencyLimit>) => {
    if (CURRENCY_LIMITS[currencyCode]) {
      CURRENCY_LIMITS[currencyCode] = { ...CURRENCY_LIMITS[currencyCode], ...updates };
    }
  },
  updateTransactionLimit: (
    transactionType: keyof TransactionLimits,
    updates: Partial<TransactionLimits[typeof transactionType]>
  ) => {
    TRANSACTION_LIMITS[transactionType] = { ...TRANSACTION_LIMITS[transactionType], ...updates } as any;
  },
};
