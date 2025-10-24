import { 
  CurrencyDollarIcon, 
  ClockIcon,
  ArrowPathIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";

// Application constants
export const AVG_PROCESS_TIME = "4.2m";
export const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds
export const DEBOUNCE_DELAY = 500; // 500ms for search

// Metrics configuration
export const METRICS_CONFIG = {
  PENDING_TRANSACTIONS: {
    label: "Pending Transactions",
    color: "fuchsia",
    icon: CurrencyDollarIcon,
    trend: "up"
  },
  COMPLETED_TODAY: {
    label: "Completed Today",
    color: "green",
    icon: ClockIcon,
    trend: "up"
  },
  AVG_PROCESS_TIME: {
    label: "Avg. Process Time",
    color: "blue",
    icon: ArrowPathIcon,
    trend: "down"
  },
  QUEUE_WAITING: {
    label: "Queue Waiting",
    color: "orange",
    icon: UserCircleIcon,
    trend: "neutral"
  }
};

// Service configuration
export const SERVICE_CONFIG = {
  ACCOUNT_OPENING: {
    id: 'accountOpening',
    name: 'Account Opening',
    endpoint: 'AccountOpening',
    color: 'blue'
  },
  CBE_BIRR_REGISTRATION: {
    id: 'cbeBirrRegistration',
    name: 'CBE Birr Registration',
    endpoint: 'CbeBirrRegistrations',
    color: 'green'
  },
  E_BANKING_APPLICATION: {
    id: 'eBankingApplication',
    name: 'E-Banking Application',
    endpoint: 'EBankingApplication',
    color: 'purple'
  },
  POS_REQUEST: {
    id: 'posRequest',
    name: 'POS Request',
    endpoint: 'PosRequest',
    color: 'indigo'
  },
  STATEMENT_REQUEST: {
    id: 'statementRequest',
    name: 'Statement Request',
    endpoint: 'StatementRequest',
    color: 'orange'
  },
  STOP_PAYMENT: {
    id: 'stopPayment',
    name: 'Stop Payment',
    endpoint: 'StopPaymentOrder',
    color: 'red'
  },
  CBE_BIRR_LINK: {
    id: 'cbeBirrLink',
    name: 'CBE Birr Link',
    endpoint: 'CbeBirrLink',
    color: 'teal'
  },
  RTGS_TRANSFER: {
    id: 'rtgsTransfer',
    name: 'RTGS Transfer',
    endpoint: 'RtgsTransfer',
    color: 'pink'
  }
};

// Transaction types
export const TRANSACTION_TYPES = {
  DEPOSIT: 'Deposit',
  WITHDRAWAL: 'Withdrawal',
  FUND_TRANSFER: 'FundTransfer'
} as const;

// Status colors
export const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  in_progress: 'bg-blue-100 text-blue-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800'
};