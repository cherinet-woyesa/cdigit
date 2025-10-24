
// features/customer/utils/posRequestValidationSchema.ts

export const posRequestValidationSchema = {
    accountNumber: (value: string) => {
        if (!value.trim()) return 'Please select an account';
    },
    businessName: (value: string) => {
        if (!value.trim()) return 'Business name is required';
    },
    businessType: (value: string) => {
        if (!value.trim()) return 'Business type is required';
    },
    contactPerson: (value: string) => {
        if (!value.trim()) return 'Contact person is required';
    },
    phoneNumber: (value: string) => {
        if (!value.trim()) return 'Phone number is required';
    },
    email: (value: string) => {
        if (!value.trim()) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Please enter a valid email address';
    },
    region: (value: string) => {
        if (!value.trim()) return 'Region is required';
    },
    zone: (value: string) => {
        if (!value.trim()) return 'Zone is required';
    },
    wereda: (value: string) => {
        if (!value.trim()) return 'Wereda is required';
    },
    houseNumber: (value: string) => {
        if (!value.trim()) return 'House number is required';
    },
    termsAccepted: (value: boolean) => {
        if (!value) return 'You must accept the terms and conditions';
    },
    otpCode: (value: string) => {
        if (!value || value.length !== 6) return 'Please enter the 6-digit OTP';
    },
};
