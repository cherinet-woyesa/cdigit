
// features/customer/components/ebanking/ServiceSelectionStep.tsx
import React from 'react';

const E_BANKING_OPTIONS = [
    { id: 'mobile_banking', label: 'Mobile Banking', icon: '📱' },
    { id: 'internet_banking', label: 'Internet Banking', icon: '💻' },
    { id: 'ussd', label: 'USSD Banking', icon: '*️⃣' },
    { id: 'card_banking', label: 'Card Banking', icon: '💳' },
];

export default function ServiceSelectionStep({ formData, onChange }) {
    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600">Select the services you would like to apply for: <span className="text-gray-400">(Optional)</span></p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {E_BANKING_OPTIONS.map(option => (
                    <label key={option.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                            type="checkbox"
                            name="ebankingChannels"
                            value={option.id}
                            checked={formData.ebankingChannels.includes(option.id)}
                            onChange={onChange}
                            className="h-4 w-4"
                        />
                        <span className="ml-3 text-sm font-medium">
                            <span className="mr-2">{option.icon}</span>
                            {option.label}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}
