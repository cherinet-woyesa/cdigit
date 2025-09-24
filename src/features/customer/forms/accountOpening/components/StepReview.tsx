import React from 'react';
import type { FormData } from '../../types/formTypes';

// Helper to format display labels from camelCase
const formatLabel = (key: string) => {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
};

// Helper to display a single value, handling different types
const DataValue = ({ value }: { value: any }) => {
    if (typeof value === 'boolean') {
        return <span className="font-normal text-gray-800">{value ? 'Yes' : 'No'}</span>;
    }
    if (value instanceof File) {
        return <span className="font-normal text-gray-800">{value.name}</span>;
    }
    if (!value) {
        return <span className="font-normal text-gray-500 italic">Not provided</span>;
    }
    return <span className="font-normal text-gray-800">{String(value)}</span>;
};

// Component to display a section of the form data
const ReviewSection = ({ title, data, onEdit }: { title: string, data: object, onEdit: () => void }) => {
    // Don't render the section if data is null or undefined
    if (!data) {
        return null;
    }

    const entries = Object.entries(data).filter(([key]) => key !== 'id' && key !== 'customerId');

    // Don't render the section if there are no entries to show
    if (entries.length === 0) {
        return null;
    }

    return (
        <div className="mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold text-fuchsia-700">{title}</h3>
                <button
                    onClick={onEdit}
                    className="text-sm text-fuchsia-600 hover:underline font-medium"
                >
                    Edit
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {entries.map(([key, value]) => (
                    <div key={key} className="py-1">
                        <strong className="text-sm text-gray-600">{formatLabel(key)}:</strong> <DataValue value={value} />
                    </div>
                ))}
            </div>
        </div>
    );
};

type StepReviewProps = {
    formData: FormData;
    goTo: (step: number) => void;
    onBack: () => void;
    onSubmit: () => void;
    submitting: boolean;
};

export function StepReview({ formData, goTo, onBack, onSubmit, submitting }: StepReviewProps) {
    return (
        <div className="container mx-auto px-2 py-6 max-w-4xl">
            <div className="text-2xl font-bold mb-2 text-fuchsia-800">Review Your Application</div>
            <p className="text-gray-600 mb-6">Please review all the information carefully before submitting. You can edit any section by clicking the 'Edit' button.</p>

            <ReviewSection title="Personal Details" data={formData.personalDetails} onEdit={() => goTo(0)} />
            <ReviewSection title="Address Details" data={formData.addressDetails} onEdit={() => goTo(1)} />
            <ReviewSection title="Financial Details" data={formData.financialDetails} onEdit={() => goTo(2)} />
            <ReviewSection title="Other Details" data={formData.otherDetails} onEdit={() => goTo(3)} />
            <ReviewSection title="Document Details" data={formData.documentDetails} onEdit={() => goTo(4)} />
            <ReviewSection title="E-Payment Services" data={formData.ePaymentService} onEdit={() => goTo(5)} />
            <ReviewSection title="Passbook & Muday Request" data={formData.passbookMudayRequest} onEdit={() => goTo(6)} />
            <ReviewSection title="Signature" data={formData.digitalSignature} onEdit={() => goTo(7)} />

            <div className="flex justify-between mt-10">
                <button
                    type="button"
                    className="bg-gray-300 text-fuchsia-700 px-6 py-2 rounded-lg shadow hover:bg-gray-400 transition"
                    onClick={onBack}
                >
                    Back
                </button>
                <button
                    type="button"
                    className={`w-full md:w-auto px-10 py-3 rounded-lg font-semibold shadow-lg transition transform duration-200 
                        ${submitting ? 'bg-fuchsia-300 cursor-not-allowed' : 'bg-fuchsia-700 text-white hover:bg-fuchsia-800 hover:scale-105'}`}
                    onClick={onSubmit}
                    disabled={submitting}
                >
                    {submitting ? 'Finalizing...' : 'Confirm & Submit'}
                </button>
            </div>
        </div>
    );
}
