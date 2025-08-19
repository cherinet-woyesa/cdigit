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
        <>
            <div className="text-xl font-bold mb-3 text-fuchsia-800">Personal Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Account Type" required error={errors.accountType}>
                    {loading ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                    ) : fetchError ? (
                        <div className="text-sm text-red-600">{fetchError}</div>
                    ) : (
                        <select
                            className="form-select w-full p-2 rounded border"
                            name="accountType"
                            value={data.accountType}
                            onChange={handleChange}
                            disabled={loading || accountTypes.length === 0}
                        >
                            <option value="">Select</option>
                            {accountTypes.map((type) => (
                                <option key={type.id} value={type.name}>{type.name}</option>
                            ))}
                        </select>
                    )}
                </Field>
                <Field label="Title" required error={errors.title}>
                    <div className="flex gap-3">
                        {["Mr.", "Mrs.", "Miss", "Ms.", "Dr."].map((t) => (
                            <label key={t} className="flex items-center space-x-1">
                                <input
                                    type="radio"
                                    name="title" // Changed to camelCase
                                    value={t}
                                    checked={data.title === t}
                                    onChange={handleChange}
                                />
                                <span>{t}</span>
                            </label>
                        ))}
                    </div>
                </Field>
                <Field label="First Name" required error={errors.firstName}>
                    <input
                        type="text"
                        name="firstName" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.firstName}
                        onChange={handleChange}
                        placeholder="First Name"
                    />
                </Field>
                <Field label="Middle Name" error={errors.middleName}>
                    <input
                        type="text"
                        name="middleName" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.middleName || ""}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Grandfather's Name" required error={errors.grandfatherName}>
                    <input
                        type="text"
                        name="grandfatherName" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.grandfatherName}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Mother's Full Name" error={errors.motherFullName}>
                    <input
                        type="text"
                        name="motherFullName" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.motherFullName || ""}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Sex" required error={errors.sex}>
                    <div className="flex gap-3">
                        {["Male", "Female"].map((s) => (
                            <label key={s} className="flex items-center space-x-1">
                                <input
                                    type="radio"
                                    name="sex" // Changed to camelCase
                                    value={s}
                                    checked={data.sex === s}
                                    onChange={handleChange}
                                />
                                <span>{s}</span>
                            </label>
                        ))}
                    </div>
                </Field>
                <Field label="Date of Birth" required error={errors.dateOfBirth}>
                    <input
                        type="date"
                        name="dateOfBirth"
                        className="form-input w-full p-2 rounded border"
                        value={formatDateForInput(data.dateOfBirth)}
                        onChange={handleChange}
                        max={(() => {
                            const d = new Date();
                            d.setFullYear(d.getFullYear() - 18);
                            return d.toISOString().split('T')[0];
                        })()}
                    />
                </Field>
                <Field label="Place of Birth" error={errors.placeOfBirth}>
                    <input
                        type="text"
                        name="placeOfBirth" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.placeOfBirth || ""}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Marital Status" required error={errors.maritalStatus}>
                    <div className="flex gap-3">
                        {["Single", "Married", "Divorced", "Widowed"].map((m) => (
                            <label key={m} className="flex items-center space-x-1">
                                <input
                                    type="radio"
                                    name="maritalStatus" // Changed to camelCase
                                    value={m}
                                    checked={data.maritalStatus === m}
                                    onChange={handleChange}
                                />
                                <span>{m}</span>
                            </label>
                        ))}
                    </div>
                </Field>
                <Field label="Education Qualification" error={errors.educationQualification}>
                    <select
                        className="form-select w-full p-2 rounded border"
                        name="educationQualification" // Changed to camelCase
                        value={data.educationQualification || ""}
                        onChange={handleChange}
                    >
                        <option value="">Select</option>
                        <option value="None">None</option>
                        <option value="Primary">Primary</option>
                        <option value="Secondary">Secondary</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Degree">Degree</option>
                        <option value="Masters">Masters</option>
                        <option value="PhD">PhD</option>
                    </select>
                </Field>
                <Field label="Nationality" required error={errors.nationality}>
                    <div className="flex gap-3">
                        {["Ethiopian", "Foreign National"].map((n) => (
                            <label key={n} className="flex items-center space-x-1">
                                <input
                                    type="radio"
                                    name="nationality" // Changed to camelCase
                                    value={n}
                                    checked={data.nationality === n}
                                    onChange={handleChange}
                                />
                                <span>{n}</span>
                            </label>
                        ))}
                    </div>
                </Field>
            </div>
            <div className="flex justify-end mt-6">
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