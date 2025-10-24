
// features/customer/components/CustomerInfoSection.tsx
import React from 'react';
import { type CustomerInfo } from '../../../services/cbeBirrService';

export const CustomerInfoSection: React.FC<{ customerInfo: CustomerInfo }> = ({ customerInfo }) => (
    <div className="bg-white p-6 rounded-lg shadow border border-fuchsia-200">
        <h2 className="text-xl font-semibold mb-4 text-fuchsia-700">Customer & CBE-Birr Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="p-2 border border-fuchsia-200 rounded bg-gradient-to-r from-amber-50 to-fuchsia-50">
                    {customerInfo.fullName}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
                <div className="p-2 border border-fuchsia-200 rounded bg-gradient-to-r from-amber-50 to-fuchsia-50">
                    {customerInfo.customerId}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CBE-Birr User Phone Number</label>
                <div className="p-2 border border-fuchsia-200 rounded bg-gradient-to-r from-amber-50 to-fuchsia-50">
                    {customerInfo.cbeBirrPhone || customerInfo.phoneNumber}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CBE-Birr Status</label>
                <div className={`p-2 border rounded ${
                    customerInfo.cbeBirrLinked 
                        ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 text-green-800' 
                        : 'border-yellow-300 bg-gradient-to-r from-amber-50 to-yellow-50 text-yellow-800'
                }`}>
                    {customerInfo.cbeBirrLinked ? 'Linked' : 'Not Linked'}
                </div>
            </div>
        </div>
    </div>
);

export default CustomerInfoSection;
