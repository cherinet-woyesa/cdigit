import React from 'react';
import { type CustomerInfo } from '../../../../services/cbeBirrService';

interface CustomerInfoSectionProps {
  customerInfo: CustomerInfo;
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({ customerInfo }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-semibold mb-4">Customer & CBE-Birr Information</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <div className="p-2 border rounded bg-gray-50">{customerInfo.fullName}</div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
        <div className="p-2 border rounded bg-gray-50">{customerInfo.customerId}</div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CBE-Birr User Phone Number</label>
        <div className="p-2 border rounded bg-gray-50">{customerInfo.cbeBirrPhone || customerInfo.phoneNumber}</div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CBE-Birr Status</label>
        <div className="p-2 border rounded bg-gray-50">{customerInfo.cbeBirrLinked ? 'Linked' : 'Not Linked'}</div>
      </div>
    </div>
  </div>
);

export default CustomerInfoSection;
