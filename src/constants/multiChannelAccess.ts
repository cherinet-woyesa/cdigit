
import type { AccessMethod, SessionPolicy, MultiChannelConfig } from '../types/multiChannelAccess';

export const ACCESS_METHODS = {
  MOBILE_APP: 'mobile_app' as AccessMethod,
  BRANCH_TABLET: 'branch_tablet' as AccessMethod,
  QR_CODE: 'qr_code' as AccessMethod,
} as const;

/**
 * Access method display names
 */
export const ACCESS_METHOD_LABELS: Record<AccessMethod, string> = {
  mobile_app: 'Mobile App',
  branch_tablet: 'Branch Tablet',
  qr_code: 'QR Code Access',
};

/**
 * Access method icons (emoji or icon class names)
 */
export const ACCESS_METHOD_ICONS: Record<AccessMethod, string> = {
  mobile_app: '📱',
  branch_tablet: '🖥️',
  qr_code: '📷',
};

/**
 * Access method colors for UI indicators
 */
export const ACCESS_METHOD_COLORS: Record<AccessMethod, string> = {
  mobile_app: '#3B82F6', // Blue
  branch_tablet: '#10B981', // Green
  qr_code: '#8B5CF6', // Purple
};

// ============================================================================
// SESSION POLICY CONSTANTS
// ============================================================================

/**
 * Session duration in milliseconds for each access method
 */
export const SESSION_DURATIONS: Record<AccessMethod, number> = {
  mobile_app: 24 * 60 * 60 * 1000, // 24 hours
  branch_tablet: 15 * 60 * 1000, // 15 minutes
  qr_code: 30 * 60 * 1000, // 30 minutes
};

/**
 * Inactivity timeout in milliseconds
 */
export const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

/**
 * Warning time before session expiration (in milliseconds)
 */
export const SESSION_WARNING_TIME = 2 * 60 * 1000; // 2 minutes

/**
 * Biometric re-authentication interval for mobile app (in milliseconds)
 */
export const BIOMETRIC_REAUTH_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Session policies for each access method
 */
export const SESSION_POLICIES: Record<AccessMethod, SessionPolicy> = {
  mobile_app: {
    accessMethod: 'mobile_app',
    sessionDuration: SESSION_DURATIONS.mobile_app,
    inactivityTimeout: INACTIVITY_TIMEOUT,
    warningTime: SESSION_WARNING_TIME,
    requireReauth: true,
    reauthInterval: BIOMETRIC_REAUTH_INTERVAL,
    autoTerminateAfterTransaction: false,
  },
  branch_tablet: {
    accessMethod: 'branch_tablet',
    sessionDuration: SESSION_DURATIONS.branch_tablet,
    inactivityTimeout: INACTIVITY_TIMEOUT,
    warningTime: SESSION_WARNING_TIME,
    requireReauth: false,
    autoTerminateAfterTransaction: true,
  },
  qr_code: {
    accessMethod: 'qr_code',
    sessionDuration: SESSION_DURATIONS.qr_code,
    inactivityTimeout: INACTIVITY_TIMEOUT,
    warningTime: SESSION_WARNING_TIME,
    requireReauth: false,
    autoTerminateAfterTransaction: false,
  },
};

// ============================================================================
// QR CODE CONSTANTS
// ============================================================================

/**
 * QR code expiration time in milliseconds
 */
export const QR_CODE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

/**
 * QR code refresh interval in milliseconds
 */
export const QR_CODE_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * QR code version
 */
export const QR_CODE_VERSION = '1.0';

/**
 * QR code generation rate limit (per branch per minute)
 */
export const QR_CODE_RATE_LIMIT = 1;

// ============================================================================
// TABLET CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Configuration access gesture duration (long press in milliseconds)
 */
export const CONFIG_GESTURE_DURATION = 3000; // 3 seconds

/**
 * Configuration URL parameter
 */
export const CONFIG_URL_PARAM = 'config';

/**
 * Maximum configuration attempts before lockout
 */
export const MAX_CONFIG_ATTEMPTS = 3;

// ============================================================================
// SECURITY CONSTANTS
// ============================================================================

/**
 * Encryption algorithm
 */
export const ENCRYPTION_ALGORITHM = 'AES-256-GCM';

/**
 * Session token length in bytes
 */
export const TOKEN_LENGTH = 32;

/**
 * Maximum login attempts before lockout
 */
export const MAX_LOGIN_ATTEMPTS = 3;

/**
 * Device fingerprint components
 */
