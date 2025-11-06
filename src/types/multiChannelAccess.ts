/**
 * Multi-Channel Access System Types
 * 
 * This file contains all TypeScript interfaces, enums, and error types
 * for the multi-channel customer access system supporting Mobile App,
 * Branch Tablet, and QR Code access methods.
 */

// ============================================================================
// TYPE DEFINITIONS (String Literal Unions)
// ============================================================================

/**
 * Access methods available for customers to access the banking system
 */
export type AccessMethod = 'mobile_app' | 'branch_tablet' | 'qr_code';

/**
 * Session states throughout the session lifecycle
 */
export type SessionState = 'active' | 'inactive' | 'expired' | 'terminated' | 'warning';

/**
 * Device types for access method detection
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * QR code status
 */
export type QRCodeStatus = 'active' | 'expired' | 'used' | 'invalid';

/**
 * Configuration status for tablet devices
 */
export type ConfigurationStatus = 'configured' | 'unconfigured' | 'locked' | 'tampered';

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Device information captured for security and audit purposes
 */
export interface DeviceInfo {
  /** Unique device identifier */
  deviceId: string;
  /** Type of device (mobile, tablet, desktop) */
  deviceType: DeviceType;
  /** Browser user agent string */
  userAgent: string;
  /** Operating system platform */
  platform: string;
  /** Screen width in pixels */
  screenWidth?: number;
  /** Screen height in pixels */
  screenHeight?: number;
  /** Device fingerprint for security */
  fingerprint?: string;
  /** Hardware identifier (for tablets) */
  hardwareId?: string;
}

/**
 * Branch context containing branch information and access method
 */
export interface BranchContext {
  /** Branch unique identifier */
  branchId: string;
  /** Branch display name */
  branchName: string;
  /** Branch code */
  branchCode: string;
  /** Access method used to establish this context */
  accessMethod: AccessMethod;
  /** Timestamp when context was created */
  timestamp: string;
  /** Session token (for QR code access) */
  sessionToken?: string;
  /** Branch address */
  address?: string;
  /** Branch phone number */
  phone?: string;
  /** Branch working hours */
  workingHours?: string;
  /** Branch latitude coordinate */
  latitude?: number;
  /** Branch longitude coordinate */
  longitude?: number;
}

/**
 * Customer session information
 */
export interface Session {
  /** Unique session identifier */
  sessionId: string;
  /** Session token for authentication */
  sessionToken: string;
  /** Access method for this session */
  accessMethod: AccessMethod;
  /** Branch context for this session */
  branchContext: BranchContext;
  /** Device information */
  deviceInfo: DeviceInfo;
  /** IP address of the client */
  ipAddress?: string;
  /** Geolocation data (if available) */
  geolocation?: Geolocation;
  /** Session creation timestamp */
  createdAt: string;
  /** Session expiration timestamp */
  expiresAt: string;
  /** Last activity timestamp */
  lastActivity: string;
  /** Current session state */
  state: SessionState;
  /** User ID (if authenticated) */
  userId?: string;
  /** Number of transactions in this session */
  transactionCount: number;
  /** Whether session is currently active */
  isActive: boolean;
}

/**
 * Geolocation information
 */
export interface Geolocation {
  /** Latitude coordinate */
  latitude: number;
  /** Longitude coordinate */
  longitude: number;
  /** Accuracy in meters */
  accuracy?: number;
  /** Timestamp when location was captured */
  timestamp: string;
}

// ============================================================================
// QR CODE INTERFACES
// ============================================================================

/**
 * QR code data structure
 */
export interface QRCodeData {
  /** Branch ID embedded in QR code */
  branchId: string;
  /** Encrypted session token */
  sessionToken: string;
  /** QR code generation timestamp */
  timestamp: string;
  /** QR code expiration timestamp */
  expiresAt: string;
  /** QR code version */
  qrVersion: string;
  /** Base64 encoded QR code image */
  qrCodeImage: string;
  /** Nonce for replay attack prevention */
  nonce?: string;
}

/**
 * QR code validation result
 */
