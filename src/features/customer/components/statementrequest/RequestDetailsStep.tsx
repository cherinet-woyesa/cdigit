
// features/customer/components/statementrequest/RequestDetailsStep.tsx
import React from 'react';
import Field from '../Field';

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

export default function RequestDetailsStep({ formData, onChange, errors, onAccountChange, emailProps, accounts }) {
    const { emailAddresses, handleEmailChange, addEmailField, removeEmailField } = emailProps;

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
            <Field label="Account Holder Name" required error={errors.accountHolderName}>
                <input type="text" name="accountHolderName" value={formData.accountHolderName} readOnly className="w-full p-3 rounded-lg border bg-gray-50" />
            </Field>
            <Field label="Email Address(es)" required error={errors.emailAddresses}>
                <div className="space-y-3">
                    {emailAddresses.map((email, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <input type="email" value={email} onChange={(e) => handleEmailChange(index, e.target.value)} className="w-full p-3 rounded-lg border" required={index === 0} />
                            {emailAddresses.length > 1 && (
                                <button type="button" onClick={() => removeEmailField(index)} className="p-2 text-red-500">X</button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={addEmailField} className="text-sm text-fuchsia-700">+ Add another email</button>
                </div>
            </Field>
            <Field label="Statement Frequency" required>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {FREQUENCY_OPTIONS.map((option) => (
                        <div key={option.value} className={`border rounded-lg p-3 cursor-pointer text-center ${formData.statementFrequency === option.value ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-gray-300'}`} onClick={() => onChange({ target: { name: 'statementFrequency', value: option.value } })}>
                            <label className="block cursor-pointer">
                                <span className="block text-sm font-medium">{option.label}</span>
                            </label>
                        </div>
                    ))}
                </div>
            </Field>
        </div>
    );
}
