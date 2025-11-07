// features/customer/forms/customerProfileChange/CustomerProfileChange.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '@context/BranchContext';
import { useToast } from '@context/ToastContext';
import { useFormValidation } from '@features/customer/hooks/useFormValidation';
import { FormLayout } from '@features/customer/components/FormLayout';
import { AccountSelector } from '@features/customer/components/AccountSelector';
import { StepNavigation } from '@features/customer/components/StepNavigation';
import { customerProfileChangeValidationSchema } from '@features/customer/utils/extendedValidationSchemas';
import { customerProfileChangeService } from '@services/forms/customerProfileChangeService';
import { OTPVerification } from '@features/customer/components/OTPVerification';
import { useOTPHandling } from '@features/customer/hooks/useOTPHandling';
import { authService } from '@services/auth';
import { useFormSteps } from '@features/customer/hooks/useFormSteps';

interface FormData {
  // Account Information
  accountNumber: string;
  accountHolderName: string;
  customerId: string;
  accountName: string;
  customerFullName: string;
  accountType: string;
  dateRequested: string;
  phoneNumber: string;
  
  // Service Request Checklist
  changeOfSignatureOrName: boolean;
  pinResetRequest: boolean;
  mobileNumberReplacement: boolean;
  changeOrAddMobileBankingChannel: boolean;
  corpInternetBankingUserChange: boolean;
  mobileBankingResubscription: boolean;
  customerInfoChange: boolean;
  mobileBankingTermination: boolean;
  tokenReplacement: boolean;
  internetBankingTermination: boolean;
  linkOrChangeAdditionalAccounts: boolean;
  accountClosure: boolean;
  posMerchantContractTermination: boolean;
  powerOfAttorneyChange: boolean;
  additionalCardRequest: boolean;
  cardReplacementRequest: boolean;
  hasOtherRequest: boolean;
  
  // Additional Information
  reasonForRequest: string;
  detailedRequestDescription: string;
  clause: string;
  
  // OTP
  otp: string;
}

