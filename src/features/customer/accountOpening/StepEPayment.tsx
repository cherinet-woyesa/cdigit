// src/components/accountOpening/StepEPayment.tsx
import React from "react";
import { Field } from "./FormElements";
import type { EPaymentService, Errors } from "./formTypes";

type StepEPaymentProps = {
    data: EPaymentService;
    setData: (d: EPaymentService) => void;
    errors: Errors<EPaymentService>;
    onNext: () => void;
    onBack: () => void;
    submitting: boolean;
};

export function StepEPayment({ data, setData, errors, onNext, onBack, submitting }: StepEPaymentProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement;
        const { name, type, checked, value } = target;
        if (type === "checkbox") {
            if (name === "hasAtmCard") {
                // When ATM Card is unchecked, clear its dependent fields
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

    // Local conditional validation: only when ATM is requested
    const localErrors: Partial<Errors<EPaymentService>> = {};
    if (data.hasAtmCard) {
        if (!data.atmCardType) {
            localErrors.atmCardType = "Card Type is required";
        }
        if (!data.atmCardDeliveryBranch) {
            localErrors.atmCardDeliveryBranch = "Delivery Branch is required";
        }
    }
    const mergedErrors: Errors<EPaymentService> = { ...(errors || {}), ...(localErrors as Errors<EPaymentService>) };
    const hasLocalErrors = Object.values(localErrors).some(Boolean);

    return (
        <>
            <div className="text-xl font-bold mb-3 text-fuchsia-800">E-Payment Services</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="ATM Card" error={errors.hasAtmCard}>
                    <input
                        type="checkbox"
                        name="hasAtmCard" // Changed to camelCase
                        checked={data.hasAtmCard}
                        onChange={handleChange}
                    />
                </Field>
                {data.hasAtmCard && (
                    <>
                        <Field label="Card Type" error={mergedErrors.atmCardType}>
                            <select
                                className="form-select w-full p-2 rounded border"
                                name="atmCardType" // Changed to camelCase
                                value={data.atmCardType || ""}
                                onChange={handleChange}
                            >
                                <option value="">Select</option>
                                <option value="Visa">Visa</option>
                                <option value="Mastercard">Mastercard</option>
                            </select>
                        </Field>
                        <Field label="Delivery Branch" error={mergedErrors.atmCardDeliveryBranch}>
                            <input
                                type="text"
                                name="atmCardDeliveryBranch" // Changed to camelCase
                                className="form-input w-full p-2 rounded border"
                                value={data.atmCardDeliveryBranch || ""}
                                onChange={handleChange}
                            />
                        </Field>
                    </>
                )}
                <Field label="Mobile Banking" error={errors.hasMobileBanking}>
                    <input
                        type="checkbox"
                        name="hasMobileBanking" // Changed to camelCase
                        checked={data.hasMobileBanking}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Internet Banking" error={errors.hasInternetBanking}>
                    <input
                        type="checkbox"
                        name="hasInternetBanking" // Changed to camelCase
                        checked={data.hasInternetBanking}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="CBE Birr" error={errors.hasCbeBirr}>
                    <input
                        type="checkbox"
                        name="hasCbeBirr" // Changed to camelCase
                        checked={data.hasCbeBirr}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="SMS Banking" error={errors.hasSmsBanking}>
                    <input
                        type="checkbox"
                        name="hasSmsBanking" // Changed to camelCase
                        checked={data.hasSmsBanking}
                        onChange={handleChange}
                    />
                </Field>
            </div>
            <div className="flex justify-between mt-6">
                <button
                    type="button"
                    className="bg-gray-300 text-fuchsia-700 px-6 py-2 rounded shadow hover:bg-gray-400 transition"
                    onClick={onBack}
                >
                    Back
                </button>
                <button
                    type="button"
                    className="bg-fuchsia-700 text-white px-6 py-2 rounded shadow hover:bg-fuchsia-800 transition"
                    onClick={onNext}
                    disabled={submitting || hasLocalErrors}
                >
                    Next
                </button>
            </div>
        </>
    );
}