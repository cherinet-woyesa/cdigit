// src/components/accountOpening/StepEPayment.tsx
import React from "react";
import { Field } from "./FormElements";
import type { EPaymentService, Errors } from "../types/formTypes";

export const validate = (data: EPaymentService): Errors<EPaymentService> => {
    const newErrors: Errors<EPaymentService> = {};
    if (data.hasAtmCard) {
        if (!data.atmCardType) {
            newErrors.atmCardType = "Card Type is required";
        }
        if (!data.atmCardDeliveryBranch) {
            newErrors.atmCardDeliveryBranch = "Delivery Branch is required";
        }
    }
    return newErrors;
};

type StepEPaymentProps = {
    data: EPaymentService;
    setData: (d: EPaymentService) => void;
    errors: Errors<EPaymentService>;
    onNext: (errors: Errors<EPaymentService>) => void;
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

export function StepEPayment({ data, setData, errors, onNext, onBack, submitting }: StepEPaymentProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement;
        const { name, type, checked, value } = target;

        if (type === "checkbox") {
            if (name === "hasAtmCard") {
                const nextHasAtm = checked;
                setData({
                    ...data,
                    hasAtmCard: nextHasAtm,
                    atmCardType: nextHasAtm ? data.atmCardType : "",
                    atmCardDeliveryBranch: nextHasAtm ? data.atmCardDeliveryBranch : "",
                });
                return;
            }
            setData({ ...data, [name]: checked } as EPaymentService);
        } else {
            setData({ ...data, [name]: value } as EPaymentService);
        }
    };

    const handleNext = () => {
        const validationErrors = validate(data);
        onNext(validationErrors);
    };

    return (
        <div className="container mx-auto px-2 py-6 max-w-4xl">
            <div className="text-xl font-bold mb-3 text-fuchsia-800">E-Payment Services</div>
            <p className="text-gray-600 mb-6">Select the e-payment services you would like to subscribe to.</p>
            
            <div className="space-y-6">
                <div className="p-4 border rounded-lg shadow-sm">
                    <ToggleSwitch name="hasAtmCard" checked={!!data.hasAtmCard} onChange={handleChange} label="Request ATM Card" />
                    {data.hasAtmCard && (
                        <div className="mt-4 pl-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Card Type" required error={errors.atmCardType}>
                                <select
                                    className="form-select w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors bg-white shadow-sm"
                                    name="atmCardType"
                                    value={data.atmCardType || ""}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Card Type</option>
                                    <option value="Visa">Visa</option>
                                    <option value="Mastercard">Mastercard</option>
                                </select>
                            </Field>
                            <Field label="Delivery Branch" required error={errors.atmCardDeliveryBranch}>
                                <input
                                    type="text"
                                    name="atmCardDeliveryBranch"
                                    className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                                    value={data.atmCardDeliveryBranch || ""}
                                    onChange={handleChange}
                                    placeholder="Enter delivery branch"
                                />
                            </Field>
                        </div>
                    )}
                </div>

                <div className="p-4 border rounded-lg shadow-sm">
                    <ToggleSwitch name="hasMobileBanking" checked={!!data.hasMobileBanking} onChange={handleChange} label="Mobile Banking" />
                </div>
                <div className="p-4 border rounded-lg shadow-sm">
                    <ToggleSwitch name="hasInternetBanking" checked={!!data.hasInternetBanking} onChange={handleChange} label="Internet Banking" />
                </div>
                <div className="p-4 border rounded-lg shadow-sm">
                    <ToggleSwitch name="hasCbeBirr" checked={!!data.hasCbeBirr} onChange={handleChange} label="CBE Birr" />
                </div>
                <div className="p-4 border rounded-lg shadow-sm">
                    <ToggleSwitch name="hasSmsBanking" checked={!!data.hasSmsBanking} onChange={handleChange} label="SMS Banking" />
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
                    {submitting ? 'Submitting...' : 'Submit'}
                </button>
            </div>
        </div>
    );
}
