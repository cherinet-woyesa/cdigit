
// features/customer/hooks/useMultiAccountSelection.ts
import { useState } from 'react';
import { type CustomerAccount } from '@services/cbeBirrService';
import { useToast } from '@context/ToastContext';

export function useMultiAccountSelection(accounts: CustomerAccount[]) {
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const { error: showError } = useToast();

    const toggleAccount = (accountNumber: string) => {
        const account = accounts.find(acc => acc.accountNumber === accountNumber);
        if (!account || account.status !== 'active') {
            showError('Only active accounts can be selected.');
            return;
        }

        setSelectedAccounts(prev => {
            const isSelected = prev.includes(accountNumber);
            if (isSelected) {
                return prev.filter(acc => acc !== accountNumber);
            } else {
                return [...prev, accountNumber];
            }
        });
    };

    const toggleAllAccounts = (selectAll: boolean) => {
        const activeAccounts = accounts
            .filter(acc => acc.status === 'active')
            .map(acc => acc.accountNumber);
        setSelectedAccounts(selectAll ? activeAccounts : []);
    };

    return {
        selectedAccounts,
        toggleAccount,
        toggleAllAccounts,
    };
}
