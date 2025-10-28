// features/customer/components/ebanking/IDDetailsStep.tsx
import React from 'react';
import Field from '../Field';

export default function IDDetailsStep({ formData, onChange, errors }) {
    return (
        <div className="space-y-6">
            <Field label="ID Type" required>
                <select name="idType" value={formData.idType} onChange={onChange} className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200">
                    <option value="national_id">National ID</option>
                    <option value="passport">Passport</option>
                    <option value="driving_license">Driving License</option>
                </select>
            </Field>
            <Field label="ID Number" required error={errors.idNumber}>
                <input type="text" name="idNumber" value={formData.idNumber} onChange={onChange} className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200" />
            </Field>
            <Field label="Issuing Authority" required error={errors.issuingAuthority}>
                <input type="text" name="issuingAuthority" value={formData.issuingAuthority} onChange={onChange} className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200" />
            </Field>
            <Field label="Issue Date" required error={errors.idIssueDate}>
                <input type="date" name="idIssueDate" value={formData.idIssueDate} onChange={onChange} className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200" />
            </Field>
            <Field label="Expiry Date" required error={errors.idExpiryDate}>
                <input type="date" name="idExpiryDate" value={formData.idExpiryDate} onChange={onChange} className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200" />
            </Field>
        </div>
    );
}