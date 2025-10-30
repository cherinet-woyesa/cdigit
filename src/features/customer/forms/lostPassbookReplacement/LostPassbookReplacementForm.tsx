
// features/customer/forms/lostPassbookReplacement/LostPassbookReplacementForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '../../../../context/BranchContext';
import { useToast } from '../../../../context/ToastContext';
import { FormLayout } from '../../components/FormLayout';
import { AccountSelector } from '../../components/AccountSelector';
import { OTPVerification } from '../../components/OTPVerification';
import { SignatureStep } from '../../components/SignatureStep';
import { StepNavigation } from '../../components/StepNavigation';
import { lostPassbookReplacementService } from '../../../../services/lostPassbookReplacementService';
import authService from '../../../../services/authService';

interface FormData {
  accountNumber: string;
  customerName: string;
  phoneNumber: string;
  optionSelected: string;
  remark: string;
  otp: string;
  signature: string;
}

export default function LostPassbookReplacementForm() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    accountNumber: '',
    customerName: '',
    phoneNumber: '',
    optionSelected: 'TransferToNewAccount',
    remark: '',
    otp: '',
    signature: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountValidated, setAccountValidated] = useState(false);

  const handleAccountChange = (accountNumber: string, accountHolderName?: string) => {
    setFormData(prev => ({
      ...prev,
      accountNumber,
      customerName: accountHolderName || '',
    }));
    if (!accountNumber) {
      setAccountValidated(false);
    }
  };

  const handleAccountValidation = (account: any | null) => {
    setAccountValidated(!!account);
    if (account) {
      setFormData(prev => ({
        ...prev,
        customerName: account.accountHolderName || '',
        phoneNumber: account.phoneNumber || '',
      }));
    }
  };

  const handlePhoneNumberFetched = (phoneNumber: string) => {
    setFormData(prev => ({ ...prev, phoneNumber }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOtpChange = (otp: string) => {
    setFormData(prev => ({ ...prev, otp }));
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
    if (!accountValidated) {
      showError('Please validate the account.');
      return;
    }

    setIsSubmitting(true);
    try {
      await lostPassbookReplacementService.submit({
        branchId: branch.id,
        phoneNumber: formData.phoneNumber,
        accountNumber: formData.accountNumber,
        customerName: formData.customerName,
        optionSelected: formData.optionSelected,
        remark: formData.remark,
        otpCode: formData.otp,
        signatures: [{ signature: formData.signature }],
      });
      showSuccess('Request submitted successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      showError(error?.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormLayout title="Lost Passbook Replacement" branchName={branch?.name} phone={formData.phoneNumber}>
      <div className="space-y-6">
        <AccountSelector
          accounts={[]}
          selectedAccount={formData.accountNumber}
          onAccountChange={handleAccountChange}
          onAccountValidation={handleAccountValidation}
          onPhoneNumberFetched={handlePhoneNumberFetched}
          allowManualEntry={true}
        />
        {accountValidated && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                readOnly
                className="w-full p-3 rounded-lg border border-fuchsia-300 bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Option</label>
              <select
                name="optionSelected"
                value={formData.optionSelected}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-gray-300"
              >
                <option value="TransferToNewAccount">Transfer to New Account</option>
                <option value="ResponsibilityTaken">Responsibility Taken</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Remark</label>
              <textarea
                name="remark"
                value={formData.remark}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-gray-300"
              />
            </div>
            <SignatureStep onSignatureComplete={handleSignatureComplete} onSignatureClear={handleSignatureClear} />
            <OTPVerification
              phone={formData.phoneNumber}
              otp={formData.otp}
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
          </>
        )}
      </div>
    </FormLayout>
  );
}
