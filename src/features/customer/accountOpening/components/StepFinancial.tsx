// src/components/accountOpening/StepFinancial.tsx
import React, { useRef, useEffect } from "react";
import { Field } from "./FormElements";
import type { FinancialDetail, Errors } from "../types/formTypes";

export const validate = (data: FinancialDetail): Errors<FinancialDetail> => {
    const newErrors: Errors<FinancialDetail> = {};
    if (!data.typeOfWork) newErrors.typeOfWork = "Type of Work is required";
    if (data.typeOfWork === "Private") {
        // if (!data.businessSector) newErrors.businessSector = "Business Sector is required";
        // if (!data.incomeDetails_Private) newErrors.incomeDetails_Private = "Income Details are required";
        // Require at least one income frequency
        if (!data.incomeFrequencyAnnual_Private && !data.incomeFrequencyMonthly_Private && !data.incomeFrequencyDaily_Private) {
            newErrors.incomeFrequencyAnnual_Private = "Select an income frequency";
        }
    } else if (data.typeOfWork === "Employee") {
        // if (!data.sectorOfEmployer) newErrors.sectorOfEmployer = "Sector of Employer is required";
        // if (!data.jobPosition) newErrors.jobPosition = "Job Position is required";
        // if (!data.incomeDetails_Employee) newErrors.incomeDetails_Employee = "Income Details are required";
        // Require at least one income frequency
        if (!data.incomeFrequencyAnnual_Employee && !data.incomeFrequencyMonthly_Employee && !data.incomeFrequencyDaily_Employee) {
            newErrors.incomeFrequencyAnnual_Employee = "Select an income frequency";
        }
    }
    return newErrors;
};

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
        <div className="flex flex-wrap items-center gap-1 sm:gap-4" role="radiogroup" aria-labelledby={`${name}-label`} aria-invalid={!!error}>
            <label className="flex items-center space-x-1 cursor-pointer">
                <input
                    type="radio"
                    name={name}
                    value="Annual"
                    checked={annualChecked}
                    onChange={onAnnual}
                    aria-checked={annualChecked}
                    aria-required="true"
                    className="hidden"
                />
                <span className={`px-4 py-2 rounded-full border-2 transition-colors duration-200 text-sm md:text-base 
                    ${annualChecked ? 'bg-fuchsia-700 text-white border-fuchsia-700 shadow' : 'bg-white text-gray-700 border-gray-300 hover:border-fuchsia-500'}`}>
                    Annual
                </span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer">
                <input
                    type="radio"
                    name={name}
                    value="Monthly"
                    checked={monthlyChecked}
                    onChange={onMonthly}
                    aria-checked={monthlyChecked}
                    aria-required="true"
                    className="hidden"
                />
                <span className={`px-4 py-2 rounded-full border-2 transition-colors duration-200 text-sm md:text-base 
                    ${monthlyChecked ? 'bg-fuchsia-700 text-white border-fuchsia-700 shadow' : 'bg-white text-gray-700 border-gray-300 hover:border-fuchsia-500'}`}>
                    Monthly
                </span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer">
                <input
                    type="radio"
                    name={name}
                    value="Daily"
                    checked={dailyChecked}
                    onChange={onDaily}
                    aria-checked={dailyChecked}
                    aria-required="true"
                    className="hidden"
                />
                <span className={`px-4 py-2 rounded-full border-2 transition-colors duration-200 text-sm md:text-base 
                    ${dailyChecked ? 'bg-fuchsia-700 text-white border-fuchsia-700 shadow' : 'bg-white text-gray-700 border-gray-300 hover:border-fuchsia-500'}`}>
                    Daily
                </span>
            </label>
        </div>
    );
}

