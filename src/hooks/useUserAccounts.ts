import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:5268/api';

interface Account {
    accountNumber: string;
    accountHolderName: string;
    name?: string; // For cases where accountHolderName might be 'name'
    TypeOfAccount?: string; // For cases where typeOfAccount might be 'TypeOfAccount'
    typeOfAccount?: string;
}

export function useUserAccounts() {
    const { phone } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [accountDropdown, setAccountDropdown] = useState(false);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [errorAccounts, setErrorAccounts] = useState<string | null>(null);

    useEffect(() => {
        const fetchAccounts = async () => {
            setLoadingAccounts(true);
            setErrorAccounts(null);
            try {
                const cached = localStorage.getItem('customerAccounts');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const mappedAccounts = parsed.map((acc: any) => ({
                            ...acc,
                            accountNumber: acc.accountNumber || acc.AccountNumber,
                            accountHolderName: acc.accountHolderName || acc.AccountHolderName || acc.name,
                            typeOfAccount: acc.typeOfAccount || acc.TypeOfAccount
                        }));
                        setAccounts(mappedAccounts);
                        setAccountDropdown(mappedAccounts.length > 1);
                        setLoadingAccounts(false);
                        return;
                    }
                }

                if (phone) {
                    const resp = await fetch(`${API_BASE_URL}/Accounts/by-phone/${phone}`);
                    if (resp.ok) {
                        const payload = await resp.json();
                        const data = payload.data ?? payload;
                        const mappedAccounts = (data || []).map((acc: any) => ({
                            ...acc,
                            accountNumber: acc.accountNumber || acc.AccountNumber,
                            accountHolderName: acc.accountHolderName || acc.AccountHolderName || acc.name,
                            typeOfAccount: acc.typeOfAccount || acc.TypeOfAccount
                        }));
                        setAccounts(mappedAccounts);
                        setAccountDropdown(mappedAccounts.length > 1);
                        localStorage.setItem('customerAccounts', JSON.stringify(mappedAccounts));
                    } else {
                        setErrorAccounts(`Failed to fetch accounts: ${resp.statusText}`);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch accounts", err);
                setErrorAccounts("An error occurred while fetching accounts.");
            } finally {
                setLoadingAccounts(false);
            }
        };
        fetchAccounts();
    }, [phone]);

    return { accounts, accountDropdown, loadingAccounts, errorAccounts };
}
