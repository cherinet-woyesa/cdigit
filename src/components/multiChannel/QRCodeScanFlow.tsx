/**
 * QR Code Scan Flow Component
 * 
 * Handles the QR code scanning flow when users access via /qr-login/:branchId/:token
 * Validates QR code, creates session with branch context, and navigates to language selection.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { qrCodeValidator } from '@services/multiChannel/qrCodeValidator';
import { useMultiChannelBranch } from '@context/MultiChannelBranchContext';
import { accessMethodDetector } from '@services/multiChannel/accessMethodDetector';
import type { QRValidationResult } from '@types';
import './QRCodeScanFlow.css';

/**
 * QR Code Scan Flow Component
 */
export const QRCodeScanFlow: React.FC = () => {
  const { branchId, token } = useParams<{ branchId: string; token: string }>();
  const navigate = useNavigate();
  const { setBranchContext } = useMultiChannelBranch();
  
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [validationResult, setValidationResult] = useState<QRValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateAndSetup = async () => {
      if (!branchId || !token) {
        setError('Invalid QR code URL. Missing branch ID or token.');
        setIsValidating(false);
        return;
      }

      try {
        console.log('Validating QR code:', { branchId, token: token.substring(0, 10) + '...' });

        // Validate QR code
        const result = await qrCodeValidator.validateAndMarkUsed(branchId, token);
        setValidationResult(result);

        if (!result.isValid) {
          const errorMessage = qrCodeValidator.getErrorMessage(result);
          setError(errorMessage);
          setIsValidating(false);
          return;
        }

        // Set branch context with QR code access method
        if (result.branchContext) {
          await setBranchContext(branchId, 'qr_code');
          
          // Store session token
          sessionStorage.setItem('qr_session_token', token);
          
          // Store device info
          const deviceInfo = accessMethodDetector.getDeviceInfo();
          sessionStorage.setItem('device_info', JSON.stringify(deviceInfo));

          console.log('QR code validated successfully, navigating to language selection');

          // Navigate to language selection after a brief delay
          setTimeout(() => {
            navigate('/language-selection', { 
              replace: true,
              state: { fromQRCode: true, branchId } 
            });
          }, 1500);
        } else {
          setError('Failed to extract branch information from QR code.');
          setIsValidating(false);
        }
      } catch (err) {
        console.error('QR code validation error:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        setIsValidating(false);
      }
    };

    validateAndSetup();
  }, [branchId, token, setBranchContext, navigate]);

  /**
   * Handles retry action
   */
  const handleRetry = () => {
    window.location.reload();
  };

  /**
   * Handles go home action
   */
  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="qr-scan-flow">
        <div className="qr-scan-container">
          <div className="qr-scan-loading">
            <div className="loading-spinner"></div>
            <h2>Validating QR Code</h2>
            <p>Please wait while we verify your access...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !validationResult?.isValid) {
    return (
      <div className="qr-scan-flow">
        <div className="qr-scan-container">
          <div className="qr-scan-error">
            <div className="error-icon">❌</div>
            <h2>QR Code Invalid</h2>
            <p className="error-message">{error || 'The QR code could not be validated.'}</p>
            
            <div className="error-details">
              {validationResult?.status === 'expired' && (
                <p className="detail-text">This QR code has expired. Please scan a new one.</p>
              )}
              {validationResult?.status === 'used' && (
                <p className="detail-text">This QR code has already been used.</p>
              )}
              {validationResult?.status === 'invalid' && (
                <p className="detail-text">The QR code format is invalid or corrupted.</p>
              )}
            </div>

            <div className="error-actions">
              <button onClick={handleRetry} className="retry-button">
                Try Again
              </button>
              <button onClick={handleGoHome} className="home-button">
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state (brief display before navigation)
  return (
    <div className="qr-scan-flow">
      <div className="qr-scan-container">
        <div className="qr-scan-success">
          <div className="success-icon">✓</div>
          <h2>QR Code Verified</h2>
          <p>Redirecting to language selection...</p>
          {validationResult.branchContext && (
            <div className="branch-info">
              <p className="branch-name">{validationResult.branchContext.branchName}</p>
              <p className="branch-code">Branch Code: {validationResult.branchContext.branchCode}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanFlow;
