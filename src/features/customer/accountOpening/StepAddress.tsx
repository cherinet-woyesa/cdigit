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
    // function isValidEmail(email: string) {
    //     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    // }
    function isValidPhone(phone: string) {
        // Ethiopian mobile: starts with 09 or +2519, 10 digits
        return /^09\d{8}$|^\+2519\d{8}$/.test(phone);
    }
    // function isValidOfficePhone(phone: string) {
    //     // Allow empty, or must start with +251 and be numeric (Ethiopian format)
    //     if (!phone) return true;
    //     return /^\+251\d{8,9}$/.test(phone);
    // }

    const [touchedNext, setTouchedNext] = useState(false);

    function validateOnNext() {
        const nextErrors: Partial<typeof errors> = { ...errors };

        // Conditional validation for email and office phone
        // if (data.emailAddress && !isValidEmail(data.emailAddress)) {
        //     nextErrors.emailAddress = "Invalid email format";
        // } else {
        //     delete nextErrors.emailAddress;
        // }

        // if (data.officePhone && !isValidOfficePhone(data.officePhone)) {
        //     nextErrors.officePhone = "Office phone must start with +251 and be numeric";
        // } else {
        //     delete nextErrors.officePhone;
        // }

        // Required field checks
        if (!data.regionCityAdministration) { nextErrors.regionCityAdministration = "Region is required"; }
        if (!data.subCity) { nextErrors.subCity = "Sub-City is required"; }
        if (!data.weredaKebele) { nextErrors.weredaKebele = "Wereda/Kebele is required"; }
        if (!data.mobilePhone) { nextErrors.mobilePhone = "Mobile phone is required"; }
        
        // No longer required: emailAddress, houseNumber
        if (data.mobilePhone && !isValidPhone(data.mobilePhone)) {
            nextErrors.mobilePhone = "Invalid Ethiopian mobile phone number";
        }

        return nextErrors;
    }

    const handleNext = () => {
        setTouchedNext(true);
        const nextErrors = validateOnNext();
        if (setErrors) setErrors(nextErrors as Errors<AddressDetail>);
        const hasError = Object.values(nextErrors).some(Boolean);
        if (!hasError) {
            onNext();
        }
    };

    return (
        <div className="container mx-auto px-3 py-6 max-w-4xl">
            

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Region Field */}
                <Field label="Region / City Administration" required error={errors.regionCityAdministration}>
                    {regionLoading ? (
                        <div className="text-sm text-gray-500 animate-pulse">Mapping out regions...</div>
                    ) : regionError ? (
                        <div className="text-sm text-red-600">{regionError}</div>
                    ) : (
                        <select
                            className="form-select w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors bg-white shadow-sm"
                            name="regionCityAdministration"
                            value={data.regionCityAdministration || ""}
                            onChange={handleChange}
                        >
                            <option value="">Select your region</option>
                            {regions.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                            ))}
                        </select>
                    )}
                </Field>

                {/* Zone Field */}
                <Field label="Zone" error={errors.zone || zoneError || undefined}>
                    {zoneLoading ? (
                        <div className="text-sm text-gray-500 animate-pulse">Charting zones...</div>
                    ) : (
                        <select
                            className="form-select w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors bg-white shadow-sm"
                            name="zone"
                            value={data.zone || ""}
                            onChange={handleChange}
                            disabled={!data.regionCityAdministration || zoneLoading || zones.length === 0}
                        >
                            <option value="">Select your zone</option>
                            {zones.map(z => (
                                <option key={z.id} value={z.name}>{z.name}</option>
                            ))}
                        </select>
                    )}
                </Field>

                {/* Sub-City Field */}
                {/* <Field label="Sub-City" required error={errors.subCity}>
                    <input
                        type="text"
                        name="subCity"
                        className="form-input w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.subCity || ""}
                        onChange={handleChange}
                        placeholder="e.g., Arada"
                    />
                </Field> */}

                {/* Wereda / Kebele Field */}
                <Field label="Wereda / Kebele" required error={errors.weredaKebele || woredaError || undefined}>
                    {woredaLoading ? (
                        <div className="text-sm text-gray-500 animate-pulse">Finding woredas...</div>
                    ) : (
                        <select
                            className="form-select w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors bg-white shadow-sm"
                            name="weredaKebele"
                            value={data.weredaKebele || ""}
                            onChange={handleChange}
                            disabled={!data.zone || woredaLoading || woredas.length === 0}
                        >
                            <option value="">Select your woreda</option>
                            {woredas.map(w => (
                                <option key={w.id} value={w.name}>{w.name}</option>
                            ))}
                        </select>
                    )}
                </Field>

                {/* House Number Field (Now OPTIONAL) */}
                {/* <Field label="House Number" error={errors.houseNumber}>
                    <input
                        type="text"
                        name="houseNumber"
                        className="form-input w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.houseNumber || ""}
                        onChange={handleChange}
                        placeholder="Optional"
                    />
                </Field> */}

                {/* Mobile Phone Field */}
                <Field label="Mobile Phone" required error={errors.mobilePhone}>
                    <input
                        type="tel"
                        name="mobilePhone"
                        className="form-input w-full p-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.mobilePhone}
                        onChange={handleChange}
                        placeholder="e.g., 0912345678"
                    />
                </Field>

                {/* Office Phone Field */}
                {/* <Field label="Office Phone" error={touchedNext ? errors.officePhone : undefined}>
                    <input
                        type="tel"
                        name="officePhone"
                        className="form-input w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.officePhone || ""}
                        onChange={handleChange}
                        placeholder="Optional"
                    />
                </Field> */}

                {/* Email Address Field (Now OPTIONAL) */}
                {/* <Field label="Email Address" error={errors.emailAddress}>
                    <input
                        type="email"
                        name="emailAddress"
                        className="form-input w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-fuchsia-500 transition-colors shadow-sm"
                        value={data.emailAddress || ""}
                        onChange={handleChange}
                        placeholder="Optional"
                    />
                </Field> */}
            </div>

            <div className="flex flex-col md:flex-row md:justify-between gap-4 mt-10">
  <button
    type="button"
    className="w-full md:w-auto px-6 py-2 rounded-lg font-semibold border-2 border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
    onClick={onBack}
  >
    <span className="mr-2">⬅️</span> Go Back
  </button>
  <button
    type="button"
    className={`w-full md:w-auto px-6 py-2 rounded-lg font-semibold shadow-lg transition transform duration-200 
      ${submitting ? 'bg-fuchsia-300 cursor-not-allowed' : 'bg-fuchsia-700 text-white hover:bg-fuchsia-800 hover:scale-105'}`}
    onClick={handleNext}
    disabled={submitting}
  >
    {submitting ? 'Moving to next step...' : 'Confirm Location'}
  </button>
</div>

        </div>
    );
}