// features/customer/components/statementrequest/RequestDetailsStep.tsx
import React from 'react';
import Field from '@features/customer/components/Field';
import { AccountSelector } from '@features/customer/components/AccountSelector';

interface FormData {
    accountNumber: string;
    accountHolderName: string;
    emailAddresses: string[];
    statementFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

interface RequestDetailsStepProps {
    formData: FormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    errors: Record<string, string | undefined>;
    onAccountChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    emailProps: {
        emailAddresses: string[];
        handleEmailChange: (index: number, value: string) => void;
        addEmailField: () => void;
        removeEmailField: (index: number) => void;
    };
    accounts: any[];
    onAccountValidation: (account: any | null) => void;
    validatedAccount: any | null;
}

export default function RequestDetailsStep({ 
    formData, 
    onChange, 
    errors, 
    onAccountChange, 
    accounts, 
    onAccountValidation, 
    validatedAccount 
}: RequestDetailsStepProps) {
    return (
        <div className="space-y-6">
            <Field label="Account Number" required error={errors.accountNumber}>
                <AccountSelector
                    accounts={[]} // Pass empty array to disable dropdown
                    selectedAccount={formData.accountNumber}
                    onAccountChange={(accountNumber, accountHolderName) => {
                        onAccountChange({ target: { name: 'accountNumber', value: accountNumber } } as React.ChangeEvent<HTMLInputElement>);
                        onChange({ target: { name: 'accountHolderName', value: accountHolderName || '' } } as React.ChangeEvent<HTMLInputElement>);
                    }}
                    onAccountValidation={onAccountValidation}
                    error={errors.accountNumber}
                    allowManualEntry={true}
                />
            </Field>
            
            {validatedAccount && (
                <Field label="Account Holder Name" required error={errors.accountHolderName}>
                    <input 
                        type="text" 
                        name="accountHolderName" 
                        value={formData.accountHolderName} 
                        readOnly 
                        className="w-full p-3 rounded-lg border bg-gray-50" 
                    />
                </Field>
            )}
        </div>
    );
}