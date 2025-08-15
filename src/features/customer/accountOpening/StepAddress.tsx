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

    // Custom validation for email and phone
    const localErrors: Partial<typeof errors> = { ...errors };
    if (data.emailAddress && !isValidEmail(data.emailAddress)) {
        localErrors.emailAddress = "Invalid email format";
    }
    if (data.mobilePhone && !isValidPhone(data.mobilePhone)) {
        localErrors.mobilePhone = "Invalid Ethiopian phone number";
    }
    if (data.officePhone && !isValidOfficePhone(data.officePhone)) {
        localErrors.officePhone = "Office phone must start with +251 and be numeric (e.g., +251112345678)";
    }

    return (
        <>
            <div className="text-xl font-bold mb-3 text-fuchsia-800">Address Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Region / City Administration" required error={errors.regionCityAdministration}>
                    <select
                        className="form-select w-full p-2 rounded border"
                        name="regionCityAdministration"
                        value={data.regionCityAdministration}
                        onChange={handleChange}
                        required
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
                        name="zone"
                        className="form-input w-full p-2 rounded border"
                        value={data.zone || ""}
                        onChange={handleChange}
                    />
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
                <Field label="Wereda / Kebele" required error={errors.weredaKebele}>
                    <input
                        type="text"
                        name="weredaKebele"
                        className="form-input w-full p-2 rounded border"
                        value={data.weredaKebele || ""}
                        onChange={handleChange}
                        required
                    />
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
                <Field label="Office Phone" error={localErrors.officePhone}>
                    <input
                        type="tel"
                        name="officePhone"
                        className="form-input w-full p-2 rounded border"
                        value={data.officePhone || ""}
                        onChange={handleChange}
                    />
                </Field>
                <Field label="Email Address" required error={localErrors.emailAddress}>
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
                    onClick={onNext}
                    disabled={submitting}
                >
                    Next
                </button>
            </div>
        </>
    );
}