import axios from 'axios';
import { getAuthToken, removeAuthToken } from '../utils/authUtils';

export const api = axios.create({
  // Individual services set baseURL; interceptors here add headers/handling
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Token invalid/expired. Clear and redirect to OTP.
      removeAuthToken();
      try {
        const url = new URL(window.location.href);
        if (!url.pathname.startsWith('/otp-login')) {
          window.location.assign('/otp-login');
        }
      } catch {}
    }
    return Promise.reject(error);
  }
);

export default api;











