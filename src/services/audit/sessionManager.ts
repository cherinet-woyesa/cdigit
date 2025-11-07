/**
 * Session Manager Service
 * 
 * Manages user sessions with channel-specific policies including
 * creation, validation, refresh, and termination.
 */

import type { Session, BranchContext, DeviceInfo, SessionState } from '@types';
import { SessionError } from '@types';
import { SESSION_POLICIES, STORAGE_KEYS } from '@constants/multiChannelAccess';
import { accessMethodDetector } from '@services/multiChannel/accessMethodDetector';

/**
 * Session creation options
 */
interface SessionCreationOptions {
  branchContext: BranchContext;
  deviceInfo?: DeviceInfo;
  userId?: string;
  ipAddress?: string;
}

/**
 * Session Manager Service
 * Handles all session lifecycle operations
 */
class SessionManagerService {
  private currentSession: Session | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private expirationTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;

  /**
   * Creates a new session with channel-specific policies
   */
  async createSession(options: SessionCreationOptions): Promise<Session> {
    try {
      const { branchContext, deviceInfo, userId, ipAddress } = options;
      const accessMethod = branchContext.accessMethod;

      // Get policy for access method
      const policy = SESSION_POLICIES[accessMethod];

      // Generate session ID and token
      const sessionId = this.generateSessionId();
      const sessionToken = this.generateSessionToken();

      // Get or create device info
      const device = deviceInfo || accessMethodDetector.getDeviceInfo();

      // Calculate expiration
      const now = new Date();
      const expiresAt = new Date(now.getTime() + policy.sessionDuration);

      // Create session
      const session: Session = {
        sessionId,
        sessionToken,
        accessMethod,
        branchContext,
        deviceInfo: device,
        ipAddress,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        lastActivity: now.toISOString(),
        state: 'active',
        userId,
        transactionCount: 0,
        isActive: true,
      };

      // Store session
      this.currentSession = session;
      this.storeSession(session);

      // Set up timers
      this.setupSessionTimers(session);

      console.log('Session created:', {
        sessionId,
        accessMethod,
        expiresAt: session.expiresAt,
      });

      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new SessionError(
        'Failed to create session',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Validates a session
   */
  async validateSession(sessionId?: string): Promise<boolean> {
    try {
      const session = sessionId 
        ? await this.getSessionById(sessionId)
        : this.currentSession;

      if (!session) {
        return false;
      }

      // Check if session is active
      if (!session.isActive || session.state !== 'active') {
        return false;
      }

      // Check expiration
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);
      
      if (now > expiresAt) {
        await this.terminateSession(session.sessionId, 'expired');
        return false;
      }

      // Check inactivity timeout
      const policy = SESSION_POLICIES[session.accessMethod];
      const lastActivity = new Date(session.lastActivity);
      const inactivityMs = now.getTime() - lastActivity.getTime();

      if (inactivityMs > policy.inactivityTimeout) {
        await this.terminateSession(session.sessionId, 'inactive');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  /**
   * Refreshes a session (extends lifetime)
   */
  async refreshSession(sessionId?: string): Promise<Session> {
    try {
      const session = sessionId 
        ? await this.getSessionById(sessionId)
        : this.currentSession;

      if (!session) {
        throw new SessionError('No active session to refresh');
      }

      // Validate session first
      const isValid = await this.validateSession(session.sessionId);
      if (!isValid) {
        throw new SessionError('Cannot refresh invalid or expired session');
      }

      // Get policy
      const policy = SESSION_POLICIES[session.accessMethod];

      // Extend expiration
      const now = new Date();
      const newExpiresAt = new Date(now.getTime() + policy.sessionDuration);

      // Update session
      const refreshedSession: Session = {
        ...session,
        expiresAt: newExpiresAt.toISOString(),
        lastActivity: now.toISOString(),
        state: 'active',
      };

      // Store updated session
      this.currentSession = refreshedSession;
      this.storeSession(refreshedSession);

      // Reset timers
      this.clearSessionTimers();
      this.setupSessionTimers(refreshedSession);

      console.log('Session refreshed:', {
        sessionId: session.sessionId,
        newExpiresAt: refreshedSession.expiresAt,
      });

      return refreshedSession;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      throw new SessionError(
        'Failed to refresh session',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Terminates a session
   */
  async terminateSession(sessionId?: string, reason: string = 'manual'): Promise<void> {
    try {
      const session = sessionId 
        ? await this.getSessionById(sessionId)
        : this.currentSession;

      if (!session) {
        console.warn('No session to terminate');
        return;
      }

      // Update session state
      const terminatedSession: Session = {
        ...session,
        state: reason === 'expired' ? 'expired' : 'terminated',
        isActive: false,
      };

      // Store terminated session
      this.storeSession(terminatedSession);

      // Clear current session
      if (this.currentSession?.sessionId === session.sessionId) {
        this.currentSession = null;
      }

      // Clear timers
      this.clearSessionTimers();

      // Clear stored session
      this.clearStoredSession();

      console.log('Session terminated:', {
        sessionId: session.sessionId,
        reason,
      });
    } catch (error) {
      console.error('Failed to terminate session:', error);
      throw new SessionError(
        'Failed to terminate session',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Updates last activity timestamp
   */
  updateActivity(): void {
    if (!this.currentSession) {
      return;
    }

    const now = new Date();
    this.currentSession.lastActivity = now.toISOString();
    this.storeSession(this.currentSession);

    // Reset inactivity timer
    this.resetActivityTimer();
  }

  /**
   * Increments transaction count
   */
  incrementTransactionCount(): void {
    if (!this.currentSession) {
      return;
    }

    this.currentSession.transactionCount++;
    this.storeSession(this.currentSession);

    // Check if should auto-terminate after transaction
    const policy = SESSION_POLICIES[this.currentSession.accessMethod];
    if (policy.autoTerminateAfterTransaction) {
      console.log('Auto-terminating session after transaction');
      this.terminateSession(this.currentSession.sessionId, 'transaction_complete');
    }
  }

  /**
   * Gets current session
   */
  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Gets session by ID
   */
  private async getSessionById(sessionId: string): Promise<Session | null> {
    // Check current session
    if (this.currentSession?.sessionId === sessionId) {
      return this.currentSession;
    }

    // Try to load from storage
    const stored = this.loadStoredSession();
    if (stored?.sessionId === sessionId) {
      return stored;
    }

    return null;
  }

  /**
   * Generates unique session ID
   */
  private generateSessionId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generates session token
   */
  private generateSessionToken(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `token_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Stores session in localStorage
   */
  private storeSession(session: Session): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_DATA, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, session.lastActivity);
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  /**
   * Loads session from localStorage
   */
  private loadStoredSession(): Session | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSION_DATA);
      if (!stored) {
        return null;
      }
      return JSON.parse(stored) as Session;
    } catch (error) {
      console.error('Failed to load stored session:', error);
      return null;
    }
  }

  /**
   * Clears stored session
   */
  private clearStoredSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION_DATA);
      localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
    } catch (error) {
      console.error('Failed to clear stored session:', error);
    }
  }

  /**
   * Sets up session timers
   */
  private setupSessionTimers(session: Session): void {
    const policy = SESSION_POLICIES[session.accessMethod];
    const now = Date.now();
    const expiresAt = new Date(session.expiresAt).getTime();
    const timeUntilExpiration = expiresAt - now;

    // Set expiration timer
    if (timeUntilExpiration > 0) {
      this.expirationTimer = setTimeout(() => {
        console.log('Session expired');
        this.terminateSession(session.sessionId, 'expired');
        this.emitSessionEvent('expired', session);
      }, timeUntilExpiration);
    }

    // Set warning timer
    const timeUntilWarning = timeUntilExpiration - policy.warningTime;
    if (timeUntilWarning > 0) {
      this.warningTimer = setTimeout(() => {
        console.log('Session expiring soon');
        if (this.currentSession) {
          this.currentSession.state = 'warning';
          this.storeSession(this.currentSession);
        }
        this.emitSessionEvent('warning', session);
      }, timeUntilWarning);
    }

    // Set inactivity timer
    this.resetActivityTimer();
  }

  /**
   * Resets activity timer
   */
  private resetActivityTimer(): void {
    if (!this.currentSession) {
      return;
    }

    // Clear existing timer
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }

    const policy = SESSION_POLICIES[this.currentSession.accessMethod];

    // Set new timer
    this.activityTimer = setTimeout(() => {
      console.log('Session inactive');
      if (this.currentSession) {
        this.terminateSession(this.currentSession.sessionId, 'inactive');
        this.emitSessionEvent('inactive', this.currentSession);
      }
    }, policy.inactivityTimeout);
  }

  /**
   * Clears all session timers
   */
  private clearSessionTimers(): void {
    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
  }

  /**
   * Emits session event (for listeners)
   */
  private emitSessionEvent(event: string, session: Session): void {
    const customEvent = new CustomEvent('session-event', {
      detail: { event, session },
    });
    window.dispatchEvent(customEvent);
  }

  /**
   * Restores session from storage
   */
  async restoreSession(): Promise<Session | null> {
    try {
      const stored = this.loadStoredSession();
      if (!stored) {
        return null;
      }

      // Validate stored session
      const isValid = await this.validateSession(stored.sessionId);
      if (!isValid) {
        this.clearStoredSession();
        return null;
      }

      // Restore session
      this.currentSession = stored;
      this.setupSessionTimers(stored);

      console.log('Session restored:', stored.sessionId);
      return stored;
    } catch (error) {
      console.error('Failed to restore session:', error);
      return null;
    }
  }

  /**
   * Gets remaining session time in milliseconds
   */
  getRemainingTime(): number {
    if (!this.currentSession) {
      return 0;
    }

    const now = Date.now();
    const expiresAt = new Date(this.currentSession.expiresAt).getTime();
    return Math.max(0, expiresAt - now);
  }

  /**
   * Gets session state
   */
  getSessionState(): SessionState | null {
    return this.currentSession?.state || null;
  }

  /**
   * Checks if session requires re-authentication
   */
  requiresReauth(): boolean {
    if (!this.currentSession) {
      return false;
    }

    const policy = SESSION_POLICIES[this.currentSession.accessMethod];
    if (!policy.requireReauth || !policy.reauthInterval) {
      return false;
    }

    const now = Date.now();
    const createdAt = new Date(this.currentSession.createdAt).getTime();
    const timeSinceCreation = now - createdAt;

    return timeSinceCreation >= policy.reauthInterval;
  }
}

// Export singleton instance
export const sessionManager = new SessionManagerService();
