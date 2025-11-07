
// features/customer/hooks/useStopPaymentForm.ts
import { useState } from 'react';
import { type StopPaymentOrderResponseDto } from '@services/transactions/stopPaymentService';

export type SPOFormMode = 'spo' | 'rspo';

export interface SPOFormData {
    mode: SPOFormMode;
    accountNumber: string;
    chequeNumber: string;
    amount: string;
    chequeDate: string;
    reason: string;
    searchTerm: string;
    selectedSpoId: string;
    signature: string;
    otpCode: string;
    termsAccepted: boolean;
}

export function useStopPaymentForm() {
    const [formData, setFormData] = useState<SPOFormData>({
        mode: 'spo',
        accountNumber: '',
        chequeNumber: '',
        amount: '',
        chequeDate: '',
        reason: '',
        searchTerm: '',
        selectedSpoId: '',
        signature: '',
        otpCode: '',
        termsAccepted: false,
    });
    const [selectedSpo, setSelectedSpo] = useState<StopPaymentOrderResponseDto | null>(null);

    const toggleMode = (newMode: SPOFormMode) => {
        setFormData(prev => ({
            ...prev,
            mode: newMode,
            searchTerm: '',
            selectedSpoId: '',
            signature: '',
            otpCode: '',
            termsAccepted: false,
        }));
        setSelectedSpo(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSpoSelection = (spo: StopPaymentOrderResponseDto) => {
        setSelectedSpo(spo);
        setFormData(prev => ({ ...prev, selectedSpoId: spo.id }));
    };

    return {
        formData,
        setFormData,
        selectedSpo,
        toggleMode,
        handleFormChange,
        handleSpoSelection,
    };
}