type StepFinancialProps = {
    data: FinancialDetail;
    setData: (d: FinancialDetail) => void;
    errors: Errors<FinancialDetail>;
    onNext: (errors: Errors<FinancialDetail>) => void;
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

    const handleNext = () => {
        const validationErrors = validate(data);
        onNext(validationErrors);
    };

    return (
        <div className="container mx-auto px-2 py-6 max-w-4xl">
            <div className="text-xl font-bold mb-3 text-fuchsia-800">Financial Details</div>
            {hasErrors && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    Please fill all required fields and correct any errors below.
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-1">
                <Field label="Type of Work" required error={errors.typeOfWork}>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-4">
                        {["Private", "Employee"].map((type) => (
                            <label key={type} className="flex items-center space-x-1 cursor-pointer">
                                <input
                                    type="radio"
                                    name="typeOfWork"
                                    value={type}
                                    checked={data.typeOfWork === type}
                                    onChange={handleChange}
                                    aria-required="true"
                                    aria-invalid={!!errors.typeOfWork}
                                    ref={errors.typeOfWork && !firstErrorRef.current ? firstErrorRef : null}
                                    className="hidden"
                                />
                                <span className={`px-4 py-2 rounded-full border-2 transition-colors duration-200 text-sm md:text-base 
                                    ${data.typeOfWork === type ? 'bg-fuchsia-700 text-white border-fuchsia-700 shadow' : 'bg-white text-gray-700 border-gray-300 hover:border-fuchsia-500'}`}>
                                    {type}
                                </span>
                            </label>
                        ))}
                    </div>
                </Field>
                {/* Private Worker Fields */}
                {data.typeOfWork === "Private" && (
                    <>
                        {/* <Field label="Business Sector" required error={errors.businessSector}>
                            <input
                                type="text"
                                name="businessSector"
                                className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                                value={data.businessSector || ""}
                                onChange={handleChange}
                                aria-required="true"
                                aria-invalid={!!errors.businessSector}
                                ref={errors.businessSector && !firstErrorRef.current ? firstErrorRef : null}
                            />
                        </Field> */}
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
                        {/* <Field label="Income Details" required error={errors.incomeDetails_Private}>
                            <input
                                type="text"
                                name="incomeDetails_Private"
                                className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                                value={data.incomeDetails_Private || ""}
                                onChange={handleChange}
                                aria-required="true"
                                aria-invalid={!!errors.incomeDetails_Private}
                                ref={errors.incomeDetails_Private && !firstErrorRef.current ? firstErrorRef : null}
                            />
                        </Field> */}
                        {/* <Field label="Other Income (if any)" error={errors.otherIncome}>
                            <input
                                type="text"
                                name="otherIncome"
                                className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                                value={data.otherIncome || ""}
                                onChange={handleChange}
                                aria-invalid={!!errors.otherIncome}
                                ref={errors.otherIncome && !firstErrorRef.current ? firstErrorRef : null}
                            />
                        </Field> */}
                    </>
                )}
                {/* Employee Fields */}
                {data.typeOfWork === "Employee" && (
                    <>
                        {/* <Field label="Sector of Employer" required error={errors.sectorOfEmployer}>
                            <input
                                type="text"
                                name="sectorOfEmployer"
                                className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                                value={data.sectorOfEmployer || ""}
                                onChange={handleChange}
                                aria-required="true"
                                aria-invalid={!!errors.sectorOfEmployer}
                                ref={errors.sectorOfEmployer && !firstErrorRef.current ? firstErrorRef : null}
                            />
                        </Field> */}
                        {/* <Field label="Job Position" required error={errors.jobPosition}>
                            <input
                                type="text"
                                name="jobPosition"
                                className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                                value={data.jobPosition || ""}
                                onChange={handleChange}
                                aria-required="true"
                                aria-invalid={!!errors.jobPosition}
                                ref={errors.jobPosition && !firstErrorRef.current ? firstErrorRef : null}
                            />
                        </Field> */}
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
                        {/* <Field label="Income Details" required error={errors.incomeDetails_Employee}>
                            <input
                                type="text"
                                name="incomeDetails_Employee"
                                className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                                value={data.incomeDetails_Employee || ""}
                                onChange={handleChange}
                                aria-required="true"
                                aria-invalid={!!errors.incomeDetails_Employee}
                                ref={errors.incomeDetails_Employee && !firstErrorRef.current ? firstErrorRef : null}
                            />
                        </Field> */}
                    </>
                )}
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
