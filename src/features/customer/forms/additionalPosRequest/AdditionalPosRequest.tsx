
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '../../../../context/BranchContext';
import { useToast } from '../../../../context/ToastContext';
import { FormLayout } from '../../components/FormLayout';
import { StepNavigation } from '../../components/StepNavigation';
import { SignatureStep } from '../../components/SignatureStep';
import additionalPOSRequestService from '../../../../services/additionalPOSRequestService';

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

  const handleSignatureComplete = (signatureData: string) => {
    setFormData(prev => ({ ...prev, repSignature: signatureData }));
  };

  const handleSignatureClear = () => {
    setFormData(prev => ({ ...prev, repSignature: '' }));
  };
  
  const handleSecSignatureComplete = (signatureData: string) => {
    setFormData(prev => ({ ...prev, secRepSignature: signatureData }));
  };

  const handleSecSignatureClear = () => {
    setFormData(prev => ({ ...prev, secRepSignature: '' }));
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

  return (
    <FormLayout title="Additional POS Request" branchName={branch?.name} phone={null}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Company Name" className="w-full p-2 border rounded" />
            <input type="text" name="contractNumber" value={formData.contractNumber} onChange={handleChange} placeholder="Contract Number" className="w-full p-2 border rounded" />
            <textarea name="reasonForAdditionalPOS" value={formData.reasonForAdditionalPOS} onChange={handleChange} placeholder="Reason For Additional POS" className="w-full p-2 border rounded" />
            <input type="number" name="desktopPOSCount" value={formData.desktopPOSCount} onChange={handleNumberChange} placeholder="Desktop POS Count" className="w-full p-2 border rounded" />
            <input type="number" name="mobilePOSCount" value={formData.mobilePOSCount} onChange={handleNumberChange} placeholder="Mobile POS Count" className="w-full p-2 border rounded" />
            <input type="text" name="placeOfDeployment" value={formData.placeOfDeployment} onChange={handleChange} placeholder="Place of Deployment" className="w-full p-2 border rounded" />
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Address</h3>
            <input type="text" name="region" value={formData.region} onChange={handleChange} placeholder="Region" className="w-full p-2 border rounded" />
            <input type="text" name="zone" value={formData.zone} onChange={handleChange} placeholder="Zone" className="w-full p-2 border rounded" />
            <input type="text" name="woreda" value={formData.woreda} onChange={handleChange} placeholder="Woreda" className="w-full p-2 border rounded" />
            <input type="text" name="kebele" value={formData.kebele} onChange={handleChange} placeholder="Kebele" className="w-full p-2 border rounded" />
            <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" className="w-full p-2 border rounded" />
            <input type="text" name="houseNumber" value={formData.houseNumber} onChange={handleChange} placeholder="House Number" className="w-full p-2 border rounded" />
            <input type="text" name="poBox" value={formData.poBox} onChange={handleChange} placeholder="PO Box" className="w-full p-2 border rounded" />
          </div>

          {/* Linked Account */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Linked Account</h3>
            <input type="text" name="linkedAccountNumber" value={formData.linkedAccountNumber} onChange={handleChange} placeholder="Linked Account Number" className="w-full p-2 border rounded" />
          </div>

          {/* Primary Representative */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Primary Representative</h3>
            <input type="text" name="repFullName" value={formData.repFullName} onChange={handleChange} placeholder="Full Name" className="w-full p-2 border rounded" />
            <input type="email" name="repEmail" value={formData.repEmail} onChange={handleChange} placeholder="Email" className="w-full p-2 border rounded" />
            <input type="tel" name="repTelNumber" value={formData.repTelNumber} onChange={handleChange} placeholder="Telephone" className="w-full p-2 border rounded" />
            <SignatureStep onSignatureComplete={handleSignatureComplete} onSignatureClear={handleSignatureClear} />
          </div>

          {/* Secondary Representative */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Secondary Representative (Optional)</h3>
            <input type="text" name="secRepFullName" value={formData.secRepFullName} onChange={handleChange} placeholder="Full Name" className="w-full p-2 border rounded" />
            <input type="email" name="secRepEmail" value={formData.secRepEmail} onChange={handleChange} placeholder="Email" className="w-full p-2 border rounded" />
            <input type="tel" name="secRepTelNumber" value={formData.secRepTelNumber} onChange={handleChange} placeholder="Telephone" className="w-full p-2 border rounded" />
            <SignatureStep onSignatureComplete={handleSecSignatureComplete} onSignatureClear={handleSecSignatureClear} />
          </div>
          
          {/* Other fields */}
          <div className="space-y-4">
             <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Phone Number for OTP" className="w-full p-2 border rounded" />
             <input type="text" name="otpCode" value={formData.otpCode} onChange={handleChange} placeholder="OTP Code" className="w-full p-2 border rounded" />
          </div>

        </div>
        <StepNavigation
          currentStep={1}
          totalSteps={1}
          onNext={handleSubmit}
          onBack={() => navigate(-1)}
          nextLabel="Submit"
          nextLoading={isSubmitting}
        />
      </form>
    </FormLayout>
  );
}
