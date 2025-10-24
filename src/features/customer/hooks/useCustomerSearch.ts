
// features/customer/hooks/useCustomerSearch.ts
import { useState } from 'react';
import { cbeBirrService, type CustomerInfo } from '../../../services/cbeBirrService';
import { useToast } from '../../../context/ToastContext';

export function useCustomerSearch() {
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const { error: showError } = useToast();

    const searchCustomer = async () => {
        if (!searchTerm.trim()) return;

        setIsSearching(true);
        try {
            const customer = await cbeBirrService.getCustomerInfo(searchTerm);
            if (customer) {
                setCustomerInfo(customer);
                return customer;
            } else {
                showError('Customer not found. Please check the ID or phone number.');
                return null;
            }
        } catch (error) {
            console.error('Error searching for customer:', error);
            showError('Failed to fetch customer information');
            return null;
        } finally {
            setIsSearching(false);
        }
    };

    return {
        customerInfo,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchCustomer,
    };
}
