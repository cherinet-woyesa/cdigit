// src/components/accountOpening/StepOther.tsx
import React from "react";
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
        setData({ ...data, [name]: type === "checkbox" ? checked : value });
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
                                name="hasBeenConvicted" // Changed to camelCase
                                checked={data.hasBeenConvicted === true}
                                onChange={() => setData({ ...data, hasBeenConvicted: true })}
                            />
                            <span>Yes</span>
                        </label>
                        <label className="flex items-center space-x-1">
                            <input
                                type="radio"
                                name="hasBeenConvicted" // Changed to camelCase
                                checked={data.hasBeenConvicted === false}
                                onChange={() => setData({ ...data, hasBeenConvicted: false })}
                            />
                            <span>No</span>
                        </label>
                    </div>
                </Field>
                {data.hasBeenConvicted && (
                    <Field label="Reason for Conviction" required error={errors.convictionReason}>
                        <input
                            type="text"
                            name="convictionReason" // Changed to camelCase
                            className="form-input w-full p-2 rounded border"
                            value={data.convictionReason || ""}
                            onChange={handleChange}
                        />
                    </Field>
                )}
                <Field label="Are you a Politically Exposed Person (PEP)?" error={errors.isPoliticallyExposed}>
                    <div className="flex gap-3">
                        <label className="flex items-center space-x-1">
                            <input
                                type="radio"
                                name="isPoliticallyExposed" // Changed to camelCase
                                checked={data.isPoliticallyExposed === true}
                                onChange={() => setData({ ...data, isPoliticallyExposed: true })}
                            />
                            <span>Yes</span>
                        </label>
                        <label className="flex items-center space-x-1">
                            <input
                                type="radio"
                                name="isPoliticallyExposed" // Changed to camelCase
                                checked={data.isPoliticallyExposed === false}
                                onChange={() => setData({ ...data, isPoliticallyExposed: false })}
                            />
                            <span>No</span>
                        </label>
                    </div>
                </Field>
                {data.isPoliticallyExposed && (
                    <Field label="PEP Position" required error={errors.pepPosition}>
                        <input
                            type="text"
                            name="pepPosition" // Changed to camelCase
                            className="form-input w-full p-2 rounded border"
                            value={data.pepPosition || ""}
                            onChange={handleChange}
                        />
                    </Field>
                )}
                <Field label="Source of Fund" required error={errors.sourceOfFund}>
                    <select
                        className="form-select w-full p-2 rounded border"
                        name="sourceOfFund" // Changed to camelCase
                        value={data.sourceOfFund}
                        onChange={handleChange}
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
                    <Field label="Specify Other Source of Fund" required error={errors.otherSourceOfFund}>
                        <input
                            type="text"
                            name="otherSourceOfFund" // Changed to camelCase
                            className="form-input w-full p-2 rounded border"
                            value={data.otherSourceOfFund || ""}
                            onChange={handleChange}
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
                    className="bg-fuchsia-700 text-white px-6 py-2 rounded shadow hover:bg-fuchsia-800 transition"
                    onClick={onNext}
                    disabled={submitting}
                >
                    Next
                </button>
            </div>
        </>
    );
}