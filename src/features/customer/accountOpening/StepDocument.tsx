// src/components/accountOpening/StepDocument.tsx
import React, { useEffect, useState, useRef } from "react";
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
            .then(res => {
                let arr = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
                setRegions(arr);
            })
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
            .then(res => {
                let arr = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
                setZones(arr);
            })
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
            .then(res => {
                let arr = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
                setWoredas(arr);
            })
            .catch(() => setWoredaError("Failed to load woredas"))
            .finally(() => setWoredaLoading(false));
    }, [data.docZone, zones]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'docRegionCitySubCity') {
            setData({ ...data, docRegionCitySubCity: value, docZone: '', docWeredaKebele: '' });
            setZones([]); // Reset zones and woredas visually
            setWoredas([]);
        } else if (name === 'docZone') {
            setData({ ...data, docZone: value, docWeredaKebele: '' });
            setWoredas([]); // Reset woredas visually
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


    // Validation helpers
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

    // Show errors only after Next is clicked

    const [touchedNext, setTouchedNext] = useState(false);
    const [localErrors, setLocalErrors] = useState<Partial<Record<keyof DocumentDetail, string>>>({});
    const errorRefs = useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | null }>({});

    function validateAll() {
        const errs: Partial<Record<keyof DocumentDetail, string>> = {};
        if (data.docEmail && !isValidEmail(data.docEmail)) {
            errs.docEmail = 'Invalid email format';
        }
        if (data.mobilePhoneNo && !isValidPhone(data.mobilePhoneNo)) {
            errs.mobilePhoneNo = 'Invalid Ethiopian phone number';
        }
        if (data.docOfficeTelephone && !isValidOfficePhone(data.docOfficeTelephone)) {
            errs.docOfficeTelephone = 'Office phone must start with +251 and be numeric (e.g., +251112345678)';
        }
        if (data.issueDate && data.expiryDate) {
            try {
                const issue = new Date(data.issueDate);
                const expiry = new Date(data.expiryDate);
                if (expiry < issue) {
                    errs.expiryDate = 'Expiry date must be after issue date';
                }
            } catch {}
        }
        // Required fields (add more as needed)
        if (!data.idType) errs.idType = 'ID Type is required';
        if (!data.idPassportNo) errs.idPassportNo = 'ID / Passport No. is required';
        if (!data.issuedBy) errs.issuedBy = 'Issued By is required';
        if (!data.issueDate) errs.issueDate = 'Issue Date is required';
        if (!data.expiryDate) errs.expiryDate = 'Expiry Date is required';
        if (!data.mobilePhoneNo) errs.mobilePhoneNo = 'Mobile Phone is required';
        return errs;
    }

    const handleNext = () => {
        setTouchedNext(true);
        const errs = validateAll();
        setLocalErrors(errs);
        // Scroll to first error field
        if (Object.values(errs).some(Boolean)) {
            const firstErrorKey = Object.keys(errs)[0];
            if (firstErrorKey && errorRefs.current[firstErrorKey]) {
                errorRefs.current[firstErrorKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                errorRefs.current[firstErrorKey]?.focus();
            }
            return;
        }
        onNext();
    };

    // Error summary for accessibility and clarity
    const errorList = touchedNext ? Object.values(localErrors).filter(Boolean) : [];

    return (
        <>
            <div className="text-xl font-bold mb-3 text-fuchsia-800">Document Details</div>
            {errorList.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded text-red-700" role="alert" aria-live="assertive">
                    <strong className="block mb-1">Please fill the following:</strong>
                    <ul className="list-disc list-inside text-sm">
                        {errorList.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="ID Type" required error={touchedNext ? localErrors.idType : undefined}>
                    <select
                        className={`form-select w-full p-2 rounded border focus:ring-2 focus:ring-fuchsia-500 ${touchedNext && localErrors.idType ? 'border-red-500' : ''}`}
                        name="idType"
                        value={data.idType}
                        onChange={handleChange}
                        ref={el => { errorRefs.current.idType = el; }}
                        aria-invalid={!!(touchedNext && localErrors.idType)}
                        aria-describedby={touchedNext && localErrors.idType ? 'idType-error' : undefined}
                    >
                        <option value="">Select</option>
                        <option value="National ID">National ID</option>
                        <option value="Passport">Passport</option>
                        <option value="Driver's License">Driver's License</option>
                        <option value="Resident Permit">Resident Permit</option>
                    </select>
                </Field>
                <Field label="ID / Passport No." required error={touchedNext ? localErrors.idPassportNo : undefined}>
                    <input
                        type="text"
                        name="idPassportNo"
                        className={`form-input w-full p-2 rounded border focus:ring-2 focus:ring-fuchsia-500 ${touchedNext && localErrors.idPassportNo ? 'border-red-500' : ''}`}
                        value={data.idPassportNo}
                        onChange={handleChange}
                        ref={el => { errorRefs.current.idPassportNo = el; }}
                        aria-invalid={!!(touchedNext && localErrors.idPassportNo)}
                        aria-describedby={touchedNext && localErrors.idPassportNo ? 'idPassportNo-error' : undefined}
                    />
                </Field>
                <Field label="Issued By" required error={touchedNext ? localErrors.issuedBy : undefined}>
                    <input
                        type="text"
                        name="issuedBy"
                        className={`form-input w-full p-2 rounded border focus:ring-2 focus:ring-fuchsia-500 ${touchedNext && localErrors.issuedBy ? 'border-red-500' : ''}`}
                        value={data.issuedBy}
                        onChange={handleChange}
                        ref={el => { errorRefs.current.issuedBy = el; }}
                        aria-invalid={!!(touchedNext && localErrors.issuedBy)}
                        aria-describedby={touchedNext && localErrors.issuedBy ? 'issuedBy-error' : undefined}
                    />
                </Field>
                <Field label="ID Issue Date" required error={touchedNext ? localErrors.issueDate : undefined}>
                    <input
                        type="date"
                        name="issueDate"
                        className={`form-input w-full p-2 rounded border focus:ring-2 focus:ring-fuchsia-500 ${touchedNext && localErrors.issueDate ? 'border-red-500' : ''}`}
                        value={formatDateForInput(data.issueDate)}
                        onChange={handleChange}
                        ref={el => { errorRefs.current.issueDate = el; }}
                        aria-invalid={!!(touchedNext && localErrors.issueDate)}
                        aria-describedby={touchedNext && localErrors.issueDate ? 'issueDate-error' : undefined}
                    />
                </Field>
                <Field label="ID Expiry Date" required error={touchedNext ? localErrors.expiryDate : undefined}>
                    <input
                        type="date"
                        name="expiryDate"
                        className={`form-input w-full p-2 rounded border focus:ring-2 focus:ring-fuchsia-500 ${touchedNext && localErrors.expiryDate ? 'border-red-500' : ''}`}
                        value={formatDateForInput(data.expiryDate)}
                        onChange={handleChange}
                        ref={el => { errorRefs.current.expiryDate = el; }}
                        aria-invalid={!!(touchedNext && localErrors.expiryDate)}
                        aria-describedby={touchedNext && localErrors.expiryDate ? 'expiryDate-error' : undefined}
                    />
                </Field>
                <Field label="Mobile Phone" required error={touchedNext ? localErrors.mobilePhoneNo : undefined}>
                    <input
                        type="tel"
                        name="mobilePhoneNo"
                        className={`form-input w-full p-2 rounded border focus:ring-2 focus:ring-fuchsia-500 ${touchedNext && localErrors.mobilePhoneNo ? 'border-red-500' : ''}`}
                        value={data.mobilePhoneNo}
                        onChange={handleChange}
                        ref={el => { errorRefs.current.mobilePhoneNo = el; }}
                        aria-invalid={!!(touchedNext && localErrors.mobilePhoneNo)}
                        aria-describedby={touchedNext && localErrors.mobilePhoneNo ? 'mobilePhoneNo-error' : undefined}
                    />
                </Field>
                <Field label="Document Region / City / Sub-City" error={errors.docRegionCitySubCity || regionError || undefined}>
                    {regionLoading ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                    ) : regionError ? (
                        <div className="text-sm text-red-600">{regionError}</div>
                    ) : (
                        <select
                            className="form-select w-full p-2 rounded border focus:ring-2 focus:ring-fuchsia-500"
                            name="docRegionCitySubCity"
                            value={data.docRegionCitySubCity || ''}
                            onChange={handleChange}
                            aria-label="Select region or city"
                        >
                            <option value="">Select</option>
                            {regions.length === 0 ? (
                                <option value="" disabled>No options available</option>
                            ) : (
                                regions.map(r => (
                                    <option key={r.id} value={r.name}>{r.name}</option>
                                ))
                            )}
                        </select>
                    )}
                </Field>
                <Field label="Document Zone" error={zoneError || undefined}>
                    {zoneLoading ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                    ) : zoneError ? (
                        <div className="text-sm text-red-600">{zoneError}</div>
                    ) : (
                        <select
                            className="form-select w-full p-2 rounded border focus:ring-2 focus:ring-fuchsia-500"
                            name="docZone"
                            value={data.docZone || ''}
                            onChange={handleChange}
                            disabled={!data.docRegionCitySubCity || zoneLoading || zones.length === 0}
                            aria-label="Select zone"
                        >
                            <option value="">Select</option>
                            {zones.length === 0 ? (
                                <option value="" disabled>No options available</option>
                            ) : (
                                zones.map(z => (
                                    <option key={z.id} value={z.name}>{z.name}</option>
                                ))
                            )}
                        </select>
                    )}
                </Field>
                <Field label="Document Woreda" error={woredaError || undefined}>
                    {woredaLoading ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                    ) : woredaError ? (
                        <div className="text-sm text-red-600">{woredaError}</div>
                    ) : (
                        <select
                            className="form-select w-full p-2 rounded border focus:ring-2 focus:ring-fuchsia-500"
                            name="docWeredaKebele"
                            value={data.docWeredaKebele || ''}
                            onChange={handleChange}
                            disabled={!data.docZone || woredaLoading || woredas.length === 0}
                            aria-label="Select woreda"
                        >
                            <option value="">Select</option>
                            {woredas.length === 0 ? (
                                <option value="" disabled>No options available</option>
                            ) : (
                                woredas.map(w => (
                                    <option key={w.id} value={w.name}>{w.name}</option>
                                ))
                            )}
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
                <Field label="Document Email" error={touchedNext ? localErrors.docEmail : undefined}>
                    <input
                        type="email"
                        name="docEmail"
                        className={`form-input w-full p-2 rounded border focus:ring-2 focus:ring-fuchsia-500 ${touchedNext && localErrors.docEmail ? 'border-red-500' : ''}`}
                        value={data.docEmail || ''}
                        onChange={handleChange}
                        ref={el => { errorRefs.current.docEmail = el; }}
                        aria-invalid={!!(touchedNext && localErrors.docEmail)}
                        aria-describedby={touchedNext && localErrors.docEmail ? 'docEmail-error' : undefined}
                    />
                </Field>
                <Field label="Document Office Telephone" error={touchedNext ? localErrors.docOfficeTelephone : undefined}>
                    <input
                        type="tel"
                        name="docOfficeTelephone"
                        className={`form-input w-full p-2 rounded border focus:ring-2 focus:ring-fuchsia-500 ${touchedNext && localErrors.docOfficeTelephone ? 'border-red-500' : ''}`}
                        value={data.docOfficeTelephone || ''}
                        onChange={handleChange}
                        ref={el => { errorRefs.current.docOfficeTelephone = el; }}
                        aria-invalid={!!(touchedNext && localErrors.docOfficeTelephone)}
                        aria-describedby={touchedNext && localErrors.docOfficeTelephone ? 'docOfficeTelephone-error' : undefined}
                    />
                </Field>
                <Field label="Upload Photo of ID" required error={errors.docPhotoUrl || fileError || undefined}>
                    <input
                        type="file"
                        name="photoIdFile"
                        className="form-input w-full p-2 rounded border focus:ring-2 focus:ring-fuchsia-500"
                        onChange={handleFileChange}
                        accept="image/*"
                        aria-label="Upload photo of ID"
                    />
                    {filePreview && (
                        <div className="mt-2 flex flex-col items-center">
                            <img src={filePreview} alt="Preview" className="max-h-32 rounded shadow border-2 border-fuchsia-200" />
                            <span className="text-xs text-gray-500 mt-1">Preview</span>
                        </div>
                    )}
                    {data.docPhotoUrl && !filePreview && (
                        <p className="text-sm text-gray-500 mt-1">Uploaded: <span className="break-all">{data.docPhotoUrl}</span></p>
                    )}
                    {fileError && (
                        <div className="text-sm text-red-600 mt-1">{fileError}</div>
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
                    onClick={handleNext}
                    disabled={submitting}
                >
                    Next
                </button>
            </div>
        </>
    );
}