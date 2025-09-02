// src/components/accountOpening/StepPassbook.tsx
import React from "react";
import { Field } from "./FormElements";
import type { PassbookMudayRequest, Errors } from "../types/formTypes";

export const validate = (data: PassbookMudayRequest): Errors<PassbookMudayRequest> => {
    const newErrors: Errors<PassbookMudayRequest> = {};
    if (data.needsMudayBox && !data.mudayBoxDeliveryBranch) {
        newErrors.mudayBoxDeliveryBranch = "Muday Box Delivery Branch is required";
    }
    return newErrors;
};

type StepPassbookProps = {
    data: PassbookMudayRequest;
    setData: (d: PassbookMudayRequest) => void;
    errors: Errors<PassbookMudayRequest>;
    onNext: (errors: Errors<PassbookMudayRequest>) => void;
    onBack: () => void;
    submitting: boolean;
};

const ToggleSwitch = ({ name, checked, onChange, label }: { name: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, label: string }) => (
    <label htmlFor={name} className="flex items-center cursor-pointer">
        <div className="relative">
            <input id={name} name={name} type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
            <div className={`block w-14 h-8 rounded-full ${checked ? 'bg-fuchsia-700' : 'bg-gray-300'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
        </div>
        <div className="ml-3 text-gray-700 font-medium">
            {label}
        </div>
    </label>
);

export function StepPassbook({ data, setData, errors, onNext, onBack, submitting }: StepPassbookProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement;
        const { name, type, checked, value } = target;

        if (type === "checkbox") {
            if (name === "needsMudayBox") {
                setData({ ...data, needsMudayBox: checked, mudayBoxDeliveryBranch: checked ? data.mudayBoxDeliveryBranch : "" });
                return;
            }
            setData({ ...data, [name]: checked } as PassbookMudayRequest);
        } else {
            setData({ ...data, [name]: value });
        }
    };

    const handleNext = () => {
        const validationErrors = validate(data);
        onNext(validationErrors);
    };

    return (
        <div className="container mx-auto px-2 py-6 max-w-4xl">
            <div className="text-xl font-bold mb-3 text-fuchsia-800">Passbook & Muday Request</div>
            <p className="text-gray-600 mb-6">Select the physical items you would like to request.</p>

            <div className="space-y-6">
                <div className="p-4 border rounded-lg shadow-sm">
                    <ToggleSwitch name="needsPassbook" checked={!!data.needsPassbook} onChange={handleChange} label="Request Passbook" />
                </div>

                <div className="p-4 border rounded-lg shadow-sm">
                    <ToggleSwitch name="needsMudayBox" checked={!!data.needsMudayBox} onChange={handleChange} label="Request Muday Box (Coin Bank)" />
                    {data.needsMudayBox && (
                        <div className="mt-4 pl-8">
                            <Field label="Muday Box Delivery Branch" required error={errors.mudayBoxDeliveryBranch}>
                                <input
                                    type="text"
                                    name="mudayBoxDeliveryBranch"
                                    className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                                    value={data.mudayBoxDeliveryBranch || ""}
                                    onChange={handleChange}
                                    placeholder="Enter delivery branch"
                                />
                            </Field>
                        </div>
                    )}
                </div>
            </div>

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
                    onClick={handleNext}
                    disabled={submitting}
                >
                    {submitting ? 'Processing...' : 'Next'}
                </button>
            </div>
        </div>
    );
}
