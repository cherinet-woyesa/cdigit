// src/components/accountOpening/StepDocument.tsx
import React from "react";
import { Field } from "./FormElements";
import type { DocumentDetail, Errors } from "./formTypes";

type StepDocumentProps = {
    data: DocumentDetail;
    setData: (d: DocumentDetail) => void;
    errors: Errors<DocumentDetail>;
    onNext: () => void;
    onBack: () => void;
    submitting: boolean;
};

export function StepDocument({ data, setData, errors, onNext, onBack, submitting }: StepDocumentProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setData({ ...data, photoIdFile: e.target.files[0] });
        } else {
            setData({ ...data, photoIdFile: undefined });
        }
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

    return (
        <>
            <div className="text-xl font-bold mb-3 text-fuchsia-800">Document Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="ID Type" required error={errors.idType}>
                    <select
                        className="form-select w-full p-2 rounded border"
                        name="idType" // Changed to camelCase
                        value={data.idType}
                        onChange={handleChange}
                    >
                        <option value="">Select</option>
                        <option value="National ID">National ID</option>
                        <option value="Passport">Passport</option>
                        <option value="Driver's License">Driver's License</option>
                        <option value="Resident Permit">Resident Permit</option>
                    </select>
                </Field>
                <Field label="ID / Passport No." required error={errors.idPassportNo}>
                    <input
                        type="text"
                        name="idPassportNo" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.idPassportNo}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Issued By" required error={errors.issuedBy}>
                    <input
                        type="text"
                        name="issuedBy" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.issuedBy}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="ID Issue Date" required error={errors.issueDate}>
                    <input
                        type="date"
                        name="issueDate" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={formatDateForInput(data.issueDate)}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="ID Expiry Date" required error={errors.expiryDate}>
                    <input
                        type="date"
                        name="expiryDate" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={formatDateForInput(data.expiryDate)}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Mobile Phone" required error={errors.mobilePhoneNo}>
                    <input
                        type="tel"
                        name="mobilePhoneNo" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.mobilePhoneNo}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Document Region / City / Sub-City" error={errors.docRegionCitySubCity}>
                    <input
                        type="text"
                        name="docRegionCitySubCity" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.docRegionCitySubCity || ''}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Document Wereda / Kebele" error={errors.docWeredaKebele}>
                    <input
                        type="text"
                        name="docWeredaKebele" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.docWeredaKebele || ''}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Document House Number" error={errors.docHouseNumber}>
                    <input
                        type="text"
                        name="docHouseNumber" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.docHouseNumber || ''}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Document Email" error={errors.docEmail}>
                    <input
                        type="email"
                        name="docEmail" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.docEmail || ''}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Document Office Telephone" error={errors.docOfficeTelephone}>
                    <input
                        type="tel"
                        name="docOfficeTelephone" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.docOfficeTelephone || ''}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Upload Photo of ID" required error={errors.docPhotoUrl}>
                    <input
                        type="file"
                        name="photoIdFile" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        onChange={handleFileChange}
                        accept="image/*"
                    />
                    {data.docPhotoUrl && (
                        <p className="text-sm text-gray-500 mt-1">Uploaded: {data.docPhotoUrl}</p>
                    )}
                </Field>
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