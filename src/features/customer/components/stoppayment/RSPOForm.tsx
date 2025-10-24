
// features/customer/components/stoppayment/RSPOForm.tsx
import React, { useState } from 'react';
import Field from '../Field';
import { useSPOSearch } from '../../hooks/useSPOSearch';
import { Loader2 } from 'lucide-react';

export default function RSPOForm({ onSelect, selectedSpo }) {
    const [searchTerm, setSearchTerm] = useState('');
    const { searchResults, isSearching, searchSPOs } = useSPOSearch();

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        searchSPOs(e.target.value);
    }

    return (
        <div className="space-y-6">
            <Field label="Search by Account or Cheque Number" required>
                <div className="relative">
                    <input type="text" value={searchTerm} onChange={handleSearch} className="w-full p-3 rounded-lg border" placeholder="Enter search term" />
                    {isSearching && <Loader2 className="animate-spin absolute right-3 top-3" />}
                </div>
            </Field>

            {searchResults.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                    {searchResults.map((spo) => (
                        <div key={spo.id} className={`p-4 border-b cursor-pointer ${selectedSpo?.id === spo.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`} onClick={() => onSelect(spo)}>
                            <div className="flex items-center gap-3">
                                <input type="radio" name="selectedSpo" checked={selectedSpo?.id === spo.id} readOnly />
                                <div>
                                    <p>Cheque #{spo.chequeNumber}</p>
                                    <p>Account: {spo.accountNumber}</p>
                                    <p>Amount: {spo.chequeAmount}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
