// features/customer/forms/posDeliveryForm/POSDeliveryForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '@context/BranchContext';
import { useToast } from '@context/ToastContext';
import { useFormSteps } from '@features/customer/hooks/useFormSteps';
import { useFormValidation } from '@features/customer/hooks/useFormValidation';
import { useOTPHandling } from '@features/customer/hooks/useOTPHandling';
import { FormLayout } from '@features/customer/components/FormLayout';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import { AccountSelector } from '@features/customer/components/AccountSelector';
import { posDeliveryFormValidationSchema } from '@features/customer/utils/extendedValidationSchemas';
import { posDeliveryFormService } from '@services/forms/posDeliveryFormService';
import { 
  MapPin, 
  User, 
  Phone, 
  Calendar,
  Shield,
  FileText,
  Building,
  Package
} from 'lucide-react';

interface FormData {
  accountNumber: string;
  registeredName: string;
  tradeName: string;
  tinNumber: string;
  merchantId: string;
  address: string;
  typeOfPOSTerminal: string;
  equipmentType: string;
  serialNumber: string;
  posId: string;
  posAccessories: string;
  deliveredBy: string;
  deliveredTo: string;
  deliveredByDate: string;
  deliveredToDate: string;
  phoneNumber: string;
  otpCode: string;
}

