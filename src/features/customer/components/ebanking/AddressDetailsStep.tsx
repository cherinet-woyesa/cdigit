
// features/customer/components/ebanking/AddressDetailsStep.tsx
import React from 'react';
import Field from '../Field';
import { Loader2 } from 'lucide-react';

export default function AddressDetailsStep({ formData, onChange, errors, addressProps }) {
    const { regions, zones, woredas, regionLoading, zoneLoading, woredaLoading } = addressProps;

    return (
        <div className="space-y-6">
            <Field label="Region" required error={errors.region}>
                <div className="relative">
                    {regionLoading && <Loader2 className="animate-spin absolute right-3 top-3" />}
                    <select name="region" value={formData.region} onChange={onChange} disabled={regionLoading} className="w-full p-3 rounded-lg border">
                        <option value="">Select region</option>
                        {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                </div>
            </Field>
            <Field label="Zone" required error={errors.zone}>
                <div className="relative">
                    {zoneLoading && <Loader2 className="animate-spin absolute right-3 top-3" />}
                    <select name="zone" value={formData.zone} onChange={onChange} disabled={!formData.region || zoneLoading} className="w-full p-3 rounded-lg border">
                        <option value="">Select zone</option>
                        {zones.map(z => <option key={z.id} value={z.name}>{z.name}</option>)}
                    </select>
                </div>
            </Field>
            <Field label="Wereda" required error={errors.wereda}>
                <div className="relative">
                    {woredaLoading && <Loader2 className="animate-spin absolute right-3 top-3" />}
                    <select name="wereda" value={formData.wereda} onChange={onChange} disabled={!formData.zone || woredaLoading} className="w-full p-3 rounded-lg border">
                        <option value="">Select woreda</option>
                        {woredas.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                    </select>
                </div>
            </Field>
            <Field label="House Number" required error={errors.houseNumber}>
                <input type="text" name="houseNumber" value={formData.houseNumber} onChange={onChange} className="w-full p-3 rounded-lg border" />
            </Field>
        </div>
    );
}
