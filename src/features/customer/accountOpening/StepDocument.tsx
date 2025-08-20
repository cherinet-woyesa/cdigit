// src/components/accountOpening/StepDocument.tsx
import React, { useEffect, useState } from "react";
import { getRegions, getZones, getWoredas } from "../../../services/addressService";
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
    // Dynamic region/zone/woreda state
    const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
    const [zones, setZones] = useState<{ id: number; name: string; regionId: number }[]>([]);
    const [woredas, setWoredas] = useState<{ id: number; name: string; zoneId: number }[]>([]);
    const [regionLoading, setRegionLoading] = useState(false);
    const [zoneLoading, setZoneLoading] = useState(false);
    const [woredaLoading, setWoredaLoading] = useState(false);
    const [regionError, setRegionError] = useState<string | undefined>(undefined);
    const [zoneError, setZoneError] = useState<string | undefined>(undefined);
    const [woredaError, setWoredaError] = useState<string | undefined>(undefined);

    // File upload feedback
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | undefined>(undefined);

    useEffect(() => {
        setRegionLoading(true);
        getRegions()
            .then(setRegions)
            .catch(() => setRegionError("Failed to load regions"))
            .finally(() => setRegionLoading(false));
    }, []);

    useEffect(() => {
        if (!data.docRegionCitySubCity) {
            setZones([]);
            return;
        }
        setZoneLoading(true);
        setZoneError(undefined);
        const selectedRegion = regions.find(r => r.name === data.docRegionCitySubCity);
        if (!selectedRegion) {
            setZones([]);
            setZoneLoading(false);
            return;
        }
        getZones(selectedRegion.id)
            .then(setZones)
            .catch(() => setZoneError("Failed to load zones"))
            .finally(() => setZoneLoading(false));
    }, [data.docRegionCitySubCity, regions]);

    useEffect(() => {
        if (!data.docZone) {
            setWoredas([]);
            return;
        }
        setWoredaLoading(true);
        setWoredaError(undefined);
        const selectedZone = zones.find(z => z.name === data.docZone);
        if (!selectedZone) {
            setWoredas([]);
            setWoredaLoading(false);
            return;
        }
        getWoredas(selectedZone.id)
            .then(setWoredas)
            .catch(() => setWoredaError("Failed to load woredas"))
            .finally(() => setWoredaLoading(false));
    }, [data.docZone, zones]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'docRegionCitySubCity') {
            setData({ ...data, docRegionCitySubCity: value, docZone: '', docWeredaKebele: '' });
        } else if (name === 'docZone') {
            setData({ ...data, docZone: value, docWeredaKebele: '' });
        } else {
            setData({ ...data, [name]: value } as any);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileError(undefined);
        setFilePreview(null);
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            // Validate file type and size (max 2MB)
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
            // Split at 'T' to get only the date part (e.g., "2025-08-14")
            return isoDate.split("T")[0];
        } catch (e) {
            console.error("Invalid date format from backend:", isoDate);
            return "";
        }
    };

    // Local-only validation for formats and date ordering
    function isValidEmail(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    function isValidPhone(phone: string) {
        return /^09\d{8}$|^\+2519\d{8}$/.test(phone);
    }
    function isValidOfficePhone(phone: string) {
        if (!phone) return true;
        return /^\+251\d{8,9}$/.test(phone);
    }
    const localOnlyErrors: Partial<Record<keyof DocumentDetail, string>> = {};
    if (data.docEmail && !isValidEmail(data.docEmail)) {
        localOnlyErrors.docEmail = 'Invalid email format';
    }
    if (data.mobilePhoneNo && !isValidPhone(data.mobilePhoneNo)) {
        localOnlyErrors.mobilePhoneNo = 'Invalid Ethiopian phone number';
    }
    if (data.docOfficeTelephone && !isValidOfficePhone(data.docOfficeTelephone)) {
        localOnlyErrors.docOfficeTelephone = 'Office phone must start with +251 and be numeric (e.g., +251112345678)';
    }
    if (data.issueDate && data.expiryDate) {
        try {
            const issue = new Date(data.issueDate);
            const expiry = new Date(data.expiryDate);
            if (expiry < issue) {
                localOnlyErrors.expiryDate = 'Expiry date must be after issue date';
            }
        } catch {}
    }
    const mergedErrors = { ...errors, ...localOnlyErrors } as Errors<DocumentDetail>;
    const hasLocalErrors = Object.values(localOnlyErrors).some(Boolean);

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
                <Field label="ID Expiry Date" required error={mergedErrors.expiryDate}>
                    <input
                        type="date"
                        name="expiryDate" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={formatDateForInput(data.expiryDate)}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Mobile Phone" required error={mergedErrors.mobilePhoneNo}>
                    <input
                        type="tel"
                        name="mobilePhoneNo" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.mobilePhoneNo}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Document Region / City / Sub-City" error={errors.docRegionCitySubCity || regionError || undefined}>
                    {regionLoading ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                    ) : (
                        <select
                            className="form-select w-full p-2 rounded border"
                            name="docRegionCitySubCity"
                            value={data.docRegionCitySubCity || ''}
                            onChange={handleChange}
                        >
                            <option value="">Select</option>
                            {regions.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                            ))}
                        </select>
                    )}
                </Field>
                <Field label="Document Zone" error={zoneError || undefined}>
                    {zoneLoading ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                    ) : (
                        <select
                            className="form-select w-full p-2 rounded border"
                            name="docZone"
                            value={data.docZone || ''}
                            onChange={handleChange}
                            disabled={!data.docRegionCitySubCity || zoneLoading || zones.length === 0}
                        >
                            <option value="">Select</option>
                            {zones.map(z => (
                                <option key={z.id} value={z.name}>{z.name}</option>
                            ))}
                        </select>
                    )}
                </Field>
                <Field label="Document Woreda" error={woredaError || undefined}>
                    {woredaLoading ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                    ) : (
                        <select
                            className="form-select w-full p-2 rounded border"
                            name="docWeredaKebele"
                            value={data.docWeredaKebele || ''}
                            onChange={handleChange}
                            disabled={!data.docZone || woredaLoading || woredas.length === 0}
                        >
                            <option value="">Select</option>
                            {woredas.map(w => (
                                <option key={w.id} value={w.name}>{w.name}</option>
                            ))}
                        </select>
                    )}
                </Field>
                <Field label="Document House Number" error={errors.docHouseNumber}>
                    <input
                        type="text"
                        name="docHouseNumber"
                        className="form-input w-full p-2 rounded border"
                        value={data.docHouseNumber || ''}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Document Email" error={mergedErrors.docEmail}>
                    <input
                        type="email"
                        name="docEmail" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.docEmail || ''}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Document Office Telephone" error={mergedErrors.docOfficeTelephone}>
                    <input
                        type="tel"
                        name="docOfficeTelephone" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.docOfficeTelephone || ''}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Upload Photo of ID" required error={errors.docPhotoUrl || fileError || undefined}>
                    <input
                        type="file"
                        name="photoIdFile"
                        className="form-input w-full p-2 rounded border"
                        onChange={handleFileChange}
                        accept="image/*"
                    />
                    {filePreview && (
                        <div className="mt-2 flex flex-col items-center">
                            <img src={filePreview} alt="Preview" className="max-h-32 rounded shadow" />
                            <span className="text-xs text-gray-500 mt-1">Preview</span>
                        </div>
                    )}
                    {data.docPhotoUrl && !filePreview && (
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
                    disabled={submitting || hasLocalErrors}
                >
                    Next
                </button>
            </div>
        </>
    );
}