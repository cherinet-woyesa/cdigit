
// features/customer/utils/eBankingApplicationValidationSchema.ts

export const eBankingApplicationValidationSchema = {
    accountNumber: (value: string) => {
        if (!value.trim()) return 'Account number is required';
        if (value.length < 10) return 'Account number is too short';
        if (value.length > 16) return 'Account number is too long';
        if (!/^\d+$/.test(value)) return 'Account number must contain only digits';
    },
    customerName: (value: string) => {
        if (!value.trim()) return 'Customer name is required';
        if (value.length < 2) return 'Customer name is too short';
    },
    mobileNumber: (value: string) => {
        const cleanPhone = value.replace(/[^\d]/g, '');
        if (!value.trim()) return 'Mobile number is required';
        if (cleanPhone.length < 9) return 'Mobile number is too short';
        if (cleanPhone.length > 12) return 'Mobile number is too long';
        if (!/^(\+251|0)?[97]\d{8}$/.test(cleanPhone)) return 'Invalid mobile number format';
    },
    idNumber: (value: string, formData: any) => {
        if (!formData.idCopyAttached && !value.trim()) return 'ID number is required';
        if (value.trim() && value.length < 5) return 'ID number is too short';
    },
    issuingAuthority: (value: string, formData: any) => {
        if (!formData.idCopyAttached && !value.trim()) return 'Issuing authority is required';
        if (value.trim() && value.length < 2) return 'Issuing authority is too short';
    },
    idIssueDate: (value: string, formData: any) => {
        if (!formData.idCopyAttached && !value) return 'Issue date is required';
        if (value) {
            const issueDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (issueDate > today) return 'Issue date cannot be in the future';
            if (formData.idExpiryDate) {
                const expiryDate = new Date(formData.idExpiryDate);
                if (issueDate >= expiryDate) return 'Issue date must be before expiry date';
            }
        }
    },
    idExpiryDate: (value: string, formData: any) => {
        if (!formData.idCopyAttached && !value) return 'Expiry date is required';
        if (value) {
            const expiryDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (expiryDate < today) return 'Expiry date cannot be in the past';
            if (formData.idIssueDate) {
                const issueDate = new Date(formData.idIssueDate);
                if (expiryDate <= issueDate) return 'Expiry date must be after issue date';
            }
        }
    },
    region: (value: string, formData: any) => {
        if (!formData.idCopyAttached && !value.trim()) return 'Region is required';
    },
    zone: (value: string, formData: any) => {
        if (!formData.idCopyAttached && !value.trim()) return 'Zone is required';
    },
    wereda: (value: string, formData: any) => {
        if (!formData.idCopyAttached && !value.trim()) return 'Wereda is required';
    },
    houseNumber: (value: string, formData: any) => {
        if (!formData.idCopyAttached && !value.trim()) return 'House number is required';
    },
    termsAccepted: (value: boolean) => {
        if (!value) return 'You must accept the terms and conditions';
    },
    otpCode: (value: string) => {
        if (!value || value.length !== 6) return 'Please enter the 6-digit OTP';
    },
};
