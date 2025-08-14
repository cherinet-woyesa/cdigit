// src/components/accountOpening/StepFinancial.tsx
import React from "react";
import { Field } from "./FormElements";
import type { FinancialDetail, Errors } from "./formTypes";

type StepFinancialProps = {
    data: FinancialDetail;
    setData: (d: FinancialDetail) => void;
    errors: Errors<FinancialDetail>;
    onNext: () => void;
    onBack: () => void;
    submitting: boolean;
};

export function StepFinancial({ data, setData, errors, onNext, onBack, submitting }: StepFinancialProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    return (
        <>
            <div className="text-xl font-bold mb-3 text-purple-800">Financial Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Type of Work" required error={errors.typeOfWork}>
                    <div className="flex gap-3">
                        {["Private", "Employee"].map((type) => (
                            <label key={type} className="flex items-center space-x-1">
                                <input
                                    type="radio"
                                    name="typeOfWork" // Changed to camelCase
                                    value={type}
                                    checked={data.typeOfWork === type}
                                    onChange={handleChange}
                                />
                                <span>{type}</span>
                            </label>
                        ))}
                    </div>
                </Field>
                {/* Private Worker Fields */}
                {data.typeOfWork === "Private" && (
                    <>
                        <Field label="Business Sector" required error={errors.businessSector}>
                            <input
                                type="text"
                                name="businessSector" // Changed to camelCase
                                className="form-input w-full p-2 rounded border"
                                value={data.businessSector || ""}
                                onChange={handleChange}
                            />
                        </Field>
                        <Field label="Income Frequency" required error={errors.incomeFrequencyAnnual_Private}>
                            <div className="flex gap-3">
                                <label className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        name="incomeFrequency" // Changed to camelCase
                                        value="Annual"
                                        checked={data.incomeFrequencyAnnual_Private}
                                        onChange={() => setData({ ...data, incomeFrequencyAnnual_Private: true, incomeFrequencyMonthly_Private: false, incomeFrequencyDaily_Private: false })}
                                    />
                                    <span>Annual</span>
                                </label>
                                <label className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        name="incomeFrequency" // Changed to camelCase
                                        value="Monthly"
                                        checked={data.incomeFrequencyMonthly_Private}
                                        onChange={() => setData({ ...data, incomeFrequencyAnnual_Private: false, incomeFrequencyMonthly_Private: true, incomeFrequencyDaily_Private: false })}
                                    />
                                    <span>Monthly</span>
                                </label>
                                <label className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        name="incomeFrequency" // Changed to camelCase
                                        value="Daily"
                                        checked={data.incomeFrequencyDaily_Private}
                                        onChange={() => setData({ ...data, incomeFrequencyAnnual_Private: false, incomeFrequencyMonthly_Private: false, incomeFrequencyDaily_Private: true })}
                                    />
                                    <span>Daily</span>
                                </label>
                            </div>
                        </Field>
                        <Field label="Income Details" required error={errors.incomeDetails_Private}>
                            <input
                                type="text"
                                name="incomeDetails_Private" // Changed to camelCase
                                className="form-input w-full p-2 rounded border"
                                value={data.incomeDetails_Private || ""}
                                onChange={handleChange}
                            />
                        </Field>
                        <Field label="Other Income (if any)" error={errors.otherIncome}>
                            <input
                                type="text"
                                name="otherIncome" // Changed to camelCase
                                className="form-input w-full p-2 rounded border"
                                value={data.otherIncome || ""}
                                onChange={handleChange}
                            />
                        </Field>
                    </>
                )}
                {/* Employee Fields */}
                {data.typeOfWork === "Employee" && (
                    <>
                        <Field label="Sector of Employer" required error={errors.sectorOfEmployer}>
                            <input
                                type="text"
                                name="sectorOfEmployer" // Changed to camelCase
                                className="form-input w-full p-2 rounded border"
                                value={data.sectorOfEmployer || ""}
                                onChange={handleChange}
                            />
                        </Field>
                        <Field label="Job Position" required error={errors.jobPosition}>
                            <input
                                type="text"
                                name="jobPosition" // Changed to camelCase
                                className="form-input w-full p-2 rounded border"
                                value={data.jobPosition || ""}
                                onChange={handleChange}
                            />
                        </Field>
                        <Field label="Income Frequency" required error={errors.incomeFrequencyAnnual_Employee}>
                            <div className="flex gap-3">
                                <label className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        name="incomeFrequency" // Changed to camelCase
                                        value="Annual"
                                        checked={data.incomeFrequencyAnnual_Employee}
                                        onChange={() => setData({ ...data, incomeFrequencyAnnual_Employee: true, incomeFrequencyMonthly_Employee: false, incomeFrequencyDaily_Employee: false })}
                                    />
                                    <span>Annual</span>
                                </label>
                                <label className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        name="incomeFrequency" // Changed to camelCase
                                        value="Monthly"
                                        checked={data.incomeFrequencyMonthly_Employee}
                                        onChange={() => setData({ ...data, incomeFrequencyAnnual_Employee: false, incomeFrequencyMonthly_Employee: true, incomeFrequencyDaily_Employee: false })}
                                    />
                                    <span>Monthly</span>
                                </label>
                                <label className="flex items-center space-x-1">
                                    <input
                                        type="radio"
                                        name="incomeFrequency" // Changed to camelCase
                                        value="Daily"
                                        checked={data.incomeFrequencyDaily_Employee}
                                        onChange={() => setData({ ...data, incomeFrequencyAnnual_Employee: false, incomeFrequencyMonthly_Employee: false, incomeFrequencyDaily_Employee: true })}
                                    />
                                    <span>Daily</span>
                                </label>
                            </div>
                        </Field>
                        <Field label="Income Details" required error={errors.incomeDetails_Employee}>
                            <input
                                type="text"
                                name="incomeDetails_Employee" // Changed to camelCase
                                className="form-input w-full p-2 rounded border"
                                value={data.incomeDetails_Employee || ""}
                                onChange={handleChange}
                            />
                        </Field>
                    </>
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