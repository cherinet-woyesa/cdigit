
// features/customer/components/stoppayment/SPOForm.tsx
import React from 'react';
import Field from '@features/customer/components/Field';
import { useUserAccounts } from '@features/customer/hooks/useUserAccounts';

export default function SPOForm({ formData, onChange, errors }) {
    const { accounts } = useUserAccounts();

    return (
        <div className="space-y-6">
            <Field label="Select Account" required error={errors.accountNumber}>
                <select name="accountNumber" value={formData.accountNumber} onChange={onChange} className="w-full p-3 rounded-lg border">
                    <option value="">Select an account</option>
                    {accounts.map((account) => (
                        <option key={account.accountNumber} value={account.accountNumber}>
                            {account.accountNumber} - {account.accountType}
                        </option>
                    ))}
                </select>
            </Field>
            <Field label="Cheque Number" required error={errors.chequeNumber}>
                <input type="text" name="chequeNumber" value={formData.chequeNumber} onChange={onChange} className="w-full p-3 rounded-lg border" />
            </Field>
            <Field label="Amount" required error={errors.amount}>
                <input type="text" name="amount" value={formData.amount} onChange={onChange} className="w-full p-3 rounded-lg border" />
            </Field>
            <Field label="Cheque Date" required error={errors.chequeDate}>
                <input type="date" name="chequeDate" value={formData.chequeDate} onChange={onChange} className="w-full p-3 rounded-lg border" />
            </Field>
            <Field label="Reason" required error={errors.reason}>
                <textarea name="reason" value={formData.reason} onChange={onChange} rows={3} className="w-full p-3 rounded-lg border" />
            </Field>
        </div>
    );
}
