// src/components/accountOpening/StepFinancial.tsx
import React, { useRef, useEffect } from "react";
import { Field } from "./FormElements";
import type { FinancialDetail, Errors } from "./formTypes";
// DRY: Income Frequency Radio Group
function IncomeFrequencyRadios({
    annualChecked,
    monthlyChecked,
    dailyChecked,
    onAnnual,
    onMonthly,
    onDaily,
    name,
    error
}: {
    annualChecked: boolean;
    monthlyChecked: boolean;
    dailyChecked: boolean;
    onAnnual: () => void;
    onMonthly: () => void;
    onDaily: () => void;
    name: string;
    error?: string;
}) {
    return (
        <div className="flex gap-3" role="radiogroup" aria-labelledby={`${name}-label`} aria-invalid={!!error}>
            <label className="flex items-center space-x-1">
                <input
                    type="radio"
                    name={name}
                    value="Annual"
                    checked={annualChecked}
                    onChange={onAnnual}
                    aria-checked={annualChecked}
                    aria-required="true"
                />
                <span>Annual</span>
            </label>
            <label className="flex items-center space-x-1">
                <input
                    type="radio"
                    name={name}
                    value="Monthly"
                    checked={monthlyChecked}
                    onChange={onMonthly}
                    aria-checked={monthlyChecked}
                    aria-required="true"
                />
                <span>Monthly</span>
            </label>
            <label className="flex items-center space-x-1">
                <input
                    type="radio"
                    name={name}
                    value="Daily"
                    checked={dailyChecked}
                    onChange={onDaily}
                    aria-checked={dailyChecked}
                    aria-required="true"
                />
                <span>Daily</span>
            </label>
        </div>
    );
}

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

    // Show summary error if any error exists
    const hasErrors = Object.values(errors).some(Boolean);

    // Accessibility: scroll to first error
    const firstErrorRef = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
        if (hasErrors && firstErrorRef.current) {
            firstErrorRef.current.focus();
        }
    }, [hasErrors]);

    return (
        <>
            <div className="text-xl font-bold mb-3 text-fuchsia-800">Financial Details</div>
            {hasErrors && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    Please fill all required fields and correct any errors below.
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Type of Work" required error={errors.typeOfWork}>
                    <div className="flex gap-3">
                        {["Private", "Employee"].map((type) => (
                            <label key={type} className="flex items-center space-x-1">
                                <input
                                    type="radio"
                                    name="typeOfWork"
                                    value={type}
                                    checked={data.typeOfWork === type}
                                    onChange={handleChange}
                                    aria-required="true"
                                    aria-invalid={!!errors.typeOfWork}
                                    ref={errors.typeOfWork && !firstErrorRef.current ? firstErrorRef : null}
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
                                name="businessSector"
                                className="form-input w-full p-2 rounded border"
                                value={data.businessSector || ""}
                                onChange={handleChange}
                                aria-required="true"
                                aria-invalid={!!errors.businessSector}
                                ref={errors.businessSector && !firstErrorRef.current ? firstErrorRef : null}
                            />
                        </Field>
                        <Field label="Income Frequency" required error={errors.incomeFrequencyAnnual_Private}>
                            <IncomeFrequencyRadios
                                name="incomeFrequency_Private"
                                annualChecked={!!data.incomeFrequencyAnnual_Private}
                                monthlyChecked={!!data.incomeFrequencyMonthly_Private}
                                dailyChecked={!!data.incomeFrequencyDaily_Private}
                                onAnnual={() => setData({ ...data, incomeFrequencyAnnual_Private: true, incomeFrequencyMonthly_Private: false, incomeFrequencyDaily_Private: false })}
                                onMonthly={() => setData({ ...data, incomeFrequencyAnnual_Private: false, incomeFrequencyMonthly_Private: true, incomeFrequencyDaily_Private: false })}
                                onDaily={() => setData({ ...data, incomeFrequencyAnnual_Private: false, incomeFrequencyMonthly_Private: false, incomeFrequencyDaily_Private: true })}
                                error={errors.incomeFrequencyAnnual_Private}
                            />
                        </Field>
                        <Field label="Income Details" required error={errors.incomeDetails_Private}>
                            <input
                                type="text"
                                name="incomeDetails_Private"
                                className="form-input w-full p-2 rounded border"
                                value={data.incomeDetails_Private || ""}
                                onChange={handleChange}
                                aria-required="true"
                                aria-invalid={!!errors.incomeDetails_Private}
                                ref={errors.incomeDetails_Private && !firstErrorRef.current ? firstErrorRef : null}
                            />
                        </Field>
                        <Field label="Other Income (if any)" error={errors.otherIncome}>
                            <input
                                type="text"
                                name="otherIncome"
                                className="form-input w-full p-2 rounded border"
                                value={data.otherIncome || ""}
                                onChange={handleChange}
                                aria-invalid={!!errors.otherIncome}
                                ref={errors.otherIncome && !firstErrorRef.current ? firstErrorRef : null}
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
                                name="sectorOfEmployer"
                                className="form-input w-full p-2 rounded border"
                                value={data.sectorOfEmployer || ""}
                                onChange={handleChange}
                                aria-required="true"
                                aria-invalid={!!errors.sectorOfEmployer}
                                ref={errors.sectorOfEmployer && !firstErrorRef.current ? firstErrorRef : null}
                            />
                        </Field>
                        <Field label="Job Position" required error={errors.jobPosition}>
                            <input
                                type="text"
                                name="jobPosition"
                                className="form-input w-full p-2 rounded border"
                                value={data.jobPosition || ""}
                                onChange={handleChange}
                                aria-required="true"
                                aria-invalid={!!errors.jobPosition}
                                ref={errors.jobPosition && !firstErrorRef.current ? firstErrorRef : null}
                            />
                        </Field>
                        <Field label="Income Frequency" required error={errors.incomeFrequencyAnnual_Employee}>
                            <IncomeFrequencyRadios
                                name="incomeFrequency_Employee"
                                annualChecked={!!data.incomeFrequencyAnnual_Employee}
                                monthlyChecked={!!data.incomeFrequencyMonthly_Employee}
                                dailyChecked={!!data.incomeFrequencyDaily_Employee}
                                onAnnual={() => setData({ ...data, incomeFrequencyAnnual_Employee: true, incomeFrequencyMonthly_Employee: false, incomeFrequencyDaily_Employee: false })}
                                onMonthly={() => setData({ ...data, incomeFrequencyAnnual_Employee: false, incomeFrequencyMonthly_Employee: true, incomeFrequencyDaily_Employee: false })}
                                onDaily={() => setData({ ...data, incomeFrequencyAnnual_Employee: false, incomeFrequencyMonthly_Employee: false, incomeFrequencyDaily_Employee: true })}
                                error={errors.incomeFrequencyAnnual_Employee}
                            />
                        </Field>
                        <Field label="Income Details" required error={errors.incomeDetails_Employee}>
                            <input
                                type="text"
                                name="incomeDetails_Employee"
                                className="form-input w-full p-2 rounded border"
                                value={data.incomeDetails_Employee || ""}
                                onChange={handleChange}
                                aria-required="true"
                                aria-invalid={!!errors.incomeDetails_Employee}
                                ref={errors.incomeDetails_Employee && !firstErrorRef.current ? firstErrorRef : null}
                            />
                        </Field>
                    </>
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