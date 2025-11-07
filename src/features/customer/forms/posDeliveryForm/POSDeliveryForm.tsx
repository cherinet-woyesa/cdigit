// features/customer/forms/posDeliveryForm/POSDeliveryForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '@context/BranchContext';
import { useToast } from '@context/ToastContext';
import { useFormSteps } from '@features/customer/hooks/useFormSteps';
import { useFormValidation } from '@features/customer/hooks/useFormValidation';
import { FormLayout } from '@features/customer/components/FormLayout';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import { posDeliveryFormValidationSchema } from '@features/customer/utils/extendedValidationSchemas';
import { posDeliveryFormService } from '@services/forms/posDeliveryFormService';

interface FormData {
  address: string;
  city: string;
  postalCode: string;
  contactName: string;
  contactPhone: string;
  deliveryDate: string;
  specialInstructions: string;
}

export default function POSDeliveryForm() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();
  const { step, next, prev, isFirst, isLast } = useFormSteps(3); // 3 steps

  const { errors, validateForm, clearFieldError } = useFormValidation(posDeliveryFormValidationSchema);

  const [formData, setFormData] = useState<FormData>({
    address: '',
    city: '',
    postalCode: '',
    contactName: '',
    contactPhone: '',
    deliveryDate: '',
    specialInstructions: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof FormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (value) clearFieldError(field);
  };

  const handleSubmit = async () => {
    if (!branch?.id) {
      showError('Branch information is missing. Please select a branch and try again.');
      return;
    }
    if (!validateForm(formData)) return;

    setIsSubmitting(true);
    try {
      const posDeliveryFormData = {
        branchId: branch.id,
        ...formData,
      };

      const response = await posDeliveryFormService.submitPOSDeliveryForm(posDeliveryFormData);

      showSuccess('POS delivery form submitted successfully!');
      navigate('/form/pos-delivery/confirmation', {
        state: {
          serverData: response,
          branchName: branch.name,
        }
      });
    } catch (error: any) {
      showError(error?.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        // Address and city information
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address')(e.target.value)}
                className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                placeholder="Enter address"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city')(e.target.value)}
                className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                placeholder="Enter city"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode')(e.target.value)}
                className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                placeholder="Enter postal code"
              />
              {errors.postalCode && (
                <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
              )}
            </div>
          </div>
        );
      case 2:
        // Contact information
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Delivery Address:</span>
                <span className="font-semibold text-fuchsia-900">{formData.address || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">City:</span>
                <span className="font-semibold text-fuchsia-900">{formData.city || 'Not provided'}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => handleInputChange('contactName')(e.target.value)}
                className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                placeholder="Enter contact name"
              />
              {errors.contactName && (
                <p className="mt-1 text-sm text-red-600">{errors.contactName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone')(e.target.value)}
                className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                placeholder="Enter contact phone"
              />
              {errors.contactPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.contactPhone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => handleInputChange('deliveryDate')(e.target.value)}
                className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
              />
              {errors.deliveryDate && (
                <p className="mt-1 text-sm text-red-600">{errors.deliveryDate}</p>
              )}
            </div>
          </div>
        );
      case 3:
        // Special instructions
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Contact:</span>
                <span className="font-semibold text-fuchsia-900">{formData.contactName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Phone:</span>
                <span className="font-semibold text-fuchsia-900">{formData.contactPhone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Delivery Date:</span>
                <span className="font-semibold text-fuchsia-900">{formData.deliveryDate || 'Not provided'}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions
              </label>
              <textarea
                value={formData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions')(e.target.value)}
                className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                placeholder="Enter special instructions"
                rows={4}
              />
              {errors.specialInstructions && (
                <p className="mt-1 text-sm text-red-600">{errors.specialInstructions}</p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <FormLayout
      title="POS Delivery Form"
      branchName={branch?.name}
      phone={null}
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        {renderStep()}
        <StepNavigation
          currentStep={step}
          totalSteps={3}
          onNext={isLast ? handleSubmit : next}
          onBack={prev}
          nextLabel={isLast ? 'Submit' : 'Continue'}
          nextDisabled={
            (step === 1 && (!formData.address || !formData.city)) ||
            (step === 2 && (!formData.contactName || !formData.contactPhone || !formData.deliveryDate)) ||
            isSubmitting
          }
          nextLoading={isSubmitting}
          hideBack={isFirst}
        />
      </form>
    </FormLayout>
  );
}