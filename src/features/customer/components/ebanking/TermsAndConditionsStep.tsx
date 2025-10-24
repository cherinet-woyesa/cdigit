
// features/customer/components/ebanking/TermsAndConditionsStep.tsx
import React from 'react';
import Field from '../Field';

export default function TermsAndConditionsStep({ formData, onChange, errors }) {
    return (
        <div className="space-y-6">
            <Field error={errors.termsAccepted}>
                <div className="flex items-start">
                    <input id="termsAccepted" name="termsAccepted" type="checkbox" checked={formData.termsAccepted} onChange={onChange} className="h-4 w-4" />
                    <div className="ml-3 text-sm">
                        <label htmlFor="termsAccepted" className="font-medium">I agree to the <button type="button" className="text-fuchsia-700 underline">Terms and Conditions</button></label>
                    </div>
                </div>
            </Field>
            <Field error={errors.idCopyAttached}>
                <div className="flex items-start">
                    <input id="idCopyAttached" name="idCopyAttached" type="checkbox" checked={formData.idCopyAttached} onChange={onChange} className="h-4 w-4" />
                    <div className="ml-3 text-sm">
                        <label htmlFor="idCopyAttached" className="font-medium">I have attached a copy of my ID</label>
                        <p className="text-gray-500">If checked, address information becomes optional</p>
                    </div>
                </div>
            </Field>
        </div>
    );
}
