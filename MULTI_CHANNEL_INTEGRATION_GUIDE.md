# Multi-Channel Access System - Integration Guide

This guide provides step-by-step instructions for integrating the multi-channel access system into your existing application.

## Overview

The multi-channel access system has been implemented with all core services and components. This guide covers how to integrate it with your existing components.

## Table of Contents

1. [Provider Setup](#provider-setup)
2. [Routing Integration](#routing-integration)
3. [Component Integration](#component-integration)
4. [Authentication Integration](#authentication-integration)
5. [Form Integration](#form-integration)
6. [Dashboard Integration](#dashboard-integration)
7. [Testing](#testing)

---

## 1. Provider Setup

### Wrap your app with MultiChannelBranchProvider

Update your `App.tsx` or main component:

```tsx
import { BrowserRouter } from 'react-router-dom';
import { BranchProvider } from './context/BranchContext';
import { MultiChannelBranchProvider } from './context/MultiChannelBranchContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BranchProvider>
          <MultiChannelBranchProvider>
            {/* Your app routes */}
          </MultiChannelBranchProvider>
        </BranchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

---

## 2. Routing Integration

### Add Multi-Channel Routes

Update your routing configuration to include the new routes:

```tsx
import { Routes, Route } from 'react-router-dom';
import Entrypoint from './Entrypoint';
import { QRCodeScanFlow } from './components/QRCodeScanFlow';
import { TabletConfigScreen } from './components/TabletConfigScreen';

<Routes>
  <Route path="/" element={<Entrypoint />} />
  <Route path="/qr-login/:branchId/:token" element={<QRCodeScanFlow />} />
  <Route path="/tablet-config" element={<TabletConfigScreen />} />
  {/* Your existing routes */}
</Routes>
```

### Entrypoint Component

The `Entrypoint` component is already updated to detect access methods and route accordingly. No additional changes needed.

---

## 3. Component Integration

### Add Access Method Indicator to Header

Update your header/navbar component:

```tsx
import { AccessMethodIndicatorWithContext } from './components/AccessMethodIndicator';

function Header() {
  return (
    <header>
      <div className="header-left">
        {/* Your logo and navigation */}
      </div>
      <div className="header-right">
        <AccessMethodIndicatorWithContext />
        {/* Your other header items */}
      </div>
    </header>
  );
}
```

### Add Branch Watermark to Layout

Update your main layout component:

```tsx
import { BranchWatermark } from './components/BranchWatermark';
import { useMultiChannelBranch } from './context/MultiChannelBranchContext';

function Layout({ children }) {
  const { branchContext, accessMethod } = useMultiChannelBranch();

  return (
    <div className="app-layout">
      {children}
      {branchContext && accessMethod && (
        <BranchWatermark
          branchName={branchContext.branchName}
          accessMethod={accessMethod}
          position="bottom-right"
        />
      )}
    </div>
  );
}
```

---

## 4. Authentication Integration

### Update AuthContext for Channel-Specific Auth

Modify your `AuthContext` to skip authentication for tablet and QR access:

```tsx
import { useMultiChannelBranch } from './MultiChannelBranchContext';

// In your AuthProvider component
const { accessMethod } = useMultiChannelBranch();

// Skip authentication for tablet and QR code access
const requiresAuth = accessMethod === 'mobile_app';

if (!requiresAuth) {
  // Allow access without authentication
  // Set a guest user or skip auth checks
}
```

### Protected Routes

Update your protected route component:

```tsx
import { useMultiChannelBranch } from './context/MultiChannelBranchContext';

function ProtectedRoute({ children }) {
  const { accessMethod } = useMultiChannelBranch();
  const { user } = useAuth();

  // Mobile app requires authentication
  if (accessMethod === 'mobile_app' && !user) {
    return <Navigate to="/login" />;
  }

  // Tablet and QR code don't require authentication
  return children;
}
```

---

## 5. Form Integration

### Include Access Method in Form Submissions

Update your form components to include access method and branch context:

```tsx
import { useMultiChannelBranch } from './context/MultiChannelBranchContext';
import { auditLogger } from './services/auditLogger';

function TransactionForm() {
  const { branchContext, accessMethod } = useMultiChannelBranch();

  const handleSubmit = async (formData) => {
    // Include access method and branch context
    const submissionData = {
      ...formData,
      accessMethod,
      branchId: branchContext?.branchId,
      branchName: branchContext?.branchName,
    };

    try {
      // Submit to backend
      const result = await submitTransaction(submissionData);

      // Log transaction
      await auditLogger.logTransaction('transaction_completed', {
        transactionType: formData.type,
        sessionId: sessionManager.getCurrentSession()?.sessionId || '',
        amount: formData.amount,
        reference: result.reference,
        accessMethod,
        branchId: branchContext?.branchId,
      });

      // Handle success
    } catch (error) {
      // Log failure
      await auditLogger.logTransaction('transaction_failed', {
        transactionType: formData.type,
        sessionId: sessionManager.getCurrentSession()?.sessionId || '',
        errorReason: error.message,
        accessMethod,
        branchId: branchContext?.branchId,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Display branch name in header */}
      {branchContext && (
        <div className="form-header">
          <h3>{branchContext.branchName}</h3>
        </div>
      )}
      {/* Your form fields */}
    </form>
  );
}
```

---

## 6. Dashboard Integration

### Update Dashboard to Show Access Method

```tsx
import { AccessMethodIndicatorWithContext } from './components/AccessMethodIndicator';
import { BranchWatermark } from './components/BranchWatermark';
import { useMultiChannelBranch } from './context/MultiChannelBranchContext';

function Dashboard() {
  const { branchContext, accessMethod } = useMultiChannelBranch();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <AccessMethodIndicatorWithContext />
      </div>

      {/* Display branch information */}
      {branchContext && (
        <div className="branch-info-card">
          <h3>{branchContext.branchName}</h3>
          <p>Branch Code: {branchContext.branchCode}</p>
          <p>Access Method: {accessMethod}</p>
        </div>
      )}

      {/* Your dashboard content */}

      {/* Branch watermark */}
      {branchContext && accessMethod && (
        <BranchWatermark
          branchName={branchContext.branchName}
          accessMethod={accessMethod}
        />
      )}
    </div>
  );
}
```

---

## 7. Session Management Integration

### Track User Activity

Add activity tracking to your app:

```tsx
import { useEffect } from 'react';
import { sessionManager } from './services/sessionManager';

function App() {
  useEffect(() => {
    // Track user activity
    const handleActivity = () => {
      sessionManager.updateActivity();
    };

    // Listen for user interactions
    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, []);

  return <YourApp />;
}
```

### Session Timeout Warning

Add session timeout warning modal:

```tsx
import { useEffect, useState } from 'react';
import { sessionManager } from './services/sessionManager';

function SessionTimeoutWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    // Listen for session warning events
    const handleSessionEvent = (event: CustomEvent) => {
      if (event.detail.event === 'warning') {
        setShowWarning(true);
      } else if (event.detail.event === 'expired') {
        // Redirect to home or login
        window.location.href = '/';
      }
    };

    window.addEventListener('session-event', handleSessionEvent as EventListener);

    // Update remaining time
    const interval = setInterval(() => {
      const remaining = sessionManager.getRemainingTime();
      setTimeRemaining(remaining);
    }, 1000);

    return () => {
      window.removeEventListener('session-event', handleSessionEvent as EventListener);
      clearInterval(interval);
    };
  }, []);

  if (!showWarning) return null;

  return (
    <div className="session-timeout-modal">
      <h3>Session Expiring Soon</h3>
      <p>Your session will expire in {Math.floor(timeRemaining / 1000)} seconds</p>
      <button onClick={() => {
        sessionManager.refreshSession();
        setShowWarning(false);
      }}>
        Extend Session
      </button>
    </div>
  );
}
```

---

## 8. QR Code Display for Branch Screens

### Add QR Code Display to Branch Screen

```tsx
import { QRCodeDisplay } from './components/QRCodeDisplay';
import { useBranch } from './context/BranchContext';

function BranchScreen() {
  const { branch } = useBranch();

  if (!branch) return null;

  return (
    <div className="branch-screen">
      <h1>Welcome to {branch.name}</h1>
      
      <QRCodeDisplay
        branchId={branch.id}
        branchName={branch.name}
        autoRefresh={true}
      />
    </div>
  );
}
```

---

## 9. Audit Logging Integration

### Log Access Events

```tsx
import { auditLogger } from './services/auditLogger';

// On successful login
await auditLogger.logAccess('access_success', {
  accessMethod: 'mobile_app',
  sessionId: session.sessionId,
  userId: user.id,
  branchId: branch.id,
});

// On failed login
await auditLogger.logAccess('access_failure', {
  accessMethod: 'mobile_app',
  failureReason: 'Invalid credentials',
  branchId: branch.id,
});
```

---

## 10. Testing Checklist

### Mobile App Flow
- [ ] Navigate to `/` - should detect mobile app access
- [ ] Go through language selection
- [ ] Select branch
- [ ] Complete OTP login
- [ ] Access dashboard
- [ ] Verify access method indicator shows "Mobile App"
- [ ] Verify branch watermark displays

### Branch Tablet Flow
- [ ] Configure tablet via `/tablet-config`
- [ ] Navigate to `/` - should detect tablet access
- [ ] Skip authentication
- [ ] Access dashboard with pre-configured branch
- [ ] Verify access method indicator shows "Branch Tablet"
- [ ] Verify session auto-terminates after transaction

### QR Code Flow
- [ ] Generate QR code on branch screen
- [ ] Scan QR code (navigate to `/qr-login/:branchId/:token`)
- [ ] Verify QR code validation
- [ ] Complete language selection
- [ ] Access dashboard
- [ ] Verify access method indicator shows "QR Code Access"
- [ ] Verify 30-minute session timeout

---

## 11. Environment Configuration

Add these environment variables:

```env
# QR Code Settings
VITE_QR_CODE_EXPIRATION_MINUTES=5
VITE_QR_CODE_REFRESH_INTERVAL_MINUTES=5

# Session Settings
VITE_MOBILE_SESSION_HOURS=24
VITE_TABLET_SESSION_MINUTES=15
VITE_QR_SESSION_MINUTES=30
VITE_INACTIVITY_TIMEOUT_MINUTES=10

# Security Settings
VITE_ENCRYPTION_ALGORITHM=AES-256-GCM
VITE_MAX_LOGIN_ATTEMPTS=3

# Feature Flags
VITE_ENABLE_QR_CODE_ACCESS=true
VITE_ENABLE_TABLET_ACCESS=true
VITE_ENABLE_MOBILE_APP_ACCESS=true
```

---

## 12. Troubleshooting

### Access Method Not Detected
- Check browser console for errors
- Verify `accessMethodDetector` is working
- Check local storage for `multi_channel_access_method`

### QR Code Not Working
- Verify QR code hasn't expired (5-minute limit)
- Check QR code format in URL
- Verify backend QR validation endpoint

### Session Timeout Issues
- Check session policy configuration
- Verify activity tracking is working
- Check browser console for session events

### Tablet Configuration Issues
- Verify admin credentials
- Check device fingerprint
- Verify branch selection

---

## 13. Next Steps

1. **Backend Integration**: Connect services to backend APIs (Task 12)
2. **Testing**: Run comprehensive tests (Task 13)
3. **Deployment**: Deploy to staging and production (Task 14)

---

## Support

For issues or questions, refer to:
- `Frontend/src/types/multiChannelAccess.README.md` - Type system documentation
- Component source files for implementation details
- Service files for API documentation

---

**Implementation Status**: ✅ Core system complete, ready for integration
