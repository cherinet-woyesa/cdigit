import { useMemo } from 'react';
import type { WorkflowStage } from '@services/workflowRoutingService';

interface VoucherStatusBadgeProps {
  status: WorkflowStage | string;
  lastActionAt?: string;
  isPending?: boolean;
  showTimestamp?: boolean;
  showElapsedTime?: boolean;
  className?: string;
}

/**
 * VoucherStatusBadge Component
 * 
 * Displays the current workflow stage of a voucher with color-coding,
 * timestamp information, and pending indicators.
 * 
 * @param status - Current workflow stage
 * @param lastActionAt - Timestamp of last action (ISO string)
 * @param isPending - Whether the voucher is pending action
 * @param showTimestamp - Whether to display the timestamp
 * @param showElapsedTime - Whether to display elapsed time
 * @param className - Additional CSS classes
 */
export default function VoucherStatusBadge({
  status,
  lastActionAt,
  isPending = false,
  showTimestamp = false,
  showElapsedTime = false,
  className = ''
}: VoucherStatusBadgeProps) {
  // Calculate elapsed time
  const elapsedTime = useMemo(() => {
    if (!lastActionAt) return null;

    const now = new Date();
    const actionDate = new Date(lastActionAt);
    const diffMs = now.getTime() - actionDate.getTime();
    
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  }, [lastActionAt]);

  // Check if voucher has been waiting too long (more than 24 hours)
  const isWaitingTooLong = useMemo(() => {
    if (!lastActionAt || !isPending) return false;

    const now = new Date();
    const actionDate = new Date(lastActionAt);
    const diffHours = (now.getTime() - actionDate.getTime()) / (1000 * 60 * 60);
    
    return diffHours > 24;
  }, [lastActionAt, isPending]);

  // Get badge styling based on status
  const getBadgeStyle = (status: string) => {
    const normalizedStatus = status.toLowerCase();

    // Pending/In-Progress stages (orange/yellow)
    if (
      normalizedStatus.includes('topre') ||
      normalizedStatus.includes('toauditor') ||
      normalizedStatus.includes('toauthorizer') ||
      normalizedStatus.includes('tokyc') ||
      normalizedStatus === 'created'
    ) {
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-200',
        icon: '⏳',
        label: 'Pending'
      };
    }

    // Completed stages (green)
    if (
      normalizedStatus.includes('audited') ||
      normalizedStatus.includes('authorized') ||
      normalizedStatus.includes('kycapproved') ||
      normalizedStatus === 'completed'
    ) {
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        icon: '✓',
        label: 'Completed'
      };
    }

    // Pre-stages (blue)
    if (
      normalizedStatus.includes('pre') &&
      !normalizedStatus.includes('topre')
    ) {
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        icon: '◐',
        label: 'In Progress'
      };
    }

    // Default (gray)
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200',
      icon: '○',
      label: 'Unknown'
    };
  };

  const badgeStyle = getBadgeStyle(status);

  // Format status for display
  const formatStatus = (status: string): string => {
    // Convert camelCase or PascalCase to readable format
    return status
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      {/* Main Badge */}
      <div
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
          border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}
          transition-all duration-200
        `}
      >
        {/* Status Icon */}
        <span className="text-sm" aria-hidden="true">
          {badgeStyle.icon}
        </span>

        {/* Status Text */}
        <span className="font-semibold">
          {formatStatus(status)}
        </span>

        {/* Pending Indicator for long-waiting vouchers */}
        {isPending && isWaitingTooLong && (
          <span
            className="inline-flex items-center justify-center w-2 h-2 bg-red-500 rounded-full animate-pulse"
            title="Waiting too long"
            aria-label="Waiting too long"
          />
        )}
      </div>

      {/* Timestamp and Elapsed Time */}
      {(showTimestamp || showElapsedTime) && lastActionAt && (
        <div className="flex items-center gap-2 text-xs text-gray-500 pl-1">
          {showTimestamp && (
            <span title={new Date(lastActionAt).toLocaleString()}>
              {formatTimestamp(lastActionAt)}
            </span>
          )}
          
          {showTimestamp && showElapsedTime && (
            <span className="text-gray-300">•</span>
          )}
          
          {showElapsedTime && (
            <span className={isWaitingTooLong ? 'text-red-600 font-medium' : ''}>
              {elapsedTime}
            </span>
          )}
        </div>
      )}

      {/* Warning for long-waiting vouchers */}
      {isPending && isWaitingTooLong && (
        <div className="flex items-center gap-1 text-xs text-red-600 pl-1">
          <svg
            className="w-3 h-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">Pending for over 24 hours</span>
        </div>
      )}
    </div>
  );
}
