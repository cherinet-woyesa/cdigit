# Multi-Channel Access System Types

This document provides an overview of the TypeScript types, interfaces, and error classes for the Multi-Channel Customer Access System.

## Overview

The Multi-Channel Access System supports three distinct entry points for customers:
1. **Mobile App** - Customer's personal mobile application
2. **Branch Tablet** - Tablets physically located at bank branches
3. **QR Code** - Scanning QR codes displayed at branches using personal devices

## Core Types

### Access Method
```typescript
type AccessMethod = 'mobile_app' | 'branch_tablet' | 'qr_code';
```

Defines the three access channels available to customers.

### Session State
```typescript
type SessionState = 'active' | 'inactive' | 'expired' | 'terminated' | 'warning';
```

Represents the current state of a customer session.

### Device Type
```typescript
type DeviceType = 'mobile' | 'tablet' | 'desktop';
```

Categorizes the type of device being used.

## Core Interfaces

### DeviceInfo
Contains device identification and fingerprinting information for security and audit purposes.

**Key Fields:**
- `deviceId`: Unique device identifier
- `deviceType`: Type of device (mobile, tablet, desktop)
- `userAgent`: Browser user agent string
- `platform`: Operating system platform
- `fingerprint`: Device fingerprint for security

### BranchContext
Stores branch information and the access method used to establish the context.

**Key Fields:**
- `branchId`: Branch unique identifier
- `branchName`: Branch display name
- `branchCode`: Branch code
- `accessMethod`: How the customer accessed the system
- `sessionToken`: Session token (for QR code access)

### Session
Represents a customer session with all relevant metadata.

**Key Fields:**
- `sessionId`: Unique session identifier
- `accessMethod`: Access method for this session
- `branchContext`: Associated branch context
- `deviceInfo`: Device information
- `state`: Current session state
- `expiresAt`: Session expiration timestamp

## QR Code Interfaces

### QRCodeData
Structure for QR code generation and display.

**Key Fields:**
- `branchId`: Branch ID embedded in QR code
- `sessionToken`: Encrypted session token
- `expiresAt`: QR code expiration timestamp
- `qrCodeImage`: Base64 encoded QR code image

### QRCodePayload
The actual data structure embedded in the QR code (compact format).

**Structure:**
```json
{
  "v": "1.0",           // Version
  "b": "branch-id",     // Branch ID
  "t": "token",         // Encrypted token
  "ts": 1699264800000,  // Timestamp
  "exp": 300,           // Expiration (seconds)
  "n": "nonce"          // Nonce (optional)
}
```

## Tablet Configuration Interfaces

### TabletConfig
Configuration data for branch tablets.

**Key Fields:**
- `branchId`: Configured branch ID
- `deviceId`: Unique device identifier
- `configuredBy`: Admin user who configured the tablet
- `encryptedData`: Encrypted configuration data
- `deviceFingerprint`: Device fingerprint for binding

### AdminCredentials
Credentials required for tablet configuration.

**Key Fields:**
- `username`: Admin username
- `password`: Admin password
- `role`: Admin role (Manager or Admin)

## Session Policy Interfaces

### SessionPolicy
Defines session timeout and behavior policies for each access method.

**Key Fields:**
- `sessionDuration`: Session duration in milliseconds
- `inactivityTimeout`: Inactivity timeout in milliseconds
- `warningTime`: Warning time before expiration
- `requireReauth`: Whether to require re-authentication
- `autoTerminateAfterTransaction`: Auto-terminate after transaction

**Default Policies:**
- **Mobile App**: 24-hour session with 4-hour biometric re-auth
- **Branch Tablet**: Auto-terminate after transaction (max 15 minutes)
- **QR Code**: 30-minute session with 10-minute inactivity timeout

## Audit Log Interfaces

### AuditEvent (Base)
Base interface for all audit events.

**Key Fields:**
- `eventId`: Event unique identifier
- `timestamp`: Event timestamp
- `accessMethod`: Access method used
- `deviceInfo`: Device information
- `ipAddress`: IP address
- `geolocation`: Geolocation data (if available)

