// services/accountTypeService.ts

export async function getAccountTypes() {
    const response = await fetch('/api/AccountTypes');
    if (!response.ok) throw new Error("Failed to fetch account types");
    return await response.json(); // Should be an array of { id, name }
}