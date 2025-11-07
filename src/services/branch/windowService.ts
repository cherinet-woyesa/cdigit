// src/services/windowService.ts

export type Window = {
  id: string;
  branchId: string;
  windowNumber: number;
  description: string;
  windowType: string;
  status: string;
};

export async function fetchWindowsByBranch(branchId: string): Promise<Window[]> {
  const response = await fetch(`http://localhost:5268/api/window/bybranch/${branchId}`);
  if (!response.ok) throw new Error('Failed to fetch windows');
  return response.json();
}
