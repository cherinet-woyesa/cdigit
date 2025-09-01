// src/components/accountOpening/StepPersonal.tsx
import React, { useEffect, useState } from "react";
import { Field } from "./FormElements";
import { getAccountTypes } from "../../../services/accountTypeService";
import type { PersonalDetail, Errors } from "./formTypes"; // Ensure types are correct

type StepPersonalProps = {
    data: PersonalDetail;
    setData: (d: PersonalDetail) => void;
    errors: Errors<PersonalDetail>;
    onNext: () => void;
    submitting: boolean;
};

export function StepPersonal({ data, setData, errors, onNext, submitting }: StepPersonalProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    const formatDateForInput = (isoDate: string | undefined): string => {
        if (!isoDate) return "";
        try {
            // Split at 'T' to get only the date part (e.g., "2025-08-14")
            return isoDate.split("T")[0];
        } catch (e) {
            console.error("Invalid date format from backend:", isoDate);
            return "";
        }
    };

    // State for account types
    const [accountTypes, setAccountTypes] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        getAccountTypes()
            .then((types) => {
                setAccountTypes(types);
                setFetchError(null);
            })
            .catch(() => {
                setFetchError("Failed to load account types");
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="container mx-auto px-2 py-6 max-w-4xl">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-1">
                {/* Account Type Field */}
                <Field label="Account Type" required error={errors.accountType}>
                    {loading ? (
                        <div className="text-sm text-gray-500 animate-pulse">Loading destinations...</div>
                    ) : fetchError ? (
                        <div className="text-sm text-red-600">{fetchError}</div>
                    ) : (
                        <select
                            className="form-select w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors bg-white shadow-sm"
                            name="accountType"
                            value={data.accountType}
                            onChange={handleChange}
                            disabled={loading || accountTypes.length === 0}
                        >
                            <option value="">Select your destination account</option>
                            {accountTypes.map((type) => (
                                <option key={type.id} value={type.name}>{type.name}</option>
                            ))}
                        </select>
                    )}
                </Field>

                {/* Title Field */}
                <Field label="Title" required error={errors.title}>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-4">
                        {["Mr.", "Mrs.", "Miss", "Ms.", "Dr."].map((t) => (
                            <label key={t} className="flex items-center space-x-1 cursor-pointer">
                                <input
                                    type="radio"
                                    name="title"
                                    value={t}
                                    checked={data.title === t}
                                    onChange={handleChange}
                                    className="hidden" // Hides the default radio button
                                />
                                <span className={`px-4 py-2 rounded-full border-2 transition-colors duration-200 text-sm md:text-base 
                                    ${data.title === t ? 'bg-fuchsia-700 text-white border-fuchsia-700 shadow' : 'bg-white text-gray-700 border-gray-300 hover:border-fuchsia-500'}`}>
                                    {t}
                                </span>
                            </label>
                        ))}
                    </div>
                </Field>

                {/* First Name Field */}
                <Field label="First Name" required error={errors.firstName}>
                    <input
                        type="text"
                        name="firstName"
                        className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.firstName}
                        onChange={handleChange}
                        placeholder="Your given name"
                    />
                </Field>

                {/* Middle Name Field */}
                <Field label="Middle Name" error={errors.middleName}>
                    <input
                        type="text"
                        name="middleName"
                        className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.middleName || ""}
                        onChange={handleChange}
                        placeholder="Middle name (optional)"
                    />
                </Field>
                
                {/* Grandfather's Name Field */}
                <Field label="Grandfather's Name" required error={errors.grandfatherName}>
                    <input
                        type="text"
                        name="grandfatherName"
                        className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.grandfatherName}
                        onChange={handleChange}
                        placeholder="e.g., Smith"
                    />
                </Field>
                
                {/* Mother's Full Name Field */}
                <Field label="Mother's Full Name" error={errors.motherFullName}>
                    <input
                        type="text"
                        name="motherFullName"
                        className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.motherFullName || ""}
                        onChange={handleChange}
                        placeholder="e.g., Jane Doe"
                    />
                </Field>

                {/* Sex Field */}
                <Field label="Sex" required error={errors.sex}>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-4">
                        {["Male", "Female"].map((s) => (
                            <label key={s} className="flex items-center space-x-1 cursor-pointer">
                                <input
                                    type="radio"
                                    name="sex"
                                    value={s}
                                    checked={data.sex === s}
                                    onChange={handleChange}
                                    className="hidden"
                                />
                                <span className={`px-4 py-1 rounded-full border-2 transition-colors duration-200 text-sm md:text-base
                                    ${data.sex === s ? 'bg-fuchsia-700 text-white border-fuchsia-700 shadow' : 'bg-white text-gray-700 border-gray-300 hover:border-fuchsia-500'}`}>
                                    {s}
                                </span>
                            </label>
                        ))}
                    </div>
                </Field>

                {/* Date of Birth Field */}
                <Field label="Date of Birth" required error={errors.dateOfBirth}>
                    <input
                        type="date"
                        name="dateOfBirth"
                        className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={formatDateForInput(data.dateOfBirth)}
                        onChange={handleChange}
                        max={(() => {
                            const d = new Date();
                            d.setFullYear(d.getFullYear() - 18);
                            return d.toISOString().split('T')[0];
                        })()}
                    />
                </Field>

                {/* Place of Birth Field */}
                <Field label="Place of Birth" error={errors.placeOfBirth}>
                    <input
                        type="text"
                        name="placeOfBirth"
                        className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.placeOfBirth || ""}
                        onChange={handleChange}
                        placeholder="e.g., Addis Ababa"
                    />
                </Field>

                {/* Marital Status Field */}
                <Field label="Marital Status" required error={errors.maritalStatus}>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-1">
                        {["Single", "Married", "Divorced", "Widowed"].map((m) => (
                            <label key={m} className="flex items-center space-x-1 cursor-pointer">
                                <input
                                    type="radio"
                                    name="maritalStatus"
                                    value={m}
                                    checked={data.maritalStatus === m}
                                    onChange={handleChange}
                                    className="hidden"
                                />
                                <span className={`px-4 py-1 rounded-full border-2 transition-colors duration-200 text-sm md:text-base
                                    ${data.maritalStatus === m ? 'bg-fuchsia-700 text-white border-fuchsia-700 shadow' : 'bg-white text-gray-700 border-gray-300 hover:border-fuchsia-500'}`}>
                                    {m}
                                </span>
                            </label>
                        ))}
                    </div>
                </Field>

                {/* Education Qualification Field */}
                <Field label="Education Qualification" error={errors.educationQualification}>
                    <select
                        className="form-select w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        name="educationQualification"
                        value={data.educationQualification || ""}
                        onChange={handleChange}
                    >
                        <option value="">Select your education level</option>
                        <option value="None">None</option>
                        <option value="Primary">Primary</option>
                        <option value="Secondary">Secondary</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Degree">Degree</option>
                        <option value="Masters">Masters</option>
                        <option value="PhD">PhD</option>
                    </select>
                </Field>

                {/* Nationality Field */}
                <Field label="Nationality" required error={errors.nationality}>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        {["Ethiopian", "Foreign National"].map((n) => (
                            <label key={n} className="flex items-center space-x-1 cursor-pointer">
                                <input
                                    type="radio"
                                    name="nationality"
                                    value={n}
                                    checked={data.nationality === n}
                                    onChange={handleChange}
                                    className="hidden"
                                />
                                <span className={`px-4 py-2 rounded-full border-2 transition-colors duration-200 text-sm md:text-base
                                    ${data.nationality === n ? 'bg-fuchsia-700 text-white border-fuchsia-700 shadow' : 'bg-white text-gray-700 border-gray-300 hover:border-fuchsia-500'}`}>
                                    {n}
                                </span>
                            </label>
                        ))}
                    </div>
                </Field>
            </div>
            
            <div className="flex justify-center md:justify-end mt-10">
                <button
                    type="button"
                    className={`w-full md:w-auto px-10 py-3 rounded-lg font-semibold shadow-lg transition transform duration-200 
                        ${submitting ? 'bg-fuchsia-300 cursor-not-allowed' : 'bg-fuchsia-700 text-white hover:bg-fuchsia-800 hover:scale-105'}`}
                    onClick={onNext}
                    disabled={submitting}
                >
                    {submitting ? 'Preparing...' : 'Next'}
                </button>
            </div>
        </div>
    );
}