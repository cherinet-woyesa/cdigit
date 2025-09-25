// src/services/branchService.ts

import { getAuthToken } from '../utils/authUtils';

export interface Branch {
  id: string;
  name: string;
  code: string;
  location?: string;
  status: string;
  qrCode: string;
  isActive?: boolean;
  latitude?: number;
  longitude?: number;
  address?: string;
  phone?: string;
  workingHours?: string;
  email?: string;
  managerName?: string;
  services?: string[];
  lastUpdated?: string;
}

const API_BASE_URL = 'http://localhost:5268/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch data');
  }
  
  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json();
}

export async function fetchBranches(): Promise<Branch[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/branches`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  const result = await handleResponse<{ data: Branch[]; success: boolean }>(response);
  return result.data || [];
}

export async function getBranchById(id: string): Promise<Branch> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/branches/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  const result = await handleResponse<{ data: Branch; success: boolean }>(response);
  return result.data;
}

export async function setUserBranch(branchId: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/users/current/branch`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ branchId }),
  });
  
  await handleResponse<{ success: boolean }>(response);
}
