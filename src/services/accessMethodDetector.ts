/**
 * Access Method Detector Service
 * 
 * Detects the access method (Mobile App, Branch Tablet, or QR Code)
 * and captures device information for security and audit purposes.
 */

import type { AccessMethod, DeviceType, DeviceInfo } from '../types/multiChannelAccess';
import { ACCESS_METHODS, STORAGE_KEYS } from '../constants/multiChannelAccess';
import { AccessMethodError } from '../types/multiChannelAccess';

/**
 * AccessMethodDetector Service
 * Provides methods to detect access method and capture device information
 */
class AccessMethodDetectorService {
  private cachedDeviceInfo: DeviceInfo | null = null;
  private cachedAccessMethod: AccessMethod | null = null;

  /**
   * Detects the access method based on URL, device type, and stored configuration
   * @returns The detected access method
   */
  detectAccessMethod(): AccessMethod {
    // Check if already cached
    if (this.cachedAccessMethod) {
      return this.cachedAccessMethod;
    }

    try {
      // 1. Check for QR code access via URL path
      const path = window.location.pathname;
      if (path.startsWith('/qr-login/')) {
        this.cachedAccessMethod = ACCESS_METHODS.QR_CODE;
        this.storeAccessMethod(ACCESS_METHODS.QR_CODE);
        return ACCESS_METHODS.QR_CODE;
      }

      // 2. Check for tablet configuration in local storage
      const tabletConfig = this.getTabletConfiguration();
      if (tabletConfig && this.isTabletDevice()) {
        this.cachedAccessMethod = ACCESS_METHODS.BRANCH_TABLET;
        this.storeAccessMethod(ACCESS_METHODS.BRANCH_TABLET);
        return ACCESS_METHODS.BRANCH_TABLET;
      }

      // 3. Check stored access method (from previous session)
      const storedAccessMethod = this.getStoredAccessMethod();
      if (storedAccessMethod) {
        this.cachedAccessMethod = storedAccessMethod;
        return storedAccessMethod;
      }

      // 4. Default to mobile app for all other cases
      this.cachedAccessMethod = ACCESS_METHODS.MOBILE_APP;
      this.storeAccessMethod(ACCESS_METHODS.MOBILE_APP);
      return ACCESS_METHODS.MOBILE_APP;
    } catch (error) {
      console.error('Error detecting access method:', error);
      throw new AccessMethodError(
        'Failed to detect access method',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Checks if the current device is a tablet
   * @returns True if device is a tablet
   */
  isTabletDevice(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';
    
    // Check for tablet-specific user agents
    const isTabletUA = 
      /ipad/.test(userAgent) ||
      (/android/.test(userAgent) && !/mobile/.test(userAgent)) ||
      /tablet/.test(userAgent);

    // Check screen size (tablets typically have larger screens)
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const minDimension = Math.min(screenWidth, screenHeight);
    const maxDimension = Math.max(screenWidth, screenHeight);
    
    // Tablets typically have min dimension >= 768px
    const isTabletSize = minDimension >= 768 && maxDimension >= 1024;

    // Check for tablet platform
    const isTabletPlatform = 
      /ipad/.test(platform) ||
      (/android/.test(platform) && isTabletSize);

    return isTabletUA || isTabletPlatform;
  }

  /**
   * Detects the device type (mobile, tablet, or desktop)
   * @returns The detected device type
   */
  detectDeviceType(): DeviceType {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Check for tablet first
    if (this.isTabletDevice()) {
      return 'tablet';
    }

    // Check for mobile
    const isMobile = 
      /mobile/.test(userAgent) ||
      /android/.test(userAgent) ||
      /iphone/.test(userAgent) ||
      /ipod/.test(userAgent) ||
      /blackberry/.test(userAgent) ||
      /windows phone/.test(userAgent);

    if (isMobile) {
      return 'mobile';
    }

    // Default to desktop
    return 'desktop';
  }

  /**
   * Captures comprehensive device information
   * @returns Device information object
   */
  getDeviceInfo(): DeviceInfo {
    // Return cached device info if available
    if (this.cachedDeviceInfo) {
      return this.cachedDeviceInfo;
    }

    try {
      const deviceType = this.detectDeviceType();
      const deviceId = this.getOrCreateDeviceId();
      const fingerprint = this.generateDeviceFingerprint();

      const deviceInfo: DeviceInfo = {
        deviceId,
        deviceType,
        userAgent: navigator.userAgent,
        platform: navigator.platform || 'unknown',
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        fingerprint,
      };

      // Add hardware ID for tablets
      if (deviceType === 'tablet') {
        deviceInfo.hardwareId = this.getHardwareId();
      }

      // Cache the device info
      this.cachedDeviceInfo = deviceInfo;
      this.storeDeviceInfo(deviceInfo);

      return deviceInfo;
    } catch (error) {
      console.error('Error getting device info:', error);
      throw new AccessMethodError(
        'Failed to capture device information',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Generates a unique device fingerprint
   * @returns Device fingerprint string
   */
  private generateDeviceFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.platform,
      navigator.language,
      window.screen.width,
      window.screen.height,
      window.screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      navigator.maxTouchPoints || 0,
    ];

    // Create a simple hash from components
    const fingerprintString = components.join('|');
    return this.simpleHash(fingerprintString);
  }

  /**
   * Simple hash function for fingerprinting
   * @param str String to hash
   * @returns Hash string
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Gets or creates a unique device ID
   * @returns Device ID string
   */
  private getOrCreateDeviceId(): string {
    const storedDeviceId = localStorage.getItem('device_id');
    
    if (storedDeviceId) {
      return storedDeviceId;
    }

    // Generate new device ID using crypto API if available
    let deviceId: string;
    
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      deviceId = crypto.randomUUID();
    } else {
      // Fallback to timestamp-based ID
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }

    localStorage.setItem('device_id', deviceId);
    return deviceId;
  }

  /**
   * Gets hardware ID for tablet devices
   * @returns Hardware ID or undefined
   */
  private getHardwareId(): string | undefined {
    // Try to get hardware ID from various sources
    // Note: This is limited in browsers due to privacy restrictions
    
    // Check for stored hardware ID
    const storedHardwareId = localStorage.getItem('hardware_id');
    if (storedHardwareId) {
      return storedHardwareId;
    }

    // Generate a pseudo-hardware ID based on device characteristics
    const hardwareComponents = [
      navigator.hardwareConcurrency || 0,
      navigator.maxTouchPoints || 0,
      window.screen.width,
      window.screen.height,
      window.screen.colorDepth,
      navigator.platform,
    ];

    const hardwareId = this.simpleHash(hardwareComponents.join('|'));
    localStorage.setItem('hardware_id', hardwareId);
    
    return hardwareId;
  }

  /**
   * Gets tablet configuration from local storage
   * @returns Tablet configuration or null
   */
  private getTabletConfiguration(): any {
    try {
      const configData = localStorage.getItem(STORAGE_KEYS.TABLET_CONFIG);
      return configData ? JSON.parse(configData) : null;
    } catch (error) {
      console.error('Error reading tablet configuration:', error);
      return null;
    }
  }

  /**
   * Gets stored access method from local storage
   * @returns Stored access method or null
   */
  private getStoredAccessMethod(): AccessMethod | null {
    try {
      const storedMethod = localStorage.getItem(STORAGE_KEYS.ACCESS_METHOD);
      if (storedMethod && this.isValidAccessMethod(storedMethod)) {
        return storedMethod as AccessMethod;
      }
      return null;
    } catch (error) {
      console.error('Error reading stored access method:', error);
      return null;
    }
  }

  /**
   * Validates if a string is a valid access method
   * @param method String to validate
   * @returns True if valid access method
   */
  private isValidAccessMethod(method: string): boolean {
    return Object.values(ACCESS_METHODS).includes(method as AccessMethod);
  }

  /**
   * Stores access method in local storage
   * @param method Access method to store
   */
  private storeAccessMethod(method: AccessMethod): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCESS_METHOD, method);
    } catch (error) {
      console.error('Error storing access method:', error);
    }
  }

