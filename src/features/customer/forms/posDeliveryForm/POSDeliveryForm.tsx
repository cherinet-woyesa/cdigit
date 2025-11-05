// features/customer/forms/posDeliveryForm/POSDeliveryForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '../../../../context/BranchContext';
import { useToast } from '../../../../context/ToastContext';
import { useFormValidation } from '../../hooks/useFormValidation';
import { FormLayout } from '../../components/FormLayout';
import { StepNavigation } from '../../components/StepNavigation';
import { posDeliveryFormValidationSchema } from '../../utils/extendedValidationSchemas';
import { posDeliveryFormService } from '../../../../services/posDeliveryFormService';

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

  return (
    <FormLayout
      title="POS Delivery Form"
      branchName={branch?.name}
      phone={null}
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
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
        <StepNavigation
            onNext={handleSubmit}
            nextLabel="Submit"
            nextDisabled={isSubmitting}
            nextLoading={isSubmitting}
            hideBack={true}
        />
      </form>
    </FormLayout>
  );
}
