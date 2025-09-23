import React from 'react';

export type ReviewProps = {
  formData: {
    branchName: string;
    accountNumber: string;
    customerName: string;
    mobileNumber: string;
    ebankingChannels: string[];
  };
  options: { id: string; label: string }[];
};

const StepReview: React.FC<ReviewProps> = ({ formData, options }) => (
  <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
    <div className="px-4 py-5 sm:px-6 bg-gray-50">
      <h3 className="text-lg leading-6 font-medium text-gray-900">
        Application Summary
      </h3>
      <p className="mt-1 max-w-2xl text-sm text-gray-500">
        Review your E-Banking application details
      </p>
    </div>
    <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
      <dl className="sm:divide-y sm:divide-gray-200">
        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt className="text-sm font-medium text-gray-500">Branch</dt>
          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {formData.branchName}
          </dd>
        </div>
        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt className="text-sm font-medium text-gray-500">Account Number</dt>
          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {formData.accountNumber ? `•••• ${formData.accountNumber.slice(-4)}` : 'N/A'}
          </dd>
        </div>
        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt className="text-sm font-medium text-gray-500">Customer Name</dt>
          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {formData.customerName}
          </dd>
        </div>
        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt className="text-sm font-medium text-gray-500">Mobile Number</dt>
          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {formData.mobileNumber}
          </dd>
        </div>
        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
          <dt className="text-sm font-medium text-gray-500">Selected Services</dt>
          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            <ul className="list-disc pl-5">
              {formData.ebankingChannels.map(channel => (
                <li key={channel}>
                  {options.find(opt => opt.id === channel)?.label || channel}
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </div>
  </div>
);

export default StepReview;