export const DEVICE_FINGERPRINT_COMPONENTS = [
  'userAgent',
  'platform',
  'screenResolution',
  'timezone',
  'language',
  'hardwareId',
] as const;

// ============================================================================
// AUDIT LOG CONSTANTS
// ============================================================================

/**
 * Audit log retention period in years
 */
export const AUDIT_LOG_RETENTION_YEARS = 7;

/**
 * Audit log batch size for bulk submissions
 */
export const AUDIT_LOG_BATCH_SIZE = 100;

/**
 * Audit log retry attempts
 */
export const AUDIT_LOG_RETRY_ATTEMPTS = 3;

/**
 * Audit log retry delay in milliseconds (exponential backoff base)
 */
export const AUDIT_LOG_RETRY_DELAY = 1000; // 1 second

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

/**
 * Local storage keys for multi-channel access data
 */
export const STORAGE_KEYS = {
  BRANCH_CONTEXT: 'multi_channel_branch_context',
  TABLET_CONFIG: 'multi_channel_tablet_config',
  SESSION_DATA: 'multi_channel_session',
  ACCESS_METHOD: 'multi_channel_access_method',
  DEVICE_INFO: 'multi_channel_device_info',
  LAST_ACTIVITY: 'multi_channel_last_activity',
} as const;

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * Default multi-channel access configuration
 */
export const DEFAULT_MULTI_CHANNEL_CONFIG: MultiChannelConfig = {
  // QR Code Settings
  qrCodeExpirationMinutes: 5,
  qrCodeRefreshIntervalMinutes: 5,
  qrCodeVersion: '1.0',
  
  // Session Settings
  mobileSessionHours: 24,
  tabletSessionMinutes: 15,
  qrSessionMinutes: 30,
  inactivityTimeoutMinutes: 10,
  
  // Security Settings
  encryptionAlgorithm: 'AES-256-GCM',
  tokenLength: 32,
  maxLoginAttempts: 3,
  
  // Audit Settings
  auditLogRetentionYears: 7,
  auditLogBatchSize: 100,
  
  // Feature Flags
  enableQRCodeAccess: true,
  enableTabletAccess: true,
  enableMobileAppAccess: true,
};

// ============================================================================
// ROUTE PATHS
// ============================================================================

/**
 * Route paths for multi-channel access flows
 */
export const MULTI_CHANNEL_ROUTES = {
  QR_LOGIN: '/qr-login/:branchId/:token',
  TABLET_CONFIG: '/tablet-config',
  LANGUAGE_SELECTION: '/language-selection',
  BRANCH_SELECTION: '/select-branch',
  DASHBOARD: '/dashboard',
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

/**
 * Standard error messages for multi-channel access
 */
export const ERROR_MESSAGES = {
  // Branch Context Errors
  BRANCH_CONTEXT_MISSING: 'Branch context is missing. Please select a branch.',
  BRANCH_CONTEXT_INVALID: 'Invalid branch context. Please try again.',
  BRANCH_NOT_FOUND: 'Branch not found or is no longer available.',
  BRANCH_INACTIVE: 'This branch is currently inactive.',
  
  // QR Code Errors
  QR_CODE_EXPIRED: 'This QR code has expired. Please scan a new one.',
  QR_CODE_INVALID: 'Invalid QR code. Please try again.',
  QR_CODE_ALREADY_USED: 'This QR code has already been used.',
  QR_CODE_GENERATION_FAILED: 'Failed to generate QR code. Please try again.',
  
  // Session Errors
  SESSION_EXPIRED: 'Your session has expired. Please start again.',
  SESSION_INVALID: 'Invalid session. Please start again.',
  SESSION_TIMEOUT: 'Your session will expire soon due to inactivity.',
  SESSION_CONCURRENT: 'Another session is active on a different device.',
  
  // Configuration Errors
  CONFIG_AUTH_FAILED: 'Authentication failed. Please check your credentials.',
  CONFIG_DEVICE_MISMATCH: 'Configuration is locked to a different device.',
  CONFIG_SAVE_FAILED: 'Failed to save configuration. Please try again.',
  CONFIG_TAMPERED: 'Configuration tampering detected. Please contact support.',
  
  // Access Method Errors
  ACCESS_METHOD_DETECTION_FAILED: 'Failed to detect access method.',
  ACCESS_METHOD_NOT_SUPPORTED: 'This access method is not currently supported.',
  
  // General Errors
  NETWORK_ERROR: 'Network error. Please check your connection.',
  VALIDATION_ERROR: 'Validation failed. Please check your input.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;
