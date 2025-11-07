// src/services/queueService.ts

export interface QueueCount {
  count: number;
}

export async function getQueueCount(branchId: string): Promise<number> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`http://localhost:5268/api/QueueManager/countOnQueue/${branchId}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch queue count for branch ${branchId}: ${response.status} ${response.statusText}`);
    }
    
    const count = await response.json();
    return count as number;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn(`Timeout fetching queue count for branch ${branchId}`);
    } else {
      console.error('Error fetching queue count:', error);
    }
    throw error;
  }
}