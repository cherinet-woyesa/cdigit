/**
 * Validation Audit Service
 * Stores validation results for audit and analytics purposes
 */

export interface ValidationResult {
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  formType: 'deposit' | 'withdrawal' | 'fundTransfer' | 'rtgs' | 'accountOpening' | 'other';
  fieldName: string;
  fieldValue: string;
  validationRule: string;
  isValid: boolean;
  errorMessage?: string;
  guidedPrompt?: string;
  context?: Record<string, any>;
}

export interface ValidationAnalytics {
  totalValidations: number;
  failedValidations: number;
  successRate: number;
  commonErrors: Array<{
    field: string;
    rule: string;
    count: number;
    percentage: number;
  }>;
  validationsByForm: Record<string, number>;
  validationsByField: Record<string, { success: number; failed: number }>;
}

class ValidationAuditService {
  private validationLog: ValidationResult[] = [];
  private readonly MAX_LOG_SIZE = 1000; // Keep last 1000 validations in memory
  private readonly STORAGE_KEY = 'validation_audit_log';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Log a validation result
   */
  logValidation(validation: Omit<ValidationResult, 'timestamp'>): void {
    const result: ValidationResult = {
      ...validation,
      timestamp: new Date(),
    };

    // Add to in-memory log
    this.validationLog.push(result);

    // Trim if exceeds max size
    if (this.validationLog.length > this.MAX_LOG_SIZE) {
      this.validationLog = this.validationLog.slice(-this.MAX_LOG_SIZE);
    }

    // Persist to localStorage (async in background)
    this.saveToStorage();

    // Send to backend if available (non-blocking)
    this.sendToBackend(result).catch(console.error);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Validation Audit]', result);
    }
  }

  /**
   * Get validation history
   */
  getValidationHistory(filters?: {
    formType?: string;
    fieldName?: string;
    isValid?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): ValidationResult[] {
    let results = [...this.validationLog];

    // Apply filters
    if (filters) {
      if (filters.formType) {
        results = results.filter(v => v.formType === filters.formType);
      }
      if (filters.fieldName) {
        results = results.filter(v => v.fieldName === filters.fieldName);
      }
      if (filters.isValid !== undefined) {
        results = results.filter(v => v.isValid === filters.isValid);
      }
      if (filters.startDate) {
        results = results.filter(v => v.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        results = results.filter(v => v.timestamp <= filters.endDate!);
      }
      if (filters.limit) {
        results = results.slice(-filters.limit);
      }
    }

    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get analytics from validation data
   */
  getAnalytics(formType?: string): ValidationAnalytics {
    let data = formType
      ? this.validationLog.filter(v => v.formType === formType)
      : this.validationLog;

    const totalValidations = data.length;
    const failedValidations = data.filter(v => !v.isValid).length;
    const successRate = totalValidations > 0 ? ((totalValidations - failedValidations) / totalValidations) * 100 : 0;

    // Calculate common errors
    const errorMap = new Map<string, number>();
    data.filter(v => !v.isValid).forEach(v => {
      const key = `${v.fieldName}:${v.validationRule}`;
      errorMap.set(key, (errorMap.get(key) || 0) + 1);
    });

    const commonErrors = Array.from(errorMap.entries())
      .map(([key, count]) => {
        const [field, rule] = key.split(':');
        return {
          field,
          rule,
          count,
          percentage: (count / failedValidations) * 100 || 0,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 errors

    // Validations by form type
    const validationsByForm: Record<string, number> = {};
    data.forEach(v => {
      validationsByForm[v.formType] = (validationsByForm[v.formType] || 0) + 1;
    });

    // Validations by field
    const validationsByField: Record<string, { success: number; failed: number }> = {};
    data.forEach(v => {
      if (!validationsByField[v.fieldName]) {
        validationsByField[v.fieldName] = { success: 0, failed: 0 };
      }
      if (v.isValid) {
        validationsByField[v.fieldName].success++;
      } else {
        validationsByField[v.fieldName].failed++;
      }
    });

    return {
      totalValidations,
      failedValidations,
      successRate,
      commonErrors,
      validationsByForm,
      validationsByField,
    };
  }

  /**
   * Clear validation history
   */
  clearHistory(): void {
    this.validationLog = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Export validation data for analysis
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['Timestamp', 'Form Type', 'Field', 'Rule', 'Valid', 'Error Message', 'User ID'];
      const rows = this.validationLog.map(v => [
        v.timestamp.toISOString(),
        v.formType,
        v.fieldName,
        v.validationRule,
        v.isValid.toString(),
        v.errorMessage || '',
        v.userId || '',
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(this.validationLog, null, 2);
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = JSON.stringify(this.validationLog.slice(-500)); // Store last 500
      localStorage.setItem(this.STORAGE_KEY, data);
    } catch (error) {
      console.error('Failed to save validation audit to storage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.validationLog = parsed.map((v: any) => ({
          ...v,
          timestamp: new Date(v.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load validation audit from storage:', error);
    }
  }

  /**
   * Send validation result to backend (if API exists)
   */
  private async sendToBackend(validation: ValidationResult): Promise<void> {
    try {
      // Only send failed validations to backend to reduce traffic
      if (!validation.isValid) {
        await fetch('/api/analytics/validation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validation),
        });
      }
    } catch (error) {
      // Silently fail - analytics should not block user operations
      console.debug('Failed to send validation to backend:', error);
    }
  }
}

// Singleton instance
export const validationAuditService = new ValidationAuditService();

// Export for testing
export { ValidationAuditService };
