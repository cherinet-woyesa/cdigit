/**
 * Audit Logger Service
 * 
 * Comprehensive audit logging for all multi-channel access events including
 * access attempts, configuration changes, QR code operations, and transactions.
 */

import type {
  AuditEvent,
  AccessEvent,
  ConfigEvent,
  QREvent,
  QRScanEvent,
  TransactionEvent,
  DeviceInfo,
  AccessMethod,
  TabletConfig,
} from '@types';
import { accessMethodDetector } from '@services/multiChannel/accessMethodDetector';
import { AUDIT_LOG_BATCH_SIZE, AUDIT_LOG_RETRY_ATTEMPTS, AUDIT_LOG_RETRY_DELAY } from '@constants/multiChannelAccess';

/**
 * Log queue entry
 */
interface QueuedLog {
  event: AuditEvent;
  retryCount: number;
  timestamp: number;
}

/**
 * Audit Logger Service
 * Handles all audit logging operations
 */
class AuditLoggerService {
  private logQueue: QueuedLog[] = [];
  private isProcessing: boolean = false;
  private flushTimer: NodeJS.Timeout | null = null;

  /**
   * Logs an access attempt event
   */
  async logAccess(
    eventType: 'access_attempt' | 'access_success' | 'access_failure',
    data: {
      accessMethod?: AccessMethod;
      sessionId?: string;
      failureReason?: string;
      userId?: string;
      branchId?: string;
    }
  ): Promise<void> {
    const event: AccessEvent = {
      ...this.createBaseEvent(data.accessMethod, data.userId, data.branchId),
      eventType,
      sessionId: data.sessionId,
      failureReason: data.failureReason,
    };

    await this.queueLog(event);
    console.log('Access event logged:', eventType, data);
  }

  /**
   * Logs a configuration change event
   */
  async logConfiguration(
    eventType: 'config_create' | 'config_update' | 'config_delete',
    data: {
      adminUser: string;
      deviceId: string;
      previousConfig?: TabletConfig;
      newConfig: TabletConfig;
      branchId?: string;
    }
  ): Promise<void> {
    const event: ConfigEvent = {
      ...this.createBaseEvent('branch_tablet', undefined, data.branchId),
      eventType,
      adminUser: data.adminUser,
      deviceId: data.deviceId,
      previousConfig: data.previousConfig,
      newConfig: data.newConfig,
    };

    await this.queueLog(event);
    console.log('Configuration event logged:', eventType, data.deviceId);
  }

  /**
   * Logs QR code generation event
   */
  async logQRGeneration(
    eventType: 'qr_generated' | 'qr_refreshed' | 'qr_expired',
    data: {
      sessionToken: string;
      expiresAt: string;
      branchId?: string;
    }
  ): Promise<void> {
    const event: QREvent = {
      ...this.createBaseEvent('qr_code', undefined, data.branchId),
      eventType,
      sessionToken: data.sessionToken,
      expiresAt: data.expiresAt,
    };

    await this.queueLog(event);
    console.log('QR generation event logged:', eventType);
  }

  /**
   * Logs QR code scan event
   */
  async logQRScan(
    eventType: 'qr_scan_success' | 'qr_scan_failure',
    data: {
      sessionToken?: string;
      sessionId?: string;
      errorReason?: string;
      qrStatus?: 'active' | 'expired' | 'used' | 'invalid';
      branchId?: string;
    }
  ): Promise<void> {
    const event: QRScanEvent = {
      ...this.createBaseEvent('qr_code', undefined, data.branchId),
      eventType,
      sessionToken: data.sessionToken,
      sessionId: data.sessionId,
      errorReason: data.errorReason,
      qrStatus: data.qrStatus,
    };

    await this.queueLog(event);
    console.log('QR scan event logged:', eventType, data);
  }

  /**
   * Logs transaction event
   */
  async logTransaction(
    eventType: 'transaction_initiated' | 'transaction_completed' | 'transaction_failed',
    data: {
      transactionType: string;
      sessionId: string;
      amount?: number;
      reference?: string;
      errorReason?: string;
      accessMethod?: AccessMethod;
      userId?: string;
      branchId?: string;
    }
  ): Promise<void> {
    const event: TransactionEvent = {
      ...this.createBaseEvent(data.accessMethod, data.userId, data.branchId),
      eventType,
      transactionType: data.transactionType,
      sessionId: data.sessionId,
      amount: data.amount,
      reference: data.reference,
      errorReason: data.errorReason,
    };

    await this.queueLog(event);
    console.log('Transaction event logged:', eventType, data.transactionType);
  }

  /**
   * Creates base audit event with common fields
   */
  private createBaseEvent(
    accessMethod?: AccessMethod,
    userId?: string,
    branchId?: string
  ): AuditEvent {
    const deviceInfo = this.getDeviceInfo();
    const geolocation = this.getGeolocation();

    return {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      accessMethod,
      deviceInfo,
      ipAddress: this.getIPAddress(),
      geolocation,
      userId,
      branchId,
    };
  }

