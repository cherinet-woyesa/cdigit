// features/customer/forms/fixedTimeDepositAccountRequest/FixedTimeDepositAccountRequestForm.tsx
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
import { fixedTimeDepositAccountRequestService } from '@services/forms/fixedTimeDepositAccountRequestService';
import authService from '@services/auth/authService';
import { 
  User, 
  Calendar, 
  FileText, 
  Shield,
  DollarSign
} from 'lucide-react';

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
  const { success: showSuccess, error: showError, info } = useToast();
  const navigate = useNavigate();
  const { step, next, prev, isFirst, isLast } = useFormSteps(5); // 5 steps now
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
      await requestOTP(
        () => authService.requestOTP(formData.phoneNumber),
        'OTP sent to your phone'
      );
      info('OTP sent to your phone');
      next();
    } catch (error: any) {
      showError(error?.message || 'Failed to send OTP.');
    }
  };

  const handleResendOTP = async () => {
    if (!formData.phoneNumber) {
      showError('Phone number not found for this account. Please contact support.');
      return;
    }

    const phoneNumber = formData.phoneNumber.trim();
    if (!phoneNumber) {
      showError('Phone number not found for this account. Please contact support.');
      return;
    }

    try {
      await resendOTP(
        () => authService.requestOTP(phoneNumber),
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
          <div className="border border-fuchsia-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-fuchsia-700" />
              Account Validation
            </h2>
            <div className="space-y-4">
              <AccountSelector
                accounts={[]}
                selectedAccount={formData.accountNumber}
                onAccountChange={handleAccountChange}
                onAccountValidation={handleAccountValidation}
                onPhoneNumberFetched={handlePhoneNumberFetched}
                allowManualEntry={true}
              />
              
              {!formData.accountNumber && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-sm font-medium text-amber-800">
                    Please validate your account by entering the account number and clicking "Search"
                  </div>
                </div>
              )}
              
              {formData.accountNumber && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800">
                    Account validated successfully
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        // Deposit details step
        return (
          <div className="border border-fuchsia-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-fuchsia-700" />
              Deposit Details
            </h2>
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Account Holder:</span>
                <span className="font-semibold text-fuchsia-900">{formData.customerFullName}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Account Number:</span>
                <span className="font-mono font-semibold text-fuchsia-900">{formData.accountNumber}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    name="depositAmount" 
                    value={formData.depositAmount} 
                    onChange={handleChange} 
                    placeholder="Enter deposit amount" 
                    type="number" 
                    className="w-full pl-10 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contract Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="date" 
                    name="contractDate" 
                    value={formData.contractDate} 
                    onChange={handleChange} 
                    className="w-full pl-10 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maturity Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="date" 
                    name="maturityDate" 
                    value={formData.maturityDate} 
                    onChange={handleChange} 
                    className="w-full pl-10 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                  />
                </div>
              </div>
              <div className="flex items-center pt-6">
                <input 
                  type="checkbox" 
                  name="isRolloverAgreed" 
                  checked={formData.isRolloverAgreed} 
                  onChange={handleChange} 
                  className="h-4 w-4 text-fuchsia-600 border-fuchsia-300 rounded focus:ring-fuchsia-500" 
                />
                <label htmlFor="isRolloverAgreed" className="ml-2 block text-sm text-gray-900">
                  Agree to Rollover
                </label>
              </div>
            </div>
          </div>
        );
      case 3:
        // Signature step
        return (
          <div className="border border-fuchsia-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-fuchsia-700" />
              Digital Signature
            </h2>
            <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200 mb-6">
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
                <span className="font-semibold text-fuchsia-900">{Number(formData.depositAmount).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Maturity Date:</span>
                <span className="font-semibold text-fuchsia-900">{formData.maturityDate}</span>
              </div>
            </div>
            
            <div className="border border-fuchsia-200 rounded-lg p-4">
              <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-fuchsia-700" />
                Signature
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please sign below to confirm your deposit request. This signature is legally binding.
              </p>
              <SignatureStep 
                onSignatureComplete={handleSignatureComplete}
                onSignatureClear={handleSignatureClear}
              />
            </div>
          </div>
        );
      case 4:
        // Review step
        return (
          <div className="border border-fuchsia-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-fuchsia-700" />
              Review Your Request
            </h2>
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
                <span className="font-semibold text-fuchsia-900">{Number(formData.depositAmount).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Contract Date:</span>
                <span className="font-semibold text-fuchsia-900">{formData.contractDate}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Maturity Date:</span>
                <span className="font-semibold text-fuchsia-900">{formData.maturityDate}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Rollover Agreed:</span>
                <span className="font-semibold text-fuchsia-900">{formData.isRolloverAgreed ? 'Yes' : 'No'}</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                Please review all information carefully before proceeding. You will need to verify with an OTP sent to your registered phone number.
              </p>
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
                <span className="font-medium text-fuchsia-800">Account Holder:</span>
                <span className="font-semibold text-fuchsia-900">{formData.customerFullName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Account Number:</span>
                <span className="font-mono font-semibold text-fuchsia-900">{formData.accountNumber}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
                <span className="font-medium text-fuchsia-800">Deposit Amount:</span>
                <span className="font-semibold text-fuchsia-900">{Number(formData.depositAmount).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-fuchsia-800">Maturity Date:</span>
                <span className="font-semibold text-fuchsia-900">{formData.maturityDate}</span>
              </div>
            </div>
            
            <OTPStep 
              otpCode={formData.otpCode} 
              onOtpChange={handleOtpChange} 
              onResend={handleResendOTP} 
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
        nextLabel={isLast ? 'Submit Request' : 'Continue'}
        nextDisabled={
          (step === 1 && !accountValidated) || 
          (step === 2 && (!formData.depositAmount || !formData.maturityDate)) ||
          (step === 3 && isSignatureEmpty) ||
          (step === 5 && formData.otpCode.length !== 6) || 
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