import React, { useEffect, useState } from "react";
import Field from "@components/form/Field";
import { getAccountTypes } from "@services/accountTypeService";
import type { PersonalDetail, Errors } from "@features/customer/forms/accountOpening/types/formTypes";
import { Loader2, ChevronRight, User, Calendar, GraduationCap, Globe } from 'lucide-react';

export const validate = (data: PersonalDetail): Errors<PersonalDetail> => {
    const newErrors: Errors<PersonalDetail> = {};
    if (!data.accountType) newErrors.accountType = "Account Type is required";
    if (!data.title) newErrors.title = "Title is required";
    if (!data.firstName) newErrors.firstName = "First Name is required";
    if (!data.grandfatherName) newErrors.grandfatherName = "Grandfather's Name is required";
    if (!data.sex) newErrors.sex = "Sex is required";
    if (!data.dateOfBirth) {
        newErrors.dateOfBirth = "Date of Birth is required";
    } else {
        const dob = new Date(data.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        const d = today.getDate() - dob.getDate();
        let is18 = age > 18 || (age === 18 && (m > 0 || (m === 0 && d >= 0)));
        if (!is18) {
            newErrors.dateOfBirth = "You must be at least 18 years old to open an account.";
        }
    }
    if (!data.maritalStatus) newErrors.maritalStatus = "Marital Status is required";
    if (!data.nationality) newErrors.nationality = "Nationality is required";
    return newErrors;
};

type StepPersonalProps = {
    data: PersonalDetail;
    setData: (d: PersonalDetail) => void;
    errors: Errors<PersonalDetail>;
    onNext: (errors: Errors<PersonalDetail>) => void;
    submitting: boolean;
};

export function StepPersonal({ data, setData, errors, onNext, submitting }: StepPersonalProps) {
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    const formatDateForInput = (isoDate: string | undefined): string => {
        if (!isoDate) return "";
        try {
            return isoDate.split("T")[0];
        } catch (e) {
            console.error("Invalid date format:", isoDate);
            return "";
        }
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
            <input
                type="radio"
                name={name}
                value={value}
                checked={currentValue === value}
                onChange={() => onChange(value)}
                className="hidden"
            />
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
                    <User className="h-5 w-5 text-fuchsia-700" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                    <p className="text-gray-600 text-sm">Tell us about yourself</p>
                </div>
            </div>

            {Object.keys(errors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm font-medium">Please check the highlighted fields below</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Account Type */}
                <Field label="Account Type" required error={errors.accountType}>
                    {loading ? (
                        <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading account types...
                        </div>
                    ) : fetchError ? (
                        <div className="text-red-600 text-sm">{fetchError}</div>
                    ) : (
                        <select
                            className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors bg-white"
                            name="accountType"
                            value={data.accountType}
                            onChange={handleChange}
                        >
                            <option value="">Select account type</option>
                            {accountTypes.map((type) => (
                                <option key={type.id} value={type.name}>{type.name}</option>
                            ))}
                        </select>
                    )}
                </Field>

                {/* Title */}
                <Field label="Title" required error={errors.title}>
                    <div className="flex flex-wrap gap-2">
                        {["Mr.", "Mrs.", "Miss", "Ms.", "Dr."].map((title) => (
                            <RadioOption
                                key={title}
                                value={title}
                                currentValue={data.title}
                                label={title}
                                onChange={(value) => setData({ ...data, title: value })}
                                name="title"
                            />
                        ))}
                    </div>
                </Field>

                {/* First Name */}
                <Field label="First Name" required error={errors.firstName}>
                    <div className="relative">
                        <input
                            type="text"
                            name="firstName"
                            className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
                            value={data.firstName}
                            onChange={handleChange}
                            placeholder="Your given name"
                        />
                    </div>
                </Field>

                {/* Middle Name */}
                <Field label="Middle Name" error={errors.middleName}>
                    <input
                        type="text"
                        name="middleName"
                        className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
                        value={data.middleName || ""}
                        onChange={handleChange}
                        placeholder="Optional"
                    />
                </Field>

                {/* Grandfather's Name */}
                <Field label="Grandfather's Name" required error={errors.grandfatherName}>
                    <input
                        type="text"
                        name="grandfatherName"
                        className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
                        value={data.grandfatherName}
                        onChange={handleChange}
                        placeholder="Father's father name"
                    />
                </Field>

                {/* Mother's Full Name */}
                <Field label="Mother's Full Name" error={errors.motherFullName}>
                    <input
                        type="text"
                        name="motherFullName"
                        className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
                        value={data.motherFullName || ""}
                        onChange={handleChange}
                        placeholder="Optional"
                    />
                </Field>

                {/* Sex */}
                <Field label="Sex" required error={errors.sex}>
                    <div className="flex gap-2">
                        {["Male", "Female"].map((sex) => (
                            <RadioOption
                                key={sex}
                                value={sex}
                                currentValue={data.sex}
                                label={sex}
                                onChange={(value) => setData({ ...data, sex: value })}
                                name="sex"
                            />
                        ))}
                    </div>
                </Field>

                {/* Date of Birth */}
                <Field label="Date of Birth" required error={errors.dateOfBirth}>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="date"
                            name="dateOfBirth"
                            className="w-full pl-10 p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
                            value={formatDateForInput(data.dateOfBirth)}
                            onChange={handleChange}
                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                        />
                    </div>
                </Field>

                {/* Place of Birth */}
                <Field label="Place of Birth" error={errors.placeOfBirth}>
                    <input
                        type="text"
                        name="placeOfBirth"
                        className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
                        value={data.placeOfBirth || ""}
                        onChange={handleChange}
                        placeholder="City or town"
                    />
                </Field>

                {/* Marital Status */}
                <Field label="Marital Status" required error={errors.maritalStatus}>
                    <div className="grid grid-cols-2 gap-2">
                        {["Single", "Married", "Divorced", "Widowed"].map((status) => (
                            <RadioOption
                                key={status}
                                value={status}
                                currentValue={data.maritalStatus}
                                label={status}
                                onChange={(value) => setData({ ...data, maritalStatus: value })}
                                name="maritalStatus"
                            />
                        ))}
                    </div>
                </Field>

                {/* Education Qualification */}
                <Field label="Education Qualification" error={errors.educationQualification}>
                    <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                            className="w-full pl-10 p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors bg-white"
                            name="educationQualification"
                            value={data.educationQualification || ""}
                            onChange={handleChange}
                        >
                            <option value="">Select education level</option>
                            <option value="None">None</option>
                            <option value="Primary">Primary</option>
                            <option value="Secondary">Secondary</option>
                            <option value="Diploma">Diploma</option>
                            <option value="Degree">Degree</option>
                            <option value="Masters">Masters</option>
                            <option value="PhD">PhD</option>
                        </select>
                    </div>
                </Field>

                {/* Nationality */}
                <Field label="Nationality" required error={errors.nationality}>
                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <div className="flex gap-2 pl-8">
                            {["Ethiopian", "Foreign National"].map((nation) => (
                                <RadioOption
                                    key={nation}
                                    value={nation}
                                    currentValue={data.nationality}
                                    label={nation}
                                    onChange={(value) => setData({ ...data, nationality: value })}
                                    name="nationality"
                                />
                            ))}
                        </div>
                    </div>
                </Field>
            </div>

            {/* Navigation */}
            <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
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