// features/customer/components/stoppayment/SPOForm.tsx
import React from 'react';
import Field from '@features/customer/components/Field';

interface SPOFormData {
    accountNumber: string;
    chequeNumber: string;
    amount: string;
    chequeDate: string;
    reason: string;
    accountHolderName?: string;
}

interface SPOFormProps {
    formData: SPOFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    errors: Record<string, string | undefined>;
}

export default function SPOForm({ formData, onChange, errors }: SPOFormProps) {
    return (
        <div className="space-y-6">
            <Field label="Cheque Number" required error={errors.chequeNumber}>
                <input 
                    type="text" 
                    name="chequeNumber" 
                    value={formData.chequeNumber} 
                    onChange={onChange} 
                    className="w-full p-3 rounded-lg border" 
                    placeholder="Enter cheque number"
                />
            </Field>
            <Field label="Amount" required error={errors.amount}>
                <input 
                    type="text" 
                    name="amount" 
                    value={formData.amount} 
                    onChange={onChange} 
                    className="w-full p-3 rounded-lg border" 
                    placeholder="Enter amount"
                />
            </Field>
            <Field label="Cheque Date" required error={errors.chequeDate}>
                <input 
                    type="date" 
                    name="chequeDate" 
                    value={formData.chequeDate} 
                    onChange={onChange} 
                    className="w-full p-3 rounded-lg border" 
                />
            </Field>
            <Field label="Reason" required error={errors.reason}>
                <textarea 
                    name="reason" 
                    value={formData.reason} 
                    onChange={onChange} 
                    rows={3} 
                    className="w-full p-3 rounded-lg border" 
                    placeholder="Enter reason for stop payment"
                />
            </Field>
        </div>
    );
}