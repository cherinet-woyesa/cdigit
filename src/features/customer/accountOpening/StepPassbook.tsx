// src/components/accountOpening/StepPassbook.tsx
import React from "react";
import { Field } from "./FormElements";
import type { PassbookMudayRequest, Errors } from "./formTypes";

type StepPassbookProps = {
    data: PassbookMudayRequest;
    setData: (d: PassbookMudayRequest) => void;
    errors: Errors<PassbookMudayRequest>;
    onNext: () => void;
    onBack: () => void;
    submitting: boolean;
};

export function StepPassbook({ data, setData, errors, onNext, onBack, submitting }: StepPassbookProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const target = e.target as HTMLInputElement;
        const { name, checked } = target;
        setData({ ...data, [name]: checked });
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    return (
        <>
            <div className="text-xl font-bold mb-3 text-purple-800">Passbook & Muday Request</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Request Passbook" error={errors.needsPassbook}>
                    <input
                        type="checkbox"
                        name="needsPassbook" // Changed to camelCase
                        checked={data.needsPassbook}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Request Muday Box" error={errors.needsMudayBox}>
                    <input
                        type="checkbox"
                        name="needsMudayBox" // Changed to camelCase
                        checked={data.needsMudayBox}
                        onChange={handleChange}
                    />
                </Field>
                {data.needsMudayBox && (
                    <Field label="Muday Box Delivery Branch" required error={errors.mudayBoxDeliveryBranch}>
                        <input
                            type="text"
                            name="mudayBoxDeliveryBranch" // Changed to camelCase
                            className="form-input w-full p-2 rounded border"
                            value={data.mudayBoxDeliveryBranch || ""}
                            onChange={handleTextChange}
                        />
                    </Field>
                )}
            </div>
            <div className="flex justify-between mt-6">
                <button
                    type="button"
                    className="bg-gray-300 text-purple-700 px-6 py-2 rounded shadow hover:bg-gray-400 transition"
                    onClick={onBack}
                >
                    Back
                </button>
                <button
                    type="button"
                    className="bg-purple-700 text-white px-6 py-2 rounded shadow hover:bg-purple-800 transition"
                    onClick={onNext}
                    disabled={submitting}
                >
                    Next
                </button>
            </div>
        </>
    );
}