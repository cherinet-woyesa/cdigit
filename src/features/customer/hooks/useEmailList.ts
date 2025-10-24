
// features/customer/hooks/useEmailList.ts
import { useState } from 'react';

export function useEmailList(initialEmails: string[] = ['']) {
    const [emailAddresses, setEmailAddresses] = useState<string[]>(initialEmails);

    const handleEmailChange = (index: number, value: string) => {
        const newEmails = [...emailAddresses];
        newEmails[index] = value;
        setEmailAddresses(newEmails);
    };

    const addEmailField = () => {
        setEmailAddresses(prev => [...prev, '']);
    };

    const removeEmailField = (index: number) => {
        if (emailAddresses.length <= 1) return;
        const newEmails = emailAddresses.filter((_, i) => i !== index);
        setEmailAddresses(newEmails);
    };

    return {
        emailAddresses,
        handleEmailChange,
        addEmailField,
        removeEmailField,
    };
}
