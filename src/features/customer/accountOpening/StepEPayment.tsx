// src/components/accountOpening/StepEPayment.tsx
import React, { useState } from "react";
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


    // Show errors only after Next is clicked
    const [touchedNext, setTouchedNext] = useState(false);
    const [localErrors, setLocalErrors] = useState<Partial<Errors<EPaymentService>>>({});

    function validateAll() {
        const errs: Partial<Errors<EPaymentService>> = {};
        if (data.hasAtmCard) {
            if (!data.atmCardType) {
                errs.atmCardType = "Card Type is required";
            }
            if (!data.atmCardDeliveryBranch) {
                errs.atmCardDeliveryBranch = "Delivery Branch is required";
            }
        }
        return errs;
    }

    const handleNext = () => {
        setTouchedNext(true);
        const errs = validateAll();
        setLocalErrors(errs);
        if (Object.values(errs).some(Boolean)) return;
        onNext();
    };

    // Reset errors for ATM card fields when ATM Card is unchecked
    React.useEffect(() => {
        if (!data.hasAtmCard) {
            setLocalErrors((prev) => ({ ...prev, atmCardType: undefined, atmCardDeliveryBranch: undefined }));
        }
    }, [data.hasAtmCard]);

    return (
        <>
            <div className="text-xl font-bold mb-3 text-fuchsia-800">E-Payment Services</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="ATM Card" error={errors.hasAtmCard}>
                    <input
                        type="checkbox"
                        name="hasAtmCard"
                        checked={data.hasAtmCard}
                        onChange={handleChange}
                        aria-label="ATM Card"
                    />
                </Field>
                {data.hasAtmCard && (
                    <>
                        <Field label="Card Type" error={touchedNext ? localErrors.atmCardType : undefined}>
                            <select
                                className="form-select w-full p-2 rounded border focus:ring-2 focus:ring-fuchsia-500"
                                name="atmCardType"
                                value={data.atmCardType || ""}
                                onChange={handleChange}
                                aria-label="ATM Card Type"
                            >
                                <option value="">Select</option>
                                <option value="Visa">Visa</option>
                                <option value="Mastercard">Mastercard</option>
                            </select>
                        </Field>
                        <Field label="Delivery Branch" error={touchedNext ? localErrors.atmCardDeliveryBranch : undefined}>
                            <input
                                type="text"
                                name="atmCardDeliveryBranch"
                                className="form-input w-full p-2 rounded border focus:ring-2 focus:ring-fuchsia-500"
                                value={data.atmCardDeliveryBranch || ""}
                                onChange={handleChange}
                                aria-label="ATM Card Delivery Branch"
                            />
                        </Field>
                    </>
                )}
                <Field label="Mobile Banking" error={errors.hasMobileBanking}>
                    <input
                        type="checkbox"
                        name="hasMobileBanking"
                        checked={data.hasMobileBanking}
                        onChange={handleChange}
                        aria-label="Mobile Banking"
                    />
                </Field>
                <Field label="Internet Banking" error={errors.hasInternetBanking}>
                    <input
                        type="checkbox"
                        name="hasInternetBanking"
                        checked={data.hasInternetBanking}
                        onChange={handleChange}
                        aria-label="Internet Banking"
                    />
                </Field>
                <Field label="CBE Birr" error={errors.hasCbeBirr}>
                    <input
                        type="checkbox"
                        name="hasCbeBirr"
                        checked={data.hasCbeBirr}
                        onChange={handleChange}
                        aria-label="CBE Birr"
                    />
                </Field>
                <Field label="SMS Banking" error={errors.hasSmsBanking}>
                    <input
                        type="checkbox"
                        name="hasSmsBanking"
                        checked={data.hasSmsBanking}
                        onChange={handleChange}
                        aria-label="SMS Banking"
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
                    className={`bg-fuchsia-700 text-white px-6 py-2 rounded shadow hover:bg-fuchsia-800 transition ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleNext}
                    disabled={submitting}
                    aria-disabled={submitting}
                >
                    Next
                </button>
            </div>
        </>
    );
}