import React from 'react';
import Field from '../../../../components/Field';

export type IDInfoProps = {
  formData: {
    idType: string;
    idNumber: string;
    issuingAuthority: string;
    idIssueDate: string;
    idExpiryDate: string;
  };
  errors: {
    idNumber?: string;
    issuingAuthority?: string;
    idIssueDate?: string;
    idExpiryDate?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

const StepIDInfo: React.FC<IDInfoProps> = ({ formData, errors, onChange }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h2 className="text-lg font-semibold text-fuchsia-700 mb-4">ID Information</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ID Type *</label>
        <select
          name="idType"
          value={formData.idType}
          onChange={onChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cbe-primary focus:ring-cbe-primary sm:text-sm"
        >
          <option value="national_id">National ID</option>
          <option value="passport">Passport</option>
          <option value="driving_license">Driving License</option>
        </select>
      </div>
      <Field label="ID Number *" error={errors.idNumber}>
        <input
          name="idNumber"
          type="text"
          value={formData.idNumber}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded"
        />
      </Field>
      <Field label="Issuing Authority *" error={errors.issuingAuthority}>
        <input
          name="issuingAuthority"
          type="text"
          value={formData.issuingAuthority}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded"
        />
      </Field>
      <Field label="Issue Date *" error={errors.idIssueDate}>
        <input
          name="idIssueDate"
          type="date"
          value={formData.idIssueDate}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded"
        />
      </Field>
      <Field label="Expiry Date *" error={errors.idExpiryDate}>
        <input
          name="idExpiryDate"
          type="date"
          value={formData.idExpiryDate}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded"
        />
      </Field>
    </div>
  </div>
);

export default StepIDInfo;
