/**
 * QR Code Display Component
 * 
 * Displays QR code for branch access with auto-refresh every 5 minutes,
 * expiration countdown timer, and branch information.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { QRCodeData } from '../types/multiChannelAccess';
import { qrCodeGenerator } from '../services/qrCodeGenerator';
import { QR_CODE_REFRESH_INTERVAL } from '../constants/multiChannelAccess';
import './QRCodeDisplay.css';

/**
 * QR Code Display Props
 */
interface QRCodeDisplayProps {
  branchId: string;
  branchName: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onRefresh?: (qrCodeData: QRCodeData) => void;
  onExpire?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

/**
 * QR Code Display Component
 */
export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  branchId,
  branchName,
  autoRefresh = true,
  refreshInterval = QR_CODE_REFRESH_INTERVAL,
  onRefresh,
  onExpire,
  onError,
  className = '',
}) => {
  const [qrCodeData, setQRCodeData] = useState<QRCodeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  /**
   * Generates QR code
   */
  const generateQRCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await qrCodeGenerator.generateQRCode(branchId);
      setQRCodeData(data);
      setIsExpired(false);
      
      if (onRefresh) {
        onRefresh(data);
      }

      console.log('QR code generated:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate QR code';
      setError(errorMessage);
      console.error('QR code generation error:', err);
      
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [branchId, onRefresh, onError]);

  /**
   * Refreshes QR code
   */
  const refreshQRCode = useCallback(async () => {
    console.log('Refreshing QR code...');
    await generateQRCode();
  }, [generateQRCode]);

  /**
   * Updates remaining time
   */
  const updateRemainingTime = useCallback(() => {
    if (!qrCodeData) {
      return;
    }

    const remaining = qrCodeGenerator.getRemainingTime(qrCodeData);
    setRemainingTime(remaining);

    if (remaining <= 0 && !isExpired) {
      setIsExpired(true);
      if (onExpire) {
        onExpire();
      }
    }
  }, [qrCodeData, isExpired, onExpire]);

  // Generate QR code on mount
  useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  // Update remaining time every second
  useEffect(() => {
    if (!qrCodeData) {
      return;
    }

    const interval = setInterval(updateRemainingTime, 1000);
    return () => clearInterval(interval);
  }, [qrCodeData, updateRemainingTime]);

  // Auto-refresh QR code
  useEffect(() => {
    if (!autoRefresh || !qrCodeData) {
      return;
    }

    const interval = setInterval(refreshQRCode, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, qrCodeData, refreshQRCode]);

  /**
   * Formats remaining time as MM:SS
   */
  const formatRemainingTime = (): string => {
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Gets progress percentage
   */
  const getProgressPercentage = (): number => {
    if (!qrCodeData) {
      return 0;
    }

    const totalTime = new Date(qrCodeData.expiresAt).getTime() - new Date(qrCodeData.timestamp).getTime();
    return (remainingTime / totalTime) * 100;
  };

  /**
   * Gets status color based on remaining time
   */
  const getStatusColor = (): string => {
    const percentage = getProgressPercentage();
    
    if (percentage > 50) {
      return '#10B981'; // Green
    } else if (percentage > 20) {
      return '#F59E0B'; // Orange
    } else {
      return '#EF4444'; // Red
    }
  };

  if (isLoading && !qrCodeData) {
    return (
      <div className={`qr-code-display ${className}`}>
        <div className="qr-code-loading">
          <div className="loading-spinner"></div>
          <p>Generating QR Code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`qr-code-display ${className}`}>
        <div className="qr-code-error">
          <div className="error-icon">⚠️</div>
          <p className="error-message">{error}</p>
          <button onClick={refreshQRCode} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!qrCodeData) {
    return null;
  }

  return (
    <div className={`qr-code-display ${className} ${isExpired ? 'expired' : ''}`}>
      <div className="qr-code-header">
        <h2 className="qr-code-title">Scan to Access</h2>
        <p className="qr-code-branch">{branchName}</p>
      </div>

      <div className="qr-code-container">
        {qrCodeData.qrCodeImage ? (
          <img
            src={`data:image/png;base64,${qrCodeData.qrCodeImage}`}
            alt="QR Code"
            className="qr-code-image"
          />
        ) : (
          <div className="qr-code-placeholder">
            <p>QR Code</p>
          </div>
        )}

        {isExpired && (
          <div className="qr-code-overlay">
            <div className="expired-message">
              <span className="expired-icon">⏱️</span>
              <p>QR Code Expired</p>
              <button onClick={refreshQRCode} className="refresh-button">
                Generate New Code
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="qr-code-footer">
        <div className="timer-container">
          <div className="timer-label">Expires in:</div>
          <div className="timer-value" style={{ color: getStatusColor() }}>
            {formatRemainingTime()}
          </div>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${getProgressPercentage()}%`,
              backgroundColor: getStatusColor(),
            }}
          />
        </div>

        <button
          onClick={refreshQRCode}
          className="manual-refresh-button"
          disabled={isLoading}
        >
          🔄 Refresh Code
        </button>
      </div>

      <div className="qr-code-instructions">
        <p>1. Open the banking app on your mobile device</p>
        <p>2. Scan this QR code with your camera</p>
        <p>3. Follow the prompts to access services</p>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
