
// features/customer/utils/cbeBirrLinkValidationSchema.ts

export const cbeBirrLinkValidationSchema = {
    actionType: (value: string) => {
        if (!value) return 'Action type is required';
    },
    idNumber: (value: string) => {
        if (!value.trim()) return 'ID number is required';
    },
    idType: (value: string) => {
        if (!value.trim()) return 'ID type is required';
    },
    idIssueDate: (value: string) => {
        if (!value.trim()) return 'ID issue date is required';
    },
    newPhoneNumber: (value: string, formData: any) => {
        if (formData.actionType === 'change_phone' && !value?.trim()) {
            return 'New phone number is required';
        }
        if (value && !/^\+251[0-9]{9}$/.test(value)) {
            return 'Phone number must be in the format +251XXXXXXXXX';
        }
    },
    newEndDate: (value: string, formData: any) => {
        if (formData.actionType === 'modify_end_date' && !value?.trim()) {
            return 'New end date is required';
        }
    },
    selectedAccounts: (value: string[], formData: any) => {
        if (formData.actionType === 'link' && value.length === 0) {
            return 'Please select at least one account to link';
        }
    },
    termsAccepted: (value: boolean) => {
        if (!value) return 'You must accept the terms and conditions';
    },
};
