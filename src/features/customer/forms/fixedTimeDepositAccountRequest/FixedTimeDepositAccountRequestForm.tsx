
// features/customer/forms/fixedTimeDepositAccountRequest/FixedTimeDepositAccountRequestForm.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '../../../../context/BranchContext';
import { useToast } from '../../../../context/ToastContext';
import { FormLayout } from '../../components/FormLayout';
import { AccountSelector } from '../../components/AccountSelector';
import { OTPVerification } from '../../components/OTPVerification';
import { SignatureStep } from '../../components/SignatureStep';
import { StepNavigation } from '../../components/StepNavigation';
import { fixedTimeDepositAccountRequestService } from '../../../../services/fixedTimeDepositAccountRequestService';
import authService from '../../../../services/authService';

interface FormData {
  customerId: string;
  accountNumber: string;
  accountName: string;
  customerFullName: string;
  phoneNumber: string;
  depositAmount: string;
  contractDate: string;
  maturityDate: string;
  isRolloverAgreed: boolean;
  otpCode: string;
  signature: string;
}

export default function FixedTimeDepositAccountRequestForm() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    customerId: '',
    accountNumber: '',
    accountName: '',
    customerFullName: '',
    phoneNumber: '',
    depositAmount: '',
    contractDate: new Date().toISOString().split('T')[0],
    maturityDate: '',
    isRolloverAgreed: false,
    otpCode: '',
    signature: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountValidated, setAccountValidated] = useState(false);

  const handleAccountChange = (accountNumber: string, accountHolderName?: string) => {
    setFormData(prev => ({
      ...prev,
      accountNumber,
      accountName: accountHolderName || '',
      customerFullName: accountHolderName || '',
    }));
  };

  const handleAccountValidation = (account: any | null) => {
    setAccountValidated(!!account);
    if (account) {
      setFormData(prev => ({
        ...prev,
        customerId: account.customerId || '',
        accountName: account.accountHolderName || '',
        customerFullName: account.accountHolderName || '',
        phoneNumber: account.phoneNumber || '',
      }));
    }
  };

  const handlePhoneNumberFetched = (phoneNumber: string) => {
    setFormData(prev => ({ ...prev, phoneNumber }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
    if (!accountValidated) {
      showError('Please validate the account.');
      return;
    }

    setIsSubmitting(true);
    try {
      await fixedTimeDepositAccountRequestService.submit({
        ...formData,
        branchId: branch.id,
        depositAmount: parseFloat(formData.depositAmount),
        contractDate: new Date(formData.contractDate),
        maturityDate: new Date(formData.maturityDate),
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
    <FormLayout title="Fixed-Time Deposit Request" branchName={branch?.name}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="customerFullName" value={formData.customerFullName} readOnly placeholder="Customer Name" className="w-full p-2 border rounded bg-gray-100" />
                <input name="depositAmount" value={formData.depositAmount} onChange={handleChange} placeholder="Deposit Amount" type="number" className="w-full p-2 border rounded" />
                <div>
                    <label className="block text-sm font-medium text-gray-700">Contract Date</label>
                    <input type="date" name="contractDate" value={formData.contractDate} onChange={handleChange} className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Maturity Date</label>
                    <input type="date" name="maturityDate" value={formData.maturityDate} onChange={handleChange} className="w-full p-2 border rounded" />
                </div>
                <div className="flex items-center">
                    <input type="checkbox" name="isRolloverAgreed" checked={formData.isRolloverAgreed} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                    <label htmlFor="isRolloverAgreed" className="ml-2 block text-sm text-gray-900">Agree to Rollover</label>
                </div>
            </div>
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
          </>
        )}
      </div>
    </FormLayout>
  );
}
