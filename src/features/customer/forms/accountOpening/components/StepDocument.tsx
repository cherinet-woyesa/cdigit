// src/components/accountOpening/StepDocument.tsx
import React, { useState } from "react";
import Field from '../../../../../components/Field';
import type { DocumentDetail, Errors } from "../../../../../types/formTypes";

export const validate = (data: DocumentDetail): Errors<DocumentDetail> => {
    const newErrors: Errors<DocumentDetail> = {};
    if (!data.idType) newErrors.idType = "ID Type is required";
    if (!data.idPassportNo) newErrors.idPassportNo = "ID / Passport No. is required";
    if (!data.issuedBy) newErrors.issuedBy = "Issued By is required";
    if (!data.issueDate) newErrors.issueDate = "Issue Date is required";
    if (!data.expiryDate) newErrors.expiryDate = "Expiry Date is required";
    if (data.issueDate && data.expiryDate) {
        try {
            const issue = new Date(data.issueDate);
            const expiry = new Date(data.expiryDate);
            if (expiry < issue) {
                newErrors.expiryDate = 'Expiry date must be after issue date';
            }
        } catch {}
    }
    if (!data.mobilePhoneNo) {
        newErrors.mobilePhoneNo = "Mobile Phone is required";
    } else if (!/^09\d{8}$|^\+2519\d{8}$/.test(data.mobilePhoneNo)) {
        newErrors.mobilePhoneNo = 'Invalid Ethiopian phone number';
    }
    if (!data.photoIdFile && !data.docPhotoUrl) newErrors.docPhotoUrl = "Document photo is required";
    // Email is now optional
    // if (data.docEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.docEmail)) {
    //     newErrors.docEmail = 'Invalid email format';
    // }
    return newErrors;
};

type StepDocumentProps = {
    data: DocumentDetail;
    setData: (d: DocumentDetail) => void;
    errors: Errors<DocumentDetail>;
    onNext: (errors: Errors<DocumentDetail>) => void;
    onBack: () => void;
    submitting: boolean;
};

export function StepDocument({ data, setData, errors, onNext, onBack, submitting }: StepDocumentProps) {
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | undefined>(undefined);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value } as any);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileError(undefined);
        setFilePreview(null);
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setFileError('Only image files are allowed.');
                setData({ ...data, photoIdFile: undefined });
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                setFileError('File size must be less than 2MB.');
                setData({ ...data, photoIdFile: undefined });
                return;
            }
            setData({ ...data, photoIdFile: file });
            const reader = new FileReader();
            reader.onload = (ev) => {
                setFilePreview(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setData({ ...data, photoIdFile: undefined });
        }
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

    return (
        <div className="container mx-auto px-2 py-6 max-w-4xl">
            <div className="text-xl font-bold mb-3 text-fuchsia-800">Document Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-1">
                <Field label="ID Type" required error={errors.idType}>
                    <select
                        className="form-select w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors bg-white shadow-sm"
                        name="idType"
                        value={data.idType}
                        onChange={handleChange}
                    >
                        <option value="">Select ID Type</option>
                        <option value="National ID">National ID</option>
                        <option value="Passport">Passport</option>
                        <option value="Driver's License">Driver's License</option>
                        <option value="Resident Permit">Resident Permit</option>
                    </select>
                </Field>
                <Field label="ID / Passport No." required error={errors.idPassportNo}>
                    <input
                        type="text"
                        name="idPassportNo"
                        className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.idPassportNo}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Issued By" required error={errors.issuedBy}>
                    <input
                        type="text"
                        name="issuedBy"
                        className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.issuedBy}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="ID Issue Date" required error={errors.issueDate}>
                    <input
                        type="date"
                        name="issueDate"
                        className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={formatDateForInput(data.issueDate)}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="ID Expiry Date" required error={errors.expiryDate}>
                    <input
                        type="date"
                        name="expiryDate"
                        className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={formatDateForInput(data.expiryDate)}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Mobile Phone" required error={errors.mobilePhoneNo}>
                    <input
                        type="tel"
                        name="mobilePhoneNo"
                        className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.mobilePhoneNo}
                        onChange={handleChange}
                    />
                </Field>
                
                {/* <Field label="Document Region / City / Sub-City" error={errors.docRegionCitySubCity}>
                    <input
                        type="text"
                        name="docRegionCitySubCity"
                        className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.docRegionCitySubCity || ''}
                        onChange={handleChange}
                    />
                </Field> */}

                {/* <Field label="Document Zone" error={errors.docZone}>
                    <input
                        type="text"
                        name="docZone"
                        className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.docZone || ''}
                        onChange={handleChange}
                    />
                </Field> */}

                {/* <Field label="Document Woreda" error={errors.docWeredaKebele}>
                    <input
                        type="text"
                        name="docWeredaKebele"
                        className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.docWeredaKebele || ''}
                        onChange={handleChange}
                    />
                </Field> */}

                {/* <Field label="Document House Number" error={errors.docHouseNumber}>
                    <input
                        type="text"
                        name="docHouseNumber"
                        className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.docHouseNumber || ''}
                        onChange={handleChange}
                    />
                </Field> */}

                <Field label="Email" error={errors.docEmail}>
                    <input
                        type="email"
                        name="docEmail"
                        className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.docEmail || ''}
                        onChange={handleChange}
                        placeholder="email (optional)"
                    />
                </Field>

                {/* <Field label="Document Office Telephone" error={errors.docOfficeTelephone}>
                    <input
                        type="tel"
                        name="docOfficeTelephone"
                        className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.docOfficeTelephone || ''}
                        onChange={handleChange}
                    />
                </Field> */}

                <Field label="Upload Photo of ID" required error={errors.docPhotoUrl || fileError}>
                    <input
                        type="file"
                        name="photoIdFile"
                        className="form-input w-full p-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100"
                        onChange={handleFileChange}
                        accept="image/*"
                    />
                    {filePreview && (
                        <div className="mt-2 flex flex-col items-center">
                            <img src={filePreview} alt="Preview" className="max-h-32 rounded shadow border-2 border-fuchsia-200" />
                        </div>
                    )}
                    {data.docPhotoUrl && !filePreview && (
                        <p className="text-sm text-gray-500 mt-1">Current: <span className="break-all">{data.docPhotoUrl}</span></p>
                    )}
                </Field>
            </div>
            <div className="flex justify-between mt-10">
                <button
  type="button"
  className="px-6 py-2 rounded-lg font-semibold shadow bg-gray-300 text-fuchsia-700 hover:bg-gray-400 transition"
  onClick={onBack}
>
  Back
</button>
<button
  type="button"
  className={`px-6 py-2 rounded-lg font-semibold shadow-lg transition transform duration-200 
    ${submitting 
      ? 'bg-fuchsia-300 cursor-not-allowed text-white' 
      : 'bg-fuchsia-700 text-white hover:bg-fuchsia-800 hover:scale-105'}`}
  onClick={handleNext}
  disabled={submitting}
>
  {submitting ? 'Saving...' : 'Next'}
</button>

            </div>
        </div>
    );
}
