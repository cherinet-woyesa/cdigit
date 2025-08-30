// src/components/accountOpening/StepAddress.tsx
import React, { useEffect, useState } from "react";
// Helper to get the phone number the user started with from localStorage
function getStartedPhoneNumber() {
    return localStorage.getItem("accountOpeningPhoneNumberInput") || "";
}
import { getRegions, getZones, getWoredas } from "../../../services/addressService";
import { Field } from "./FormElements";
import type { AddressDetail, Errors } from "./formTypes";

type StepAddressProps = {
    data: AddressDetail;
    setData: (d: AddressDetail) => void;
    errors: Errors<AddressDetail>;
    setErrors?: (e: Errors<AddressDetail>) => void; // Optional, for parent error state
    onNext: () => void;
    onBack: () => void;
    submitting: boolean;
};

export function StepAddress({ data, setData, errors, setErrors, onNext, onBack, submitting }: StepAddressProps) {

    // Autofill mobilePhone with the started phone number if empty
    useEffect(() => {
        const startedPhone = getStartedPhoneNumber();
        if (!data.mobilePhone && startedPhone) {
            setData({ ...data, mobilePhone: startedPhone });
        }
    }, []); // Only on mount
    const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
    const [zones, setZones] = useState<{ id: number; name: string; regionId: number }[]>([]);
    const [woredas, setWoredas] = useState<{ id: number; name: string; zoneId: number }[]>([]);
    const [regionLoading, setRegionLoading] = useState(false);
    const [zoneLoading, setZoneLoading] = useState(false);
    const [woredaLoading, setWoredaLoading] = useState(false);
    const [regionError, setRegionError] = useState<string | undefined>(undefined);
    const [zoneError, setZoneError] = useState<string | undefined>(undefined);
    const [woredaError, setWoredaError] = useState<string | undefined>(undefined);

    useEffect(() => {
        setRegionLoading(true);
        getRegions()
            .then(res => setRegions(Array.isArray(res) ? res : (res.data || [])))
            .catch(() => setRegionError("Failed to load regions"))
            .finally(() => setRegionLoading(false));
    }, []);

    useEffect(() => {
        if (!data.regionCityAdministration) {
            setZones([]);
            return;
        }
        setZoneLoading(true);
        setZoneError(undefined);
        const selectedRegion = regions.find(r => r.name === data.regionCityAdministration);
        if (!selectedRegion) {
            setZones([]);
            setZoneLoading(false);
            return;
        }
        getZones(selectedRegion.id)
            .then(res => setZones(Array.isArray(res) ? res : (res.data || [])))
            .catch(() => setZoneError("Failed to load zones"))
            .finally(() => setZoneLoading(false));
    }, [data.regionCityAdministration, regions]);

    useEffect(() => {
        if (!data.zone) {
            setWoredas([]);
            return;
        }
        setWoredaLoading(true);
        setWoredaError(undefined);
        const selectedZone = zones.find(z => z.name === data.zone);
        if (!selectedZone) {
            setWoredas([]);
            setWoredaLoading(false);
            return;
        }
        getWoredas(selectedZone.id)
            .then(res => setWoredas(Array.isArray(res) ? res : (res.data || [])))
            .catch(() => setWoredaError("Failed to load woredas"))
            .finally(() => setWoredaLoading(false));
    }, [data.zone, zones]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };


    // Email and phone validation helpers
    function isValidEmail(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    function isValidPhone(phone: string) {
        // Ethiopian mobile: starts with 09 or +2519, 10 digits
        return /^09\d{8}$|^\+2519\d{8}$/.test(phone);
    }
    function isValidOfficePhone(phone: string) {
        // Allow empty, or must start with +251 and be numeric (Ethiopian format)
        if (!phone) return true;
        return /^\+251\d{8,9}$/.test(phone);
    }

    // Only validate mobilePhone live (for required/format), others on Next
    const localErrors: Partial<typeof errors> = { ...errors };
    if (data.mobilePhone && !isValidPhone(data.mobilePhone)) {
        localErrors.mobilePhone = "Invalid Ethiopian phone number";
    }

    // Validate officePhone and emailAddress only on Next
    const [touchedNext, setTouchedNext] = useState(false);

    function validateOnNext() {
        const nextErrors: Partial<typeof errors> = { ...errors };
        if (data.emailAddress && !isValidEmail(data.emailAddress)) {
            nextErrors.emailAddress = "Invalid email format";
        } else {
            delete nextErrors.emailAddress;
        }
        if (data.officePhone && !isValidOfficePhone(data.officePhone)) {
            nextErrors.officePhone = "Office phone must start with +251 and be numeric (e.g., +251112345678)";
        } else {
            delete nextErrors.officePhone;
        }
        // Required checks (if not already handled by parent)
        if (!data.emailAddress) {
            nextErrors.emailAddress = "Email is required";
        }
        if (!data.mobilePhone) {
            nextErrors.mobilePhone = "Mobile phone is required";
        }
        // Add other required checks as needed
        return nextErrors;
    }

    const handleNext = () => {
        setTouchedNext(true);
        const nextErrors = validateOnNext();
        if (setErrors) setErrors(nextErrors as Errors<AddressDetail>);
        // Only proceed if no errors
        const hasError = Object.values(nextErrors).some(Boolean);
        if (!hasError) {
            onNext();
        }
    };

    return (
        <>
            <div className="text-xl font-bold mb-3 text-fuchsia-800">Address Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Region / City Administration" required error={errors.regionCityAdministration}>
                    {regionLoading ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                    ) : regionError ? (
                        <div className="text-sm text-red-600">{regionError}</div>
                    ) : (
                        <select
                            className="form-select w-full p-2 rounded border"
                            name="regionCityAdministration"
                            value={data.regionCityAdministration || ""}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select</option>
                            {regions.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                            ))}
                        </select>
                    )}
                </Field>
                <Field label="Zone" error={errors.zone || zoneError || undefined}>
                    {zoneLoading ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                    ) : (
                        <select
                            className="form-select w-full p-2 rounded border"
                            name="zone"
                            value={data.zone || ""}
                            onChange={handleChange}
                            disabled={!data.regionCityAdministration || zoneLoading || zones.length === 0}
                        >
                            <option value="">Select</option>
                            {zones.map(z => (
                                <option key={z.id} value={z.name}>{z.name}</option>
                            ))}
                        </select>
                    )}
                </Field>
                <Field label="Sub-City" required error={errors.subCity}>
                    <input
                        type="text"
                        name="subCity"
                        className="form-input w-full p-2 rounded border"
                        value={data.subCity || ""}
                        onChange={handleChange}
                        required
                    />
                </Field>
                <Field label="Wereda / Kebele" required error={errors.weredaKebele || woredaError || undefined}>
                    {woredaLoading ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                    ) : (
                        <select
                            className="form-select w-full p-2 rounded border"
                            name="weredaKebele"
                            value={data.weredaKebele || ""}
                            onChange={handleChange}
                            disabled={!data.zone || woredaLoading || woredas.length === 0}
                        >
                            <option value="">Select</option>
                            {woredas.map(w => (
                                <option key={w.id} value={w.name}>{w.name}</option>
                            ))}
                        </select>
                    )}
                </Field>
                <Field label="House Number" required error={errors.houseNumber}>
                    <input
                        type="text"
                        name="houseNumber"
                        className="form-input w-full p-2 rounded border"
                        value={data.houseNumber || ""}
                        onChange={handleChange}
                        required
                    />
                </Field>
                <Field label="Mobile Phone" required error={localErrors.mobilePhone}>
                    <input
                        type="tel"
                        name="mobilePhone"
                        className="form-input w-full p-2 rounded border"
                        value={data.mobilePhone}
                        onChange={handleChange}
                        required
                    />
                </Field>
                <Field label="Office Phone" error={touchedNext ? errors.officePhone : undefined}>
                    <input
                        type="tel"
                        name="officePhone"
                        className="form-input w-full p-2 rounded border"
                        value={data.officePhone || ""}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Email Address" required error={touchedNext ? errors.emailAddress : undefined}>
                    <input
                        type="email"
                        name="emailAddress"
                        className="form-input w-full p-2 rounded border"
                        value={data.emailAddress || ""}
                        onChange={handleChange}
                        required
                    />
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