// features/customer/components/ebanking/TermsAndConditionsStep.tsx
import React from 'react';
import Field from '../Field';
import FileUpload from '../FileUpload';

export default function TermsAndConditionsStep({ formData, onChange, errors, onFileChange, idCopy }) {
    return (
        <div className="space-y-6">
            
            <FileUpload onFileChange={onFileChange} file={idCopy} />
            <Field error={errors.termsAccepted}>
                <div className="flex items-start">
                    <input id="termsAccepted" name="termsAccepted" type="checkbox" checked={formData.termsAccepted} onChange={onChange} className="h-4 w-4" />
                    <div className="ml-3 text-sm">
                        <label htmlFor="termsAccepted" className="font-medium">I agree to the <button type="button" className="text-fuchsia-700 underline">Terms and Conditions</button></label>
                    </div>
                </div>
            </Field>
        </div>
    );
}