import React from 'react';
import type { FormData } from '../types/formTypes';
import { Loader2, ChevronRight, CheckCircle2, Edit, User, MapPin, CreditCard, FileText, Shield, PenTool } from 'lucide-react';

const formatLabel = (key: string) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

const DataValue = ({ value }: { value: any }) => {
    if (typeof value === 'boolean') {
        return <span className="font-normal text-gray-800">{value ? 'Yes' : 'No'}</span>;
    }
    if (value instanceof File) {
        return <span className="font-normal text-gray-800">{value.name}</span>;
    }
    if (!value || value === '') {
        return <span className="font-normal text-gray-500 italic">Not provided</span>;
    }
    if (typeof value === 'string' && value.length > 50) {
        return <span className="font-normal text-gray-800 break-all">{value.substring(0, 50)}...</span>;
    }
    return <span className="font-normal text-gray-800">{String(value)}</span>;
};

const ReviewSection = ({ 
    title, 
    data, 
    onEdit, 
    icon: Icon 
}: { 
    title: string; 
    data: object; 
    onEdit: () => void; 
    icon: React.ComponentType<any>;
}) => {
    if (!data) return null;

    const entries = Object.entries(data).filter(([key]) => 
        key !== 'id' && key !== 'customerId' && data[key as keyof typeof data] !== undefined
    );

    if (entries.length === 0) return null;

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                </div>
                <button
                    onClick={onEdit}
                    className="text-fuchsia-700 hover:text-fuchsia-800 flex items-center gap-1 text-sm font-medium"
                >
                    <Edit className="h-3 w-3" />
                    Edit
                </button>
            </div>
            <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {entries.map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                {formatLabel(key)}
                            </span>
                            <DataValue value={value} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

type StepReviewProps = {
    formData: FormData;
    goTo: (step: number) => void;
    onBack: () => void;
    onSubmit: () => void;
    submitting: boolean;
};

export function StepReview({ formData, goTo, onBack, onSubmit, submitting }: StepReviewProps) {
    const sectionIcons = [User, MapPin, CreditCard, Shield, FileText, CreditCard, CreditCard, PenTool];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="bg-green-100 p-3 rounded-full inline-flex mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Application</h2>
                <p className="text-gray-600">Please verify all information before submitting</p>
            </div>

            {/* Application Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    <div>
                        <p className="text-blue-800 font-medium">Application Summary</p>
                        <p className="text-blue-700 text-sm">Customer ID: {formData.customerId || 'Pending'}</p>
                    </div>
                </div>
            </div>

            {/* Review Sections */}
            <div className="space-y-4">
                <ReviewSection 
                    title="Personal Details" 
                    data={formData.personalDetails} 
                    onEdit={() => goTo(0)} 
                    icon={sectionIcons[0]} 
                />
                
                <ReviewSection 
                    title="Address Details" 
                    data={formData.addressDetails} 
                    onEdit={() => goTo(1)} 
                    icon={sectionIcons[1]} 
                />
                
                <ReviewSection 
                    title="Financial Details" 
                    data={formData.financialDetails} 
                    onEdit={() => goTo(2)} 
                    icon={sectionIcons[2]} 
                />
                
                <ReviewSection 
                    title="Other Details" 
                    data={formData.otherDetails} 
                    onEdit={() => goTo(3)} 
                    icon={sectionIcons[3]} 
                />
                
                <ReviewSection 
                    title="Document Details" 
                    data={formData.documentDetails} 
                    onEdit={() => goTo(4)} 
                    icon={sectionIcons[4]} 
                />
                
                <ReviewSection 
                    title="E-Payment Services" 
                    data={formData.ePaymentService} 
                    onEdit={() => goTo(5)} 
                    icon={sectionIcons[5]} 
                />
                
                <ReviewSection 
                    title="Physical Items" 
                    data={formData.passbookMudayRequest} 
                    onEdit={() => goTo(6)} 
                    icon={sectionIcons[6]} 
                />
                
                <ReviewSection 
                    title="Signature & Agreement" 
                    data={formData.digitalSignature} 
                    onEdit={() => goTo(7)} 
                    icon={sectionIcons[7]} 
                />
            </div>

            {/* Final Confirmation */}
            <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <label className="flex items-start gap-3 cursor-pointer">
                    <div className="flex items-center h-5 mt-0.5">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
                            defaultChecked
                            readOnly
                        />
                    </div>
                    <div>
                        <span className="text-gray-900 font-medium">
                            I confirm that all information provided is accurate and complete
                        </span>
                        <p className="text-gray-600 text-sm mt-1">
                            By submitting, you agree that all details are correct to the best of your knowledge
                        </p>
                    </div>
                </label>
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
                    onClick={onSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-4 w-4" />
                            Review
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}