import React, { useEffect, useState } from "react";
import { getRegions, getZones, getWoredas } from "@services/addressService";
import Field from '@components/form/Field';
import type { AddressDetail, Errors } from "@features/customer/forms/accountOpening/types/formTypes";
import { Loader2, ChevronRight, MapPin, Phone, Mail } from 'lucide-react';

function getStartedPhoneNumber() {
    return localStorage.getItem("accountOpeningPhone") || "";
}

export const validate = (data: AddressDetail): Errors<AddressDetail> => {
    const newErrors: Errors<AddressDetail> = {};
    if (!data.regionCityAdministration) newErrors.regionCityAdministration = "Region / City is required"; 
    if (!data.weredaKebele) newErrors.weredaKebele = "Wereda / Kebele is required";
    if (!data.mobilePhone) newErrors.mobilePhone = "Mobile Phone is required";
    return newErrors;
};

type StepAddressProps = {
    data: AddressDetail;
    setData: (d: AddressDetail) => void;
    errors: Errors<AddressDetail>;
    setErrors?: (e: Errors<AddressDetail>) => void;
    onNext: (errors: Errors<AddressDetail>) => void;
    onBack: () => void;
    submitting: boolean;
};

export function StepAddress({ data, setData, errors, setErrors, onNext, onBack, submitting }: StepAddressProps) {
    const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
    const [zones, setZones] = useState<{ id: number; name: string; regionId: number }[]>([]);
    const [woredas, setWoredas] = useState<{ id: number; name: string; zoneId: number }[]>([]);
    const [regionLoading, setRegionLoading] = useState(false);
    const [zoneLoading, setZoneLoading] = useState(false);
    const [woredaLoading, setWoredaLoading] = useState(false);

    useEffect(() => {
        const startedPhone = getStartedPhoneNumber();
        if (!data.mobilePhone && startedPhone) {
            setData({ ...data, mobilePhone: startedPhone });
        }
    }, []);

    useEffect(() => {
        setRegionLoading(true);
        getRegions()
            .then(res => setRegions(Array.isArray(res) ? res : (res.data || [])))
            .catch(() => console.error("Failed to load regions"))
            .finally(() => setRegionLoading(false));
    }, []);

    useEffect(() => {
        if (!data.regionCityAdministration) {
            setZones([]);
            return;
        }
        setZoneLoading(true);
        const selectedRegion = regions.find(r => r.name === data.regionCityAdministration);
        if (!selectedRegion) {
            setZones([]);
            setZoneLoading(false);
            return;
        }
        getZones(selectedRegion.id)
            .then(res => setZones(Array.isArray(res) ? res : (res.data || [])))
            .catch(() => console.error("Failed to load zones"))
            .finally(() => setZoneLoading(false));
    }, [data.regionCityAdministration, regions]);

    useEffect(() => {
        if (!data.zone) {
            setWoredas([]);
            return;
        }
        setWoredaLoading(true);
        const selectedZone = zones.find(z => z.name === data.zone);
        if (!selectedZone) {
            setWoredas([]);
            setWoredaLoading(false);
            return;
        }
        getWoredas(selectedZone.id)
            .then(res => setWoredas(Array.isArray(res) ? res : (res.data || [])))
            .catch(() => console.error("Failed to load woredas"))
            .finally(() => setWoredaLoading(false));
    }, [data.zone, zones]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    const isValidPhone = (phone: string) => {
        return /^09\d{8}$|^07\d{8}$|^\+2519\d{8}$|^2519\d{8}$|^9\d{8}$/.test(phone);
    };

    const handleNext = () => {
        const validationErrors = validate(data);
        onNext(validationErrors);
    };

    const LoadingState = ({ message }: { message: string }) => (
        <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{message}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-fuchsia-100 p-2 rounded-lg">
                    <MapPin className="h-5 w-5 text-fuchsia-700" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Address Information</h2>
                    <p className="text-gray-600 text-sm">Where can we reach you?</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Region */}
                <Field label="Region / City Administration" required error={errors.regionCityAdministration}>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        {regionLoading ? (
                            <LoadingState message="Loading regions..." />
                        ) : (
                            <select
                                className="w-full pl-10 p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors bg-white"
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
                    </div>
                </Field>

                {/* Zone */}
                <Field label="Zone" error={errors.zone}>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        {zoneLoading ? (
                            <LoadingState message="Loading zones..." />
                        ) : (
                            <select
                                className="w-full pl-10 p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors bg-white"
                                name="zone"
                                value={data.zone || ""}
                                onChange={handleChange}
                                disabled={!data.regionCityAdministration || zoneLoading}
                            >
                                <option value="">Select your zone</option>
                                {zones.map(z => (
                                    <option key={z.id} value={z.name}>{z.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </Field>

                {/* Wereda / Kebele */}
                <Field label="Wereda / Kebele" required error={errors.weredaKebele}>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        {woredaLoading ? (
                            <LoadingState message="Loading woredas..." />
                        ) : (
                            <select
                                className="w-full pl-10 p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors bg-white"
                                name="weredaKebele"
                                value={data.weredaKebele || ""}
                                onChange={handleChange}
                                disabled={!data.zone || woredaLoading}
                            >
                                <option value="">Select your woreda</option>
                                {woredas.map(w => (
                                    <option key={w.id} value={w.name}>{w.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </Field>

                {/* Mobile Phone */}
                <Field label="Mobile Phone" required error={errors.mobilePhone}>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="tel"
                            name="mobilePhone"
                            className="w-full pl-10 p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
                            value={data.mobilePhone}
                            onChange={handleChange}
                            placeholder="09XXXXXXXX"
                        />
                    </div>
                </Field>

                {/* Email Address */}
                <Field label="Email Address" error={errors.emailAddress}>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="email"
                            name="emailAddress"
                            className="w-full pl-10 p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
                            value={data.emailAddress || ""}
                            onChange={handleChange}
                            placeholder="Optional"
                        />
                    </div>
                </Field>
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