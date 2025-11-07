import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@context/AuthContext';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api';

interface Account {
    accountNumber: string;
    accountHolderName: string;
    accountType?: string;
    TypeOfAccount?: string;
    phoneNumber?: string;
    name?: string;
    AccountNumber?: string;
    AccountHolderName?: string;
    Type?: string;
    isDiaspora?: boolean;
}

// Cache key generator
const getCacheKey = (phone: string) => `customerAccounts_${phone}`;

// Helper function to normalize account data
const normalizeAccount = (acc: any): Account => {
    // Log the raw account data for debugging
    console.log('Normalizing account:', acc);
    
    // Map the API response fields to our normalized format
    const normalized = {
        id: acc.id,
        accountNumber: acc.accountNumber || acc.AccountNumber || '',
        accountHolderName: acc.accountHolderName || acc.AccountHolderName || acc.name || 'Unknown',
        accountType: acc.typeOfAccount || acc.TypeOfAccount || acc.AccountType || acc.Type || 'normal',
        TypeOfAccount: acc.typeOfAccount || acc.TypeOfAccount || acc.AccountType || acc.Type || 'normal',
        phoneNumber: acc.phoneNumber || acc.PhoneNumber || '',
        // Include original data for reference
        ...acc
    };
    
    console.log('Normalized account:', normalized);
    return normalized;
};

export function useUserAccounts() {
    const { phone } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [accountDropdown, setAccountDropdown] = useState(false);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [errorAccounts, setErrorAccounts] = useState<string | null>(null);

    // Fetch accounts from the API
    const fetchAccounts = useCallback(async (phoneNumber: string): Promise<Account[]> => {
        try {
            console.log(`Fetching accounts for phone: ${phoneNumber}`);
            
            // FIXED: Use route parameter instead of query parameter
            const response = await axios.get(`${API_BASE_URL}/Accounts/by-phone/${phoneNumber}`);
            
            console.log('API Response:', response.data);
            
            // Handle the API response format
            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Failed to fetch accounts');
            }

            const responseData = response.data;
            let accountsData = [];

            if (responseData.data) {
                // Handle both array and single object responses
                accountsData = Array.isArray(responseData.data) 
                    ? responseData.data 
                    : [responseData.data];
            }

            console.log('Raw accounts data:', accountsData);
            
            if (!accountsData || accountsData.length === 0) {
                console.log('No accounts found in response');
                return [];
            }

            // Normalize the account data
            const normalized = accountsData.map(normalizeAccount);
            console.log('Normalized accounts:', normalized);
            return normalized;
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
            throw error;
        }
    }, []);

    // Load accounts when phone number changes
    useEffect(() => {
        const loadAccounts = async () => {
            if (!phone) {
                console.log('No phone number available, skipping account load');
                setLoadingAccounts(false);
                return;
            }

            console.log(`Loading accounts for phone: ${phone}`);
            setLoadingAccounts(true);
            setErrorAccounts(null);

            try {
                // Try to get from cache first
                const cacheKey = getCacheKey(phone);
                const cachedData = localStorage.getItem(cacheKey);
                
                if (cachedData) {
                    try {
                        const parsed = JSON.parse(cachedData);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            console.log('Using cached accounts:', parsed);
                            setAccounts(parsed);
                            setAccountDropdown(parsed.length > 1);
                            setLoadingAccounts(false);
                            
                            // Refresh in background
                            console.log('Refreshing accounts in background');
                            refreshAccounts(phone).catch(e => 
                                console.error('Background refresh failed:', e)
                            );
                            return;
                        }
                    } catch (e) {
                        console.warn('Failed to parse cached accounts', e);
                        localStorage.removeItem(cacheKey);
                    }
                }

                // No valid cache, fetch fresh data
                console.log('No valid cache, fetching fresh accounts');
                const freshAccounts = await fetchAccounts(phone);
                console.log('Fetched accounts:', freshAccounts);
                
                if (freshAccounts.length > 0) {
                    console.log(`Found ${freshAccounts.length} accounts`);
                    setAccounts(freshAccounts);
                    setAccountDropdown(freshAccounts.length > 1);
                    // Update cache
                    localStorage.setItem(cacheKey, JSON.stringify(freshAccounts));
                    console.log('Updated accounts state and cache');
                } else {
                    console.log('No accounts found for this phone number');
                    setAccounts([]);
                    setAccountDropdown(false);
                }
            } catch (error) {
                console.error('Failed to load accounts:', error);
                setErrorAccounts(
                    error instanceof Error 
                        ? error.message 
                        : 'An error occurred while loading accounts.'
                );
            } finally {
                setLoadingAccounts(false);
            }
        };

        loadAccounts();
    }, [phone, fetchAccounts]);

    // Refresh accounts function
    const refreshAccounts = useCallback(async (phoneNumber?: string) => {
        const targetPhone = phoneNumber || phone;
        if (!targetPhone) {
            console.error('Cannot refresh accounts: No phone number available');
            return [];
        }

        try {
            const freshAccounts = await fetchAccounts(targetPhone);
            setAccounts(freshAccounts);
            setAccountDropdown(freshAccounts.length > 1);
            
            // Update cache
            localStorage.setItem(getCacheKey(targetPhone), JSON.stringify(freshAccounts));
            return freshAccounts;
        } catch (error) {
            console.error('Failed to refresh accounts:', error);
            throw error;
        }
    }, [fetchAccounts, phone]);

    return { 
        accounts, 
        accountDropdown, 
        loadingAccounts, 
        errorAccounts, 
        refreshAccounts: () => phone ? refreshAccounts(phone) : Promise.reject('No phone number available')
    };
}