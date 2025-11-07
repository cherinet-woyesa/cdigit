// hooks/useAccountSelection.ts

import { useState, useEffect } from 'react';
import { useUserAccounts } from '@features/customer/hooks/useUserAccounts';

export function useAccountSelection(storageKey: string = 'selectedAccount') {
  const { accounts, loadingAccounts, errorAccounts, refreshAccounts } = useUserAccounts();
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  useEffect(() => {
    if (loadingAccounts || !accounts?.length) return;

    const savedAccount = localStorage.getItem(storageKey);
    const account = savedAccount 
      ? accounts.find(a => a.accountNumber === savedAccount)
      : accounts[0];

    setSelectedAccount(account || null);
  }, [accounts, loadingAccounts, storageKey]);

  const selectAccount = (accountNumber: string) => {
    const account = accounts.find(a => a.accountNumber === accountNumber);
    if (account) {
      setSelectedAccount(account);
      localStorage.setItem(storageKey, accountNumber);
    }
  };

  return {
    accounts,
    loadingAccounts,
    errorAccounts,
    selectedAccount,
    selectAccount,
    refreshAccounts,
  };
}