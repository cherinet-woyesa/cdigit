// src/components/accountOpening/StepOther.tsx
import React, { useState } from "react";
import { Field } from "./FormElements";
import type { OtherDetail, Errors } from "./formTypes";

type StepOtherProps = {
    data: OtherDetail;
    setData: (d: OtherDetail) => void;
    errors: Errors<OtherDetail>;
    onNext: () => void;
    onBack: () => void;
    submitting: boolean;
};

export function StepOther({ data, setData, errors, onNext, onBack, submitting }: StepOtherProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement;
        const { name, value, type, checked } = target;
        if (name === 'hasBeenConvicted') {
            const next = type === 'checkbox' ? checked : value === 'true';
            setData({ ...data, hasBeenConvicted: next, convictionReason: next ? data.convictionReason : '' });
            return;
        }
        if (name === 'isPoliticallyExposed') {
            const next = type === 'checkbox' ? checked : value === 'true';
            setData({ ...data, isPoliticallyExposed: next, pepPosition: next ? data.pepPosition : '' });
            return;
        }
        if (name === 'sourceOfFund') {
            setData({ ...data, sourceOfFund: value as any, otherSourceOfFund: value === 'Other' ? data.otherSourceOfFund : '' });
            return;
        }
        setData({ ...data, [name]: type === "checkbox" ? checked : value } as OtherDetail);
    };


    // Show errors only after Next is clicked
    const [touchedNext, setTouchedNext] = useState(false);
    const [localErrors, setLocalErrors] = useState<Partial<Errors<OtherDetail>>>({});

    function validateAll() {
        const errs: Partial<Errors<OtherDetail>> = {};
        if (data.hasBeenConvicted && !data.convictionReason) {
            errs.convictionReason = 'Reason for conviction is required';
        }
        if (data.isPoliticallyExposed && !data.pepPosition) {
            errs.pepPosition = 'PEP Position is required';
        }
        if (!data.sourceOfFund) {
            errs.sourceOfFund = 'Source of Fund is required';
        }
        if (data.sourceOfFund === 'Other' && !data.otherSourceOfFund) {
            errs.otherSourceOfFund = 'Please specify other source of fund';
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

    return (
        <>
            <div className="text-xl font-bold mb-3 text-fuchsia-800">Other Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Have you ever been convicted of a crime?" error={errors.hasBeenConvicted}>
                    <div className="flex gap-3">
                        <label className="flex items-center space-x-1">
                            <input
                                type="radio"
                                name="hasBeenConvicted"
                                checked={data.hasBeenConvicted === true}
                                onChange={() => setData({ ...data, hasBeenConvicted: true })}
                                aria-label="Convicted Yes"
                            />
                            <span>Yes</span>
                        </label>
                        <label className="flex items-center space-x-1">
                            <input
                                type="radio"
                                name="hasBeenConvicted"
                                checked={data.hasBeenConvicted === false}
                                onChange={() => setData({ ...data, hasBeenConvicted: false, convictionReason: '' })}
                                aria-label="Convicted No"
                            />
                            <span>No</span>
                        </label>
                    </div>
                </Field>
                {data.hasBeenConvicted && (
                    <Field label="Reason for Conviction" required error={touchedNext ? localErrors.convictionReason : undefined}>
                        <input
                            type="text"
                            name="convictionReason"
                            className="form-input w-full p-2 rounded border focus:ring-2 focus:ring-fuchsia-500"
                            value={data.convictionReason || ""}
                            onChange={handleChange}
                            aria-label="Reason for Conviction"
                        />
                    </Field>
                )}
                <Field label="Are you a Politically Exposed Person (PEP)?" error={errors.isPoliticallyExposed}>
                    <div className="flex gap-3">
                        <label className="flex items-center space-x-1">
                            <input
                                type="radio"
                                name="isPoliticallyExposed"
                                checked={data.isPoliticallyExposed === true}
                                onChange={() => setData({ ...data, isPoliticallyExposed: true })}
                                aria-label="PEP Yes"
                            />
                            <span>Yes</span>
                        </label>
                        <label className="flex items-center space-x-1">
                            <input
                                type="radio"
                                name="isPoliticallyExposed"
                                checked={data.isPoliticallyExposed === false}
                                onChange={() => setData({ ...data, isPoliticallyExposed: false, pepPosition: '' })}
                                aria-label="PEP No"
                            />
                            <span>No</span>
                        </label>
                    </div>
                </Field>
                {data.isPoliticallyExposed && (
                    <Field label="PEP Position" required error={touchedNext ? localErrors.pepPosition : undefined}>
                        <input
                            type="text"
                            name="pepPosition"
                            className="form-input w-full p-2 rounded border focus:ring-2 focus:ring-fuchsia-500"
                            value={data.pepPosition || ""}
                            onChange={handleChange}
                            aria-label="PEP Position"
                        />
                    </Field>
                )}
                <Field label="Source of Fund" required error={touchedNext ? localErrors.sourceOfFund : undefined}>
                    <select
                        className="form-select w-full p-2 rounded border focus:ring-2 focus:ring-fuchsia-500"
                        name="sourceOfFund"
                        value={data.sourceOfFund}
                        onChange={handleChange}
                        aria-label="Source of Fund"
                    >
                        <option value="">Select</option>
                        <option value="Salary">Salary</option>
                        <option value="Business Income">Business Income</option>
                        <option value="Gift">Gift</option>
                        <option value="Inheritance">Inheritance</option>
                        <option value="Loan">Loan</option>
                        <option value="Pension">Pension</option>
                        <option value="Other">Other</option>
                    </select>
                </Field>
                {data.sourceOfFund === "Other" && (
                    <Field label="Specify Other Source of Fund" required error={touchedNext ? localErrors.otherSourceOfFund : undefined}>
                        <input
                            type="text"
                            name="otherSourceOfFund"
                            className="form-input w-full p-2 rounded border focus:ring-2 focus:ring-fuchsia-500"
                            value={data.otherSourceOfFund || ""}
                            onChange={handleChange}
                            aria-label="Other Source of Fund"
                        />
                    </Field>
                )}
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