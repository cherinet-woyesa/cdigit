import React, { useState } from "react";
import Field from '../../../../../components/Field';
import type { DigitalSignature, Errors } from "../types/formTypes";
import { Loader2, ChevronRight, PenTool, Upload, CheckCircle2, FileText, Shield } from 'lucide-react';

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
                setFileError('Only image files (JPEG, PNG) are allowed.');
                setData({ ...data, signatureFile: undefined });
                return;
            }
            if (file.size > 1 * 1024 * 1024) {
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-fuchsia-100 p-2 rounded-lg">
                    <PenTool className="h-5 w-5 text-fuchsia-700" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Signature & Agreement</h2>
                    <p className="text-gray-600 text-sm">Finalize your application</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Signature Upload */}
                <Field label="Upload Digital Signature" required error={errors.signatureUrl || fileError}>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-fuchsia-400 transition-colors">
                        <input
                            type="file"
                            name="signatureFile"
                            className="hidden"
                            id="signatureFile"
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                        <label htmlFor="signatureFile" className="cursor-pointer">
                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600 font-medium">Click to upload your signature</p>
                            <p className="text-gray-500 text-sm">JPEG or PNG, max 1MB</p>
                        </label>
                    </div>
                    {data.signatureFile && (
                        <div className="mt-4 flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-green-700 text-sm">Signature file selected</span>
                        </div>
                    )}
                    {data.signatureUrl && !data.signatureFile && (
                        <p className="text-sm text-gray-500 mt-2">Signature already uploaded</p>
                    )}
                </Field>

                {/* Terms and Conditions */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <div className="flex items-center h-5 mt-0.5">
                            <input
                                type="checkbox"
                                name="termsAccepted"
                                checked={!!data.termsAccepted}
                                onChange={handleTermsChange}
                                className="w-4 h-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
                            />
                        </div>
                        <div className="flex-1">
                            <span className="text-gray-900 font-medium">
                                I accept the{" "}
                                <button 
                                    type="button" 
                                    className="text-fuchsia-700 hover:underline font-semibold" 
                                    onClick={() => setShowTermsModal(true)}
                                >
                                    Terms and Conditions
                                </button>
                            </span>
                            {errors.termsAccepted && (
                                <p className="text-red-600 text-sm mt-1">{errors.termsAccepted}</p>
                            )}
                        </div>
                    </label>
                </div>
            </div>

            {/* Terms Modal */}
            {showTermsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3 mb-4">
                                <Shield className="h-6 w-6 text-fuchsia-700" />
                                <h3 className="text-lg font-bold text-gray-900">Terms and Conditions</h3>
                            </div>
                        </div>
                        
                        <div className="p-6 space-y-4 text-sm text-gray-700">
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">1. Account Eligibility</h4>
                                <p>You must be at least 18 years old and provide accurate information. All documents must be valid and authentic.</p>
                            </div>
                            
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">2. Data Privacy</h4>
                                <p>Your personal information will be protected in accordance with Ethiopian data protection laws and our privacy policy.</p>
                            </div>
                            
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">3. Digital Signature</h4>
                                <p>Your digital signature constitutes a legal and binding agreement equivalent to a physical signature.</p>
                            </div>
                            
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-2">4. Service Agreement</h4>
                                <p>You agree to abide by the terms of your selected account type and banking services.</p>
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-gray-200 flex justify-end">
                            <button
                                type="button"
                                className="bg-fuchsia-700 text-white px-6 py-2 rounded-lg hover:bg-fuchsia-800 transition-colors"
                                onClick={() => setShowTermsModal(false)}
                            >
                                I Understand
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                    type="button"
                    className="px-8 py-3 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
                    onClick={onBack}
                    disabled={submitting}
                >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Back
                </button>
                <button
                    type="button"
                    className={`px-8 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 flex items-center gap-2 ${
                        (!data.termsAccepted || submitting) 
                            ? 'bg-fuchsia-300 cursor-not-allowed text-white' 
                            : 'bg-fuchsia-700 text-white hover:bg-fuchsia-800 hover:scale-105'
                    }`}
                    onClick={handleNext}
                    disabled={!data.termsAccepted || submitting}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Finalizing...
                        </>
                    ) : (
                        <>
                            Submit Application
                            <ChevronRight className="h-4 w-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}