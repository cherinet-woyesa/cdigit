import React from "react";
import Field from "../../../../components/Field";

export interface CustomerAccount {
  accountNumber: string;
  accountName: string;
}

export interface StepCustomerBeneficiaryProps {
  formData: any;
  errors: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  customerAccounts: CustomerAccount[];
  showAccountSelection: boolean;
  onAccountSelect: (acc: CustomerAccount) => void;
  BANKS: string[];
}

const StepCustomerBeneficiary: React.FC<StepCustomerBeneficiaryProps> = ({
  formData,
  errors,
  onChange,
  customerAccounts,
  showAccountSelection,
  onAccountSelect,
  BANKS,
}) => {
  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <h2 className="text-base font-semibold text-fuchsia-700 mb-3">Customer & Beneficiary Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Customer Telephone *" error={errors.customerTelephone}>
          <input
            name="customerTelephone"
            type="tel"
            value={formData.customerTelephone}
            onChange={onChange}
            placeholder="0912345678"
            className="w-full p-2 border rounded text-sm"
          />
        </Field>
        {showAccountSelection && customerAccounts.length > 0 && (
          <div className="mb-3 md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Select Account</label>
            <select
              className="block w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-fuchsia-700 focus:border-fuchsia-700"
              value={formData.orderingAccountNumber || ''}
              onChange={(e) => {
                const acc = customerAccounts.find(a => a.accountNumber === e.target.value);
                if (acc) onAccountSelect(acc);
              }}
            >
              <option value="">Choose your account</option>
              {customerAccounts.map(acc => (
                <option key={acc.accountNumber} value={acc.accountNumber}>
                  {acc.accountNumber} - {acc.accountName}
                </option>
              ))}
            </select>
          </div>
        )}
        <Field label="Account Number *" error={errors.orderingAccountNumber}>
          <input
            name="orderingAccountNumber"
            type="text"
            value={formData.orderingAccountNumber}
            onChange={onChange}
            disabled={showAccountSelection}
            className="w-full p-2 border rounded text-sm"
          />
        </Field>
        <Field label="Customer Name *" error={errors.orderingCustomerName}>
          <input
            name="orderingCustomerName"
            type="text"
            value={formData.orderingCustomerName}
            onChange={onChange}
            disabled
            className="w-full p-2 border rounded text-sm"
          />
        </Field>
        <div className="md:col-span-2 border-t pt-3 mt-3">
          <h3 className="text-base font-semibold text-fuchsia-700 mb-2">Beneficiary Information</h3>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Beneficiary Bank *
          </label>
          <select
            name="beneficiaryBank"
            value={formData.beneficiaryBank}
            onChange={onChange}
            className={`mt-1 block w-full p-2 border ${errors.beneficiaryBank ? 'border-red-500' : 'border-gray-300'} bg-white rounded-md shadow-sm focus:outline-none focus:ring-fuchsia-700 focus:border-fuchsia-700 text-sm`}
          >
            <option value="">Select a bank</option>
            {BANKS.map(bank => (
              <option key={bank} value={bank}>{bank}</option>
            ))}
          </select>
        </div>
        <Field label="Beneficiary Branch *" error={errors.beneficiaryBranch}>
          <input
            name="beneficiaryBranch"
            type="text"
            value={formData.beneficiaryBranch}
            onChange={onChange}
            className="w-full p-2 border rounded text-sm"
          />
        </Field>
        <Field label="Beneficiary Account Number *" error={errors.beneficiaryAccountNumber}>
          <input
            name="beneficiaryAccountNumber"
            type="text"
            value={formData.beneficiaryAccountNumber}
            onChange={onChange}
            className="w-full p-2 border rounded text-sm"
          />
        </Field>
        <Field label="Beneficiary Name *" error={errors.beneficiaryName}>
          <input
            name="beneficiaryName"
            type="text"
            value={formData.beneficiaryName}
            onChange={onChange}
            className="w-full p-2 border rounded text-sm"
          />
        </Field>
        <Field label="Transfer Amount (ETB) *" error={errors.transferAmount}>
          <input
            name="transferAmount"
            type="number"
            value={formData.transferAmount}
            onChange={onChange}
            min="1"
            step="0.01"
            className="w-full p-2 border rounded text-sm"
          />
        </Field>
        <div className="md:col-span-2">
          <textarea
            name="paymentNarrative"
            rows={2}
            value={formData.paymentNarrative}
            onChange={onChange}
            className={`mt-1 block w-full border ${errors.paymentNarrative ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 focus:outline-none focus:ring-fuchsia-700 focus:border-fuchsia-700 text-sm`}
            placeholder="Enter payment purpose (10-200 characters)"
          />
        </div>
      </div>
    </div>
  );
};

export default StepCustomerBeneficiary;
