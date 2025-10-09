// Fallback configuration for browser environment
export const config = {
  API_BASE_URL: window._env_?.REACT_APP_API_URL || 'http://localhost:5268',
  SIGNALR_URL: window._env_?.REACT_APP_SIGNALR_URL || 'http://localhost:5268',
  APP_ENV: window._env_?.REACT_APP_ENV || 'development',
};

export const BRAND_COLORS = {
  primary: 'fuchsia-700',
  secondary: 'fuchsia-600',
  light: 'fuchsia-50',
  dark: 'fuchsia-900',
  gradient: 'from-fuchsia-600 to-fuchsia-400',
  text: {
    primary: 'fuchsia-700',
    dark: 'fuchsia-900',
    light: 'fuchsia-100'
  }
} as const;

// Extend Window interface for TypeScript
declare global {
  interface Window {
    _env_: {
      REACT_APP_API_URL?: string;
      REACT_APP_SIGNALR_URL?: string;
      REACT_APP_ENV?: string;
    };
  }
}