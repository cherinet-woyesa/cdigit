import React, { useState } from "react";
import { Field } from "./FormElements";
import type { DigitalSignature, Errors } from "./formTypes";

type StepSignatureProps = {
    data: DigitalSignature;
    setData: (d: DigitalSignature) => void;
    errors: Errors<DigitalSignature>;
    onNext: () => void;
    onBack: () => void;
    submitting: boolean;
};

export function StepSignature({ data, setData, errors, onNext, onBack, submitting }: StepSignatureProps) {
    // State to control the visibility of the terms and conditions modal/display
    const [showTermsModal, setShowTermsModal] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setData({ ...data, signatureFile: e.target.files[0] });
        } else {
            setData({ ...data, signatureFile: undefined });
        }
    };

    const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, termsAccepted: e.target.checked });
    };

    // Determine if the submit button should be enabled
    const isSubmitEnabled = data.termsAccepted && (data.signatureFile || data.signatureUrl);

    // Define the backend base URL for image assets
    // You might want to make this configurable (e.g., via environment variables)
    const backendBaseUrl = "http://localhost:5268"; 

    return (
        <>
            <div className="text-xl font-bold mb-3 text-fuchsia-800">Digital Signature & Terms</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Upload Digital Signature" required error={errors.signatureUrl}>
                    <input
                        type="file"
                        name="signatureFile"
                        className="form-input w-full p-2 rounded border"
                        onChange={handleFileChange}
                        accept="image/*"
                    />
                    {data.signatureUrl && (
                        <p className="text-sm text-gray-500 mt-1">Uploaded: {data.signatureUrl.split('/').pop()}</p>
                    )}
                    {data.signatureFile && (
                        <p className="text-sm text-gray-500 mt-1">Ready to upload: {data.signatureFile.name}</p>
                    )}
                </Field>
                <Field label="Terms and Conditions" required error={errors.termsAccepted}>
                    <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="termsAccepted"
                                checked={data.termsAccepted}
                                onChange={handleTermsChange}
                                className="form-checkbox h-5 w-5 text-fuchsia-600 rounded focus:ring-fuchsia-500"
                            />
                            <span className="text-gray-700">I accept the terms and conditions.</span>
                        </label>
                        {/* Button to view terms, visible always */}
                        <button
                            type="button"
                            className="text-fuchsia-700 hover:underline ml-2 text-sm"
                            onClick={() => setShowTermsModal(true)}
                        >
                            View Terms
                        </button>
                    </div>
                </Field>
            </div>

            {/* Terms and Conditions Modal/Overlay */}
            {showTermsModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 relative">
                        {/* Bank Logo, Name, and Motto - now INSIDE the modal */}
                        <div className="flex flex-col items-center mb-6">
                            <img
                                // *** CRUCIAL CHANGE HERE ***
                                src={`${backendBaseUrl}/Images/cbeLogo.png`} // Full path to backend's static file
                                alt="Commercial Bank of Ethiopia Logo"
                                className="h-24 w-24 object-contain mb-2" // Adjust size as needed
                                onError={(e) => {
                                    e.currentTarget.onerror = null; // Prevent infinite loop
                                    e.currentTarget.src = "https://placehold.co/96x96/800080/FFFFFF?text=CBE"; // Placeholder if logo fails
                                }}
                            />
                            <h1 className="text-3xl font-extrabold text-fuchsia-800 mb-1">Commercial Bank of Ethiopia</h1>
                            <p className="text-lg text-fuchsia-700 font-semibold">The Bank You Can Always Rely On</p>
                        </div>

                        <h3 className="text-xl font-bold mb-4 text-fuchsia-800">Terms and Conditions</h3>
                        <div className="text-gray-700 text-sm leading-relaxed">
                            <p className="mb-4">
                                Welcome to our account opening process. By proceeding, you agree to the following terms and conditions. Please read them carefully.
                            </p>
                            <h4 className="font-semibold text-lg mb-2">1. Account Eligibility</h4>
                            <p className="mb-2">
                                You must be at least 18 years old and a legal resident of Ethiopia (or meet specific foreign national requirements) to open an account. All information provided must be accurate and truthful.
                            </p>
                            <h4 className="font-semibold text-lg mb-2">2. Data Privacy</h4>
                            <p className="mb-2">
                                We are committed to protecting your privacy. Your personal information will be collected, stored, and processed in accordance with the Ethiopian Data Protection Law and our Privacy Policy. By accepting, you consent to this data handling.
                            </p>
                            <h4 className="font-semibold text-lg mb-2">3. Digital Signature Consent</h4>
                            <p className="mb-2">
                                Your digital signature provided herein constitutes a legal and binding signature equivalent to a wet signature. You acknowledge that this signature will be used for all documentation related to your account and services.
                            </p>
                            <h4 className="font-semibold text-lg mb-2">4. Service Agreement</h4>
                            <p className="mb-2">
                                Upon successful account opening, you agree to abide by the specific terms and conditions applicable to your chosen account type (Savings, Current, IFB) and any selected e-payment or passbook/Muday box services. These additional terms will be provided upon account activation.
                            </p>
                            <h4 className="font-semibold text-lg mb-2">5. Disclaimer</h4>
                            <p className="mb-2">
                                While we strive for accuracy, the information provided during the application process is subject to verification. We reserve the right to decline any application at our discretion.
                            </p>
                            <p className="mb-4">
                                For full details, please refer to our comprehensive terms document available at any of our branches or on our official website.
                            </p>
                            <div className="bg-black p-4">
                              <span className="text-yellow-400 font-semibold mt-4">© 2025-CBE-</span>
                              <span className="text-yellow-400 font-semibold mt-4">The Bank You Can Always Rely On: </span>
                              <span className="text-right text-white font-semibold mt-4">Thank you for choosing us.</span>
                            </div>
                            {/* <p className="text-right  text-yellow-100 font-semibold mt-4">Thank you for choosing us.</p> */}
                        </div>
                        <div className="flex justify-center mt-6">
                            <button
                                type="button"
                                className="bg-fuchsia-700 text-white px-6 py-2 rounded-lg shadow-md hover:bg-fuchsia-800 transition"
                                onClick={() => setShowTermsModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between mt-6">
                <button
                    type="button"
                    className="bg-gray-300 text-fuchsia-700 px-6 py-2 rounded shadow hover:bg-gray-400 transition"
                    onClick={onBack}
                    disabled={submitting}
                >
                    Back
                </button>
                <button
                    type="button"
                    className="bg-fuchsia-700 text-white px-6 py-2 rounded shadow hover:bg-fuchsia-800 transition disabled:opacity-50"
                    onClick={onNext}
                    disabled={submitting || !isSubmitEnabled}
                >
                    Submit
                </button>
            </div>
        </>
    );
}