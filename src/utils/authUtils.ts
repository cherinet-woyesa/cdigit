// Utility functions for authentication

export const getAuthToken = (): string | null => {
  // Prefer the key used by AuthContext
  return localStorage.getItem('token') || localStorage.getItem('userToken');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token);
  localStorage.setItem('userToken', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('userToken');
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const getCurrentUser = () => {
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.nameid,
      email: payload.email,
      role: payload.role,
      branchId: payload.branchId,
    };
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};
