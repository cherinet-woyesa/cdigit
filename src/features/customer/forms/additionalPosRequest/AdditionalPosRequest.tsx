import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '@context/BranchContext';
import { useToast } from '@context/ToastContext';
import { useFormSteps } from '@features/customer/hooks/useFormSteps';
import { useOTPHandling } from '@features/customer/hooks/useOTPHandling';
import { FormLayout } from '@features/customer/components/FormLayout';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import { SignatureStep } from '@features/customer/components/SignatureStep';
import OTPStep from '@features/customer/components/stoppayment/OTPStep';
import additionalPOSRequestService from '@services/forms/additionalPOSRequestService';

interface FormData {
  companyName: string;
  contractNumber: string;
  reasonForAdditionalPOS: string;
  desktopPOSCount: number;
  mobilePOSCount: number;
  placeOfDeployment: string;
  linkedAccountNumber: string;
  linkedAccountBranchId: string;
  repFullName: string;
  repEmail: string;
  repTelNumber: string;
  repSignature: string;
  secRepFullName?: string;
  secRepEmail?: string;
  secRepTelNumber?: string;
  secRepSignature?: string;
  recommendation?: string;
  recommendedBy?: string;
  region: string;
  zone: string;
  woreda: string;
  kebele?: string;
  city?: string;
  houseNumber?: string;
  poBox?: string;
  phoneNumber: string;
  otpCode: string;
}

