import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { accessMethodDetector } from './services/accessMethodDetector';
import { useMultiChannelBranch } from './context/MultiChannelBranchContext';
import type { AccessMethod } from './types/multiChannelAccess';

const Entrypoint = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateAccessMethod } = useMultiChannelBranch();
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    const detectAndRoute = async () => {
      try {
        // Detect access method
        const accessMethod: AccessMethod = accessMethodDetector.detectAccessMethod();
        console.log('Access method detected:', accessMethod);

        // Store access method in context
        updateAccessMethod(accessMethod);

        // Route based on access method
        switch (accessMethod) {
          case 'qr_code':
            // QR code access - URL should already be /qr-login/:branchId/:token
            // If not, something went wrong
            if (!location.pathname.startsWith('/qr-login/')) {
              console.warn('QR code access detected but not on QR login path');
              navigate('/language-selection');
            }
            // Otherwise, let the QRCodeScanFlow component handle it
            break;

          case 'branch_tablet':
            // Tablet access - check if configured
            const tabletConfig = localStorage.getItem('multi_channel_tablet_config');
            if (tabletConfig) {
              // Configured tablet - go to language selection
              navigate('/language-selection');
            } else {
              // Unconfigured tablet - go to configuration
              navigate('/tablet-config');
            }
            break;

          case 'mobile_app':
          default:
            // Mobile app access - standard flow
            navigate('/language-selection');
            break;
        }
      } catch (error) {
        console.error('Error detecting access method:', error);
        // Default to mobile app flow on error
        navigate('/language-selection');
      } finally {
        setIsDetecting(false);
      }
    };

    detectAndRoute();
  }, [navigate, location, updateAccessMethod]);

  // Show loading state while detecting
  if (isDetecting) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div style={{
          textAlign: 'center',
          color: '#ffffff',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: '#ffffff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Render nothing after routing
  return null;
};

export default Entrypoint;
