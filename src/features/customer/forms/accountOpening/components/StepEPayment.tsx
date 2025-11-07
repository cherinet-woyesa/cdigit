import React from "react";
import Field from '@components/form/Field';
import type { EPaymentService, Errors } from "@features/customer/forms/accountOpening/types/formTypes";
import { Loader2, ChevronRight, CreditCard, Smartphone, Laptop, MessageSquare } from 'lucide-react';

export const validate = (data: EPaymentService): Errors<EPaymentService> => {
    const newErrors: Errors<EPaymentService> = {};
    if (data.hasAtmCard) {
        if (!data.atmCardType) newErrors.atmCardType = "Card Type is required";
        if (!data.atmCardDeliveryBranch) newErrors.atmCardDeliveryBranch = "Delivery Branch is required";
    }
    return newErrors;
};

type StepEPaymentProps = {
    data: EPaymentService;
    setData: (d: EPaymentService) => void;
    errors: Errors<EPaymentService>;
    onNext: (errors: Errors<EPaymentService>) => void;
    onBack: () => void;
    submitting: boolean;
};

const ServiceToggle = ({ 
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

export function StepEPayment({ data, setData, errors, onNext, onBack, submitting }: StepEPaymentProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement;
        const { name, type, checked, value } = target;

        if (type === "checkbox") {
            if (name === "hasAtmCard") {
                setData({
                    ...data,
                    hasAtmCard: checked,
                    atmCardType: checked ? data.atmCardType : "",
                    atmCardDeliveryBranch: checked ? data.atmCardDeliveryBranch : "",
                });
                return;
            }
            setData({ ...data, [name]: checked } as EPaymentService);
        } else {
            setData({ ...data, [name]: value } as EPaymentService);
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
                    <CreditCard className="h-5 w-5 text-fuchsia-700" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">E-Payment Services</h2>
                    <p className="text-gray-600 text-sm">Choose your digital banking services</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* ATM Card */}
                <ServiceToggle
                    name="hasAtmCard"
                    checked={!!data.hasAtmCard}
                    onChange={(checked) => handleChange({ target: { name: "hasAtmCard", type: "checkbox", checked } } as any)}
                    label="ATM Card"
                    description="Debit card for cash withdrawals and payments"
                    icon={CreditCard}
                />

                {data.hasAtmCard && (
                    <div className="ml-8 space-y-4 bg-gray-50 p-4 rounded-lg">
                        <Field label="Card Type" required error={errors.atmCardType}>
                            <select
                                className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors bg-white"
                                name="atmCardType"
                                value={data.atmCardType || ""}
                                onChange={handleChange}
                            >
                                <option value="">Select Card Type</option>
                                <option value="Visa">Visa</option>
                                <option value="Mastercard">Mastercard</option>
                                <option value="Local">Local Card</option>
                            </select>
                        </Field>

                        <Field label="Delivery Branch" required error={errors.atmCardDeliveryBranch}>
                            <input
                                type="text"
                                name="atmCardDeliveryBranch"
                                className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
                                value={data.atmCardDeliveryBranch || ""}
                                onChange={handleChange}
                                placeholder="Enter branch name for card pickup"
                            />
                        </Field>
                    </div>
                )}

                {/* Mobile Banking */}
                <ServiceToggle
                    name="hasMobileBanking"
                    checked={!!data.hasMobileBanking}
                    onChange={(checked) => handleChange({ target: { name: "hasMobileBanking", type: "checkbox", checked } } as any)}
                    label="Mobile Banking"
                    description="Banking services on your mobile phone"
                    icon={Smartphone}
                />

                {/* Internet Banking */}
                <ServiceToggle
                    name="hasInternetBanking"
                    checked={!!data.hasInternetBanking}
                    onChange={(checked) => handleChange({ target: { name: "hasInternetBanking", type: "checkbox", checked } } as any)}
                    label="Internet Banking"
                    description="Online banking through web browser"
                    icon={Laptop}
                />

                {/* CBE Birr */}
                <ServiceToggle
                    name="hasCbeBirr"
                    checked={!!data.hasCbeBirr}
                    onChange={(checked) => handleChange({ target: { name: "hasCbeBirr", type: "checkbox", checked } } as any)}
                    label="CBE Birr"
                    description="Mobile money transfer service"
                    icon={Smartphone}
                />

                {/* SMS Banking */}
                <ServiceToggle
                    name="hasSmsBanking"
                    checked={!!data.hasSmsBanking}
                    onChange={(checked) => handleChange({ target: { name: "hasSmsBanking", type: "checkbox", checked } } as any)}
                    label="SMS Banking"
                    description="Account alerts via SMS"
                    icon={MessageSquare}
                />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-blue-800 text-sm">
                    <strong>Note:</strong> Selected services will be activated after account approval. 
                    You may need to visit the branch for some service activations.
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