export default function AdditionalPOSRequestForm() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();
  const { step, next, prev, isFirst, isLast } = useFormSteps(6); // 6 steps
  const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();
  const signaturePadRef = useRef<any>(null);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);
  const [isSecSignatureEmpty, setIsSecSignatureEmpty] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    contractNumber: '',
    reasonForAdditionalPOS: '',
    desktopPOSCount: 0,
    mobilePOSCount: 0,
    placeOfDeployment: '',
    linkedAccountNumber: '',
    linkedAccountBranchId: '',
    repFullName: '',
    repEmail: '',
    repTelNumber: '',
    repSignature: '',
    secRepFullName: '',
    secRepEmail: '',
    secRepTelNumber: '',
    secRepSignature: '',
    recommendation: '',
    recommendedBy: '',
    region: '',
    zone: '',
    woreda: '',
    kebele: '',
    city: '',
    houseNumber: '',
    poBox: '',
    phoneNumber: '',
    otpCode: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleOtpChange = (value: string) => {
    setFormData(prev => ({ ...prev, otpCode: value }));
  };

  const handleSignatureComplete = (signatureData: string) => {
    setFormData(prev => ({ ...prev, repSignature: signatureData }));
    setIsSignatureEmpty(false);
  };

  const handleSignatureClear = () => {
    setFormData(prev => ({ ...prev, repSignature: '' }));
    setIsSignatureEmpty(true);
  };
  
  const handleSecSignatureComplete = (signatureData: string) => {
    setFormData(prev => ({ ...prev, secRepSignature: signatureData }));
    setIsSecSignatureEmpty(false);
  };

  const handleSecSignatureClear = () => {
    setFormData(prev => ({ ...prev, secRepSignature: '' }));
    setIsSecSignatureEmpty(true);
  };

  const handleRequestOTP = async () => {
    if (!formData.phoneNumber) {
      showError('Phone number is required.');
      return;
    }

    if (!formData.repSignature) {
      showError('Primary representative signature is required.');
      return;
    }

    try {
      await requestOTP(() => additionalPOSRequestService.requestOTP(formData.phoneNumber));
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
      const requestData = {
        branchId: branch.id,
        phoneNumber: formData.phoneNumber,
        otpCode: formData.otpCode,
        companyName: formData.companyName,
        addressesRequestDto: {
          region: formData.region,
          zone: formData.zone,
          woreda: formData.woreda,
          kebele: formData.kebele,
          city: formData.city,
          houseNumber: formData.houseNumber,
          poBox: formData.poBox,
        },
        contractNumber: formData.contractNumber,
        reasonForAdditionalPOS: formData.reasonForAdditionalPOS,
        desktopPOSCount: formData.desktopPOSCount,
        mobilePOSCount: formData.mobilePOSCount,
        placeOfDeployment: formData.placeOfDeployment,
        linkedAccountNumber: formData.linkedAccountNumber,
        linkedAccountBranchId: branch.id, // Assuming linked account is in the same branch
        repFullName: formData.repFullName,
        repEmail: formData.repEmail,
        repTelNumber: formData.repTelNumber,
        repSignature: { signatureData: formData.repSignature },
        secRepFullName: formData.secRepFullName,
        secRepEmail: formData.secRepEmail,
        secRepTelNumber: formData.secRepTelNumber,
        secRepSignature: { signatureData: formData.secRepSignature },
        recommendation: formData.recommendation,
      };
      
      await additionalPOSRequestService.submitRequest(requestData);
      showSuccess('Request submitted successfully!');
      navigate('/customer/dashboard');
    } catch (error: any) {
      showError(error?.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        // Company Information
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input 
                  type="text" 
                  name="companyName" 
                  value={formData.companyName} 
                  onChange={handleChange} 
                  placeholder="Company Name" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Number</label>
                <input 
                  type="text" 
                  name="contractNumber" 
                  value={formData.contractNumber} 
                  onChange={handleChange} 
                  placeholder="Contract Number" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason For Additional POS</label>
                <textarea 
                  name="reasonForAdditionalPOS" 
                  value={formData.reasonForAdditionalPOS} 
                  onChange={handleChange} 
                  placeholder="Reason For Additional POS" 
                  className="w-full p-3 border rounded-lg" 
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desktop POS Count</label>
                <input 
                  type="number" 
                  name="desktopPOSCount" 
                  value={formData.desktopPOSCount} 
                  onChange={handleNumberChange} 
                  placeholder="Desktop POS Count" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile POS Count</label>
                <input 
                  type="number" 
                  name="mobilePOSCount" 
                  value={formData.mobilePOSCount} 
                  onChange={handleNumberChange} 
                  placeholder="Mobile POS Count" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Place of Deployment</label>
                <input 
                  type="text" 
                  name="placeOfDeployment" 
                  value={formData.placeOfDeployment} 
                  onChange={handleChange} 
                  placeholder="Place of Deployment" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
            </div>
          </div>
        );
      case 2:
        // Address Information
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Company:</span>
                <span className="font-semibold text-fuchsia-900">{formData.companyName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Contract #:</span>
                <span className="font-semibold text-fuchsia-900">{formData.contractNumber || 'Not provided'}</span>
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <input 
                  type="text" 
                  name="region" 
                  value={formData.region} 
                  onChange={handleChange} 
                  placeholder="Region" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                <input 
                  type="text" 
                  name="zone" 
                  value={formData.zone} 
                  onChange={handleChange} 
                  placeholder="Zone" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Woreda</label>
                <input 
                  type="text" 
                  name="woreda" 
                  value={formData.woreda} 
                  onChange={handleChange} 
                  placeholder="Woreda" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kebele</label>
                <input 
                  type="text" 
                  name="kebele" 
                  value={formData.kebele} 
                  onChange={handleChange} 
                  placeholder="Kebele" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input 
                  type="text" 
                  name="city" 
                  value={formData.city} 
                  onChange={handleChange} 
                  placeholder="City" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House Number</label>
                <input 
                  type="text" 
                  name="houseNumber" 
                  value={formData.houseNumber} 
                  onChange={handleChange} 
                  placeholder="House Number" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PO Box</label>
                <input 
                  type="text" 
                  name="poBox" 
                  value={formData.poBox} 
                  onChange={handleChange} 
                  placeholder="PO Box" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
            </div>
          </div>
        );
      case 3:
        // Linked Account and Primary Representative
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Company:</span>
                <span className="font-semibold text-fuchsia-900">{formData.companyName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Location:</span>
                <span className="font-semibold text-fuchsia-900">{formData.city || formData.region || 'Not provided'}</span>
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900">Linked Account</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Linked Account Number</label>
              <input 
                type="text" 
                name="linkedAccountNumber" 
                value={formData.linkedAccountNumber} 
                onChange={handleChange} 
                placeholder="Linked Account Number" 
                className="w-full p-3 border rounded-lg" 
              />
            </div>
            
            <h3 className="text-lg font-medium text-gray-900">Primary Representative</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  name="repFullName" 
                  value={formData.repFullName} 
                  onChange={handleChange} 
                  placeholder="Full Name" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  name="repEmail" 
                  value={formData.repEmail} 
                  onChange={handleChange} 
                  placeholder="Email" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                <input 
                  type="tel" 
                  name="repTelNumber" 
                  value={formData.repTelNumber} 
                  onChange={handleChange} 
                  placeholder="Telephone" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
                <SignatureStep 
                  onSignatureComplete={handleSignatureComplete} 
                  onSignatureClear={handleSignatureClear} 
                />
              </div>
            </div>
          </div>
        );
      case 4:
        // Secondary Representative
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Company:</span>
                <span className="font-semibold text-fuchsia-900">{formData.companyName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Primary Rep:</span>
                <span className="font-semibold text-fuchsia-900">{formData.repFullName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Phone:</span>
                <span className="font-semibold text-fuchsia-900">{formData.repTelNumber || 'Not provided'}</span>
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900">Secondary Representative (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  name="secRepFullName" 
                  value={formData.secRepFullName || ''} 
                  onChange={handleChange} 
                  placeholder="Full Name" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  name="secRepEmail" 
                  value={formData.secRepEmail || ''} 
                  onChange={handleChange} 
                  placeholder="Email" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                <input 
                  type="tel" 
                  name="secRepTelNumber" 
                  value={formData.secRepTelNumber || ''} 
                  onChange={handleChange} 
                  placeholder="Telephone" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
                <SignatureStep 
                  onSignatureComplete={handleSecSignatureComplete} 
                  onSignatureClear={handleSecSignatureClear} 
                />
              </div>
            </div>
          </div>
        );
      case 5:
        // Contact Information
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Company:</span>
                <span className="font-semibold text-fuchsia-900">{formData.companyName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Primary Rep:</span>
                <span className="font-semibold text-fuchsia-900">{formData.repFullName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Secondary Rep:</span>
                <span className="font-semibold text-fuchsia-900">{formData.secRepFullName || 'Not provided'}</span>
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number for OTP</label>
                <input 
                  type="tel" 
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
      case 6:
        // OTP Verification
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Company:</span>
                <span className="font-semibold text-fuchsia-900">{formData.companyName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Primary Rep:</span>
                <span className="font-semibold text-fuchsia-900">{formData.repFullName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Phone:</span>
                <span className="font-semibold text-fuchsia-900">{formData.phoneNumber || 'Not provided'}</span>
              </div>
            </div>
            
            <OTPStep 
              otpCode={formData.otpCode} 
              onOtpChange={handleOtpChange} 
              onResend={() => resendOTP(() => additionalPOSRequestService.requestOTP(formData.phoneNumber))} 
              resendCooldown={resendCooldown} 
              otpMessage={otpMessage} 
            />
          </div>
        );
      default:
        return null;
    }
  };

  // Custom navigation for step 5 - Replace Continue with Request OTP button
  const renderCustomNavigation = () => {
    if (step === 5) {
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
        totalSteps={6}
        onNext={isLast ? handleSubmit : next}
        onBack={prev}
        nextLabel={isLast ? 'Submit' : 'Continue'}
        nextDisabled={
          (step === 1 && (!formData.companyName || !formData.contractNumber)) || 
          (step === 2 && !formData.region) ||
          (step === 3 && (!formData.linkedAccountNumber || !formData.repFullName || isSignatureEmpty)) ||
          (step === 4 && (formData.secRepFullName && !formData.secRepTelNumber)) ||
          (step === 5 && !formData.phoneNumber) ||
          (step === 6 && formData.otpCode.length !== 6) || 
          isSubmitting
        }
        nextLoading={isSubmitting}
        hideBack={isFirst}
      />
    );
  };

  return (
    <FormLayout title="Additional POS Request" branchName={branch?.name} phone={null}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {renderStep()}
        {renderCustomNavigation()}
      </form>
    </FormLayout>
  );
}