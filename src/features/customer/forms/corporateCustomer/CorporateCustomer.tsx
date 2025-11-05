// features/customer/forms/corporateCustomer/CorporateCustomer.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '../../../../context/BranchContext';
import { useToast } from '../../../../context/ToastContext';
import { useFormValidation } from '../../hooks/useFormValidation';
import { FormLayout } from '../../components/FormLayout';
import { StepNavigation } from '../../components/StepNavigation';
import { corporateCustomerValidationSchema } from '../../utils/extendedValidationSchemas';
import { corporateCustomerService } from '../../../../services/corporateCustomerService';

interface FormData {
  businessName: string;
  businessRegistrationNumber: string;
  taxIdentificationNumber: string;
  businessType: string;
  address: string;
  city: string;
  postalCode: string;
  fullName: string;
  phoneNumber: string;
  email: string;
}

export default function CorporateCustomer() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();

  const { errors, validateForm, clearFieldError } = useFormValidation(corporateCustomerValidationSchema);

  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    businessRegistrationNumber: '',
    taxIdentificationNumber: '',
    businessType: '',
    address: '',
    city: '',
    postalCode: '',
    fullName: '',
    phoneNumber: '',
    email: '',
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
      const corporateCustomerData = {
        branchId: branch.id,
        ...formData,
      };

      const response = await corporateCustomerService.submitCorporateCustomer(corporateCustomerData);

      showSuccess('Corporate customer created successfully!');
      navigate('/form/corporate-customer/confirmation', {
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
      title="Corporate Customer"
      branchName={branch?.name}
      phone={null}
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name <span className="text-red-500">*</span>
            </label>
            <input
            type="text"
            value={formData.businessName}
            onChange={(e) => handleInputChange('businessName')(e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            placeholder="Enter business name"
            />
            {errors.businessName && (
            <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
            )}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Registration Number <span className="text-red-500">*</span>
            </label>
            <input
            type="text"
            value={formData.businessRegistrationNumber}
            onChange={(e) => handleInputChange('businessRegistrationNumber')(e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            placeholder="Enter business registration number"
            />
            {errors.businessRegistrationNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.businessRegistrationNumber}</p>
            )}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Identification Number <span className="text-red-500">*</span>
            </label>
            <input
            type="text"
            value={formData.taxIdentificationNumber}
            onChange={(e) => handleInputChange('taxIdentificationNumber')(e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            placeholder="Enter tax identification number"
            />
            {errors.taxIdentificationNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.taxIdentificationNumber}</p>
            )}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Type <span className="text-red-500">*</span>
            </label>
            <select
                value={formData.businessType}
                onChange={(e) => handleInputChange('businessType')(e.target.value)}
                className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            >
                <option value="">Select Business Type</option>
                <option value="Sole Proprietorship">Sole Proprietorship</option>
                <option value="Partnership">Partnership</option>
                <option value="Corporation">Corporation</option>
                <option value="LLC">LLC</option>
                <option value="NGO">NGO</option>
                <option value="Government">Government</option>
            </select>
            {errors.businessType && (
            <p className="mt-1 text-sm text-red-600">{errors.businessType}</p>
            )}
        </div>
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
            Full Name (Contact Person) <span className="text-red-500">*</span>
            </label>
            <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName')(e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            placeholder="Enter full name"
            />
            {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
            )}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number (Contact Person) <span className="text-red-500">*</span>
            </label>
            <input
            type="text"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber')(e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            placeholder="Enter phone number"
            />
            {errors.phoneNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
            )}
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Email (Contact Person) <span className="text-red-500">*</span>
            </label>
            <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email')(e.target.value)}
            className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            placeholder="Enter email"
            />
            {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
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