export default function CustomerProfileChange() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError, info } = useToast();
  const navigate = useNavigate();
  const { step, next, prev, isFirst } = useFormSteps(3);
  const { errors, validateForm, clearFieldError } = useFormValidation(customerProfileChangeValidationSchema);
  const { otpLoading, otpMessage, resendCooldown, requestOTP } = useOTPHandling();

  const [formData, setFormData] = useState<FormData>({
    // Account Information
    accountNumber: '',
    accountHolderName: '',
    customerId: '',
    accountName: '',
    customerFullName: '',
    accountType: '',
    dateRequested: new Date().toISOString().split('T')[0],
    phoneNumber: '',
    
    // Service Request Checklist
    changeOfSignatureOrName: false,
    pinResetRequest: false,
    mobileNumberReplacement: false,
    changeOrAddMobileBankingChannel: false,
    corpInternetBankingUserChange: false,
    mobileBankingResubscription: false,
    customerInfoChange: false,
    mobileBankingTermination: false,
    tokenReplacement: false,
    internetBankingTermination: false,
    linkOrChangeAdditionalAccounts: false,
    accountClosure: false,
    posMerchantContractTermination: false,
    powerOfAttorneyChange: false,
    additionalCardRequest: false,
    cardReplacementRequest: false,
    hasOtherRequest: false,
    
    // Additional Information
    reasonForRequest: '',
    detailedRequestDescription: '',
    clause: '',
    
    // OTP
    otp: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountValidated, setAccountValidated] = useState(false);

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
      // TODO: Replace hardcoded customerId with actual value from backend when available
      const hardcodedCustomerId = 'CUST-' + Date.now(); // Temporary hardcoded value
      
      setFormData(prev => ({
        ...prev,
        accountHolderName: account.accountHolderName || '',
        customerId: account.customerId || hardcodedCustomerId, // Use hardcoded value if not available
        accountName: account.accountHolderName || '',
        customerFullName: account.accountHolderName || '',
        accountType: account.accountType || '',
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

  const handleCheckboxChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.checked }));
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
      next(); // Move to checklist step
    } catch (error: any) {
      showError(error?.message || 'Failed to send OTP');
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
      const customerProfileChangeData = {
        branchId: branch.id,
        phoneNumber: formData.phoneNumber,
        otpCode: formData.otp,
        customerId: formData.customerId,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        customerFullName: formData.customerFullName,
        accountType: formData.accountType,
        dateRequested: formData.dateRequested,
        changeOfSignatureOrName: formData.changeOfSignatureOrName,
        pinResetRequest: formData.pinResetRequest,
        mobileNumberReplacement: formData.mobileNumberReplacement,
        changeOrAddMobileBankingChannel: formData.changeOrAddMobileBankingChannel,
        corpInternetBankingUserChange: formData.corpInternetBankingUserChange,
        mobileBankingResubscription: formData.mobileBankingResubscription,
        customerInfoChange: formData.customerInfoChange,
        mobileBankingTermination: formData.mobileBankingTermination,
        tokenReplacement: formData.tokenReplacement,
        internetBankingTermination: formData.internetBankingTermination,
        linkOrChangeAdditionalAccounts: formData.linkOrChangeAdditionalAccounts,
        accountClosure: formData.accountClosure,
        posMerchantContractTermination: formData.posMerchantContractTermination,
        powerOfAttorneyChange: formData.powerOfAttorneyChange,
        additionalCardRequest: formData.additionalCardRequest,
        cardReplacementRequest: formData.cardReplacementRequest,
        hasOtherRequest: formData.hasOtherRequest,
        reasonForRequest: formData.reasonForRequest || undefined,
        detailedRequestDescription: formData.detailedRequestDescription || undefined,
        clause: formData.clause || undefined,
      };

      const response = await customerProfileChangeService.submitCustomerProfileChange(customerProfileChangeData);

      showSuccess('Customer profile change request submitted successfully!');
      navigate('/form/customer-profile-change/confirmation', {
        state: {
          serverData: response,
          branchName: branch.name,
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
      {accountValidated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer ID
            </label>
            <input
              type="text"
              value={formData.customerId}
              onChange={(e) => handleInputChange('customerId')(e.target.value)}
              className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 bg-gray-100"
              placeholder="Customer ID"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Name
            </label>
            <input
              type="text"
              value={formData.accountName}
              onChange={(e) => handleInputChange('accountName')(e.target.value)}
              className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 bg-gray-100"
              placeholder="Account Name"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Full Name
            </label>
            <input
              type="text"
              value={formData.customerFullName}
              onChange={(e) => handleInputChange('customerFullName')(e.target.value)}
              className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 bg-gray-100"
              placeholder="Customer Full Name"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <input
              type="text"
              value={formData.accountType}
              onChange={(e) => handleInputChange('accountType')(e.target.value)}
              className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 bg-gray-100"
              placeholder="Account Type"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Requested
            </label>
            <input
              type="date"
              value={formData.dateRequested}
              onChange={(e) => handleInputChange('dateRequested')(e.target.value)}
              className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            />
            {errors.dateRequested && (
              <p className="mt-1 text-sm text-red-600">{errors.dateRequested}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Service Request Checklist</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="changeOfSignatureOrName"
            checked={formData.changeOfSignatureOrName}
            onChange={handleCheckboxChange('changeOfSignatureOrName')}
            className="h-4 w-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
          />
          <label htmlFor="changeOfSignatureOrName" className="ml-2 block text-sm text-gray-900">
            Change of Signature or Name
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="pinResetRequest"
            checked={formData.pinResetRequest}
            onChange={handleCheckboxChange('pinResetRequest')}
            className="h-4 w-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
          />
          <label htmlFor="pinResetRequest" className="ml-2 block text-sm text-gray-900">
            PIN Reset Request
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="mobileNumberReplacement"
            checked={formData.mobileNumberReplacement}
            onChange={handleCheckboxChange('mobileNumberReplacement')}
            className="h-4 w-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
          />
          <label htmlFor="mobileNumberReplacement" className="ml-2 block text-sm text-gray-900">
            Mobile Number Replacement
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="changeOrAddMobileBankingChannel"
            checked={formData.changeOrAddMobileBankingChannel}
            onChange={handleCheckboxChange('changeOrAddMobileBankingChannel')}
            className="h-4 w-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
          />
          <label htmlFor="changeOrAddMobileBankingChannel" className="ml-2 block text-sm text-gray-900">
            Change or Add Mobile Banking Channel
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="corpInternetBankingUserChange"
            checked={formData.corpInternetBankingUserChange}
            onChange={handleCheckboxChange('corpInternetBankingUserChange')}
            className="h-4 w-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
          />
          <label htmlFor="corpInternetBankingUserChange" className="ml-2 block text-sm text-gray-900">
            Corporate Internet Banking User Change
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="mobileBankingResubscription"
            checked={formData.mobileBankingResubscription}
            onChange={handleCheckboxChange('mobileBankingResubscription')}
            className="h-4 w-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
          />
          <label htmlFor="mobileBankingResubscription" className="ml-2 block text-sm text-gray-900">
            Mobile Banking Resubscription
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="customerInfoChange"
            checked={formData.customerInfoChange}
            onChange={handleCheckboxChange('customerInfoChange')}
            className="h-4 w-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
          />
          <label htmlFor="customerInfoChange" className="ml-2 block text-sm text-gray-900">
            Customer Information Change
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="mobileBankingTermination"
            checked={formData.mobileBankingTermination}
            onChange={handleCheckboxChange('mobileBankingTermination')}
            className="h-4 w-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
          />
          <label htmlFor="mobileBankingTermination" className="ml-2 block text-sm text-gray-900">
            Mobile Banking Termination
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="tokenReplacement"
            checked={formData.tokenReplacement}
            onChange={handleCheckboxChange('tokenReplacement')}
            className="h-4 w-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
          />
          <label htmlFor="tokenReplacement" className="ml-2 block text-sm text-gray-900">
            Token Replacement
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="internetBankingTermination"
            checked={formData.internetBankingTermination}
            onChange={handleCheckboxChange('internetBankingTermination')}
            className="h-4 w-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
          />
          <label htmlFor="internetBankingTermination" className="ml-2 block text-sm text-gray-900">
            Internet Banking Termination
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="linkOrChangeAdditionalAccounts"
            checked={formData.linkOrChangeAdditionalAccounts}
            onChange={handleCheckboxChange('linkOrChangeAdditionalAccounts')}
            className="h-4 w-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
          />
          <label htmlFor="linkOrChangeAdditionalAccounts" className="ml-2 block text-sm text-gray-900">
            Link or Change Additional Accounts
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="accountClosure"
            checked={formData.accountClosure}
            onChange={handleCheckboxChange('accountClosure')}
            className="h-4 w-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
          />
          <label htmlFor="accountClosure" className="ml-2 block text-sm text-gray-900">
            Account Closure
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="posMerchantContractTermination"
            checked={formData.posMerchantContractTermination}
            onChange={handleCheckboxChange('posMerchantContractTermination')}
            className="h-4 w-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
          />
          <label htmlFor="posMerchantContractTermination" className="ml-2 block text-sm text-gray-900">
            POS Merchant Contract Termination
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="powerOfAttorneyChange"
            checked={formData.powerOfAttorneyChange}
            onChange={handleCheckboxChange('powerOfAttorneyChange')}
            className="h-4 w-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
          />
          <label htmlFor="powerOfAttorneyChange" className="ml-2 block text-sm text-gray-900">
            Power of Attorney Change
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="additionalCardRequest"
            checked={formData.additionalCardRequest}
            onChange={handleCheckboxChange('additionalCardRequest')}
            className="h-4 w-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
          />
          <label htmlFor="additionalCardRequest" className="ml-2 block text-sm text-gray-900">
            Additional Card Request
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="cardReplacementRequest"
            checked={formData.cardReplacementRequest}
            onChange={handleCheckboxChange('cardReplacementRequest')}
            className="h-4 w-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
          />
          <label htmlFor="cardReplacementRequest" className="ml-2 block text-sm text-gray-900">
            Card Replacement Request
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="hasOtherRequest"
            checked={formData.hasOtherRequest}
            onChange={handleCheckboxChange('hasOtherRequest')}
            className="h-4 w-4 text-fuchsia-600 border-gray-300 rounded focus:ring-fuchsia-500"
          />
          <label htmlFor="hasOtherRequest" className="ml-2 block text-sm text-gray-900">
            Has Other Request
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason for Request
        </label>
        <textarea
          value={formData.reasonForRequest}
          onChange={(e) => handleInputChange('reasonForRequest')(e.target.value)}
          className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
          placeholder="Enter reason for request"
          rows={3}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Detailed Request Description
        </label>
        <textarea
          value={formData.detailedRequestDescription}
          onChange={(e) => handleInputChange('detailedRequestDescription')(e.target.value)}
          className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
          placeholder="Enter detailed request description"
          rows={4}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Clause
        </label>
        <input
          type="text"
          value={formData.clause}
          onChange={(e) => handleInputChange('clause')(e.target.value)}
          className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
          placeholder="Enter clause"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <OTPVerification
      phone={formData.phoneNumber}
      otp={formData.otp}
      onOtpChange={handleOtpChange}
      onResendOtp={handleRequestOTP}
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
      default: return null;
    }
  };

  return (
    <FormLayout
      title="Customer Profile Change"
      branchName={branch?.name}
      phone={null}
    >
      <form onSubmit={(e) => { e.preventDefault(); step === 1 ? handleRequestOTP() : step === 2 ? next() : handleSubmit(); }} className="space-y-6">
        {getStepContent()}
        <StepNavigation
            currentStep={step}
            totalSteps={3}
            onNext={step === 1 ? handleRequestOTP : step === 2 ? next : handleSubmit}
            onBack={prev}
            nextLabel={step === 1 ? 'Validate Account & Request OTP' : step === 2 ? 'Next' : 'Verify & Submit'}
            nextDisabled={isSubmitting || otpLoading}
            nextLoading={isSubmitting || otpLoading}
            hideBack={isFirst}
        />
      </form>
    </FormLayout>
  );
}