### Specialized Audit Events
- **AccessEvent**: Access attempts and results
- **ConfigEvent**: Configuration changes
- **QREvent**: QR code generation and refresh
- **QRScanEvent**: QR code scan attempts
- **TransactionEvent**: Banking transactions

## Error Classes

All error classes extend `MultiChannelAccessError` which provides:
- `message`: Error message
- `code`: Error code
- `details`: Additional error details

### Error Types

1. **BranchContextError** - Branch context related errors
2. **QRCodeError** - QR code related errors
3. **SessionError** - Session management errors
4. **ConfigurationError** - Tablet configuration errors
5. **AccessMethodError** - Access method detection errors
6. **AuthenticationError** - Authentication and authorization errors
7. **ValidationError** - Validation errors

### Usage Example

```typescript
import { BranchContextError } from '@/types/multiChannelAccess';

throw new BranchContextError(
  'Branch context is missing',
  { branchId: 'branch-123' }
);
```

## Utility Types

### AccessMethodIndicatorProps
Props for the access method indicator component.

### BranchWatermarkProps
Props for the branch watermark component.

### SessionTimeoutModalProps
Props for the session timeout warning modal.

## Configuration

### MultiChannelConfig
Environment configuration for the multi-channel access system.

**Sections:**
- QR Code Settings
- Session Settings
- Security Settings
- Audit Settings
- Feature Flags

See `constants/multiChannelAccess.ts` for default values.

## Constants

All constant values are defined in `constants/multiChannelAccess.ts`:

- **ACCESS_METHODS**: Access method constant values
- **SESSION_POLICIES**: Session policies for each access method
- **QR_CODE_EXPIRATION**: QR code expiration time
- **STORAGE_KEYS**: Local storage keys
- **ERROR_MESSAGES**: Standard error messages
- **MULTI_CHANNEL_ROUTES**: Route paths

## Usage Examples

### Detecting Access Method
```typescript
import { AccessMethod } from '@/types/multiChannelAccess';
import { ACCESS_METHODS } from '@/constants/multiChannelAccess';

const accessMethod: AccessMethod = ACCESS_METHODS.MOBILE_APP;
```

### Creating a Session
```typescript
import { Session, BranchContext } from '@/types/multiChannelAccess';

const session: Session = {
  sessionId: 'session-123',
  sessionToken: 'token-abc',
  accessMethod: 'mobile_app',
  branchContext: branchContext,
  deviceInfo: deviceInfo,
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  lastActivity: new Date().toISOString(),
  state: 'active',
  transactionCount: 0,
  isActive: true,
};
```

### Handling Errors
```typescript
import { QRCodeError } from '@/types/multiChannelAccess';
import { ERROR_MESSAGES } from '@/constants/multiChannelAccess';

try {
  // QR code validation logic
} catch (error) {
  throw new QRCodeError(
    ERROR_MESSAGES.QR_CODE_EXPIRED,
    { qrCodeId: 'qr-123' }
  );
}
```

## Best Practices

1. **Always use type imports** for better tree-shaking:
   ```typescript
   import type { AccessMethod, Session } from '@/types/multiChannelAccess';
   ```

2. **Use constants instead of hardcoded strings**:
   ```typescript
   // Good
   if (accessMethod === ACCESS_METHODS.MOBILE_APP) { }
   
   // Avoid
   if (accessMethod === 'mobile_app') { }
   ```

3. **Throw specific error types** for better error handling:
   ```typescript
   throw new BranchContextError('Branch not found', { branchId });
   ```

4. **Validate session state** before operations:
   ```typescript
   if (session.state !== 'active') {
     throw new SessionError('Session is not active');
   }
   ```

## Related Files

- **Types**: `src/types/multiChannelAccess.ts`
- **Constants**: `src/constants/multiChannelAccess.ts`
- **Services**: (To be implemented in subsequent tasks)
  - `src/services/accessMethodDetector.ts`
  - `src/services/qrCodeGenerator.ts`
  - `src/services/sessionManager.ts`
  - `src/services/auditLogger.ts`

## Requirements Mapping

This implementation satisfies the following requirements:
- **Requirement 1.1**: Mobile App Channel Access
- **Requirement 2.1**: Branch Tablet Channel Access
- **Requirement 3.1**: QR Code Channel Access
- **Requirement 6.1**: Session Management by Channel
