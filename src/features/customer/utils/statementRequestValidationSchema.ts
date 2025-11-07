// features/customer/utils/statementRequestValidationSchema.ts

const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const statementRequestValidationSchema = {
    accountNumber: (value: string) => {
        if (!value.trim()) return 'Please enter an account number';
    },
    accountHolderName: (value: string) => {
        if (!value.trim()) return 'Account holder name is required';
    },
    emailAddresses: (value: string[]) => {
        const emails = value.filter(email => email.trim() !== '');
        if (emails.length === 0) {
            return 'At least one email address is required';
        }
        const invalidEmails = emails.filter(email => !validateEmail(email));
        if (invalidEmails.length > 0) {
            return `Invalid email format: ${invalidEmails.join(', ')}`;
        }
    },
    signature: (value: string) => {
        if (!value) return 'Signature is required';
    },
    otp: (value: string) => {
        if (!value || value.length !== 6) return 'Please enter the 6-digit OTP';
    },
};