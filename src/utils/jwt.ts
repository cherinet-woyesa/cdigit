import { jwtDecode } from 'jwt-decode';

export interface DecodedToken {
  unique_name?: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  role?: string | string[];
  BranchId?: string;
  nameid?: string;
  sub?: string;
  exp?: number;
  [key: string]: any;
}

export const safeJWTDecode = <T = DecodedToken>(token: string): T => {
  try {
    return jwtDecode<T>(token);
  } catch (error) {
    console.error('JWT decode error:', error);
    throw new Error('Invalid JWT token');
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
};

export const extractUserRole = (decodedPayload: DecodedToken): string => {
  const roles = decodedPayload.role || 
               decodedPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
               decodedPayload.roles ||
               decodedPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'];
  
  if (Array.isArray(roles)) {
    return roles[0] || 'Customer';
  } else if (typeof roles === 'string') {
    return roles;
  } else if (decodedPayload.roleName) {
    return decodedPayload.roleName;
  }
  
  return 'Customer';
};