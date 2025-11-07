// features/customer/forms/fixedTimeDepositAccountRequest/FixedTimeDepositAccountRequestForm.tsx
import { useState, useRef, useEffect } from 'react';
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
import { fixedTimeDepositAccountRequestService } from '@services/forms/fixedTimeDepositAccountRequestService';
import authService from '@services/auth/authService';

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
  const { step, next, prev, isFirst, isLast } = useFormSteps(4); // 4 steps
  const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();
  const signaturePadRef = useRef<any>(null);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);

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
  const [validatedAccount, setValidatedAccount] = useState<any>(null);

  const handleAccountChange = (accountNumber: string, accountHolderName?: string) => {
    setFormData(prev => ({
      ...prev,
      accountNumber,
      accountName: accountHolderName || '',
      customerFullName: accountHolderName || '',
    }));
  };

  const handleAccountValidation = (account: any | null) => {
    setValidatedAccount(account);
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
    if (!accountValidated) {
      showError('Please validate the account.');
      return;
    }

    if (!formData.depositAmount) {
      showError('Deposit amount is required.');
      return;
    }

    if (!formData.maturityDate) {
      showError('Maturity date is required.');
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
                  name="customerFullName"
                  value={formData.customerFullName}
                  readOnly
                  placeholder="Customer Name"
                  className="w-full p-3 border rounded-lg bg-gray-100"
                />
              </div>
            )}
          </div>
        );
      case 2:
        // Deposit details step
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Account Holder:</span>
                <span className="font-semibold text-fuchsia-900">{formData.customerFullName}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Account Number:</span>
                <span className="font-mono font-semibold text-fuchsia-900">{formData.accountNumber}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount</label>
                <input 
                  name="depositAmount" 
                  value={formData.depositAmount} 
                  onChange={handleChange} 
                  placeholder="Deposit Amount" 
                  type="number" 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract Date</label>
                <input 
                  type="date" 
                  name="contractDate" 
                  value={formData.contractDate} 
                  onChange={handleChange} 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maturity Date</label>
                <input 
                  type="date" 
                  name="maturityDate" 
                  value={formData.maturityDate} 
                  onChange={handleChange} 
                  className="w-full p-3 border rounded-lg" 
                />
              </div>
              <div className="flex items-center pt-6">
                <input 
                  type="checkbox" 
                  name="isRolloverAgreed" 
                  checked={formData.isRolloverAgreed} 
                  onChange={handleChange} 
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded" 
                />
                <label htmlFor="isRolloverAgreed" className="ml-2 block text-sm text-gray-900">Agree to Rollover</label>
              </div>
            </div>
          </div>
        );
      case 3:
        // Signature step
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Account Holder:</span>
                <span className="font-semibold text-fuchsia-900">{formData.customerFullName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Account Number:</span>
                <span className="font-mono font-semibold text-fuchsia-900">{formData.accountNumber}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Deposit Amount:</span>
                <span className="font-semibold text-fuchsia-900">{formData.depositAmount} ETB</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Maturity Date:</span>
                <span className="font-semibold text-fuchsia-900">{formData.maturityDate}</span>
              </div>
            </div>
            
            <SignatureStep 
              onSignatureComplete={handleSignatureComplete}
              onSignatureClear={handleSignatureClear}
            />
          </div>
        );
      case 4:
        // OTP step
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Account Holder:</span>
                <span className="font-semibold text-fuchsia-900">{formData.customerFullName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Account Number:</span>
                <span className="font-mono font-semibold text-fuchsia-900">{formData.accountNumber}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Deposit Amount:</span>
                <span className="font-semibold text-fuchsia-900">{formData.depositAmount} ETB</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Maturity Date:</span>
                <span className="font-semibold text-fuchsia-900">{formData.maturityDate}</span>
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

  // Custom navigation for step 3 - Replace Continue with Request OTP button
  const renderCustomNavigation = () => {
    if (step === 3) {
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
        totalSteps={4}
        onNext={isLast ? handleSubmit : next}
        onBack={prev}
        nextLabel={isLast ? 'Submit' : 'Continue'}
        nextDisabled={
          (step === 1 && !accountValidated) || 
          (step === 2 && (!formData.depositAmount || !formData.maturityDate)) ||
          (step === 4 && formData.otpCode.length !== 6) || 
          isSubmitting
        }
        nextLoading={isSubmitting}
        hideBack={isFirst}
      />
    );
  };

  return (
    <FormLayout title="Fixed-Time Deposit Request" branchName={branch?.name}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {renderStep()}
        {renderCustomNavigation()}
      </form>
    </FormLayout>
  );
}