// features/customer/forms/agentAccountOpening/AgentAccountOpeningForm.tsx
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
import { agentAccountOpeningService } from '@services/forms/agentAccountOpeningService';
import authService from '@services/auth/authService';
import { 
  Building, 
  FileText, 
  MapPin, 
  Phone, 
  User, 
  IdCard, 
  Shield,
  Calendar,
  Mail
} from 'lucide-react';

interface FormData {
  companyName: string;
  businessType: string;
  tradeLicenseNumber: string;
  issueDate: string;
  expireDate: string;
  taxPayerIdNumber: string;
  officeAddress: string;
  city: string;
  phoneNumber: string;
  faxNumber: string;
  postalNumber: string;
  emailAddress: string;
  representativeName: string;
  fatherName: string;
  grandfatherName: string;
  idNumber: string;
  idIssuedBy: string;
  representativeCity: string;
  representativeEmail: string;
  representativeTelNumber: string;
  agentBankAccountNumber: string;
  otpCode: string;
  signature: string;
}

export default function AgentAccountOpeningForm() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();
  const { step, next, prev, isFirst, isLast } = useFormSteps(5); // 5 steps
  const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();
  const signaturePadRef = useRef<any>(null);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    businessType: '',
    tradeLicenseNumber: '',
    issueDate: '',
    expireDate: '',
    taxPayerIdNumber: '',
    officeAddress: '',
    city: '',
    phoneNumber: '',
    faxNumber: '',
    postalNumber: '',
    emailAddress: '',
    representativeName: '',
    fatherName: '',
    grandfatherName: '',
    idNumber: '',
    idIssuedBy: '',
    representativeCity: '',
    representativeEmail: '',
    representativeTelNumber: '',
    agentBankAccountNumber: '',
    otpCode: '',
    signature: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      await agentAccountOpeningService.submit({
        ...formData,
        branchId: branch.id,
        branchName: branch.name,
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
        // Company & business details step
        return (
          <div className="border border-fuchsia-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="h-5 w-5 text-fuchsia-700" />
              Company & Business Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input 
                  name="companyName" 
                  value={formData.companyName} 
                  onChange={handleChange} 
                  placeholder="Enter company name" 
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                >
                  <option value="">Select Business Type</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Corporation">Corporation</option>
                  <option value="LLC">LLC</option>
                  <option value="Cooperative">Cooperative</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trade License Number
                </label>
                <input 
                  name="tradeLicenseNumber" 
                  value={formData.tradeLicenseNumber} 
                  onChange={handleChange} 
                  placeholder="Enter trade license number" 
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Payer ID
                </label>
                <input 
                  name="taxPayerIdNumber" 
                  value={formData.taxPayerIdNumber} 
                  onChange={handleChange} 
                  placeholder="Enter tax payer ID" 
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Issue Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="date" 
                    name="issueDate" 
                    value={formData.issueDate} 
                    onChange={handleChange} 
                    className="w-full pl-10 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Expire Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="date" 
                    name="expireDate" 
                    value={formData.expireDate} 
                    onChange={handleChange} 
                    className="w-full pl-10 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        // Address & contact details step
        return (
          <div className="border border-fuchsia-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-fuchsia-700" />
              Address & Contact Information
            </h2>
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Company:</span>
                <span className="font-semibold text-fuchsia-900">{formData.companyName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Business Type:</span>
                <span className="font-semibold text-fuchsia-900">{formData.businessType || 'Not provided'}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office Address <span className="text-red-500">*</span>
                </label>
                <input 
                  name="officeAddress" 
                  value={formData.officeAddress} 
                  onChange={handleChange} 
                  placeholder="Enter office address" 
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input 
                  name="city" 
                  value={formData.city} 
                  onChange={handleChange} 
                  placeholder="Enter city" 
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Number
                </label>
                <input 
                  name="postalNumber" 
                  value={formData.postalNumber} 
                  onChange={handleChange} 
                  placeholder="Enter postal number" 
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number for OTP <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    name="phoneNumber" 
                    value={formData.phoneNumber} 
                    onChange={handleChange} 
                    placeholder="Enter phone number" 
                    className="w-full pl-10 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fax Number
                </label>
                <input 
                  name="faxNumber" 
                  value={formData.faxNumber} 
                  onChange={handleChange} 
                  placeholder="Enter fax number" 
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    name="emailAddress" 
                    value={formData.emailAddress} 
                    onChange={handleChange} 
                    placeholder="Enter email address" 
                    className="w-full pl-10 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        // Representative details step
        return (
          <div className="border border-fuchsia-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-fuchsia-700" />
              Representative Details
            </h2>
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Company:</span>
                <span className="font-semibold text-fuchsia-900">{formData.companyName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Phone:</span>
                <span className="font-semibold text-fuchsia-900">{formData.phoneNumber || 'Not provided'}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Representative Name <span className="text-red-500">*</span>
                </label>
                <input 
                  name="representativeName" 
                  value={formData.representativeName} 
                  onChange={handleChange} 
                  placeholder="Enter representative name" 
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Father's Name <span className="text-red-500">*</span>
                </label>
                <input 
                  name="fatherName" 
                  value={formData.fatherName} 
                  onChange={handleChange} 
                  placeholder="Enter father's name" 
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grandfather's Name <span className="text-red-500">*</span>
                </label>
                <input 
                  name="grandfatherName" 
                  value={formData.grandfatherName} 
                  onChange={handleChange} 
                  placeholder="Enter grandfather's name" 
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    name="idNumber" 
                    value={formData.idNumber} 
                    onChange={handleChange} 
                    placeholder="Enter ID number" 
                    className="w-full pl-10 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Issued By
                </label>
                <input 
                  name="idIssuedBy" 
                  value={formData.idIssuedBy} 
                  onChange={handleChange} 
                  placeholder="Enter issuing authority" 
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Representative City
                </label>
                <input 
                  name="representativeCity" 
                  value={formData.representativeCity} 
                  onChange={handleChange} 
                  placeholder="Enter representative city" 
                  className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Representative Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    name="representativeEmail" 
                    value={formData.representativeEmail} 
                    onChange={handleChange} 
                    placeholder="Enter representative email" 
                    className="w-full pl-10 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Representative Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    name="representativeTelNumber" 
                    value={formData.representativeTelNumber} 
                    onChange={handleChange} 
                    placeholder="Enter representative phone" 
                    className="w-full pl-10 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        // Account details step
        return (
          <div className="border border-fuchsia-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-fuchsia-700" />
              Account Information
            </h2>
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Company:</span>
                <span className="font-semibold text-fuchsia-900">{formData.companyName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Representative:</span>
                <span className="font-semibold text-fuchsia-900">{formData.representativeName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Phone:</span>
                <span className="font-semibold text-fuchsia-900">{formData.phoneNumber || 'Not provided'}</span>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent Bank Account Number <span className="text-red-500">*</span>
              </label>
              <input 
                name="agentBankAccountNumber" 
                value={formData.agentBankAccountNumber} 
                onChange={handleChange} 
                placeholder="Enter bank account number" 
                className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
              />
            </div>
            
            <div className="border border-fuchsia-200 rounded-lg p-4">
              <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-fuchsia-700" />
                Digital Signature
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please sign below to confirm your application. This signature is legally binding.
              </p>
              <SignatureStep 
                onSignatureComplete={handleSignatureComplete}
                onSignatureClear={handleSignatureClear}
              />
            </div>
          </div>
        );
      case 5:
        // OTP step
        return (
          <div className="border border-fuchsia-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-fuchsia-700" />
              OTP Verification
            </h2>
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Company:</span>
                <span className="font-semibold text-fuchsia-900">{formData.companyName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Representative:</span>
                <span className="font-semibold text-fuchsia-900">{formData.representativeName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Phone:</span>
                <span className="font-semibold text-fuchsia-900">{formData.phoneNumber || 'Not provided'}</span>
              </div>
            </div>
            
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
        nextLabel={isLast ? 'Submit Application' : 'Continue'}
        nextDisabled={
          (step === 1 && (!formData.companyName || !formData.businessType)) || 
          (step === 2 && (!formData.officeAddress || !formData.city || !formData.phoneNumber)) ||
          (step === 3 && (!formData.representativeName || !formData.fatherName || !formData.grandfatherName || !formData.idNumber)) ||
          (step === 4 && (!formData.agentBankAccountNumber || isSignatureEmpty)) ||
          (step === 5 && formData.otpCode.length !== 6) || 
          isSubmitting
        }
        nextLoading={isSubmitting}
        hideBack={isFirst}
      />
    );
  };

  return (
    <FormLayout title="Agent Account Opening" branchName={branch?.name}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {renderStep()}
        {renderCustomNavigation()}
      </form>
    </FormLayout>
  );
}