
// features/customer/components/AccountSelection.tsx
import React, { useState } from 'react';
import { type CustomerAccount } from '../../../services/cbeBirrService';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AccountSelectionProps {
    accounts: CustomerAccount[];
    selectedAccounts: string[];
    onToggleAccount: (accountNumber: string) => void;
    onToggleAll: (selectAll: boolean) => void;
    actionType: 'link' | 'unlink' | 'change_phone' | 'modify_end_date';
}

export const AccountSelection: React.FC<AccountSelectionProps> = ({ accounts, selectedAccounts, onToggleAccount, onToggleAll, actionType }) => {
    const [showAccounts, setShowAccounts] = useState(false);

    return (
        <div className="bg-white p-6 rounded-lg border border-fuchsia-200">
            <h2 className="text-xl font-semibold mb-4 text-fuchsia-700">Account Selection</h2>
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Select Accounts to {actionType === 'unlink' ? 'Unlink' : 'Link'}
                    </label>
                    <div className="flex space-x-2">
                        <button type="button" onClick={() => onToggleAll(true)} className="text-xs text-fuchsia-700 hover:text-fuchsia-900">
                            Select All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button type="button" onClick={() => onToggleAll(false)} className="text-xs text-fuchsia-700 hover:text-fuchsia-900">
                            Clear All
                        </button>
                    </div>
                </div>
                <div className="border border-fuchsia-200 rounded-lg overflow-hidden">
                    <div className="p-3 bg-gradient-to-r from-amber-50 to-fuchsia-50 border-b border-fuchsia-200 cursor-pointer flex justify-between items-center" onClick={() => setShowAccounts(!showAccounts)}>
                        <span className="font-medium text-fuchsia-700">{selectedAccounts.length} account(s) selected</span>
                        {showAccounts ? <ChevronUp size={20} className="text-fuchsia-700" /> : <ChevronDown size={20} className="text-fuchsia-700" />}
                    </div>
                    {showAccounts && (
                        <div className="max-h-60 overflow-y-auto">
                            {accounts.map(account => (
                                <div key={account.accountNumber} className={`p-3 border-b border-fuchsia-100 hover:bg-gradient-to-r from-amber-50 to-fuchsia-50 cursor-pointer transition-colors ${selectedAccounts.includes(account.accountNumber) ? 'bg-gradient-to-r from-fuchsia-50 to-purple-50' : ''} ${account.status !== 'active' ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => account.status === 'active' && onToggleAccount(account.accountNumber)}>
                                    <div className="flex items-center">
                                        <input type="checkbox" checked={selectedAccounts.includes(account.accountNumber)} onChange={() => onToggleAccount(account.accountNumber)} className="h-4 w-4 text-fuchsia-700 rounded border-fuchsia-300 focus:ring-fuchsia-500 mr-2" disabled={account.status !== 'active'} />
                                        <div>
                                            <div className="font-medium">{account.accountNumber}</div>
                                            <div className="text-sm text-gray-500">
                                                {account.accountType} • {account.currency} • <span className={`ml-1 ${account.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{account.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountSelection;
