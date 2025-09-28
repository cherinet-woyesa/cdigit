import React from "react";
import Field from '../../../../../components/Field';
import type { OtherDetail, Errors } from "../types/formTypes";
import { Loader2, ChevronRight, Shield, AlertTriangle, Gift } from 'lucide-react';

export const validate = (data: OtherDetail): Errors<OtherDetail> => {
    const newErrors: Errors<OtherDetail> = {};
    if (data.hasBeenConvicted && !data.convictionReason) newErrors.convictionReason = "Reason for conviction is required";
    if (data.isPoliticallyExposed && !data.pepPosition) newErrors.pepPosition = "PEP Position is required";
    return newErrors;
};

type StepOtherProps = {
    data: OtherDetail;
    setData: (d: OtherDetail) => void;
    errors: Errors<OtherDetail>;
    onNext: (errors: Errors<OtherDetail>) => void;
    onBack: () => void;
    submitting: boolean;
};

export function StepOther({ data, setData, errors, onNext, onBack, submitting }: StepOtherProps) {
    // Fix: Update handleChange to handle textarea as well
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    // Fix: Specific handler for textarea
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    // Fix: Handler for checkbox inputs
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setData({ ...data, [name]: checked } as any);
    };

    const handleNext = () => {
        const validationErrors = validate(data);
        onNext(validationErrors);
    };

    const ToggleOption = ({ checked, onToggle, label, description }: {
        checked: boolean;
        onToggle: (checked: boolean) => void;
        label: string;
        description?: string;
    }) => (
        <div className="p-4 border rounded-lg hover:border-fuchsia-300 transition-colors">
            <label className="flex items-start gap-3 cursor-pointer">
                <div className="flex items-center h-5 mt-0.5">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onToggle(e.target.checked)}
                        className="w-4 h-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
                    />
                </div>
                <div className="flex-1">
                    <span className="font-medium text-gray-900">{label}</span>
                    {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
                </div>
            </label>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-fuchsia-100 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-fuchsia-700" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Additional Information</h2>
                    <p className="text-gray-600 text-sm">Help us understand your background</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Conviction Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Legal Declaration
                    </h3>
                    <ToggleOption
                        checked={data.hasBeenConvicted === true}
                        onToggle={(checked) => setData({ 
                            ...data, 
                            hasBeenConvicted: checked,
                            convictionReason: checked ? data.convictionReason : ''
                        })}
                        label="Have you ever been convicted of a crime?"
                        description="This information helps us comply with regulatory requirements"
                    />
                    
                    {data.hasBeenConvicted && (
                        <div className="mt-4 ml-7">
                            <Field label="Reason for Conviction" required error={errors.convictionReason}>
                                <textarea
                                    name="convictionReason"
                                    className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors resize-none"
                                    value={data.convictionReason || ""}
                                    onChange={handleTextareaChange} 
                                    rows={3}
                                    placeholder="Please provide details of the conviction"
                                />
                            </Field>
                        </div>
                    )}
                </div>

                {/* PEP Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Political Exposure</h3>
                    <ToggleOption
                        checked={data.isPoliticallyExposed === true}
                        onToggle={(checked) => setData({ 
                            ...data, 
                            isPoliticallyExposed: checked,
                            pepPosition: checked ? data.pepPosition : ''
                        })}
                        label="Are you a Politically Exposed Person (PEP)?"
                        description="This includes current or former senior government officials, political party leaders, etc."
                    />
                    
                    {data.isPoliticallyExposed && (
                        <div className="mt-4 ml-7">
                            <Field label="PEP Position" required error={errors.pepPosition}>
                                <input
                                    type="text"
                                    name="pepPosition"
                                    className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
                                    value={data.pepPosition || ""}
                                    onChange={handleChange}
                                    placeholder="Your position or role"
                                />
                            </Field>
                        </div>
                    )}
                </div>

                {/* Other Declarations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleOption
                        checked={data.isUSCitizenOrResident}
                        onToggle={(checked) => setData({ ...data, isUSCitizenOrResident: checked })}
                        label="US Citizen or Resident"
                        description="For tax compliance purposes"
                    />
                    
                    <ToggleOption
                        checked={data.accountOpenedByLegalDelegate}
                        onToggle={(checked) => setData({ ...data, accountOpenedByLegalDelegate: checked })}
                        label="Account opened by legal delegate"
                        description="If someone is opening the account on your behalf"
                    />
                </div>

                {/* Source of Funds - Optional Fields */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Source of Funds (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Primary Source of Funds" error={errors.sourceOfFund}>
                            <select
                                name="sourceOfFund"
                                className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors bg-white"
                                value={data.sourceOfFund || ""}
                                onChange={handleChange}
                            >
                                <option value="">Select source</option>
                                <option value="Salary">Salary</option>
                                <option value="Business">Business Income</option>
                                <option value="Investment">Investment</option>
                                <option value="Inheritance">Inheritance</option>
                                <option value="Other">Other</option>
                            </select>
                        </Field>

                        {data.sourceOfFund === "Other" && (
                            <Field label="Specify Other Source" error={errors.otherSourceOfFund}>
                                <input
                                    type="text"
                                    name="otherSourceOfFund"
                                    className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
                                    value={data.otherSourceOfFund || ""}
                                    onChange={handleChange}
                                    placeholder="Please specify"
                                />
                            </Field>
                        )}
                    </div>
                </div>
            </div>

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
                        submitting 
                            ? 'bg-fuchsia-300 cursor-not-allowed text-white' 
                            : 'bg-fuchsia-700 text-white hover:bg-fuchsia-800 hover:scale-105'
                    }`}
                    onClick={handleNext}
                    disabled={submitting}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            Continue
                            <ChevronRight className="h-4 w-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}