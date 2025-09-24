import React, { useState } from "react";
import Field from '../../../../../components/Field';
import type { DigitalSignature, Errors } from "../../../types/formTypes";

export const validate = (data: DigitalSignature): Errors<DigitalSignature> => {
    const newErrors: Errors<DigitalSignature> = {};
    if (!data.signatureFile && !data.signatureUrl) newErrors.signatureUrl = "Digital signature is required";
    if (!data.termsAccepted) newErrors.termsAccepted = "You must accept the terms and conditions";
    return newErrors;
};

type StepSignatureProps = {
    data: DigitalSignature;
    setData: (d: DigitalSignature) => void;
    errors: Errors<DigitalSignature>;
    onNext: (errors: Errors<DigitalSignature>) => void;
    onBack: () => void;
    submitting: boolean;
};

export function StepSignature({ data, setData, errors, onNext, onBack, submitting }: StepSignatureProps) {
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [fileError, setFileError] = useState<string | undefined>(undefined);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileError(undefined);
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setFileError('Only image files are allowed.');
                setData({ ...data, signatureFile: undefined });
                return;
            }
            if (file.size > 1 * 1024 * 1024) { // 1MB limit
                setFileError('File size must be less than 1MB.');
                setData({ ...data, signatureFile: undefined });
                return;
            }
            setData({ ...data, signatureFile: file });
        } else {
            setData({ ...data, signatureFile: undefined });
        }
    };

    const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, termsAccepted: e.target.checked });
    };

    const handleNext = () => {
        const validationErrors = validate(data);
        onNext(validationErrors);
    };

    const backendBaseUrl = "http://localhost:5268";

    return (
        <div className="container mx-auto px-2 py-6 max-w-4xl">
            <div className="text-xl font-bold mb-3 text-fuchsia-800">Digital Signature & Terms</div>
            <p className="text-gray-600 mb-6">Please upload a clear image of your signature and accept the terms to complete your application.</p>

            <div className="space-y-6">
                <Field label="Upload Digital Signature" required error={errors.signatureUrl || fileError}>
                    <input
                        type="file"
                        name="signatureFile"
                        className="form-input w-full p-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100"
                        onChange={handleFileChange}
                        accept="image/*"
                    />
                    {data.signatureFile && (
                        <p className="text-sm text-green-600 mt-1">Selected: {data.signatureFile.name}</p>
                    )}
                     {data.signatureUrl && !data.signatureFile && (
                        <p className="text-sm text-gray-500 mt-1">Current: <span className="break-all">{data.signatureUrl}</span></p>
                    )}
                </Field>

                <div className="p-4 border rounded-lg shadow-sm">
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="termsAccepted"
                            checked={!!data.termsAccepted}
                            onChange={handleTermsChange}
                            className="hidden"
                        />
                        <span className={`w-6 h-6 border-2 rounded flex items-center justify-center ${data.termsAccepted ? 'bg-fuchsia-700 border-fuchsia-700' : 'border-gray-300'}`}>
                            {data.termsAccepted && <svg className="w-4 h-4 text-white" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>}
                        </span>
                        <span className="text-gray-700">
                            I accept the <button type="button" className="text-fuchsia-700 hover:underline font-semibold" onClick={() => setShowTermsModal(true)}>Terms and Conditions</button>.
                        </span>
                    </label>
                    {errors.termsAccepted && <p className="text-red-600 text-sm mt-2">{errors.termsAccepted}</p>}
                </div>
            </div>

            {showTermsModal && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
                        <div className="flex flex-col items-center mb-6 text-center">
                            <img
                                src={`${backendBaseUrl}/Images/cbeLogo.png`}
                                alt="Commercial Bank of Ethiopia Logo"
                                className="h-20 w-20 object-contain mb-3"
                                onError={(e) => { e.currentTarget.src = "https://placehold.co/80x80/800080/FFFFFF?text=CBE"; }}
                            />
                            <h1 className="text-2xl font-extrabold text-fuchsia-800">Commercial Bank of Ethiopia</h1>
                            <p className="text-md text-fuchsia-700 font-semibold">The Bank You Can Always Rely On</p>
                        </div>

                        <h3 className="text-xl font-bold mb-4 text-gray-800">Terms and Conditions</h3>
                        <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                            <p>Welcome to our account opening process. By proceeding, you agree to the following terms and conditions. Please read them carefully.</p>
                            <h4>1. Account Eligibility</h4>
                            <p>You must be at least 18 years old and a legal resident of Ethiopia (or meet specific foreign national requirements) to open an account. All information provided must be accurate and truthful.</p>
                            <h4>2. Data Privacy</h4>
                            <p>We are committed to protecting your privacy. Your personal information will be collected, stored, and processed in accordance with the Ethiopian Data Protection Law and our Privacy Policy. By accepting, you consent to this data handling.</p>
                            <h4>3. Digital Signature Consent</h4>
                            <p>Your digital signature provided herein constitutes a legal and binding signature equivalent to a wet signature. You acknowledge that this signature will be used for all documentation related to your account and services.</p>
                            <h4>4. Service Agreement</h4>
                            <p>Upon successful account opening, you agree to abide by the specific terms and conditions applicable to your chosen account type and any selected e-payment or passbook/Muday box services.</p>
                            <h4>5. Disclaimer</h4>
                            <p>We reserve the right to decline any application at our discretion. For full details, please refer to our comprehensive terms document available at any of our branches or on our official website.</p>
                        </div>
                        <div className="text-center mt-6">
                            <button
                                type="button"
                                className="bg-fuchsia-700 text-white px-8 py-2 rounded-lg shadow-md hover:bg-fuchsia-800 transition-transform transform hover:scale-105"
                                onClick={() => setShowTermsModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between mt-10">
                <button
                    type="button"
                    className="bg-gray-300 text-fuchsia-700 px-6 py-2 rounded-lg shadow hover:bg-gray-400 transition"
                    onClick={onBack}
                >
                    Back
                </button>
                <button
                    type="button"
                    className={`w-full md:w-auto px-10 py-3 rounded-lg font-semibold shadow-lg transition transform duration-200 
                        ${(!data.termsAccepted || submitting) ? 'bg-fuchsia-300 cursor-not-allowed' : 'bg-fuchsia-700 text-white hover:bg-fuchsia-800 hover:scale-105'}`}
                    onClick={handleNext}
                    disabled={!data.termsAccepted || submitting}
                >
                    {submitting ? 'Finalizing...' : 'Submit Application'}
                </button>
            </div>
        </div>
    );
}
