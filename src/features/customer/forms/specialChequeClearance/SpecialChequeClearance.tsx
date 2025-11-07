// features/customer/forms/specialChequeClearance/SpecialChequeClearance.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '@context/BranchContext';
import { useToast } from '@context/ToastContext';
import { useFormValidation } from '@features/customer/hooks/useFormValidation';
import { FormLayout } from '@features/customer/components/FormLayout';
import { AmountInput } from '@features/customer/components/AmountInput';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import { specialChequeClearanceValidationSchema } from '@features/customer/utils/extendedValidationSchemas';
import { specialChequeClearanceService } from '@services/transactions/specialChequeClearanceService';

interface FormData {
  chequeNumber: string;
  chequeAmount: string;
  urgencyLevel: string;
  clearanceReason: string;
  documentReference: string;
}

export default function SpecialChequeClearance() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();

  const { errors, validateForm, clearFieldError } = useFormValidation(specialChequeClearanceValidationSchema);

  const [formData, setFormData] = useState<FormData>({
    chequeNumber: '',
    chequeAmount: '',
    urgencyLevel: '',
    clearanceReason: '',
    documentReference: '',
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
      const specialChequeClearanceData = {
        branchId: branch.id,
        ...formData,
        chequeAmount: parseFloat(formData.chequeAmount),
      };

      const response = await specialChequeClearanceService.submitSpecialChequeClearance(specialChequeClearanceData);

      showSuccess('Special cheque clearance request submitted successfully!');
      navigate('/form/special-cheque-clearance/confirmation', {
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
      title="Special Cheque Clearance"
      branchName={branch?.name}
      phone={null}
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Cheque Number <span className="text-red-500">*</span>
            </label>
            <input
            type="text"
            value={formData.chequeNumber}
            onChange={(e) => handleInputChange('chequeNumber')(e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            placeholder="Enter cheque number"
            />
            {errors.chequeNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.chequeNumber}</p>
            )}
        </div>
        <AmountInput
            value={formData.chequeAmount}
            onChange={handleInputChange('chequeAmount')}
            currency="ETB"
            error={errors.chequeAmount}
            label="Cheque Amount"
        />
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Urgency Level <span className="text-red-500">*</span>
            </label>
            <select
                value={formData.urgencyLevel}
                onChange={(e) => handleInputChange('urgencyLevel')(e.target.value)}
                className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            >
                <option value="">Select Urgency Level</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
            </select>
            {errors.urgencyLevel && (
            <p className="mt-1 text-sm text-red-600">{errors.urgencyLevel}</p>
            )}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Clearance Reason <span className="text-red-500">*</span>
            </label>
            <textarea
            value={formData.clearanceReason}
            onChange={(e) => handleInputChange('clearanceReason')(e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            placeholder="Enter clearance reason"
            rows={4}
            />
            {errors.clearanceReason && (
            <p className="mt-1 text-sm text-red-600">{errors.clearanceReason}</p>
            )}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Reference
            </label>
            <input
            type="text"
            value={formData.documentReference}
            onChange={(e) => handleInputChange('documentReference')(e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            placeholder="Enter document reference"
            />
            {errors.documentReference && (
            <p className="mt-1 text-sm text-red-600">{errors.documentReference}</p>
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
