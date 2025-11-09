import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TabletConfig, AdminCredentials } from '@types/multiChannelAccess';
import { accessMethodDetector } from '@services/multiChannel/accessMethodDetector';
import { fetchBranches } from '@services/branch/branchService';
import type { Branch } from '@services/branch/branchService';
import authService from '@services/auth/authService';
import logo from '@assets/logo.jpg';
import './TabletConfigScreen.css';

/**
 * Configuration status type
 */
type ConfigStatus = 'unconfigured' | 'configured' | 'locked' | 'loading';

/**
 * Tablet Configuration Screen Component
 */
export const TabletConfigScreen: React.FC = () => {
  const navigate = useNavigate();
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>({
    username: '',
    password: '',
    role: 'Manager',
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Configuration state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [deviceId, setDeviceId] = useState<string>('');
  const [configStatus, setConfigStatus] = useState<ConfigStatus>('loading');
  const [existingConfig, setExistingConfig] = useState<TabletConfig | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  /**
   * Initialize device info and check existing configuration
   */
  useEffect(() => {
    const initializeDevice = async () => {
      try {
        // Get device info
        const deviceInfo = accessMethodDetector.getDeviceInfo();
        setDeviceId(deviceInfo.deviceId);

        // Check for existing configuration
        const storedConfig = localStorage.getItem('multi_channel_tablet_config');
        if (storedConfig) {
          const config = JSON.parse(storedConfig) as TabletConfig;
          setExistingConfig(config);
          setSelectedBranchId(config.branchId);
          setConfigStatus('configured');
        } else {
          setConfigStatus('unconfigured');
        }
      } catch (error) {
        console.error('Failed to initialize device:', error);
        setConfigStatus('unconfigured');
      }
    };

    initializeDevice();
  }, []);

  /**
   * Load branches when authenticated
   */
  useEffect(() => {
    if (isAuthenticated) {
      loadBranches();
    }
  }, [isAuthenticated]);

  /**
   * Loads available branches
   */
  const loadBranches = async () => {
    try {
      const branchList = await fetchBranches();
      setBranches(branchList);
    } catch (error) {
      console.error('Failed to load branches:', error);
      setAuthError('Failed to load branches. Please try again.');
    }
  };

  /**
   * Handles admin authentication
   */
  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // Validate credentials
      if (!adminCredentials.username || !adminCredentials.password) {
        throw new Error('Please enter both username and password');
      }

      // Call backend authentication API
      const response = await authService.staffLogin({
        email: adminCredentials.username,
        password: adminCredentials.password
      });

      if (response.data?.token) {
        // Check if user has appropriate role (Manager or Admin)
        const base64Url = response.data.token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedPayload = JSON.parse(window.atob(base64));
        
        const roles = decodedPayload.role || 
                     decodedPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
                     decodedPayload.roles ||
                     decodedPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'];
      
        const userRole = Array.isArray(roles) ? roles[0] : roles;

        if (userRole !== 'Manager' && userRole !== 'Admin') {
          throw new Error('Only Manager or Admin roles can configure tablets');
        }

        // Authentication successful
        setIsAuthenticated(true);
        console.log('Admin authenticated:', adminCredentials.username);
      } else {
        throw new Error('Authentication failed. Please check your credentials.');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.Message || 
                          error.response?.data?.message || 
                          error.message || 
                          'Authentication failed';
      setAuthError(errorMessage);
      console.error('Authentication error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  /**
   * Handles configuration save
   */
  const handleSaveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      if (!selectedBranchId) {
        throw new Error('Please select a branch');
      }

      // Create configuration
      const config: TabletConfig = {
        branchId: selectedBranchId,
        deviceId,
        configuredBy: adminCredentials.username,
        configuredAt: new Date().toISOString(),
        encryptedData: '', // TODO: Implement encryption
        deviceFingerprint: accessMethodDetector.getDeviceInfo().fingerprint,
        status: 'configured',
      };

      // TODO: Save to backend API
      // For now, save to localStorage
      localStorage.setItem('multi_channel_tablet_config', JSON.stringify(config));
      localStorage.setItem('multi_channel_access_method', 'branch_tablet');

      setExistingConfig(config);
      setConfigStatus('configured');
      setSaveSuccess(true);

      console.log('Configuration saved:', config);

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles configuration removal
   */
  const handleRemoveConfiguration = () => {
    if (window.confirm('Are you sure you want to remove this tablet configuration?')) {
      localStorage.removeItem('multi_channel_tablet_config');
      localStorage.removeItem('multi_channel_access_method');
      setExistingConfig(null);
      setSelectedBranchId('');
      setConfigStatus('unconfigured');
      setSaveSuccess(false);
    }
  };

  /**
   * Handles logout
   */
  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminCredentials({ username: '', password: '', role: 'Manager' });
    setAuthError(null);
  };

  /**
   * Handles cancel
   */
  const handleCancel = () => {
    navigate('/', { replace: true });
  };

  // Loading state
  if (configStatus === 'loading') {
    return (
      <div className="tablet-config-screen">
        <div className="config-container">
          <div className="config-header">
            <div className="logo-container">
              <img src={logo} alt="CBE Logo" className="header-logo" />
            </div>
            <h1>Welcome to CBE</h1>
            <p>Commercial Bank of Ethiopia</p>
          </div>
          <div className="config-loading">
            <div className="loading-spinner"></div>
            <p>Loading configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  // Authentication form
  if (!isAuthenticated) {
    return (
      <div className="tablet-config-screen">
        <div className="config-container">
          <div className="config-header">
            <div className="logo-container">
              <img src={logo} alt="CBE Logo" className="header-logo" />
            </div>
            <h1>Welcome to CBE</h1>
            <p>Commercial Bank of Ethiopia</p>
          </div>

          <form onSubmit={handleAuthenticate} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Email</label>
              <input
                type="email"
                id="username"
                value={adminCredentials.username}
                onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
                placeholder="Enter admin email"
                disabled={isAuthenticating}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={adminCredentials.password}
                onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                placeholder="Enter admin password"
                disabled={isAuthenticating}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={adminCredentials.role}
                onChange={(e) => setAdminCredentials({ ...adminCredentials, role: e.target.value as 'Manager' | 'Admin' })}
                disabled={isAuthenticating}
              >
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {authError && (
              <div className="error-message">
                {authError}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancel}
                className="cancel-button"
                disabled={isAuthenticating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={isAuthenticating}
              >
                {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
              </button>
            </div>
          </form>

          <div className="device-info">
            <p className="device-id">Device ID: {deviceId}</p>
            <p className="config-status">
              Status: <span className={`status-badge ${configStatus}`}>{configStatus}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Configuration form
  return (
    <div className="tablet-config-screen">
      <div className="config-container">
        <div className="config-header">
          <div className="logo-container">
            <img src={logo} alt="CBE Logo" className="header-logo" />
          </div>
          <h1>Welcome to CBE</h1>
          <p>Commercial Bank of Ethiopia</p>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>

        <div className="device-info-card">
          <h3>Device Information</h3>
          <div className="info-row">
            <span className="info-label">Device ID:</span>
            <span className="info-value">{deviceId}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Status:</span>
            <span className={`status-badge ${configStatus}`}>{configStatus}</span>
          </div>
          {existingConfig && (
            <>
              <div className="info-row">
                <span className="info-label">Configured By:</span>
                <span className="info-value">{existingConfig.configuredBy}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Configured At:</span>
                <span className="info-value">
                  {new Date(existingConfig.configuredAt).toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSaveConfiguration} className="config-form">
          <div className="form-group">
            <label htmlFor="branch">Select Branch</label>
            <select
              id="branch"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={isSaving}
              required
            >
              <option value="">-- Select a branch --</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.code})
                </option>
              ))}
            </select>
          </div>

          {saveError && (
            <div className="error-message">
              {saveError}
            </div>
          )}

          {saveSuccess && (
            <div className="success-message">
              Configuration saved successfully! Redirecting...
            </div>
          )}

          <div className="form-actions">
            {existingConfig && (
              <button
                type="button"
                onClick={handleRemoveConfiguration}
                className="remove-button"
                disabled={isSaving}
              >
                Remove Configuration
              </button>
            )}
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-button"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSaving || !selectedBranchId}
            >
              {isSaving ? 'Saving...' : existingConfig ? 'Update Configuration' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TabletConfigScreen;