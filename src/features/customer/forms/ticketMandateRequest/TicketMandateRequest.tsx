// features/customer/forms/ticketMandateRequest/TicketMandateRequest.tsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '../../../../context/BranchContext';
import { useToast } from '../../../../context/ToastContext';
import { useFormValidation } from '../../hooks/useFormValidation';
import { FormLayout } from '../../components/FormLayout';
import { AccountSelector } from '../../components/AccountSelector';
import { StepNavigation } from '../../components/StepNavigation';
import { ticketMandateRequestValidationSchema } from '../../utils/extendedValidationSchemas';
import { ticketMandateRequestService } from '../../../../services/ticketMandateRequestService';
import SignatureCanvas from 'react-signature-canvas';

interface FormData {
  accountNumber: string;
  mandateType: string;
  authorizationScope: string;
  mandateStartDate: string;
  mandateEndDate: string;
  signature: string;
}

export default function TicketMandateRequest() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();
  const signatureRef = useRef<SignatureCanvas>(null);

  const { errors, validateForm, clearFieldError } = useFormValidation(ticketMandateRequestValidationSchema);

  const [formData, setFormData] = useState<FormData>({
    accountNumber: '',
    mandateType: '',
    authorizationScope: '',
    mandateStartDate: '',
    mandateEndDate: '',
    signature: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountValidated, setAccountValidated] = useState(false);

  const handleAccountChange = (accountNumber: string) => {
    setFormData(prev => ({ ...prev, accountNumber }));
    if (!accountNumber) {
      setAccountValidated(false);
    }
  };

  const handleAccountValidation = (account: any | null) => {
    setAccountValidated(!!account);
  };

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
      const ticketMandateRequestData = {
        branchId: branch.id,
        ...formData,
      };

      const response = await ticketMandateRequestService.submitTicketMandateRequest(ticketMandateRequestData);

      showSuccess('Ticket mandate request submitted successfully!');
      navigate('/form/ticket-mandate-request/confirmation', {
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
      title="Ticket Mandate Request"
      branchName={branch?.name}
      phone={null}
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        <AccountSelector
            accounts={[]}
            selectedAccount={formData.accountNumber}
            onAccountChange={handleAccountChange}
            onAccountValidation={handleAccountValidation}
            error={errors.accountNumber}
            allowManualEntry={true}
        />
        {accountValidated && (
            <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mandate Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.mandateType}
                        onChange={(e) => handleInputChange('mandateType')(e.target.value)}
                        className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                    >
                        <option value="">Select Mandate Type</option>
                        <option value="Single Transaction">Single Transaction</option>
                        <option value="Multiple Transactions">Multiple Transactions</option>
                        <option value="Standing Order">Standing Order</option>
                    </select>
                    {errors.mandateType && (
                    <p className="mt-1 text-sm text-red-600">{errors.mandateType}</p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    Authorization Scope <span className="text-red-500">*</span>
                    </label>
                    <textarea
                    value={formData.authorizationScope}
                    onChange={(e) => handleInputChange('authorizationScope')(e.target.value)}
                    className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                    placeholder="Enter authorization scope"
                    rows={4}
                    />
                    {errors.authorizationScope && (
                    <p className="mt-1 text-sm text-red-600">{errors.authorizationScope}</p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mandate Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                    type="date"
                    value={formData.mandateStartDate}
                    onChange={(e) => handleInputChange('mandateStartDate')(e.target.value)}
                    className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                    />
                    {errors.mandateStartDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.mandateStartDate}</p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mandate End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                    type="date"
                    value={formData.mandateEndDate}
                    onChange={(e) => handleInputChange('mandateEndDate')(e.target.value)}
                    className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                    />
                    {errors.mandateEndDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.mandateEndDate}</p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Digital Signature <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <SignatureCanvas
                            ref={signatureRef}
                            penColor="black"
                            canvasProps={{ className: 'w-full h-40 rounded-lg border border-fuchsia-300 bg-gray-50' }}
                            onEnd={() => {
                                if (signatureRef.current) {
                                    setFormData(prev => ({ ...prev, signature: signatureRef.current.toDataURL() }));
                                }
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => signatureRef.current?.clear()}
                            className="absolute top-2 right-2 text-xs text-gray-500 hover:text-gray-700"
                        >
                            Clear
                        </button>
                    </div>
                    {errors.signature && (
                        <p className="mt-1 text-sm text-red-600">{errors.signature}</p>
                    )}
                </div>
            </>
        )}
        <StepNavigation
            onNext={handleSubmit}
            nextLabel="Submit"
            nextDisabled={isSubmitting || !accountValidated}
            nextLoading={isSubmitting}
            hideBack={true}
        />
      </form>
    </FormLayout>
  );
}
