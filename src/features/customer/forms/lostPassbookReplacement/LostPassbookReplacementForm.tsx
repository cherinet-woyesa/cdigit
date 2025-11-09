// features/customer/forms/lostPassbookReplacement/LostPassbookReplacementForm.tsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '@context/BranchContext';
import { useToast } from '@context/ToastContext';
import { useFormSteps } from '@features/customer/hooks/useFormSteps';
import { useOTPHandling } from '@features/customer/hooks/useOTPHandling';
import { FormLayout } from '@features/customer/components/FormLayout';
import { AccountSelector } from '@features/customer/components/AccountSelector';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import { SignatureStep } from '@features/customer/components/SignatureStep';
import OTPStep from '@features/customer/components/stoppayment/OTPStep';
import { lostPassbookReplacementService } from '@services/forms/lostPassbookReplacementService';
import { authService } from '@services/auth';

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
  const { step, next, prev, isFirst, isLast } = useFormSteps(5); // 5 steps
  const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();
  const signaturePadRef = useRef<any>(null);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);

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
  const [validatedAccount, setValidatedAccount] = useState<any>(null);

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
    setValidatedAccount(account);
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

  const handleOtpChange = (value: string) => {
    setFormData(prev => ({ ...prev, otp: value }));
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
    if (!accountValidated) {
      showError('Please validate the account.');
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

  const renderStep = () => {
    switch (step) {
      case 1:
        // Account validation step
        return (
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
            )}
          </div>
        );
      case 2:
        // Options and remark step
        return (
          <div className="space-y-6">
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
                rows={4}
              />
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
                <span className="font-medium text-fuchsia-800">Account Holder:</span>
                <span className="font-semibold text-fuchsia-900">{formData.customerName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Account Number:</span>
                <span className="font-mono font-semibold text-fuchsia-900">{formData.accountNumber}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Option:</span>
                <span className="font-semibold text-fuchsia-900">
                  {formData.optionSelected === 'TransferToNewAccount' ? 'Transfer to New Account' : 'Responsibility Taken'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Remark:</span>
                <span className="font-semibold text-fuchsia-900">{formData.remark || 'None'}</span>
              </div>
            </div>
          </div>
        );
      case 5:
        // OTP step
        return (
          <div className="space-y-6">
            <OTPStep 
              otpCode={formData.otp} 
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
            disabled={!accountValidated || !formData.phoneNumber || otpLoading || isSignatureEmpty}
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
          (step === 1 && !accountValidated) || 
          (step === 2 && !formData.optionSelected) ||
          (step === 5 && formData.otp.length !== 6) || 
          isSubmitting
        }
        nextLoading={isSubmitting}
        hideBack={isFirst}
      />
    );
  };

  return (
    <FormLayout title="Lost Passbook Replacement" branchName={branch?.name} phone={formData.phoneNumber}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {renderStep()}
        {renderCustomNavigation()}
      </form>
    </FormLayout>
  );
}