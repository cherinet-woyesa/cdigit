// src/components/accountOpening/StepOther.tsx
import React from "react";
import { Field } from "./FormElements";
import type { OtherDetail, Errors } from "../types/formTypes";

export const validate = (data: OtherDetail): Errors<OtherDetail> => {
    const newErrors: Errors<OtherDetail> = {};
    if (data.hasBeenConvicted && !data.convictionReason) newErrors.convictionReason = "Reason for conviction is required";
    if (data.isPoliticallyExposed && !data.pepPosition) newErrors.pepPosition = "PEP Position is required";
    // if (!data.sourceOfFund) newErrors.sourceOfFund = "Source of Fund is required";
    // if (data.sourceOfFund === "Other" && !data.otherSourceOfFund) newErrors.otherSourceOfFund = "Please specify other source of fund";
    return newErrors;
};

type StepOtherProps = {
    data: OtherDetail;
    setData: (d: OtherDetail) => void;
    errors: Errors<OtherDetail>;
    onNext: (errors: Errors<OtherDetail>) => void;
    onBack: () => void;
    submitting: boolean;
};

export function StepOther({ data, setData, errors, onNext, onBack, submitting }: StepOtherProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    const handleNext = () => {
        const validationErrors = validate(data);
        onNext(validationErrors);
    };

    return (
        <div className="container mx-auto px-2 py-6 max-w-4xl">
            <div className="text-xl font-bold mb-3 text-fuchsia-800">Other Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-1">
                <Field label="Have you ever been convicted of a crime?" error={errors.hasBeenConvicted}>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-4">
                        <label className="flex items-center space-x-1 cursor-pointer">
                            <input
                                type="radio"
                                name="hasBeenConvicted"
                                checked={data.hasBeenConvicted === true}
                                onChange={() => setData({ ...data, hasBeenConvicted: true })}
                                className="hidden"
                            />
                            <span className={`px-4 py-2 rounded-full border-2 transition-colors duration-200 text-sm md:text-base 
                                ${data.hasBeenConvicted === true ? 'bg-fuchsia-700 text-white border-fuchsia-700 shadow' : 'bg-white text-gray-700 border-gray-300 hover:border-fuchsia-500'}`}>
                                Yes
                            </span>
                        </label>
                        <label className="flex items-center space-x-1 cursor-pointer">
                            <input
                                type="radio"
                                name="hasBeenConvicted"
                                checked={data.hasBeenConvicted === false}
                                onChange={() => setData({ ...data, hasBeenConvicted: false, convictionReason: '' })}
                                className="hidden"
                            />
                            <span className={`px-4 py-2 rounded-full border-2 transition-colors duration-200 text-sm md:text-base 
                                ${data.hasBeenConvicted === false ? 'bg-fuchsia-700 text-white border-fuchsia-700 shadow' : 'bg-white text-gray-700 border-gray-300 hover:border-fuchsia-500'}`}>
                                No
                            </span>
                        </label>
                    </div>
                </Field>
                {data.hasBeenConvicted && (
                    <Field label="Reason for Conviction" required error={errors.convictionReason}>
                        <input
                            type="text"
                            name="convictionReason"
                            className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                            value={data.convictionReason || ""}
                            onChange={handleChange}
                        />
                    </Field>
                )}
                <Field label="Are you a Politically Exposed Person (PEP)?" error={errors.isPoliticallyExposed}>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-4">
                        <label className="flex items-center space-x-1 cursor-pointer">
                            <input
                                type="radio"
                                name="isPoliticallyExposed"
                                checked={data.isPoliticallyExposed === true}
                                onChange={() => setData({ ...data, isPoliticallyExposed: true })}
                                className="hidden"
                            />
                            <span className={`px-4 py-2 rounded-full border-2 transition-colors duration-200 text-sm md:text-base 
                                ${data.isPoliticallyExposed === true ? 'bg-fuchsia-700 text-white border-fuchsia-700 shadow' : 'bg-white text-gray-700 border-gray-300 hover:border-fuchsia-500'}`}>
                                Yes
                            </span>
                        </label>
                        <label className="flex items-center space-x-1 cursor-pointer">
                            <input
                                type="radio"
                                name="isPoliticallyExposed"
                                checked={data.isPoliticallyExposed === false}
                                onChange={() => setData({ ...data, isPoliticallyExposed: false, pepPosition: '' })}
                                className="hidden"
                            />
                            <span className={`px-4 py-2 rounded-full border-2 transition-colors duration-200 text-sm md:text-base 
                                ${data.isPoliticallyExposed === false ? 'bg-fuchsia-700 text-white border-fuchsia-700 shadow' : 'bg-white text-gray-700 border-gray-300 hover:border-fuchsia-500'}`}>
                                No
                            </span>
                        </label>
                    </div>
                </Field>
                {data.isPoliticallyExposed && (
                    <Field label="PEP Position" required error={errors.pepPosition}>
                        <input
                            type="text"
                            name="pepPosition"
                            className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                            value={data.pepPosition || ""}
                            onChange={handleChange}
                        />
                    </Field>
                )}
                {/* <Field label="Source of Fund" error={errors.sourceOfFund}>
                    <select
                        className="form-select w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        name="sourceOfFund"
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
                </Field> */}
                {/* {data.sourceOfFund === "Other" && (
                    <Field label="Specify Other Source of Fund" required error={errors.otherSourceOfFund}>
                        <input
                            type="text"
                            name="otherSourceOfFund"
                            className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                            value={data.otherSourceOfFund || ""}
                            onChange={handleChange}
                        />
                    </Field>
                )} */}
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
                    {submitting ? 'Preparing...' : 'Next'}
                </button>
            </div>
        </div>
    );
}
