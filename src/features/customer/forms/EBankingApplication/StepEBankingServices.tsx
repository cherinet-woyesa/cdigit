import React from 'react';

export type EBankingServicesProps = {
  ebankingChannels: string[];
  errors: {
    ebankingChannels?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  options: { id: string; label: string }[];
};

const StepEBankingServices: React.FC<EBankingServicesProps> = ({ ebankingChannels, errors, onChange, options }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h2 className="text-lg font-semibold text-fuchsia-700 mb-4">E-Banking Services</h2>
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Select the services you would like to apply for:</p>
      {errors.ebankingChannels && (
        <p className="text-sm text-red-500">{errors.ebankingChannels}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map(option => (
          <div key={option.id} className="flex items-center">
            <input
              id={option.id}
              name="ebankingChannels"
              type="checkbox"
              value={option.id}
              checked={ebankingChannels.includes(option.id)}
              onChange={onChange}
              className="h-4 w-4 text-fuchsia-700 focus:ring-fuchsia-700 border-gray-300 rounded"
            />
            <label htmlFor={option.id} className="ml-2 block text-sm text-gray-700">
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default StepEBankingServices;
