// Base types used across maker feature
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface DecodedToken {
  nameid: string;
  unique_name: string;
  BranchId: string;
  role?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// Search and Account types
export interface AccountSearchResult {
  id: string;
  accountHolderName: string;
  phoneNumber: string;
  accountNumber: string;
  typeOfAccount: string;
}

export interface BlockRequestData {
  phoneNumber: string;
  accountNumber: string;
  accountHolderName: string;
  reason: string;
}

export interface RecoverRequestData {
  phoneNumber: string;
  recoveredById: string;
}

// Customer/Transaction types
export interface Customer {
  id: string;
  queueNumber: string;
  tokenNumber: string;
  formReferenceId: string;
  accountHolderName: string;
  transactionType: 'Deposit' | 'Withdrawal' | 'FundTransfer' | string;
  accountNumber?: string;
  debitAccountNumber?: string;
  beneficiaryAccountNumber?: string;
  amount?: number;
  withdrawal_Amount?: number;
  transferAmount?: number;
  reason?: string;
  remark?: string;
  status?: string;
  telephoneNumber?: string;
  depositedBy?: string;
  debitAccountName?: string;
  beneficiaryName?: string;
}

export interface TransactionMetrics {
  pendingTransactions: number;
  completedToday: number;
  avgProcessTime: string;
  queueWaiting: number;
}

// Service types
export interface Service {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
  endpoint: string;
}

export interface OtherServicesData {
  accountOpening: number;
  cbeBirrRegistration: number;
  eBankingApplication: number;
  posRequest: number;
  statementRequest: number;
  stopPayment: number;
  cbeBirrLink: number;
  rtgsTransfer: number;
  total: number;
}

// Performance types
export interface PerformanceData {
  avgFeedback: number;
  avgServiceTime: number;
}