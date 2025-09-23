// This file provides type information for the config module

declare module 'config' {
  const API_BASE_URL: string;
  const APP_NAME: string;
  
  const config: {
    API_BASE_URL: string;
    APP_NAME: string;
  };
  
  export { API_BASE_URL, APP_NAME };
  export default config;
}
