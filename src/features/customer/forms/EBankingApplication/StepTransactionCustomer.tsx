import React from 'react';
import Field from '../../../../components/Field';

export type TransactionCustomerProps = {
  formData: {
    branchName: string;
    date: string;
    accountNumber: string;
    customerName: string;
    mobileNumber: string;
  };
  errors: {
    accountNumber?: string;
    customerName?: string;
    mobileNumber?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const StepTransactionCustomer: React.FC<TransactionCustomerProps> = ({ formData, errors, onChange }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h2 className="text-lg font-semibold text-fuchsia-700 mb-4">Transaction & Customer Information</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <Field label="Branch Name">
        <input
          type="text"
          value={formData.branchName}
          disabled
          className="w-full px-3 py-2 border rounded"
        />
      </Field>
      <Field label="Date">
        <input
          type="date"
          value={formData.date}
          disabled
          className="w-full px-3 py-2 border rounded"
        />
      </Field>
    </div>
    <div className="space-y-4">
      <Field label="Account Number *" error={errors.accountNumber}>
        <input
          name="accountNumber"
          type="text"
          value={formData.accountNumber}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded"
        />
      </Field>
      <Field label="Customer Name *" error={errors.customerName}>
        <input
          name="customerName"
          type="text"
          value={formData.customerName}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded"
        />
      </Field>
      <Field label="Mobile Number *" error={errors.mobileNumber}>
        <input
          name="mobileNumber"
          type="tel"
          value={formData.mobileNumber}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded"
        />
      </Field>
    </div>
  </div>
);

export default StepTransactionCustomer;
