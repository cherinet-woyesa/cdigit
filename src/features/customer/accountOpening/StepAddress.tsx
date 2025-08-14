// src/components/accountOpening/StepAddress.tsx
import React from "react";
import { Field } from "./FormElements";
import type { AddressDetail, Errors } from "./formTypes";

type StepAddressProps = {
    data: AddressDetail;
    setData: (d: AddressDetail) => void;
    errors: Errors<AddressDetail>;
    onNext: () => void;
    onBack: () => void;
    submitting: boolean;
};

export function StepAddress({ data, setData, errors, onNext, onBack, submitting }: StepAddressProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    return (
        <>
            <div className="text-xl font-bold mb-3 text-purple-800">Address Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Region / City Administration" required error={errors.regionCityAdministration}>
                    <select
                        className="form-select w-full p-2 rounded border"
                        name="regionCityAdministration" // Changed to camelCase
                        value={data.regionCityAdministration}
                        onChange={handleChange}
                    >
                        <option value="">Select</option>
                        <option value="Addis Ababa">Addis Ababa</option>
                        <option value="Oromia">Oromia</option>
                        <option value="Amhara">Amhara</option>
                        <option value="Tigray">Tigray</option>
                        <option value="Sidama">Sidama</option>
                        <option value="Southern Nations">Southern Nations</option>
                        <option value="Gambella">Gambella</option>
                        <option value="Benishangul-Gumuz">Benishangul-Gumuz</option>
                        <option value="Afar">Afar</option>
                        <option value="Somali">Somali</option>
                        <option value="Harari">Harari</option>
                        <option value="Dire Dawa">Dire Dawa</option>
                    </select>
                </Field>
                <Field label="Zone" error={errors.zone}>
                    <input
                        type="text"
                        name="zone" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.zone || ""}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Sub-City" error={errors.subCity}>
                    <input
                        type="text"
                        name="subCity" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.subCity || ""}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Wereda / Kebele" error={errors.weredaKebele}>
                    <input
                        type="text"
                        name="weredaKebele" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.weredaKebele || ""}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="House Number" error={errors.houseNumber}>
                    <input
                        type="text"
                        name="houseNumber" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.houseNumber || ""}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Mobile Phone" required error={errors.mobilePhone}>
                    <input
                        type="tel"
                        name="mobilePhone" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.mobilePhone}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Office Phone" error={errors.officePhone}>
                    <input
                        type="tel"
                        name="officePhone" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.officePhone || ""}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Email Address" error={errors.emailAddress}>
                    <input
                        type="email"
                        name="emailAddress" // Changed to camelCase
                        className="form-input w-full p-2 rounded border"
                        value={data.emailAddress || ""}
                        onChange={handleChange}
                    />
                </Field>
            </div>
            <div className="flex justify-between mt-6">
                <button
                    type="button"
                    className="bg-gray-300 text-purple-700 px-6 py-2 rounded shadow hover:bg-gray-400 transition"
                    onClick={onBack}
                >
                    Back
                </button>
                <button
                    type="button"
                    className="bg-purple-700 text-white px-6 py-2 rounded shadow hover:bg-purple-800 transition"
                    onClick={onNext}
                    disabled={submitting}
                >
                    Next
                </button>
            </div>
        </>
    );
}