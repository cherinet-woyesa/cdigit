// features/customer/forms/checkDeposit/CheckDepositForm.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBranch } from "@context/BranchContext";
import { useToast } from "@context/ToastContext";
import { useFormSteps } from "@features/customer/hooks/useFormSteps";
import { useFormValidation } from "@features/customer/hooks/useFormValidation";
import { useOTPHandling } from "@features/customer/hooks/useOTPHandling";
import { FormLayout } from "@features/customer/components/FormLayout";
import { AccountSelector } from "@features/customer/components/AccountSelector";
import { AmountInput } from "@features/customer/components/AmountInput";
import { OTPVerification } from "@features/customer/components/OTPVerification";
import { StepNavigation } from "@features/customer/components/StepNavigation";
import { SignatureStep } from "@features/customer/components/SignatureStep";
import { checkDepositValidationSchema } from "@features/customer/utils/extendedValidationSchemas";
import checkDepositService from "@services/transactions/checkDepositService";
import authService from "@services/auth/authService";
import { Shield } from "lucide-react";

interface FormData {
  accountNumber: string;
  accountHolderName: string;
  amount: string;
  chequeNumber: string;
  drawerAccountNumber: string;
  checkType: string;
  checkValueDate: string;
  otp: string;
  phoneNumber: string;
  signature: string;
}

