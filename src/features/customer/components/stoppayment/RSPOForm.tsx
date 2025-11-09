// features/customer/components/stoppayment/RSPOForm.tsx
import React, { useState, useEffect } from 'react';
import Field from '@features/customer/components/Field';
import { useSPOSearch } from '@features/customer/hooks/useSPOSearch';
import { Loader2 } from 'lucide-react';
import { type StopPaymentOrderResponseDto } from '@services/transactions/stopPaymentService';

interface RSPOFormProps {
    onSelect: (spo: StopPaymentOrderResponseDto) => void;
    selectedSpo: StopPaymentOrderResponseDto | null;
    accountValidated: boolean;
    setAccountValidated: (validated: boolean) => void;
}

export default function RSPOForm({ 
    onSelect, 
    selectedSpo,
    accountValidated,
    setAccountValidated
}: RSPOFormProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const { searchResults, isSearching, searchSPOs } = useSPOSearch();

    // When account is validated, search for SPOs automatically
    useEffect(() => {
        if (accountValidated && searchTerm) {
            searchSPOs(searchTerm);
        }
    }, [accountValidated, searchTerm, searchSPOs]);

    return (
        <div className="space-y-6">
            {!accountValidated ? (
                // Account validation step
                <Field label="Account Number" required>
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full p-3 rounded-lg border" 
                        placeholder="Enter account number"
                    />
                    <button 
                        type="button"
                        onClick={() => setAccountValidated(!!searchTerm)}
                        className="mt-2 px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700"
                    >
                        Validate Account
                    </button>
                </Field>
            ) : (
                // SPO selection step
                <>
                    {searchResults.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-50 p-3 border-b">
                                <h3 className="font-medium text-gray-900">Select Stop Payment Order to Revoke</h3>
                                <p className="text-sm text-gray-600">Found {searchResults.length} active stop payment order(s)</p>
                            </div>
                            {searchResults.map((spo) => (
                                <div 
                                    key={spo.id} 
                                    className={`p-4 border-b cursor-pointer ${selectedSpo?.id === spo.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`} 
                                    onClick={() => onSelect(spo)}
                                >
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="selectedSpo" checked={selectedSpo?.id === spo.id} readOnly />
                                        <div>
                                            <p className="font-medium">Cheque #{spo.chequeNumber}</p>
                                            <p className="text-sm text-gray-600">Account: {spo.accountNumber}</p>
                                            <p className="text-sm text-gray-600">Amount: {spo.chequeAmount}</p>
                                            <p className="text-sm text-gray-600">Date: {new Date(spo.chequeDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : isSearching ? (
                        <div className="flex justify-center p-6">
                            <Loader2 className="animate-spin h-6 w-6 text-fuchsia-700" />
                        </div>
                    ) : (
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                            <p className="text-gray-600">No active stop payment orders found for this account</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}