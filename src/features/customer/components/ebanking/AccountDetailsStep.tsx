
// features/customer/components/ebanking/AccountDetailsStep.tsx
import React from 'react';
import Field from '../Field';

export default function AccountDetailsStep({ formData, onChange, errors, onAccountChange, accounts }) {
    return (
        <div className="space-y-6">
            <Field label="Account Number" required error={errors.accountNumber}>
                <select name="accountNumber" value={formData.accountNumber} onChange={onAccountChange} className="w-full p-3 rounded-lg border">
                    <option value="">Select an account</option>
                    {accounts.map(acc => (
                        <option key={acc.accountNumber} value={acc.accountNumber}>
                            {acc.accountNumber} - {acc.accountHolderName}
                        </option>
                    ))}
                </select>
            </Field>
            <Field label="Customer Name" required error={errors.customerName}>
                <input type="text" name="customerName" value={formData.customerName} readOnly className="w-full p-3 rounded-lg border bg-gray-50" />
            </Field>
            <Field label="Mobile Number" required error={errors.mobileNumber}>
                <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={onChange} className="w-full p-3 rounded-lg border" />
            </Field>
        </div>
    );
}
