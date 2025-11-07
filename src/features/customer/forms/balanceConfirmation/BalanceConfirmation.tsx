// features/customer/forms/balanceConfirmation/BalanceConfirmation.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBranch } from '@context/BranchContext';
import { useToast } from '@context/ToastContext';
import { useFormSteps } from '@features/customer/hooks/useFormSteps';
import { useFormValidation } from '@features/customer/hooks/useFormValidation';
import { useOTPHandling } from '@features/customer/hooks/useOTPHandling';
import { FormLayout } from '@features/customer/components/FormLayout';
import { AccountSelector } from '@features/customer/components/AccountSelector';
import { AmountInput } from '@features/customer/components/AmountInput';
import { OTPVerification } from '@features/customer/components/OTPVerification';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import { balanceConfirmationValidationSchema } from '@features/customer/utils/extendedValidationSchemas';
import { balanceConfirmationService } from '@services';
import { authService } from '@services';
import { Shield } from 'lucide-react';

interface FormData {
  accountNumber: string;
  accountHolderName: string;
  customerName: string;
  accountOpenedDate: string;
  balanceAsOfDate: string;
  creditBalance: string;
  embassyOrConcernedOrgan: string;
  location: string;
  otp: string;
  phoneNumber: string;
}

export default function BalanceConfirmation() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError, info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const { step, next, prev, isFirst } = useFormSteps(5);
  const { errors, validateForm, clearFieldError } = useFormValidation(balanceConfirmationValidationSchema);
  const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } = useOTPHandling();

  const [formData, setFormData] = useState<FormData>({
    accountNumber: '',
    accountHolderName: '',
    customerName: '',
    accountOpenedDate: '',
    balanceAsOfDate: '',
    creditBalance: '',
    embassyOrConcernedOrgan: '',
    location: '',
    otp: '',
    phoneNumber: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [accountValidated, setAccountValidated] = useState(false);

  useEffect(() => {
    const state = location.state as any;
    if (state?.updateId && state?.formData) {
      setFormData({
        accountNumber: state.formData.accountNumber || '',
        accountHolderName: state.formData.accountHolderName || '',
        customerName: state.formData.customerName || '',
        accountOpenedDate: state.formData.accountOpenedDate || '',
        balanceAsOfDate: state.formData.balanceAsOfDate || '',
        creditBalance: state.formData.creditBalance ? state.formData.creditBalance.toString() : '',
        embassyOrConcernedOrgan: state.formData.embassyOrConcernedOrgan || '',
        location: state.formData.location || '',
        otp: '',
        phoneNumber: state.formData.phoneNumber || '',
      });
      setAccountValidated(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleAccountChange = (accountNumber: string, accountHolderName?: string) => {
    setFormData(prev => ({
      ...prev,
      accountNumber,
      accountHolderName: accountHolderName || '',
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
        accountHolderName: account.accountHolderName || '',
        customerName: account.accountHolderName || '', // Pre-fill customer name
      }));
    }
  };

  const handlePhoneNumberFetched = (phoneNumber: string) => {
    setFormData(prev => ({ ...prev, phoneNumber }));
  };

  const handleInputChange = (field: keyof FormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (value) clearFieldError(field);
  };

  const handleOtpChange = (otp: string) => {
    setFormData(prev => ({ ...prev, otp }));
    if (otp.length === 6) clearFieldError('otp');
  };

  const handleRequestOTP = async () => {
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
      await requestOTP(
        () => authService.requestWithdrawalOTP(phoneNumber),
        'OTP sent to your phone'
      );
      info('OTP sent to your phone');
      next(); // Move to OTP verification step
    } catch (error: any) {
      showError(error?.message || 'Failed to send OTP');
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
        () => authService.requestWithdrawalOTP(phoneNumber),
        'OTP resent successfully'
      );
      info('OTP resent successfully');
    } catch (error: any) {
      showError(error?.message || 'Failed to resend OTP');
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!accountValidated) {
        showError('Please validate the account by entering the account number and clicking "Search"');
        return;
      }
      next();
    } else if (step === 2) {
      if (!formData.customerName.trim()) {
        showError('Please enter the customer name');
        return;
      }
      if (!formData.accountOpenedDate) {
        showError('Please select the account opened date');
        return;
      }
      next();
    } else if (step === 3) {
      if (!formData.balanceAsOfDate) {
        showError('Please select the balance as of date');
        return;
      }
      if (!formData.creditBalance || parseFloat(formData.creditBalance) < 0) {
        showError('Please enter a valid credit balance');
        return;
      }
      next();
    } else {
      next();
    }
  };

  const handleSubmit = async () => {
    if (!branch?.id) {
      showError('Branch information is missing. Please select a branch and try again.');
      return;
    }
    if (!accountValidated) {
      showError('Please validate the account before submitting');
      return;
    }
    if (!validateForm(formData)) return;

    setIsSubmitting(true);
    try {
      const balanceConfirmationData = {
        phoneNumber: formData.phoneNumber,
        branchId: branch.id,
        accountNumber: formData.accountNumber,
        customerName: formData.customerName,
        accountOpenedDate: formData.accountOpenedDate,
        balanceAsOfDate: formData.balanceAsOfDate,
        creditBalance: parseFloat(formData.creditBalance),
        embassyOrConcernedOrgan: formData.embassyOrConcernedOrgan,
        location: formData.location,
        otpCode: formData.otp,
      };

      const response = await balanceConfirmationService.submitBalanceConfirmation(balanceConfirmationData);

      showSuccess('Balance confirmation request submitted successfully!');
      setFormData({
        accountNumber: '',
        accountHolderName: '',
        customerName: '',
        accountOpenedDate: '',
        balanceAsOfDate: '',
        creditBalance: '',
        embassyOrConcernedOrgan: '',
        location: '',
        otp: '',
        phoneNumber: '',
      });
      setAccountValidated(false);
      navigate('/form/balance-confirmation/confirmation', {
        state: {
          serverData: response,
          branchName: branch.name,
          ui: { ...formData, telephoneNumber: formData.phoneNumber },
        }
      });
    } catch (error: any) {
      showError(error?.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <AccountSelector
        accounts={[]}
        selectedAccount={formData.accountNumber}
        onAccountChange={handleAccountChange}
        onAccountValidation={handleAccountValidation}
        onPhoneNumberFetched={handlePhoneNumberFetched}
        error={errors.accountNumber}
        allowManualEntry={true}
      />
      {!accountValidated && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-sm font-medium text-amber-800">
            Please validate the account by entering the account number and clicking "Search"
          </div>
        </div>
      )}
      {accountValidated && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm font-medium text-green-800">
            Account validated successfully: <strong>{formData.accountHolderName}</strong>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Account Holder Name
        </label>
        <input
          type="text"
          value={formData.accountHolderName}
          readOnly
          className="w-full p-3 rounded-lg border border-fuchsia-300 bg-gradient-to-r from-amber-50 to-fuchsia-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Customer Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.customerName}
          onChange={(e) => handleInputChange('customerName')(e.target.value)}
          className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
          placeholder="Enter customer name"
        />
        {errors.customerName && (
          <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Account Opened Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.accountOpenedDate}
          onChange={(e) => handleInputChange('accountOpenedDate')(e.target.value)}
          className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
        />
        {errors.accountOpenedDate && (
          <p className="mt-1 text-sm text-red-600">{errors.accountOpenedDate}</p>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Balance As Of Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.balanceAsOfDate}
          onChange={(e) => handleInputChange('balanceAsOfDate')(e.target.value)}
          className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
        />
        {errors.balanceAsOfDate && (
          <p className="mt-1 text-sm text-red-600">{errors.balanceAsOfDate}</p>
        )}
      </div>

      <AmountInput
        value={formData.creditBalance}
        onChange={handleInputChange('creditBalance')}
        currency="ETB"
        error={errors.creditBalance}
        label="Credit Balance"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Embassy/Concerned Organization (Optional)
        </label>
        <input
          type="text"
          value={formData.embassyOrConcernedOrgan}
          onChange={(e) => handleInputChange('embassyOrConcernedOrgan')(e.target.value)}
          className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
          placeholder="Enter embassy or organization name"
        />
        {errors.embassyOrConcernedOrgan && (
          <p className="mt-1 text-sm text-red-600">{errors.embassyOrConcernedOrgan}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location (Optional)
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => handleInputChange('location')(e.target.value)}
          className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
          placeholder="Enter location"
        />
        {errors.location && (
          <p className="mt-1 text-sm text-red-600">{errors.location}</p>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Account Holder:</span>
          <span className="font-semibold text-fuchsia-900">{formData.accountHolderName}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Account Number:</span>
          <span className="font-mono font-semibold text-fuchsia-900">{formData.accountNumber}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Customer Name:</span>
          <span className="font-semibold text-fuchsia-900">{formData.customerName}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Account Opened Date:</span>
          <span className="font-semibold text-fuchsia-900">{formData.accountOpenedDate}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Balance As Of Date:</span>
          <span className="font-semibold text-fuchsia-900">{formData.balanceAsOfDate}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Credit Balance:</span>
          <span className="text-lg font-bold text-fuchsia-700">
            {Number(formData.creditBalance).toLocaleString()} ETB
          </span>
        </div>
        {formData.embassyOrConcernedOrgan && (
          <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
            <span className="font-medium text-fuchsia-800">Embassy/Organization:</span>
            <span className="font-semibold text-fuchsia-900">{formData.embassyOrConcernedOrgan}</span>
          </div>
        )}
        {formData.location && (
          <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
            <span className="font-medium text-fuchsia-800">Location:</span>
            <span className="font-semibold text-fuchsia-900">{formData.location}</span>
          </div>
        )}
        <div className="flex justify-between items-center py-2">
          <span className="font-medium text-fuchsia-800">Phone Number:</span>
          <span className="font-semibold text-fuchsia-900">{formData.phoneNumber || 'Not found'}</span>
        </div>
      </div>
      
      {formData.phoneNumber && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm font-medium text-green-800">
            Phone number associated with this account: <strong>{formData.phoneNumber}</strong>
          </div>
          <div className="text-xs text-green-600 mt-1">
            OTP will be sent to this number
          </div>
        </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <OTPVerification
      phone={formData.phoneNumber}
      otp={formData.otp}
      onOtpChange={handleOtpChange}
      onResendOtp={handleResendOTP}
      resendCooldown={resendCooldown}
      loading={otpLoading}
      error={errors.otp}
      message={otpMessage}
    />
  );

  const getStepContent = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

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
            disabled={!formData.phoneNumber || otpLoading}
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
    
    // For step 5, we need custom navigation with Verify & Submit button
    if (step === 5) {
      return (
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={prev}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
          >
            Back
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={formData.otp.length !== 6 || isSubmitting}
            className="bg-fuchsia-600 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ml-auto"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              'Verify & Submit'
            )}
          </button>
        </div>
      );
    }

    return (
      <StepNavigation
        currentStep={step}
        totalSteps={5}
        onNext={handleNext}
        onBack={prev}
        nextLabel="Continue"
        nextDisabled={
          (step === 1 && !accountValidated) || 
          isSubmitting
        }
        nextLoading={isSubmitting}
        hideBack={isFirst}
      />
    );
  };

  if (!branch?.id) {
    return (
      <FormLayout
        title="Balance Confirmation"
        branchName={undefined}
        phone={null}
        error="Branch information not available. Please select a branch."
      >
        <div className="text-center p-8">
          <p className="text-red-600 mb-4">Branch selection required. Please select a branch.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-fuchsia-700 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-800"
          >
            Go to Dashboard
          </button>
        </div>
      </FormLayout>
    );
  }

  return (
    <FormLayout
      title="Balance Confirmation"
      branchName={branch?.name}
      phone={formData.phoneNumber || null}
    >
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {getStepContent()}
        {renderCustomNavigation()}
      </form>
    </FormLayout>
  );
}