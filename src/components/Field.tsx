import React from "react";

type FieldProps = {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
};

const Field: React.FC<FieldProps> = ({ label, required, error, children }) => {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <div className="mt-1">{children}</div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default Field;