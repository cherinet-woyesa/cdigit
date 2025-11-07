import React, { useState, useRef } from "react";
import Field from "@components/form/Field";
import type { DigitalSignature, Errors } from "@features/customer/forms/accountOpening/types/formTypes";
import { Loader2, ChevronRight, PenTool, CheckCircle2, Shield, Eraser } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

export const validate = (data: DigitalSignature): Errors<DigitalSignature> => {
    const newErrors: Errors<DigitalSignature> = {};
    if (!data.signatureUrl) newErrors.signatureUrl = "Digital signature is required";
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
    const [isSignatureEmpty, setIsSignatureEmpty] = useState(!data.signatureUrl);
    const signaturePadRef = useRef<SignatureCanvas | null>(null);

    const handleSignatureClear = () => {
        if (signaturePadRef.current) {
            signaturePadRef.current.clear();
            setIsSignatureEmpty(true);
            setData({ 
                ...data, 
                signatureData: '',
                signatureUrl: '' // Clear both fields
            });
        }
    };

    const handleSignatureEnd = () => {
        if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
            setIsSignatureEmpty(false);
            const signatureData = signaturePadRef.current.toDataURL();
            setData({ 
                ...data, 
                signatureData,
                signatureUrl: signatureData // Populate signatureUrl for backend
            });
        }
    };

    const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, termsAccepted: e.target.checked });
    };

    const handleNext = () => {
        const validationErrors = validate(data);
        onNext(validationErrors);
    };

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
                {/* Digital Signature Canvas */}
                <Field label="Digital Signature" required error={errors.signatureUrl}>
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-blue-700">
                                Please provide your signature using your finger or stylus. This signature will be used to authorize your application.
                            </p>
                        </div>

                        <div className="bg-gray-100 rounded-lg p-2 mb-4">
                            <SignatureCanvas
                                ref={signaturePadRef}
                                onEnd={handleSignatureEnd}
                                canvasProps={{
                                    className: "w-full h-48 bg-white border border-gray-300 rounded-md cursor-crosshair"
                                }}
                                penColor="black"
                                backgroundColor="white"
                                clearOnResize={false}
                            />
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <button
                                type="button"
                                onClick={handleSignatureClear}
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <Eraser className="h-4 w-4" />
                                Clear Signature
                            </button>
                            
                            <div className="text-sm text-gray-500">
                                {!isSignatureEmpty ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Signature provided
                                    </span>
                                ) : (
                                    <span className="text-gray-400">
                                        No signature provided
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
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
                        (!data.termsAccepted || !data.signatureUrl || submitting) 
                            ? 'bg-fuchsia-300 cursor-not-allowed text-white' 
                            : 'bg-fuchsia-700 text-white hover:bg-fuchsia-800 hover:scale-105'
                    }`}
                    onClick={handleNext}
                    disabled={!data.termsAccepted || !data.signatureUrl || submitting}
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