
// features/customer/forms/merchantAccountOpening/MerchantAccountOpeningApplicationForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '../../../../context/BranchContext';
import { useToast } from '../../../../context/ToastContext';
import { FormLayout } from '../../components/FormLayout';
import { OTPVerification } from '../../components/OTPVerification';
import { SignatureStep } from '../../components/SignatureStep';
import { StepNavigation } from '../../components/StepNavigation';
import { merchantAccountOpeningApplicationService } from '../../../../services/merchantAccountOpeningApplicationService';
import authService from '../../../../services/authService';

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

  const handleOtpChange = (otp: string) => {
    setFormData(prev => ({ ...prev, otpCode: otp }));
  };

  const handleSignatureComplete = (signatureData: string) => {
    setFormData(prev => ({ ...prev, signature: signatureData }));
  };

  const handleSignatureClear = () => {
    setFormData(prev => ({ ...prev, signature: '' }));
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

  return (
    <FormLayout title="Merchant Account Opening" branchName={branch?.name}>
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Company Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Company Name" className="w-full p-2 border rounded" />
          <input name="businessType" value={formData.businessType} onChange={handleChange} placeholder="Business Type" className="w-full p-2 border rounded" />
          <input name="licenceNumber" value={formData.licenceNumber} onChange={handleChange} placeholder="Licence Number" className="w-full p-2 border rounded" />
          <input name="taxPayerIdNumber" value={formData.taxPayerIdNumber} onChange={handleChange} placeholder="Tax Payer ID" className="w-full p-2 border rounded" />
          <input name="officeAddress" value={formData.officeAddress} onChange={handleChange} placeholder="Office Address" className="w-full p-2 border rounded" />
          <input name="city" value={formData.city} onChange={handleChange} placeholder="City" className="w-full p-2 border rounded" />
          <input name="telephoneNumber" value={formData.telephoneNumber} onChange={handleChange} placeholder="Telephone" className="w-full p-2 border rounded" />
          <input name="emailAddress" value={formData.emailAddress} onChange={handleChange} placeholder="Email" className="w-full p-2 border rounded" />
          <div>
            <label className="block text-sm font-medium text-gray-700">Issue Date</label>
            <input type="date" name="issueDate" value={formData.issueDate} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Expire Date</label>
            <input type="date" name="expireDate" value={formData.expireDate} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
        </div>

        <h3 className="text-lg font-medium text-gray-900">Representative Details</h3>
        <input name="representativeName" value={formData.representativeName} onChange={handleChange} placeholder="Representative Name" className="w-full p-2 border rounded" />

        <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
        <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Phone Number for OTP" className="w-full p-2 border rounded" />

        <SignatureStep onSignatureComplete={handleSignatureComplete} onSignatureClear={handleSignatureClear} />
        
        <OTPVerification
          phone={formData.phoneNumber}
          otp={formData.otpCode}
          onOtpChange={handleOtpChange}
          onResendOtp={() => authService.requestOTP(formData.phoneNumber)}
        />

        <StepNavigation
          onNext={handleSubmit}
          onBack={() => navigate(-1)}
          nextLabel="Submit"
          nextDisabled={isSubmitting}
          nextLoading={isSubmitting}
        />
      </div>
    </FormLayout>
  );
}