export default function CheckDeposit() {
  const { branch } = useBranch();
  const { success: showSuccess, error: showError, info } = useToast();
  const navigate = useNavigate();

  const { step, next, prev, isFirst } = useFormSteps(5);
  const { errors, validateForm, clearFieldError, clearErrors, hasErrors } = useFormValidation(
    checkDepositValidationSchema,
  );
  const { otpLoading, otpMessage, resendCooldown, requestOTP, resendOTP } =
    useOTPHandling();

  const [formData, setFormData] = useState<FormData>({
    accountNumber: "",
    accountHolderName: "",
    amount: "",
    chequeNumber: "",
    drawerAccountNumber: "",
    checkType: "",
    checkValueDate: "",
    otp: "",
    phoneNumber: "",
    signature: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountValidated, setAccountValidated] = useState(false);

  const handleAccountChange = (
    accountNumber: string,
    accountHolderName?: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      accountNumber,
      accountHolderName: accountHolderName || "",
    }));
    if (!accountNumber) {
      setAccountValidated(false);
    }
  };

  const handleAccountValidation = (account: any | null) => {
    setAccountValidated(!!account);
    if (account) {
      setFormData((prev) => ({
        ...prev,
        accountHolderName: account.accountHolderName || "",
      }));
    }
  };

  const handlePhoneNumberFetched = (phoneNumber: string) => {
    setFormData((prev) => ({ ...prev, phoneNumber }));
  };

  const handleInputChange = (field: keyof FormData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (value) clearFieldError(field);
  };

  const handleOtpChange = (otp: string) => {
    setFormData((prev) => ({ ...prev, otp }));
    if (otp.length === 6) clearFieldError("otp");
  };

  const handleSignatureComplete = (signatureData: string) => {
    setFormData((prev) => ({ ...prev, signature: signatureData }));
    clearFieldError("signature");
  };

  const handleSignatureClear = () => {
    setFormData((prev) => ({ ...prev, signature: "" }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!accountValidated) {
        showError(
          'Please validate the account by entering the account number and clicking "Search"',
        );
        return;
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        showError("Please enter a valid amount");
        return;
      }
      if (!formData.chequeNumber.trim()) {
        showError("Please enter a cheque number");
        return;
      }
      if (!formData.drawerAccountNumber.trim()) {
        showError("Please enter the drawer account number");
        return;
      }
    }

    if (step === 2) {
      if (!formData.checkType) {
        showError("Please select a check type");
        return;
      }
      if (!formData.checkValueDate) {
        showError("Please select a check value date");
        return;
      }
    }

    // Step 3 is now review, no validation needed
    // Step 4 is signature
    if (step === 4) {
      if (!formData.signature) {
        showError("Please provide a signature");
        return;
      }
    }

    next();
  };

  const handleRequestOTP = async () => {
    if (!formData.phoneNumber) {
      showError(
        "Phone number not found for this account. Please contact support.",
      );
      return;
    }

    const phoneNumber = formData.phoneNumber.trim();
    if (!phoneNumber) {
      showError(
        "Phone number not found for this account. Please contact support.",
      );
      return;
    }

    try {
      await requestOTP(
        () => authService.requestWithdrawalOTP(phoneNumber),
        "OTP sent to your phone",
      );
      info("OTP sent to your phone");
      next(); // Move to OTP verification step
    } catch (error: any) {
      showError(error?.message || "Failed to send OTP");
    }
  };

  const handleResendOTP = async () => {
    if (!formData.phoneNumber) {
      showError(
        "Phone number not found for this account. Please contact support.",
      );
      return;
    }

    const phoneNumber = formData.phoneNumber.trim();
    if (!phoneNumber) {
      showError(
        "Phone number not found for this account. Please contact support.",
      );
      return;
    }

    try {
      await resendOTP(
        () => authService.requestWithdrawalOTP(phoneNumber),
        "OTP resent successfully",
      );
      info("OTP resent successfully");
    } catch (error: any) {
      showError(error?.message || "Failed to resend OTP");
    }
  };

  const handleSubmit = async () => {
    console.log("=== Check Deposit Submission Debug ===");
    console.log("Current step:", step);
    console.log("Branch info:", branch);
    console.log("Account validated:", accountValidated);
    console.log("Form data:", formData);
    console.log("Current errors:", errors);
    console.log("Has errors:", hasErrors);
    
    if (!branch?.id) {
      console.log("ERROR: Branch information is missing");
      showError(
        "Branch information is missing. Please select a branch and try again.",
      );
      return;
    }
    
    if (!accountValidated) {
      console.log("ERROR: Account not validated");
      showError('Please validate the account before submitting');
      return;
    }
    
    // Clear any existing errors before validation
    clearErrors();
    console.log("Errors cleared");
    
    // Manual validation to identify the specific failing field
    console.log("=== Manual Validation ===");
    const validationFields = [
      'accountNumber', 'accountHolderName', 'amount', 'chequeNumber', 
      'drawerAccountNumber', 'checkType', 'checkValueDate', 'otp', 
      'phoneNumber', 'signature'
    ];
    
    let hasValidationErrors = false;
    const validationErrors: Record<string, string> = {};
    
    for (const field of validationFields) {
      const value = formData[field as keyof FormData];
      console.log(`Checking field ${field}:`, value);
      
      // Apply relevant validation rules
      switch (field) {
        case 'accountNumber':
          if (!value) {
            validationErrors[field] = 'Account number is required';
            hasValidationErrors = true;
          } else if (typeof value === 'string') {
            if (value.length < 10) {
              validationErrors[field] = 'Account number is too short';
              hasValidationErrors = true;
            } else if (value.length > 16) {
              validationErrors[field] = 'Account number is too long';
              hasValidationErrors = true;
            } else if (!/^\d+$/.test(value)) {
              validationErrors[field] = 'Account number must contain only digits';
              hasValidationErrors = true;
            }
          }
          break;
          
        case 'amount':
          if (!value) {
            validationErrors[field] = 'Amount is required';
            hasValidationErrors = true;
          } else if (typeof value === 'string') {
            const amountNum = parseFloat(value);
            if (isNaN(amountNum) || amountNum <= 0) {
              validationErrors[field] = 'Please enter a valid amount greater than 0';
              hasValidationErrors = true;
            } else if (amountNum > 10000000) {
              validationErrors[field] = 'Amount is too large';
              hasValidationErrors = true;
            }
          }
          break;
          
        case 'chequeNumber':
          if (!value) {
            validationErrors[field] = 'Cheque number is required';
            hasValidationErrors = true;
          } else if (typeof value === 'string') {
            if (value.length < 6) {
              validationErrors[field] = 'Cheque number is too short';
              hasValidationErrors = true;
            } else if (value.length > 20) {
              validationErrors[field] = 'Cheque number is too long';
              hasValidationErrors = true;
            } else if (!/^[A-Za-z0-9]+$/.test(value)) {
              validationErrors[field] = 'Cheque number must contain only letters and numbers';
              hasValidationErrors = true;
            }
          }
          break;
          
        case 'drawerAccountNumber':
          if (!value) {
            validationErrors[field] = 'Drawer account number is required';
            hasValidationErrors = true;
          } else if (typeof value === 'string') {
            // Drawer account number might have different validation rules
            // Let's check if it's at least 5 digits (more lenient)
            if (value.length < 5) {
              validationErrors[field] = 'Account number is too short';
              hasValidationErrors = true;
            } else if (value.length > 16) {
              validationErrors[field] = 'Account number is too long';
              hasValidationErrors = true;
            } else if (!/^\d+$/.test(value)) {
              validationErrors[field] = 'Account number must contain only digits';
              hasValidationErrors = true;
            }
          }
          break;
          
        case 'checkType':
          if (!value) {
            validationErrors[field] = 'Check type is required';
            hasValidationErrors = true;
          } else if (typeof value === 'string') {
            const validTypes = ["EG", "Foreign", "Traveler"];
            if (!validTypes.includes(value)) {
              validationErrors[field] = 'Please select a valid check type';
              hasValidationErrors = true;
            }
          }
          break;
          
        case 'checkValueDate':
          if (!value) {
            validationErrors[field] = 'Date is required';
            hasValidationErrors = true;
          } else if (typeof value === 'string') {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(23, 59, 59, 999); // End of today
            
            if (isNaN(selectedDate.getTime())) {
              validationErrors[field] = 'Please enter a valid date';
              hasValidationErrors = true;
            } else if (selectedDate > today) {
              validationErrors[field] = 'Date cannot be in the future';
              hasValidationErrors = true;
            }
          }
          break;
          
        case 'otp':
          if (!value) {
            validationErrors[field] = 'OTP is required';
            hasValidationErrors = true;
          } else if (typeof value === 'string') {
            if (value.length !== 6) {
              validationErrors[field] = 'OTP must be 6 digits';
              hasValidationErrors = true;
            } else if (!/^\d{6}$/.test(value)) {
              validationErrors[field] = 'OTP must contain only digits';
              hasValidationErrors = true;
            }
          }
          break;
          
        case 'signature':
          if (!value) {
            validationErrors[field] = 'Digital signature is required';
            hasValidationErrors = true;
          }
          break;
          
        // phoneNumber is not validated in the schema, so we skip it
      }
    }
    
    console.log("Manual validation errors:", validationErrors);
    
    if (hasValidationErrors) {
      console.log("ERROR: Manual validation failed");
      const errorMessages = Object.values(validationErrors);
      showError(`Please correct the following errors: ${errorMessages.join(', ')}`);
      return;
    }
    
    // Also run the original validation to see what happens
    console.log("=== Running Original Validation ===");
    const isFormValid = validateForm(formData);
    console.log("Form validation result:", isFormValid);
    console.log("Errors after validation:", errors);
    
    if (!isFormValid) {
      console.log("ERROR: Form validation failed");
      // Check if we have specific error messages to display
      const errorMessages = Object.values(errors).filter(error => error !== undefined);
      if (errorMessages.length > 0) {
        showError(`Please correct the following errors: ${errorMessages.join(', ')}`);
      } else {
        showError("Form validation failed. Please check all fields are correctly filled.");
      }
      return;
    }
    
    // Additional validation for required fields
    const requiredFields = [
      'accountNumber', 'amount', 'chequeNumber', 'drawerAccountNumber',
      'checkType', 'checkValueDate', 'otp', 'signature', 'phoneNumber'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field as keyof FormData]) {
        console.log(`ERROR: Required field ${field} is missing`);
        showError(`Missing required field: ${field}`);
        return;
      }
    }
    
    // Additional validation for checkValueDate
    if (!formData.checkValueDate) {
      console.log("ERROR: Check value date is missing");
      showError("Please select a check value date.");
      return;
    }
    
    // Validate that checkValueDate is a valid date
    const checkDate = new Date(formData.checkValueDate);
    if (isNaN(checkDate.getTime())) {
      console.log("ERROR: Check value date is invalid");
      showError("Please select a valid check value date.");
      return;
    }
    
    // Check that the date is not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkDate > today) {
      console.log("ERROR: Check value date is in the future");
      showError("Check value date cannot be in the future.");
      return;
    }
    
    // Validate OTP format
    if (formData.otp.length !== 6 || !/^\d{6}$/.test(formData.otp)) {
      console.log("ERROR: OTP format is invalid");
      showError("OTP must be exactly 6 digits.");
      return;
    }
    
    console.log("All validations passed, proceeding with submission");

    setIsSubmitting(true);
    try {
      const checkDepositData = {
        phoneNumber: formData.phoneNumber,
        branchId: branch.id,
        accountNumber: formData.accountNumber,
        amount: parseFloat(formData.amount),
        chequeNumber: formData.chequeNumber,
        drawerAccountNumber: formData.drawerAccountNumber,
        checkType: formData.checkType,
        checkValueDate: formData.checkValueDate,
        otpCode: formData.otp,
        signature: formData.signature,
      };

      console.log("Sending data to backend:", checkDepositData);
      
      const response =
        await checkDepositService.submitCheckDeposit(checkDepositData);
      
      console.log("Backend response:", response);

      showSuccess("Check deposit request submitted successfully!");
      navigate("/form/check-deposit/confirmation", {
        state: {
          serverData: response,
          branchName: branch.name,
        },
      });
    } catch (error: any) {
      console.error("Submission error:", error);
      console.error("Error details:", {
        message: error?.message,
        name: error?.name,
        stack: error?.stack
      });
      
      // Try to extract a meaningful error message
      let errorMessage = "Submission failed. Please try again.";
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      showError(errorMessage);
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
        <div className="space-y-6">
          <AmountInput
            value={formData.amount}
            onChange={handleInputChange("amount")}
            currency="ETB"
            error={errors.amount}
            label="Amount"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cheque Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.chequeNumber}
              onChange={(e) =>
                handleInputChange("chequeNumber")(e.target.value)
              }
              className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
              placeholder="Enter cheque number"
            />
            {errors.chequeNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.chequeNumber}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Drawer Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.drawerAccountNumber}
              onChange={(e) =>
                handleInputChange("drawerAccountNumber")(e.target.value)
              }
              className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
              placeholder="Enter drawer account number"
            />
            {errors.drawerAccountNumber && (
              <p className="mt-1 text-sm text-red-600">
                {errors.drawerAccountNumber}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Check Type <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.checkType}
          onChange={(e) => handleInputChange("checkType")(e.target.value)}
          className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
        >
          <option value="">Select Check Type</option>
          <option value="EG">EG</option>
          <option value="Foreign">Foreign</option>
          <option value="Traveler">Traveler</option>
        </select>
        {errors.checkType && (
          <p className="mt-1 text-sm text-red-600">{errors.checkType}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Check Value Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.checkValueDate}
          onChange={(e) => handleInputChange("checkValueDate")(e.target.value)}
          className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
        />
        {errors.checkValueDate && (
          <p className="mt-1 text-sm text-red-600">{errors.checkValueDate}</p>
        )}
      </div>
    </div>
  );

  // Step 3: Review (moved before signature)
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 space-y-3 border border-fuchsia-200">
        <h3 className="text-lg font-bold text-fuchsia-700 mb-4">
          Review Your Check Deposit
        </h3>
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Account Holder:</span>
          <span className="font-semibold text-fuchsia-900">
            {formData.accountHolderName}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Account Number:</span>
          <span className="font-mono font-semibold text-fuchsia-900">
            {formData.accountNumber}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Amount:</span>
          <span className="text-lg font-bold text-fuchsia-700">
            {Number(formData.amount).toLocaleString()} ETB
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Cheque Number:</span>
          <span className="font-semibold text-fuchsia-900">
            {formData.chequeNumber}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Drawer Account:</span>
          <span className="font-mono font-semibold text-fuchsia-900">
            {formData.drawerAccountNumber}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-fuchsia-300">
          <span className="font-medium text-fuchsia-800">Check Type:</span>
          <span className="font-semibold text-fuchsia-900">
            {formData.checkType}
          </span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="font-medium text-fuchsia-800">
            Check Value Date:
          </span>
          <span className="font-semibold text-fuchsia-900">
            {formData.checkValueDate}
          </span>
        </div>
      </div>
    </div>
  );

  // Step 4: Signature (moved after review)
  const renderStep4 = () => (
    <div className="space-y-6">
      <SignatureStep
        onSignatureComplete={handleSignatureComplete}
        onSignatureClear={handleSignatureClear}
        error={errors.signature}
      />
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
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  const renderCustomNavigation = () => {
    // Step 4 is now signature, after signature we request OTP
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
            disabled={
              !formData.phoneNumber || !formData.signature || otpLoading
            }
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
            disabled={isSubmitting}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 disabled:opacity-50"
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
              "Verify & Submit"
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
        nextDisabled={(step === 1 && !accountValidated) || isSubmitting}
        nextLoading={isSubmitting}
        hideBack={isFirst}
      />
    );
  };

  return (
    <FormLayout
      title="Check Deposit"
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
