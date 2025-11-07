// features/customer/forms/cashDiscrepancyReport/CashDiscrepancyReport.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '@context/BranchContext';
import { useToast } from '@context/ToastContext';
import { useFormValidation } from '@features/customer/hooks/useFormValidation';
import { FormLayout } from '@features/customer/components/FormLayout';
import { AmountInput } from '@features/customer/components/AmountInput';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import { cashDiscrepancyReportValidationSchema } from '@features/customer/utils/extendedValidationSchemas';
import { cashDiscrepancyReportService } from '@services/transactions/cashDiscrepancyReportService';

interface FormData {
  discrepancyAmount: string;
  description: string;
  reason: string;
  documentReference: string;
}

export default function CashDiscrepancyReport() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();

  const { errors, validateForm, clearFieldError } = useFormValidation(cashDiscrepancyReportValidationSchema);

  const [formData, setFormData] = useState<FormData>({
    discrepancyAmount: '',
    description: '',
    reason: '',
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
      const cashDiscrepancyReportData = {
        branchId: branch.id,
        discrepancyAmount: parseFloat(formData.discrepancyAmount),
        description: formData.description,
        reason: formData.reason,
        documentReference: formData.documentReference,
      };

      const response = await cashDiscrepancyReportService.submitCashDiscrepancyReport(cashDiscrepancyReportData);

      showSuccess('Cash discrepancy report submitted successfully!');
      navigate('/form/cash-discrepancy-report/confirmation', {
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
      title="Cash Discrepancy Report"
      branchName={branch?.name}
      phone={null}
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        <AmountInput
            value={formData.discrepancyAmount}
            onChange={handleInputChange('discrepancyAmount')}
            currency="ETB"
            error={errors.discrepancyAmount}
            label="Discrepancy Amount"
        />
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
            </label>
            <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description')(e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            placeholder="Enter description"
            rows={4}
            />
            {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason <span className="text-red-500">*</span>
            </label>
            <input
            type="text"
            value={formData.reason}
            onChange={(e) => handleInputChange('reason')(e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            placeholder="Enter reason"
            />
            {errors.reason && (
            <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
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
            currentStep={1}
            totalSteps={1}
            onNext={handleSubmit}
            onBack={() => {}}
            nextLabel="Submit"
            nextDisabled={isSubmitting}
            nextLoading={isSubmitting}
            hideBack={true}
        />
      </form>
    </FormLayout>
  );
}
