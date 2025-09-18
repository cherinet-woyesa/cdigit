import React from 'react';
import Field from '../../../../components/Field';

export type AddressProps = {
  formData: {
    region: string;
    city: string;
    subCity: string;
    wereda: string;
    houseNumber: string;
  };
  errors: {
    region?: string;
    city?: string;
    subCity?: string;
    wereda?: string;
    houseNumber?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const StepAddress: React.FC<AddressProps> = ({ formData, errors, onChange }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h2 className="text-lg font-semibold text-fuchsia-700 mb-4">Address Information</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Region *" error={errors.region}>
        <input
          name="region"
          type="text"
          value={formData.region}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded"
        />
      </Field>
      <Field label="City *" error={errors.city}>
        <input
          name="city"
          type="text"
          value={formData.city}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded"
        />
      </Field>
      <Field label="Sub-City *" error={errors.subCity}>
        <input
          name="subCity"
          type="text"
          value={formData.subCity}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded"
        />
      </Field>
      <Field label="Wereda *" error={errors.wereda}>
        <input
          name="wereda"
          type="text"
          value={formData.wereda}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded"
        />
      </Field>
      <Field label="House Number *" error={errors.houseNumber}>
        <input
          name="houseNumber"
          type="text"
          value={formData.houseNumber}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded"
        />
      </Field>
    </div>
  </div>
);

export default StepAddress;