export interface QRValidationResult {
  /** Whether QR code is valid */
  isValid: boolean;
  /** Branch ID from QR code */
  branchId?: string;
  /** Session token from QR code */
  sessionToken?: string;
  /** Branch context extracted from QR code */
  branchContext?: BranchContext;
  /** Error message if validation failed */
  errorMessage?: string;
  /** QR code status */
  status?: QRCodeStatus;
}

/**
 * QR code payload structure (embedded in QR code)
 */
export interface QRCodePayload {
  /** Payload version */
  v: string;
  /** Branch ID */
  b: string;
  /** Encrypted session token */
  t: string;
  /** Timestamp (Unix milliseconds) */
  ts: number;
  /** Expiration duration in seconds */
  exp: number;
  /** Nonce for replay prevention */
  n?: string;
}

// ============================================================================
// TABLET CONFIGURATION INTERFACES
// ============================================================================

/**
 * Tablet configuration data
 */
export interface TabletConfig {
  /** Branch ID configured for this tablet */
  branchId: string;
  /** Unique device identifier */
  deviceId: string;
  /** Admin user who configured the tablet */
  configuredBy: string;
  /** Configuration timestamp */
  configuredAt: string;
  /** Encrypted configuration data */
  encryptedData: string;
  /** Device fingerprint for binding */
  deviceFingerprint?: string;
  /** Last modified by admin user */
  lastModifiedBy?: string;
  /** Last modification timestamp */
  lastModifiedAt?: string;
  /** Configuration status */
  status?: ConfigurationStatus;
}

/**
 * Admin credentials for tablet configuration
 */
export interface AdminCredentials {
  /** Admin username */
  username: string;
  /** Admin password */
  password: string;
  /** Admin role (Manager or Admin) */
  role: 'Manager' | 'Admin';
}

// ============================================================================
// SESSION POLICY INTERFACES
// ============================================================================

/**
 * Session timeout policy configuration
 */
export interface SessionPolicy {
  /** Access method this policy applies to */
  accessMethod: AccessMethod;
  /** Session duration in milliseconds */
  sessionDuration: number;
  /** Inactivity timeout in milliseconds */
  inactivityTimeout: number;
  /** Warning time before expiration in milliseconds */
  warningTime: number;
  /** Whether to require re-authentication */
  requireReauth: boolean;
  /** Re-authentication interval in milliseconds (if applicable) */
  reauthInterval?: number;
  /** Whether to auto-terminate after transaction */
  autoTerminateAfterTransaction: boolean;
}

/**
 * Session timeout warning data
 */
export interface SessionTimeoutWarning {
  /** Session ID */
  sessionId: string;
  /** Time remaining in milliseconds */
  timeRemaining: number;
  /** Expiration timestamp */
  expiresAt: string;
  /** Whether user can extend session */
  canExtend: boolean;
}

// ============================================================================
// AUDIT LOG INTERFACES
// ============================================================================

/**
 * Base audit event interface
 */
export interface AuditEvent {
  /** Event unique identifier */
  eventId: string;
  /** Event timestamp */
  timestamp: string;
  /** Access method used */
  accessMethod?: AccessMethod;
  /** Device information */
  deviceInfo?: DeviceInfo;
  /** IP address */
  ipAddress?: string;
  /** Geolocation data */
  geolocation?: Geolocation;
  /** User ID (if authenticated) */
  userId?: string;
  /** Branch ID */
  branchId?: string;
}

/**
 * Access attempt audit event
 */
export interface AccessEvent extends AuditEvent {
  /** Event type */
  eventType: 'access_attempt' | 'access_success' | 'access_failure';
  /** Session ID (if successful) */
  sessionId?: string;
  /** Failure reason (if failed) */
  failureReason?: string;
}

/**
 * Configuration change audit event
 */
export interface ConfigEvent extends AuditEvent {
  /** Event type */
  eventType: 'config_create' | 'config_update' | 'config_delete';
  /** Admin user who made the change */
  adminUser: string;
  /** Device ID being configured */
  deviceId: string;
  /** Previous configuration (for updates) */
  previousConfig?: TabletConfig;
  /** New configuration */
  newConfig: TabletConfig;
}

