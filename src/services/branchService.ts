// src/services/branchService.ts

export interface Branch {
  id: string;
  name: string;
  code: string;
  location?: string;
  status: string;
}

export async function fetchBranches(): Promise<Branch[]> {
  const response = await fetch('http://localhost:5268/api/branches');
  if (!response.ok) throw new Error('Failed to fetch branches');
  return response.json();
}

// New function to get a branch by its ID
export async function getBranchById(branchId: string): Promise<Branch> {
  const response = await fetch(`http://localhost:5268/api/branches/${branchId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch branch with ID ${branchId}`);
  }
  return response.json();
}