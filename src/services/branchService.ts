// src/services/branchService.ts

export interface Branch {
  id: string;
  name: string;
  code: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  isActive?: boolean;
  // Added missing fields that might be in the backend response
  address?: string;
  phone?: string;
  workingHours?: string;
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
  console.log('Raw branches response:', result);
  
  // Handle different response structures
  if (Array.isArray(result)) {
    // If response is directly an array
    console.log('Branches response: Array format', result);
    return result.map(mapBranchData);
  } else if (result && Array.isArray(result.data)) {
    // If response has a data property that is an array
    console.log('Branches response: Data array format', result.data);
    return result.data.map(mapBranchData);
  } else if (result && result.data && typeof result.data === 'object') {
    // If response.data is an object, convert to array
    console.log('Branches response: Object format', Object.values(result.data));
    return Object.values(result.data).map(mapBranchData);
  } else {
    console.error('Unexpected branches response structure:', result);
    throw new Error('Invalid branches response format');
  }
}

// Helper function to map backend branch data to frontend Branch interface
function mapBranchData(branch: any): Branch {
  return {
    id: branch.id || branch.Id,
    name: branch.name || branch.Name,
    code: branch.code || branch.Code,
    location: branch.location || branch.Location,
    latitude: branch.latitude !== undefined ? branch.latitude : branch.Latitude,
    longitude: branch.longitude !== undefined ? branch.longitude : branch.Longitude,
    status: branch.status || branch.Status || 'Active',
    isActive: branch.isActive !== undefined ? branch.isActive : branch.IsActive,
    address: branch.address || branch.Address || branch.location || branch.Location,
    phone: branch.phone || branch.Phone,
    workingHours: branch.workingHours || branch.WorkingHours
  };
}

// New function to get a branch by its ID
export async function getBranchById(branchId: string): Promise<Branch> {
  const response = await fetch(`http://localhost:5268/api/branches/${branchId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch branch with ID ${branchId}`);
  }
  
  const result = await response.json();
  console.log('Raw branch response:', result);
  
  // Handle different response structures
  let branchData: any;
  if (result && result.data) {
    branchData = result.data; // If wrapped in data property
  } else if (result && result.id) {
    branchData = result; // If directly the branch object
  } else {
    console.error('Unexpected branch response structure:', result);
    throw new Error('Invalid branch response format');
  }
  
  return mapBranchData(branchData);
}