/**
 * QR code generation audit event
 */
export interface QREvent extends AuditEvent {
  /** Event type */
  eventType: 'qr_generated' | 'qr_refreshed' | 'qr_expired';
  /** Session token */
  sessionToken: string;
  /** Expiration timestamp */
  expiresAt: string;
}

/**
 * QR code scan audit event
 */
export interface QRScanEvent extends AuditEvent {
  /** Event type */
  eventType: 'qr_scan_success' | 'qr_scan_failure';
  /** Session token from QR code */
  sessionToken?: string;
  /** Session ID (if successful) */
  sessionId?: string;
  /** Error reason (if failed) */
  errorReason?: string;
  /** QR code status */
  qrStatus?: QRCodeStatus;
}

/**
 * Transaction audit event
 */
export interface TransactionEvent extends AuditEvent {
  /** Event type */
  eventType: 'transaction_initiated' | 'transaction_completed' | 'transaction_failed';
  /** Transaction type */
  transactionType: string;
  /** Session ID */
  sessionId: string;
  /** Transaction amount */
  amount?: number;
  /** Transaction reference */
  reference?: string;
  /** Error reason (if failed) */
  errorReason?: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Base error class for multi-channel access errors
 */
export class MultiChannelAccessError extends Error {
  public code: string;
  public details?: Record<string, unknown>;
  
  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MultiChannelAccessError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Branch context related errors
 */
export class BranchContextError extends MultiChannelAccessError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'BRANCH_CONTEXT_ERROR', details);
    this.name = 'BranchContextError';
  }
}

/**
 * QR code related errors
 */
export class QRCodeError extends MultiChannelAccessError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'QR_CODE_ERROR', details);
    this.name = 'QRCodeError';
  }
}

/**
 * Session management errors
 */
export class SessionError extends MultiChannelAccessError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SESSION_ERROR', details);
    this.name = 'SessionError';
  }
}

/**
 * Tablet configuration errors
 */
export class ConfigurationError extends MultiChannelAccessError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

/**
 * Access method detection errors
 */
export class AccessMethodError extends MultiChannelAccessError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'ACCESS_METHOD_ERROR', details);
    this.name = 'AccessMethodError';
  }
}

/**
 * Authentication and authorization errors
 */
export class AuthenticationError extends MultiChannelAccessError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends MultiChannelAccessError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Access method indicator props
 */
export interface AccessMethodIndicatorProps {
  /** Current access method */
  accessMethod: AccessMethod;
  /** Branch name to display */
  branchName?: string;
  /** Whether to show branch watermark */
  showBranchWatermark?: boolean;
  /** Custom CSS class */
  className?: string;
}

/**
 * Branch watermark props
 */
export interface BranchWatermarkProps {
  /** Branch name to display */
  branchName: string;
  /** Access method icon to show */
  accessMethod: AccessMethod;
  /** Position of watermark */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Custom CSS class */
  className?: string;
}

/**
 * Session timeout modal props
 */
export interface SessionTimeoutModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Time remaining in seconds */
  timeRemaining: number;
  /** Callback when user extends session */
  onExtend: () => void;
  /** Callback when session expires */
  onExpire: () => void;
}

/**
 * Environment configuration for multi-channel access
 */
export interface MultiChannelConfig {
  // QR Code Settings
  qrCodeExpirationMinutes: number;
  qrCodeRefreshIntervalMinutes: number;
  qrCodeVersion: string;
  
  // Session Settings
  mobileSessionHours: number;
  tabletSessionMinutes: number;
  qrSessionMinutes: number;
  inactivityTimeoutMinutes: number;
  
  // Security Settings
  encryptionAlgorithm: string;
  tokenLength: number;
  maxLoginAttempts: number;
  
  // Audit Settings
  auditLogRetentionYears: number;
  auditLogBatchSize: number;
  
  // Feature Flags
  enableQRCodeAccess: boolean;
  enableTabletAccess: boolean;
  enableMobileAppAccess: boolean;
}
