
// features/customer/utils/rtgsTransferValidationSchema.ts

export const rtgsTransferValidationSchema = {
    orderingAccountNumber: (value: string) => {
        if (!value.trim()) return 'Account number is required';
    },
    orderingCustomerName: (value: string) => {
        if (!value.trim()) return 'Customer name is required';
    },
    beneficiaryBank: (value: string) => {
        if (!value.trim()) return 'Beneficiary bank is required';
    },
    beneficiaryBranch: (value: string) => {
        if (!value.trim()) return 'Beneficiary branch is required';
    },
    beneficiaryAccountNumber: (value: string) => {
        if (!value.trim()) return 'Beneficiary account is required';
    },
    beneficiaryName: (value: string) => {
        if (!value.trim()) return 'Beneficiary name is required';
    },
    transferAmount: (value: string) => {
        if (!value || Number(value) <= 0) return 'Please enter a valid amount greater than 0';
    },
    paymentNarrative: (value: string) => {
        if (!value.trim()) return 'Payment narrative is required';
        if (value.length < 10 || value.length > 200) return 'Narrative must be 10-200 characters';
    },
    digitalSignature: (value: string) => {
        if (!value) return 'Digital signature is required';
    },
    otpCode: (value: string) => {
        if (!value || value.length !== 6) return 'Please enter the 6-digit OTP';
    },
};