  /**
   * Queues a log entry for batch processing
   */
  private async queueLog(event: AuditEvent): Promise<void> {
    const queuedLog: QueuedLog = {
      event,
      retryCount: 0,
      timestamp: Date.now(),
    };

    this.logQueue.push(queuedLog);

    // Store in local storage as backup
    this.backupToLocalStorage();

    // Schedule flush if not already scheduled
    if (!this.flushTimer) {
      this.scheduleFlush();
    }

    // Flush immediately if queue is full
    if (this.logQueue.length >= AUDIT_LOG_BATCH_SIZE) {
      await this.flushLogs();
    }
  }

  /**
   * Schedules automatic log flushing
   */
  private scheduleFlush(): void {
    this.flushTimer = setTimeout(() => {
      this.flushLogs();
      this.flushTimer = null;
    }, 5000); // Flush every 5 seconds
  }

  /**
   * Flushes queued logs to backend
   */
  async flushLogs(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get batch of logs to send
      const batch = this.logQueue.slice(0, AUDIT_LOG_BATCH_SIZE);
      const events = batch.map(q => q.event);

      // Send to backend
      await this.sendLogsToBackend(events);

      // Remove successfully sent logs from queue
      this.logQueue = this.logQueue.slice(batch.length);

      // Update backup
      this.backupToLocalStorage();

      console.log(`Flushed ${batch.length} audit logs`);
    } catch (error) {
      console.error('Failed to flush audit logs:', error);

      // Retry failed logs
      await this.retryFailedLogs();
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Sends logs to backend API
   */
  private async sendLogsToBackend(_events: AuditEvent[]): Promise<void> {
    // TODO: Implement actual API call
    // For now, just simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 95% success rate
        if (Math.random() > 0.05) {
          resolve();
        } else {
          reject(new Error('Simulated API failure'));
        }
      }, 100);
    });
  }

  /**
   * Retries failed logs with exponential backoff
   */
  private async retryFailedLogs(): Promise<void> {
    const now = Date.now();

    for (const queuedLog of this.logQueue) {
      if (queuedLog.retryCount >= AUDIT_LOG_RETRY_ATTEMPTS) {
        // Max retries reached, log error and remove
        console.error('Max retry attempts reached for audit log:', queuedLog.event.eventId);
        this.logQueue = this.logQueue.filter(q => q !== queuedLog);
        continue;
      }

      // Calculate backoff delay
      const backoffDelay = AUDIT_LOG_RETRY_DELAY * Math.pow(2, queuedLog.retryCount);
      const nextRetryTime = queuedLog.timestamp + backoffDelay;

      if (now >= nextRetryTime) {
        queuedLog.retryCount++;
        queuedLog.timestamp = now;
      }
    }

    this.backupToLocalStorage();
  }

  /**
   * Backs up log queue to local storage
   */
  private backupToLocalStorage(): void {
    try {
      const backup = {
        logs: this.logQueue,
        timestamp: Date.now(),
      };
      localStorage.setItem('audit_log_queue', JSON.stringify(backup));
    } catch (error) {
      console.error('Failed to backup audit logs:', error);
    }
  }

  /**
   * Restores log queue from local storage
   */
  restoreFromLocalStorage(): void {
    try {
      const backupStr = localStorage.getItem('audit_log_queue');
      if (!backupStr) {
        return;
      }

      const backup = JSON.parse(backupStr);
      const age = Date.now() - backup.timestamp;

      // Only restore if backup is less than 1 hour old
      if (age < 60 * 60 * 1000) {
        this.logQueue = backup.logs || [];
        console.log(`Restored ${this.logQueue.length} audit logs from backup`);
      } else {
        // Clear old backup
        localStorage.removeItem('audit_log_queue');
      }
    } catch (error) {
      console.error('Failed to restore audit logs:', error);
    }
  }

  /**
   * Gets device information
   */
  private getDeviceInfo(): DeviceInfo {
    return accessMethodDetector.getDeviceInfo();
  }

  /**
   * Gets geolocation (if available)
   */
  private getGeolocation(): { latitude: number; longitude: number; accuracy?: number; timestamp: string } | undefined {
    // Geolocation would be captured asynchronously in a real implementation
    // For now, return undefined
    return undefined;
  }

  /**
   * Gets IP address (would come from backend in real implementation)
   */
  private getIPAddress(): string | undefined {
    // IP address would be captured by backend
    return undefined;
  }

  /**
   * Generates unique event ID
   */
  private generateEventId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `event_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Gets queue size
   */
  getQueueSize(): number {
    return this.logQueue.length;
  }

  /**
   * Clears log queue (for testing)
   */
  clearQueue(): void {
    this.logQueue = [];
    localStorage.removeItem('audit_log_queue');
  }

  /**
   * Forces immediate flush
   */
  async forceFlush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flushLogs();
  }
}

// Export singleton instance
export const auditLogger = new AuditLoggerService();

// Restore logs on initialization
auditLogger.restoreFromLocalStorage();

// Set up periodic flushing
setInterval(() => {
  auditLogger.flushLogs();
}, 30000); // Flush every 30 seconds
