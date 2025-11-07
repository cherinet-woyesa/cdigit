
// features/customer/hooks/useSPOSearch.ts
import { useState } from 'react';
import stopPaymentService, { type StopPaymentOrderResponseDto } from '@services/transactions/stopPaymentService';
import { useToast } from '@context/ToastContext';

export function useSPOSearch() {
    const [searchResults, setSearchResults] = useState<StopPaymentOrderResponseDto[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const { error: showError } = useToast();

    const searchSPOs = async (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await stopPaymentService.searchStopPaymentOrders({ 
                accountNumber: searchTerm,
                chequeNumber: searchTerm,
            });
            if (response.success && response.data) {
                const activeSpos = response.data.filter(spo => spo.status === 'Approved' && !spo.isRevoked);
                setSearchResults(activeSpos);
            } else {
                showError(response.error || 'Failed to search Stop Payment Orders');
            }
        } catch (error: any) {
            showError(error.message || 'Failed to search Stop Payment Orders');
        } finally {
            setIsSearching(false);
        }
    };

    return {
        searchResults,
        isSearching,
        searchSPOs,
    };
}
