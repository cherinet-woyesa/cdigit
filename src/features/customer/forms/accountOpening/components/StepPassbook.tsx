import React from "react";
import Field from '../../../../../components/Field';
import type { PassbookMudayRequest, Errors } from "../types/formTypes";
import { Loader2, ChevronRight, Book, PiggyBank, Package } from 'lucide-react';

export const validate = (data: PassbookMudayRequest): Errors<PassbookMudayRequest> => {
    const newErrors: Errors<PassbookMudayRequest> = {};
    if (data.needsMudayBox && !data.mudayBoxDeliveryBranch) {
        newErrors.mudayBoxDeliveryBranch = "Muday Box Delivery Branch is required";
    }
    return newErrors;
};

type StepPassbookProps = {
    data: PassbookMudayRequest;
    setData: (d: PassbookMudayRequest) => void;
    errors: Errors<PassbookMudayRequest>;
    onNext: (errors: Errors<PassbookMudayRequest>) => void;
    onBack: () => void;
    submitting: boolean;
};

const ItemToggle = ({ 
    name, 
    checked, 
    onChange, 
    label, 
    description, 
    icon: Icon 
}: { 
    name: string; 
    checked: boolean; 
    onChange: (checked: boolean) => void; 
    label: string; 
    description: string; 
    icon: React.ComponentType<any>;
}) => (
    <div className={`p-4 border-2 rounded-lg transition-all duration-200 ${
        checked 
            ? 'border-fuchsia-500 bg-fuchsia-50 shadow-sm' 
            : 'border-gray-200 hover:border-gray-300'
    }`}>
        <label className="flex items-start gap-3 cursor-pointer">
            <div className="flex items-center h-5 mt-0.5">
                <input
                    type="checkbox"
                    name={name}
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="w-4 h-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
                />
            </div>
            <div className="flex items-center gap-3 flex-1">
                <div className={`p-2 rounded-lg ${
                    checked ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-gray-100 text-gray-600'
                }`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <span className="font-medium text-gray-900 block">{label}</span>
                    <span className="text-sm text-gray-600">{description}</span>
                </div>
            </div>
        </label>
    </div>
);

export function StepPassbook({ data, setData, errors, onNext, onBack, submitting }: StepPassbookProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement;
        const { name, type, checked, value } = target;

        if (type === "checkbox") {
            if (name === "needsMudayBox") {
                setData({ 
                    ...data, 
                    needsMudayBox: checked, 
                    mudayBoxDeliveryBranch: checked ? data.mudayBoxDeliveryBranch : "" 
                });
                return;
            }
            setData({ ...data, [name]: checked } as PassbookMudayRequest);
        } else {
            setData({ ...data, [name]: value });
        }
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
                    <Book className="h-5 w-5 text-fuchsia-700" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Physical Items Request</h2>
                    <p className="text-gray-600 text-sm">Request physical banking items</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Passbook */}
                <ItemToggle
                    name="needsPassbook"
                    checked={!!data.needsPassbook}
                    onChange={(checked) => handleChange({ target: { name: "needsPassbook", type: "checkbox", checked } } as any)}
                    label="Passbook"
                    description="Physical record of your account transactions"
                    icon={Book}
                />

                {/* Muday Box */}
                <ItemToggle
                    name="needsMudayBox"
                    checked={!!data.needsMudayBox}
                    onChange={(checked) => handleChange({ target: { name: "needsMudayBox", type: "checkbox", checked } } as any)}
                    label="Muday Box (Coin Bank)"
                    description="Traditional savings box for coin collection"
                    icon={PiggyBank}
                />

                {data.needsMudayBox && (
                    <div className="ml-8 space-y-4 bg-gray-50 p-4 rounded-lg">
                        <Field label="Muday Box Delivery Branch" required error={errors.mudayBoxDeliveryBranch}>
                            <div className="relative">
                                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    name="mudayBoxDeliveryBranch"
                                    className="w-full pl-10 p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
                                    value={data.mudayBoxDeliveryBranch || ""}
                                    onChange={handleChange}
                                    placeholder="Enter branch name for pickup"
                                />
                            </div>
                        </Field>
                    </div>
                )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                <p className="text-yellow-800 text-sm">
                    <strong>Important:</strong> Requested items will be available for pickup at your selected branch 
                    after account approval. You will be notified when they are ready.
                </p>
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