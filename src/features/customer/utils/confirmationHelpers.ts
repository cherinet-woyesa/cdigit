import { useTranslation } from 'react-i18next';

// Common data formatting utilities
export function formatAmount(amount: number | string | undefined | null): string {
    const numAmount = Number(amount);
    return !isNaN(numAmount) 
        ? `${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`
        : '0.00 ETB';
}

export function formatQueueToken(value: string | number | undefined | null, fallback = 'N/A'): string {
    return value?.toString() || fallback;
}

export function getEntityId(data: any): string | null {
    return data?.id || data?.Id || data?.formReferenceId || data?.FormReferenceId || null;
}

// Common navigation handlers
export function useNavigationHandlers(navigate: any, formPath: string) {
    const handleNew = () => navigate(formPath, { state: { showSuccess: false } });
    const handleBackToDashboard = () => navigate('/dashboard');
    
    return { handleNew, handleBackToDashboard };
}

// Data initialization helper
export function initializeData(state: any, fallbackData: any = {}) {
    const serverData = state?.serverData?.data || state?.serverData || state?.api?.data || state?.api;
    const uiData = state?.ui || {};
    
    return {
        ...fallbackData,
        ...serverData,
        ...uiData,
        formReferenceId: serverData?.formReferenceId || serverData?.FormReferenceId || uiData.formReferenceId,
        tokenNumber: serverData?.tokenNumber || serverData?.TokenNumber || uiData.tokenNumber,
        queueNumber: serverData?.queueNumber || serverData?.QueueNumber || uiData.queueNumber,
    };
}