export default function POSDeliveryForm() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError, info } = useToast();
  const navigate = useNavigate();
  const { step, next, prev, isFirst, isLast } = useFormSteps(5); // 5 steps now
  const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();

  const { errors, validateForm, clearFieldError } = useFormValidation(posDeliveryFormValidationSchema);

  const [formData, setFormData] = useState<FormData>({
    accountNumber: '',
    registeredName: '',
    tradeName: '',
    tinNumber: '',
    merchantId: '',
    address: '',
    typeOfPOSTerminal: '',
    equipmentType: '',
    serialNumber: '',
    posId: '',
    posAccessories: '',
    deliveredBy: '',
    deliveredTo: '',
    deliveredByDate: '',
    deliveredToDate: '',
    phoneNumber: '',
    otpCode: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountValidated, setAccountValidated] = useState(false);
  const [accountPhoneNumber, setAccountPhoneNumber] = useState<string | null>(null);

  const handleInputChange = (field: keyof FormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (value) clearFieldError(field);
  };

  const handleAccountChange = (accountNumber: string, accountHolderName?: string) => {
    setFormData(prev => ({ ...prev, accountNumber }));
    if (!accountNumber) {
      setAccountValidated(false);
    }
  };

  const handleAccountValidation = (account: any | null) => {
    setAccountValidated(!!account);
  };

  const handlePhoneNumberFetched = (phoneNumber: string) => {
    setAccountPhoneNumber(phoneNumber);
    // Also set it in formData for the OTP step
    setFormData(prev => ({ ...prev, phoneNumber }));
  };

  const handleOtpChange = (value: string) => {
    setFormData(prev => ({ ...prev, otpCode: value }));
  };

  const handleRequestOTP = async () => {
    // Use phone number from account validation
    const phoneToUse = accountPhoneNumber || formData.phoneNumber;
    
    if (!phoneToUse) {
      showError('Phone number not found for this account. Please contact support.');
      return;
    }

    try {
      await requestOTP(() => posDeliveryFormService.requestOTP(phoneToUse));
      next();
    } catch (error: any) {
      showError(error?.message || 'Failed to send OTP.');
    }
  };

  const handleResendOTP = async () => {
    // Use phone number from account validation
    const phoneToUse = accountPhoneNumber || formData.phoneNumber;
    
    if (!phoneToUse) {
      showError('Phone number not found for this account. Please contact support.');
      return;
    }

    try {
      await resendOTP(
        () => posDeliveryFormService.requestOTP(phoneToUse),
        'OTP resent successfully'
      );
      info('OTP resent successfully');
    } catch (error: any) {
      showError(error?.message || 'Failed to resend OTP.');
    }
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
        accountNumber: formData.accountNumber,
        phoneNumber: accountPhoneNumber || formData.phoneNumber,
        otpCode: formData.otpCode,
        registeredName: formData.registeredName,
        tradeName: formData.tradeName,
        tinNumber: formData.tinNumber,
        merchantId: formData.merchantId,
        address: formData.address,
        typeOfPOSTerminal: formData.typeOfPOSTerminal,
        equipmentType: formData.equipmentType,
        serialNumber: formData.serialNumber,
        posId: formData.posId,
        posAccessories: formData.posAccessories,
        deliveredBy: formData.deliveredBy,
        deliveredTo: formData.deliveredTo,
        deliveredByDate: formData.deliveredByDate,
        deliveredToDate: formData.deliveredToDate,
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
        // Account Validation
        return (
          <div className="space-y-6">
            <div className="border border-fuchsia-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-fuchsia-700" />Account Validation
              </h2>
              <div className="space-y-4">
                <AccountSelector
                  accounts={[]}
                  selectedAccount={formData.accountNumber}
                  onAccountChange={handleAccountChange}
                  onAccountValidation={handleAccountValidation}
                  onPhoneNumberFetched={handlePhoneNumberFetched}
                  error={""}
                  allowManualEntry={true}
                />
                
                {!formData.accountNumber && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-sm font-medium text-amber-800">
                      Please validate your account by entering the account number and clicking "Search"
                    </div>
                  </div>
                )}
                
                {formData.accountNumber && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm font-medium text-green-800">
                      Account validated successfully
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 2:
        // Business Information
        return (
          <div className="border border-fuchsia-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="h-5 w-5 text-fuchsia-700" />Business Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registered Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.registeredName}
                  onChange={(e) => handleInputChange('registeredName')(e.target.value)}
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  placeholder="Enter registered name"
                />
                {errors.registeredName && (
                  <p className="mt-1 text-sm text-red-600">{errors.registeredName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trade Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.tradeName}
                  onChange={(e) => handleInputChange('tradeName')(e.target.value)}
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  placeholder="Enter trade name"
                />
                {errors.tradeName && (
                  <p className="mt-1 text-sm text-red-600">{errors.tradeName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TIN Number
                </label>
                <input
                  type="text"
                  value={formData.tinNumber}
                  onChange={(e) => handleInputChange('tinNumber')(e.target.value)}
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  placeholder="Enter TIN number"
                />
                {errors.tinNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.tinNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant ID
                </label>
                <input
                  type="text"
                  value={formData.merchantId}
                  onChange={(e) => handleInputChange('merchantId')(e.target.value)}
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  placeholder="Enter merchant ID"
                />
                {errors.merchantId && (
                  <p className="mt-1 text-sm text-red-600">{errors.merchantId}</p>
                )}
              </div>
            </div>
          </div>
        );
      case 3:
        // Equipment Information
        return (
          <div className="border border-fuchsia-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-fuchsia-700" />Equipment Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
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
                  Type of POS Terminal
                </label>
                <select
                  value={formData.typeOfPOSTerminal}
                  onChange={(e) => handleInputChange('typeOfPOSTerminal')(e.target.value)}
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                >
                  <option value="">Select Type</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Mobile">Mobile</option>
                </select>
                {errors.typeOfPOSTerminal && (
                  <p className="mt-1 text-sm text-red-600">{errors.typeOfPOSTerminal}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Type
                </label>
                <input
                  type="text"
                  value={formData.equipmentType}
                  onChange={(e) => handleInputChange('equipmentType')(e.target.value)}
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  placeholder="Enter equipment type"
                />
                {errors.equipmentType && (
                  <p className="mt-1 text-sm text-red-600">{errors.equipmentType}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => handleInputChange('serialNumber')(e.target.value)}
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  placeholder="Enter serial number"
                />
                {errors.serialNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.serialNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  POS ID
                </label>
                <input
                  type="text"
                  value={formData.posId}
                  onChange={(e) => handleInputChange('posId')(e.target.value)}
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  placeholder="Enter POS ID"
                />
                {errors.posId && (
                  <p className="mt-1 text-sm text-red-600">{errors.posId}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  POS Accessories
                </label>
                <input
                  type="text"
                  value={formData.posAccessories}
                  onChange={(e) => handleInputChange('posAccessories')(e.target.value)}
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  placeholder="Enter POS accessories"
                />
                {errors.posAccessories && (
                  <p className="mt-1 text-sm text-red-600">{errors.posAccessories}</p>
                )}
              </div>
            </div>
          </div>
        );
      case 4:
        // Delivery Information
        return (
          <div className="border border-fuchsia-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-fuchsia-700" />Delivery Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivered By
                </label>
                <input
                  type="text"
                  value={formData.deliveredBy}
                  onChange={(e) => handleInputChange('deliveredBy')(e.target.value)}
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  placeholder="Enter delivered by"
                />
                {errors.deliveredBy && (
                  <p className="mt-1 text-sm text-red-600">{errors.deliveredBy}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivered To
                </label>
                <input
                  type="text"
                  value={formData.deliveredTo}
                  onChange={(e) => handleInputChange('deliveredTo')(e.target.value)}
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  placeholder="Enter delivered to"
                />
                {errors.deliveredTo && (
                  <p className="mt-1 text-sm text-red-600">{errors.deliveredTo}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivered By Date
                </label>
                <input
                  type="date"
                  value={formData.deliveredByDate}
                  onChange={(e) => handleInputChange('deliveredByDate')(e.target.value)}
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
                {errors.deliveredByDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.deliveredByDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivered To Date
                </label>
                <input
                  type="date"
                  value={formData.deliveredToDate}
                  onChange={(e) => handleInputChange('deliveredToDate')(e.target.value)}
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
                {errors.deliveredToDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.deliveredToDate}</p>
                )}
              </div>
            </div>
          </div>
        );
      case 5:
        // OTP Verification
        return (
          <div className="border border-fuchsia-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-fuchsia-700" />OTP Verification
            </h2>
            
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 border border-fuchsia-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-fuchsia-700">
                An OTP has been sent to your phone number: 
                <strong className="text-fuchsia-900"> {accountPhoneNumber || formData.phoneNumber || 'your registered phone number'}</strong>
              </p>
              {otpMessage && <p className="text-sm text-green-600 mt-1">{otpMessage}</p>}
            </div>

            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.otpCode}
                onChange={(e) => {
                  const sanitizedValue = e.target.value.replace(/\D/g, '').slice(0, 6);
                  handleOtpChange(sanitizedValue);
                }}
                maxLength={6}
                className="w-full p-3 text-center text-2xl tracking-widest rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 font-mono bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
                placeholder="000000"
              />
              
              <div className="mt-2 flex justify-between items-center">
                <button 
                  type="button" 
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0 || otpLoading}
                  className="text-sm text-fuchsia-700 hover:text-fuchsia-800 disabled:text-gray-400"
                >
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                </button>
                <span className="text-sm text-gray-500">{formData.otpCode.length}/6</span>
              </div>
              
              {errors.otpCode && (
                <p className="mt-1 text-sm text-red-600">{errors.otpCode}</p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Custom navigation for step 4 - Replace Continue with Request OTP button
  const renderCustomNavigation = () => {
    if (step === 4) {
      return (
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          {!isFirst && (
            <button
              type="button"
              onClick={prev}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
            >
              Back
            </button>
          )}
          
          <button
            type="button"
            onClick={handleRequestOTP}
            disabled={(!accountPhoneNumber && !formData.phoneNumber) || otpLoading}
            className="bg-fuchsia-600 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ml-auto"
          >
            {otpLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending OTP...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Request OTP
              </>
            )}
          </button>
        </div>
      );
    }

    // Default navigation for other steps
    return (
      <StepNavigation
        currentStep={step}
        totalSteps={5}
        onNext={isLast ? handleSubmit : next}
        onBack={prev}
        nextLabel={isLast ? 'Submit Request' : 'Continue'}
        nextDisabled={
          (step === 1 && !accountValidated) || 
          (step === 2 && (!formData.registeredName || !formData.tradeName)) ||
          (step === 5 && formData.otpCode.length !== 6) || 
          isSubmitting
        }
        nextLoading={isSubmitting}
        hideBack={isFirst}
      />
    );
  };

  return (
    <FormLayout
      title="POS Delivery Form"
      branchName={branch?.name}
      phone={null}
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        {renderStep()}
        {renderCustomNavigation()}
      </form>
    </FormLayout>
  );
}