  /**
   * Stores device info in local storage
   * @param deviceInfo Device information to store
   */
  private storeDeviceInfo(deviceInfo: DeviceInfo): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DEVICE_INFO, JSON.stringify(deviceInfo));
    } catch (error) {
      console.error('Error storing device info:', error);
    }
  }

  /**
   * Gets stored device info from local storage
   * @returns Stored device info or null
   */
  getStoredDeviceInfo(): DeviceInfo | null {
    try {
      const storedInfo = localStorage.getItem(STORAGE_KEYS.DEVICE_INFO);
      return storedInfo ? JSON.parse(storedInfo) : null;
    } catch (error) {
      console.error('Error reading stored device info:', error);
      return null;
    }
  }

  /**
   * Clears cached access method and device info
   * Useful when switching access methods or logging out
   */
  clearCache(): void {
    this.cachedAccessMethod = null;
    this.cachedDeviceInfo = null;
  }

  /**
   * Clears all stored access method data
   * Useful for testing or resetting the application
   */
  clearStoredData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_METHOD);
      localStorage.removeItem(STORAGE_KEYS.DEVICE_INFO);
      this.clearCache();
    } catch (error) {
      console.error('Error clearing stored data:', error);
    }
  }
}

// Export singleton instance
export const accessMethodDetector = new AccessMethodDetectorService();
