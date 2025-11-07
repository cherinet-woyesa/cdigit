import React from "react";
import Field from "@components/form/Field";
import type { FinancialDetail, Errors } from "@features/customer/forms/accountOpening/types/formTypes";
import { Loader2, ChevronRight, Briefcase, DollarSign } from 'lucide-react';

export const validate = (data: FinancialDetail): Errors<FinancialDetail> => {
    const newErrors: Errors<FinancialDetail> = {};
    if (!data.typeOfWork) newErrors.typeOfWork = "Type of Work is required";
    if (data.typeOfWork === "Private") {
        if (!data.incomeFrequencyAnnual_Private && !data.incomeFrequencyMonthly_Private && !data.incomeFrequencyDaily_Private) {
            newErrors.incomeFrequencyAnnual_Private = "Select an income frequency";
        }
    } else if (data.typeOfWork === "Employee") {
        if (!data.incomeFrequencyAnnual_Employee && !data.incomeFrequencyMonthly_Employee && !data.incomeFrequencyDaily_Employee) {
            newErrors.incomeFrequencyAnnual_Employee = "Select an income frequency";
        }
    }
    return newErrors;
};

function IncomeFrequencyRadios({
    annualChecked,
    monthlyChecked,
    dailyChecked,
    onAnnual,
    onMonthly,
    onDaily,
    error
}: {
    annualChecked: boolean;
    monthlyChecked: boolean;
    dailyChecked: boolean;
    onAnnual: () => void;
    onMonthly: () => void;
    onDaily: () => void;
    error?: string;
}) {
    const RadioOption = ({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) => (
        <label className="flex items-center cursor-pointer">
            <input type="radio" checked={checked} onChange={onClick} className="hidden" />
            <span className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                checked 
                    ? 'bg-fuchsia-700 text-white border-fuchsia-700 shadow-md' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-fuchsia-400 hover:bg-fuchsia-50'
            }`}>
                {label}
            </span>
        </label>
    );

    return (
        <div>
            <div className="flex flex-wrap gap-2">
                <RadioOption checked={annualChecked} onClick={onAnnual} label="Annual" />
                <RadioOption checked={monthlyChecked} onClick={onMonthly} label="Monthly" />
                <RadioOption checked={dailyChecked} onClick={onDaily} label="Daily" />
            </div>
            {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
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

    const handleNext = () => {
        const validationErrors = validate(data);
        onNext(validationErrors);
    };

    const RadioOption = ({ value, currentValue, label, onChange, name }: {
        value: string;
        currentValue: string;
        label: string;
        onChange: (value: string) => void;
        name: string;
    }) => (
        <label className="flex items-center cursor-pointer">
            <input type="radio" name={name} value={value} checked={currentValue === value} onChange={() => onChange(value)} className="hidden" />
            <span className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                currentValue === value 
                    ? 'bg-fuchsia-700 text-white border-fuchsia-700 shadow-md' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-fuchsia-400 hover:bg-fuchsia-50'
            }`}>
                {label}
            </span>
        </label>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-fuchsia-100 p-2 rounded-lg">
                    <DollarSign className="h-5 w-5 text-fuchsia-700" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Financial Information</h2>
                    <p className="text-gray-600 text-sm">Tell us about your income</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Type of Work */}
                <Field label="Type of Work" required error={errors.typeOfWork}>
                    <div className="flex flex-col gap-2">
                        {["Private", "Employee"].map((type) => (
                            <RadioOption
                                key={type}
                                value={type}
                                currentValue={data.typeOfWork}
                                label={type}
                                onChange={(value) => setData({ ...data, typeOfWork: value })}
                                name="typeOfWork"
                            />
                        ))}
                    </div>
                </Field>

                {/* Private Worker Fields */}
                {data.typeOfWork === "Private" && (
                    <>
                        <Field label="Income Frequency" required error={errors.incomeFrequencyAnnual_Private}>
                            <IncomeFrequencyRadios
                                annualChecked={!!data.incomeFrequencyAnnual_Private}
                                monthlyChecked={!!data.incomeFrequencyMonthly_Private}
                                dailyChecked={!!data.incomeFrequencyDaily_Private}
                                onAnnual={() => setData({ 
                                    ...data, 
                                    incomeFrequencyAnnual_Private: true, 
                                    incomeFrequencyMonthly_Private: false, 
                                    incomeFrequencyDaily_Private: false 
                                })}
                                onMonthly={() => setData({ 
                                    ...data, 
                                    incomeFrequencyAnnual_Private: false, 
                                    incomeFrequencyMonthly_Private: true, 
                                    incomeFrequencyDaily_Private: false 
                                })}
                                onDaily={() => setData({ 
                                    ...data, 
                                    incomeFrequencyAnnual_Private: false, 
                                    incomeFrequencyMonthly_Private: false, 
                                    incomeFrequencyDaily_Private: true 
                                })}
                                error={errors.incomeFrequencyAnnual_Private}
                            />
                        </Field>
                    </>
                )}

                {/* Employee Fields */}
                {data.typeOfWork === "Employee" && (
                    <>
                        <Field label="Income Frequency" required error={errors.incomeFrequencyAnnual_Employee}>
                            <IncomeFrequencyRadios
                                annualChecked={!!data.incomeFrequencyAnnual_Employee}
                                monthlyChecked={!!data.incomeFrequencyMonthly_Employee}
                                dailyChecked={!!data.incomeFrequencyDaily_Employee}
                                onAnnual={() => setData({ 
                                    ...data, 
                                    incomeFrequencyAnnual_Employee: true, 
                                    incomeFrequencyMonthly_Employee: false, 
                                    incomeFrequencyDaily_Employee: false 
                                })}
                                onMonthly={() => setData({ 
                                    ...data, 
                                    incomeFrequencyAnnual_Employee: false, 
                                    incomeFrequencyMonthly_Employee: true, 
                                    incomeFrequencyDaily_Employee: false 
                                })}
                                onDaily={() => setData({ 
                                    ...data, 
                                    incomeFrequencyAnnual_Employee: false, 
                                    incomeFrequencyMonthly_Employee: false, 
                                    incomeFrequencyDaily_Employee: true 
                                })}
                                error={errors.incomeFrequencyAnnual_Employee}
                            />
                        </Field>
                    </>
                )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                    type="button"
                    className="px-8 py-3 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
                    onClick={onBack}
                    disabled={submitting}
                >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Back
                </button>
                <button
                    type="button"
                    className={`px-8 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 flex items-center gap-2 ${
                        submitting 
                            ? 'bg-fuchsia-300 cursor-not-allowed text-white' 
                            : 'bg-fuchsia-700 text-white hover:bg-fuchsia-800 hover:scale-105'
                    }`}
                    onClick={handleNext}
                    disabled={submitting}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            Continue
                            <ChevronRight className="h-4 w-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}