// features/customer/utils/stopPaymentValidationSchema.ts

export const stopPaymentValidationSchema = {
    accountNumber: (value: string, formData: any) => {
        if (formData.mode === 'spo' && !value.trim()) return 'Please select an account';
    },
    chequeNumber: (value: string, formData: any) => {
        if (formData.mode === 'spo' && !value.trim()) return 'Cheque number is required';
    },
    amount: (value: string, formData: any) => {
        if (formData.mode === 'spo' && (!value || Number(value) <= 0)) return 'Please enter a valid amount greater than 0';
    },
    chequeDate: (value: string, formData: any) => {
        if (formData.mode === 'spo' && !value) return 'Cheque date is required';
    },
    reason: (value: string, formData: any) => {
        if (formData.mode === 'spo' && !value.trim()) return 'Reason is required';
    },
    selectedSpoId: (value: string, formData: any) => {
        if (formData.mode === 'rspo' && !value) return 'Please select a stop payment order to revoke';
    },
    signature: (value: string, formData: any) => {
        // Only require signature for OTP request and submission steps
        // We'll handle this validation separately in the form component
        return undefined;
    },
    termsAccepted: (value: boolean) => {
        if (!value) return 'You must accept the terms and conditions';
    },
    otpCode: (value: string) => {
        if (!value || value.length !== 6) return 'Please enter the 6-digit OTP';
    },
};