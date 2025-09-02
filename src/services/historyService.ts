import axios from "axios";

// Base URL for your backend API
const API_BASE_URL = "http://localhost:5268/api"; // Adjust port if needed

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Define a more flexible Transaction type based on common fields
export type Transaction = {
    id: string; // Unique ID for the transaction
    type: 'Deposit' | 'Withdrawal' | 'Transfer';
    amount: number;
    date: string; // ISO date string
    status: string; // e.g., 'Completed', 'Pending', 'Failed'
    description: string; // A brief description
    // Add other common fields if they exist across all transaction types
    // e.g., accountNumber?: string;
    //       referenceId?: string;
};

// Helper to normalize backend responses to the common Transaction type
const normalizeTransaction = (item: any, type: Transaction['type']): Transaction => {
    // These are assumptions based on common API patterns and previous DTOs
    // You might need to adjust these property names based on your actual backend responses
    const id = item.id?.toString() || item.Id?.toString() || Math.random().toString(36).substring(7);
    const amount = item.amount || item.Amount || item.withdrawal_Amount || item.transferAmount || 0;
    const date = item.date || item.Date || item.transactionDate || new Date().toISOString();
    const status = item.status || item.Status || 'Completed'; // Default to Completed if not provided
    let description = item.description || item.Description || '';

    if (type === 'Deposit') {
        description = `Deposit to ${item.accountNumber || item.AccountNumber || 'N/A'}`;
    } else if (type === 'Withdrawal') {
        description = `Withdrawal from ${item.accountNumber || item.AccountNumber || 'N/A'}`;
    } else if (type === 'Transfer') {
        description = `Transfer from ${item.debitAccountNumber || 'N/A'} to ${item.creditAccountNumber || 'N/A'}`;
    }

    return {
        id,
        type,
        amount: Number(amount),
        date,
        status,
        description,
    };
};

/**
 * Fetches withdrawal history for a given phone number.
 * @param phoneNumber The user's phone number.
 * @returns A promise that resolves to a list of withdrawal transactions.
 */
export const getWithdrawalHistoryByPhone = async (phoneNumber: string): Promise<Transaction[]> => {
    try {
        const response = await api.get(`/withdrawal/byPhoneNumber/${encodeURIComponent(phoneNumber)}`);
        // Assuming backend returns { success: true, data: [...] }
        const rawData = response.data.data || response.data;
        return (rawData || []).map((item: any) => normalizeTransaction(item, 'Withdrawal'));
    } catch (error) {
        console.error("Error fetching withdrawal history:", error);
        return [];
    }
};

/**
 * Fetches deposit history for a given phone number.
 * @param phoneNumber The user's phone number.
 * @returns A promise that resolves to a list of deposit transactions.
 */
export const getDepositHistoryByPhone = async (phoneNumber: string): Promise<Transaction[]> => {
    try {
        const response = await api.get(`/Deposits/byPhoneNumber/${encodeURIComponent(phoneNumber)}`);
        const rawData = response.data.data || response.data;
        return (rawData || []).map((item: any) => normalizeTransaction(item, 'Deposit'));
    } catch (error) {
        console.error("Error fetching deposit history:", error);
        return [];
    }
};

/**
 * Fetches fund transfer history for a given phone number.
 * @param phoneNumber The user's phone number.
 * @returns A promise that resolves to a list of fund transfer transactions.
 */
export const getFundTransferHistoryByPhone = async (phoneNumber: string): Promise<Transaction[]> => {
    try {
        const response = await api.get(`/FundTransfer/byPhoneNumber/${encodeURIComponent(phoneNumber)}`);
        const rawData = response.data.data || response.data;
        return (rawData || []).map((item: any) => normalizeTransaction(item, 'Transfer'));
    } catch (error) {
        console.error("Error fetching fund transfer history:", error);
        return [];
    }
};