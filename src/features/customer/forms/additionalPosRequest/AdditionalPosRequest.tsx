import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '@context/BranchContext';
import { useToast } from '@context/ToastContext';
import { useFormSteps } from '@features/customer/hooks/useFormSteps';
import { useOTPHandling } from '@features/customer/hooks/useOTPHandling';
import { FormLayout } from '@features/customer/components/FormLayout';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import { SignatureStep } from '@features/customer/components/SignatureStep';
import { AccountSelector } from '@features/customer/components/AccountSelector';
import additionalPOSRequestService from '@services/forms/additionalPOSRequestService';
import { 
  Building, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  Shield,
  Home,
  CheckCircle2
} from 'lucide-react';

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
  const { success: showSuccess, error: showError, info } = useToast();
  const navigate = useNavigate();
  const { step, next, prev, isFirst, isLast } = useFormSteps(7); // 7 steps
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
  const [accountPhoneNumber, setAccountPhoneNumber] = useState<string | null>(null);

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

  const handleAccountValidation = (account: any | null) => {
    if (account) {
      // Account is valid, we could store account holder name if needed
      console.log('Valid account:', account);
    }
  };

  const handlePhoneNumberFetched = (phoneNumber: string) => {
    setAccountPhoneNumber(phoneNumber);
    // Also set it in formData for the OTP step
    setFormData(prev => ({ ...prev, phoneNumber }));
  };

  const handleRequestOTP = async () => {
    // Use phone number from account validation, fallback to manually entered phone
    const phoneToUse = accountPhoneNumber || formData.phoneNumber;
    
    if (!phoneToUse) {
      showError('Phone number not found for this account. Please contact support.');
      return;
    }

    if (!formData.repSignature) {
      showError('Primary representative signature is required.');
      return;
    }

    try {
      await requestOTP(() => additionalPOSRequestService.requestOTP(phoneToUse));
      next();
    } catch (error: any) {
      showError(error?.message || 'Failed to send OTP.');
    }
  };

  const handleResendOTP = async () => {
    // Use phone number from account validation, fallback to manually entered phone
    const phoneToUse = accountPhoneNumber || formData.phoneNumber;
    
    if (!phoneToUse) {
      showError('Phone number not found for this account. Please contact support.');
      return;
    }

    try {
      await resendOTP(
        () => additionalPOSRequestService.requestOTP(phoneToUse),
        'OTP resent successfully'
      );
      info('OTP resent successfully');
    } catch (error: any) {
      showError(error?.message || 'Failed to resend OTP.');
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
        // Linked Account Validation
        return (
          <div className="space-y-6">
            <div className="border border-amber-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-fuchsia-700" />Linked Account Validation
              </h2>
              <div className="space-y-4">
                <AccountSelector
                  accounts={[]} // Pass empty array to disable dropdown
                  selectedAccount={formData.linkedAccountNumber}
                  onAccountChange={(accountNumber: string, accountHolderName?: string) => {
                    setFormData(prev => ({ ...prev, linkedAccountNumber: accountNumber }));
                  }}
                  onAccountValidation={handleAccountValidation}
                  onPhoneNumberFetched={handlePhoneNumberFetched}
                  label="Linked Account Number"
                  required={true}
                  error={""} // We'll handle validation separately
                  allowManualEntry={true}
                />
                
                {!formData.linkedAccountNumber && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-sm font-medium text-amber-800">
                      Please validate the linked account by entering the account number and clicking "Search"
                    </div>
                  </div>
                )}
                
                {formData.linkedAccountNumber && (
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
        // Company Information
        return (
          <div className="border border-amber-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="h-5 w-5 text-fuchsia-700" />Company Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                <input 
                  type="text" 
                  name="companyName" 
                  value={formData.companyName} 
                  onChange={handleChange} 
                  placeholder="Enter company name" 
                  className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Contract Number *</label>
                <input 
                  type="text" 
                  name="contractNumber" 
                  value={formData.contractNumber} 
                  onChange={handleChange} 
                  placeholder="Enter contract number" 
                  className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason For Additional POS *</label>
                <textarea 
                  name="reasonForAdditionalPOS" 
                  value={formData.reasonForAdditionalPOS} 
                  onChange={handleChange} 
                  placeholder="Describe the reason for requesting additional POS terminals" 
                  className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Desktop POS Count</label>
                <input 
                  type="number" 
                  name="desktopPOSCount" 
                  value={formData.desktopPOSCount} 
                  onChange={handleNumberChange} 
                  placeholder="0" 
                  min="0"
                  className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile POS Count</label>
                <input 
                  type="number" 
                  name="mobilePOSCount" 
                  value={formData.mobilePOSCount} 
                  onChange={handleNumberChange} 
                  placeholder="0" 
                  min="0"
                  className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Place of Deployment *</label>
                <input 
                  type="text" 
                  name="placeOfDeployment" 
                  value={formData.placeOfDeployment} 
                  onChange={handleChange} 
                  placeholder="Enter place of deployment" 
                  className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                />
              </div>
            </div>
          </div>
        );
      case 3:
        // Address Information
        return (
          <div className="border border-amber-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-fuchsia-700" />Address Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region *</label>
                <input 
                  type="text" 
                  name="region" 
                  value={formData.region} 
                  onChange={handleChange} 
                  placeholder="Enter region" 
                  className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zone *</label>
                <input 
                  type="text" 
                  name="zone" 
                  value={formData.zone} 
                  onChange={handleChange} 
                  placeholder="Enter zone" 
                  className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Woreda *</label>
                <input 
                  type="text" 
                  name="woreda" 
                  value={formData.woreda} 
                  onChange={handleChange} 
                  placeholder="Enter woreda" 
                  className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kebele</label>
                <input 
                  type="text" 
                  name="kebele" 
                  value={formData.kebele || ''} 
                  onChange={handleChange} 
                  placeholder="Enter kebele" 
                  className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input 
                  type="text" 
                  name="city" 
                  value={formData.city || ''} 
                  onChange={handleChange} 
                  placeholder="Enter city" 
                  className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">House Number</label>
                <input 
                  type="text" 
                  name="houseNumber" 
                  value={formData.houseNumber || ''} 
                  onChange={handleChange} 
                  placeholder="Enter house number" 
                  className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PO Box</label>
                <input 
                  type="text" 
                  name="poBox" 
                  value={formData.poBox || ''} 
                  onChange={handleChange} 
                  placeholder="Enter PO box" 
                  className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                />
              </div>
            </div>
          </div>
        );
      case 4:
        // Primary Representative
        return (
          <div className="border border-amber-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-fuchsia-700" />Primary Representative
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input 
                  type="text" 
                  name="repFullName" 
                  value={formData.repFullName} 
                  onChange={handleChange} 
                  placeholder="Enter full name" 
                  className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="email" 
                    name="repEmail" 
                    value={formData.repEmail} 
                    onChange={handleChange} 
                    placeholder="Enter email address" 
                    className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telephone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="tel" 
                    name="repTelNumber" 
                    value={formData.repTelNumber} 
                    onChange={handleChange} 
                    placeholder="Enter telephone number" 
                    className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 5:
        // Secondary Representative
        return (
          <div className="border border-amber-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-fuchsia-700" />Secondary Representative (Optional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  name="secRepFullName" 
                  value={formData.secRepFullName || ''} 
                  onChange={handleChange} 
                  placeholder="Enter full name" 
                  className="w-full p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="email" 
                    name="secRepEmail" 
                    value={formData.secRepEmail || ''} 
                    onChange={handleChange} 
                    placeholder="Enter email address" 
                    className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telephone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="tel" 
                    name="secRepTelNumber" 
                    value={formData.secRepTelNumber || ''} 
                    onChange={handleChange} 
                    placeholder="Enter telephone number" 
                    className="w-full pl-10 p-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-fuchsia-500 bg-amber-50" 
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 6:
        // Digital Signature
        return (
          <div className="border border-amber-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-fuchsia-700" />Digital Signature
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Representative Signature *</label>
                <SignatureStep 
                  onSignatureComplete={handleSignatureComplete} 
                  onSignatureClear={handleSignatureClear} 
                />
                {isSignatureEmpty && (
                  <p className="mt-1 text-sm text-red-600">Signature is required</p>
                )}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-700">
                  Please provide your signature above. This signature will be used for verification purposes.
                </p>
              </div>
            </div>
          </div>
        );
      case 7:
        // OTP Verification
        return (
          <div className="border border-amber-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-fuchsia-700" />OTP Verification
            </h2>
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-700">An OTP has been sent to: <strong className="text-amber-900">{accountPhoneNumber || formData.phoneNumber || 'your registered phone number'}</strong></p>
                {otpMessage && <p className="text-sm text-green-600 mt-1"><CheckCircle2 className="inline h-3 w-3 mr-1" />{otpMessage}</p>}
              </div>
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP *</label>
                <input 
                  type="text" 
                  name="otpCode" 
                  value={formData.otpCode} 
                  onChange={(e) => handleOtpChange(e.target.value)} 
                  maxLength={6} 
                  className="w-full p-3 text-center text-2xl tracking-widest rounded-lg border border-amber-200 font-mono bg-amber-50" 
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
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Custom navigation for step 6 - Replace Continue with Request OTP button
  const renderCustomNavigation = () => {
    if (step === 6) {
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
            disabled={(!accountPhoneNumber && !formData.phoneNumber) || otpLoading || isSignatureEmpty}
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
        totalSteps={7}
        onNext={isLast ? handleSubmit : next}
        onBack={prev}
        nextLabel={isLast ? 'Submit Request' : 'Continue'}
        nextDisabled={
          (step === 1 && !formData.linkedAccountNumber) || 
          (step === 2 && (!formData.companyName || !formData.contractNumber)) || 
          (step === 3 && (!formData.region || !formData.zone || !formData.woreda)) ||
          (step === 4 && (!formData.repFullName || !formData.repEmail || !formData.repTelNumber)) ||
          (step === 5 && (formData.secRepFullName && (!formData.secRepEmail || !formData.secRepTelNumber))) ||
          (step === 6 && false) || // Signature step, validation handled in handleRequestOTP
          (step === 7 && formData.otpCode.length !== 6) || 
          isSubmitting
        }
        nextLoading={isSubmitting}
        hideBack={isFirst}
      />
    );
  };

  return (
    <FormLayout title="Additional POS Request" branchName={branch?.name}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {renderStep()}
        {renderCustomNavigation()}
      </form>
    </FormLayout>
  );
}