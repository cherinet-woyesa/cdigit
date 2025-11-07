// src/services/branchService.ts

export interface Branch {
  id: string;
  name: string;
  code: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  phone?: string;
  workingHours?: string;
  status: string;
  isActive?: boolean;
}

// Common API response structure
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function fetchBranches(): Promise<Branch[]> {
  const response = await fetch('http://localhost:5268/api/branches');
  if (!response.ok) throw new Error('Failed to fetch branches');
  
  const result = await response.json();
  
  // Handle different response structures
  if (Array.isArray(result)) {
    // If response is directly an array
    console.log('Branches response: Array format', result);
    return result;
  } else if (result && Array.isArray(result.data)) {
    // If response has a data property that is an array
    console.log('Branches response: Data array format', result.data);
    return result.data;
  } else if (result && result.data && typeof result.data === 'object') {
    // If response.data is an object, convert to array
    console.log('Branches response: Object format', Object.values(result.data));
    return Object.values(result.data);
  } else {
    console.error('Unexpected branches response structure:', result);
    throw new Error('Invalid branches response format');
  }
}

// New function to get a branch by its ID
export async function getBranchById(branchId: string): Promise<Branch> {
  const response = await fetch(`http://localhost:5268/api/branches/${branchId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch branch with ID ${branchId}`);
  }
  
  const result = await response.json();
  
  // Handle different response structures
  if (result && result.data) {
    return result.data; // If wrapped in data property
  } else if (result && result.id) {
    return result; // If directly the branch object
  } else {
    console.error('Unexpected branch response structure:', result);
    throw new Error('Invalid branch response format');
  }
}