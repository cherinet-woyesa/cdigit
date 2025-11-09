// features/customer/forms/merchantAccountOpening/MerchantAccountOpeningApplicationForm.tsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '@context/BranchContext';
import { useToast } from '@context/ToastContext';
import { useFormSteps } from '@features/customer/hooks/useFormSteps';
import { useOTPHandling } from '@features/customer/hooks/useOTPHandling';
import { FormLayout } from '@features/customer/components/FormLayout';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import { SignatureStep } from '@features/customer/components/SignatureStep';
import OTPStep from '@features/customer/components/stoppayment/OTPStep';
import { merchantAccountOpeningApplicationService } from '@services/forms/merchantAccountOpeningApplicationService';
import authService from '@services/auth/authService';

interface FormData {
  phoneNumber: string;
  otpCode: string;
  companyName: string;
  businessType: string;
  licenceNumber: string;
  issueDate: string;
  expireDate: string;
  taxPayerIdNumber: string;
  officeAddress: string;
  city: string;
  telephoneNumber: string;
  emailAddress: string;
  representativeName: string;
  signature: string;
}

export default function MerchantAccountOpeningApplicationForm() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();
  const { step, next, prev, isFirst, isLast } = useFormSteps(5); // 5 steps
  const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();
  const signaturePadRef = useRef<any>(null);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    phoneNumber: '',
    otpCode: '',
    companyName: '',
    businessType: '',
    licenceNumber: '',
    issueDate: '',
    expireDate: '',
    taxPayerIdNumber: '',
    officeAddress: '',
    city: '',
    telephoneNumber: '',
    emailAddress: '',
    representativeName: '',
    signature: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOtpChange = (value: string) => {
    setFormData(prev => ({ ...prev, otpCode: value }));
  };

  const handleSignatureComplete = (signatureData: string) => {
    setFormData(prev => ({ ...prev, signature: signatureData }));
    setIsSignatureEmpty(false);
  };

  const handleSignatureClear = () => {
    setFormData(prev => ({ ...prev, signature: '' }));
    setIsSignatureEmpty(true);
  };

  const handleRequestOTP = async () => {
    if (!formData.phoneNumber) {
      showError('Phone number is required.');
      return;
    }

    if (!formData.signature) {
      showError('Signature is required.');
      return;
    }

    try {
      await requestOTP(() => authService.requestOTP(formData.phoneNumber));
      next();
    } catch (error: any) {
      showError(error?.message || 'Failed to send OTP.');
    }
  };

  const handleSubmit = async () => {
    if (!branch?.id) {
      showError('Branch information is missing.');
      return;
    }

    setIsSubmitting(true);
    try {
      await merchantAccountOpeningApplicationService.submit({
        ...formData,
        branchId: branch.id,
        issueDate: formData.issueDate ? new Date(formData.issueDate) : undefined,
        expireDate: formData.expireDate ? new Date(formData.expireDate) : undefined,
        signatures: [{ signature: formData.signature }],
      });
      showSuccess('Application submitted successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      showError(error?.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        // Company details step
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Company Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input 
                  name="companyName" 
                  value={formData.companyName} 
                  onChange={handleChange} 
                  placeholder="Company Name" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                <input 
                  name="businessType" 
                  value={formData.businessType} 
                  onChange={handleChange} 
                  placeholder="Business Type" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Licence Number</label>
                <input 
                  name="licenceNumber" 
                  value={formData.licenceNumber} 
                  onChange={handleChange} 
                  placeholder="Licence Number" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Payer ID</label>
                <input 
                  name="taxPayerIdNumber" 
                  value={formData.taxPayerIdNumber} 
                  onChange={handleChange} 
                  placeholder="Tax Payer ID" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Office Address</label>
                <input 
                  name="officeAddress" 
                  value={formData.officeAddress} 
                  onChange={handleChange} 
                  placeholder="Office Address" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input 
                  name="city" 
                  value={formData.city} 
                  onChange={handleChange} 
                  placeholder="City" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                <input 
                  type="date" 
                  name="issueDate" 
                  value={formData.issueDate} 
                  onChange={handleChange} 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expire Date</label>
                <input 
                  type="date" 
                  name="expireDate" 
                  value={formData.expireDate} 
                  onChange={handleChange} 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
            </div>
          </div>
        );
      case 2:
        // Representative and contact details step
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Representative Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Representative Name</label>
              <input 
                name="representativeName" 
                value={formData.representativeName} 
                onChange={handleChange} 
                placeholder="Representative Name" 
                className="w-full p-3 border rounded-lg" 
              />
            </div>
            
            <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                <input 
                  name="telephoneNumber" 
                  value={formData.telephoneNumber} 
                  onChange={handleChange} 
                  placeholder="Telephone" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  name="emailAddress" 
                  value={formData.emailAddress} 
                  onChange={handleChange} 
                  placeholder="Email" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number for OTP</label>
                <input 
                  name="phoneNumber" 
                  value={formData.phoneNumber} 
                  onChange={handleChange} 
                  placeholder="Phone Number for OTP" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
            </div>
          </div>
        );
      case 3:
        // Signature step
        return (
          <div className="space-y-6">
            <SignatureStep 
              onSignatureComplete={handleSignatureComplete}
              onSignatureClear={handleSignatureClear}
            />
          </div>
        );
      case 4:
        // Review step
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Company:</span>
                <span className="font-semibold text-fuchsia-900">{formData.companyName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Business Type:</span>
                <span className="font-semibold text-fuchsia-900">{formData.businessType || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Representative:</span>
                <span className="font-semibold text-fuchsia-900">{formData.representativeName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Licence Number:</span>
                <span className="font-semibold text-fuchsia-900">{formData.licenceNumber || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Tax Payer ID:</span>
                <span className="font-semibold text-fuchsia-900">{formData.taxPayerIdNumber || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Office Address:</span>
                <span className="font-semibold text-fuchsia-900">{formData.officeAddress || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">City:</span>
                <span className="font-semibold text-fuchsia-900">{formData.city || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Issue Date:</span>
                <span className="font-semibold text-fuchsia-900">{formData.issueDate || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Expire Date:</span>
                <span className="font-semibold text-fuchsia-900">{formData.expireDate || 'Not provided'}</span>
              </div>
            </div>
          </div>
        );
      case 5:
        // OTP step
        return (
          <div className="space-y-6">
            <OTPStep 
              otpCode={formData.otpCode} 
              onOtpChange={handleOtpChange} 
              onResend={() => resendOTP(() => authService.requestOTP(formData.phoneNumber))} 
              resendCooldown={resendCooldown} 
              otpMessage={otpMessage} 
            />
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
            disabled={!formData.phoneNumber || otpLoading || isSignatureEmpty}
            className="bg-fuchsia-600 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ml-auto"
          >
            {otpLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending OTP...
              </>
            ) : (
              <>
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
        nextLabel={isLast ? 'Submit' : 'Continue'}
        nextDisabled={
          (step === 1 && !formData.companyName) || 
          (step === 2 && !formData.representativeName) ||
          (step === 5 && formData.otpCode.length !== 6) || 
          isSubmitting
        }
        nextLoading={isSubmitting}
        hideBack={isFirst}
      />
    );
  };

  return (
    <FormLayout title="Merchant Account Opening" branchName={branch?.name}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {renderStep()}
        {renderCustomNavigation()}
      </form>
    </FormLayout>
  );
}