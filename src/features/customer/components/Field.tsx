
// features/customer/components/Field.tsx
import React from 'react';

interface FieldProps {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, required = false, error, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
);

export default Field;
