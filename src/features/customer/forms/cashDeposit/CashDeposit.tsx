// features/customer/forms/cashDeposit/CashDepositForm.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { useBranch } from '../../../../context/BranchContext';
import { useToast } from '../../../../context/ToastContext';
import { useFormSteps } from '../../hooks/useFormSteps';
import { useAccountSelection } from '../../hooks/useAccountSelection';
import { useCurrencyConversion } from '../../hooks/useCurrencyConversion';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useApprovalWorkflow } from '../../../../hooks/useApprovalWorkflow';
import { FormLayout } from '../../components/FormLayout';
import { AccountSelector } from '../../components/AccountSelector';
import { AmountInput } from '../../components/AmountInput';
import { StepNavigation } from '../../components/StepNavigation';
import { SignatureStep } from '../../components/SignatureStep'; // Add this import
import { depositValidationSchema } from '../../utils/validationSchemas';
import depositService from '../../../../services/depositService';
import { convertAmountToWords } from '../../../../utils/amountInWords';
import { CheckCircle2, ChevronRight } from 'lucide-react';

interface Account {
  accountNumber: string;
  accountHolderName: string;
  isDiaspora?: boolean;
  accountType?: string;
}

interface FormData {
  accountNumber: string;
  accountHolderName: string;
  amount: string;
  currency: string;
  signature?: string; // Add signature field
}

// Add interface for validated account
interface ValidatedAccount {
  accountNumber: string;
  accountHolderName: string;
  isDiaspora?: boolean;
  accountType?: string;
}

export default function CashDepositForm() {
  const { phone } = useAuth();
  const { branch } = useBranch();
  const { success: showSuccess, error: showError } = useToast();
  const { createWorkflow } = useApprovalWorkflow();
  const navigate = useNavigate();
  const location = useLocation();

  // Custom Hooks
  const { step, next, prev, isFirst, isLast } = useFormSteps(3); // Changed from 2 to 3 steps
  const { accounts, loadingAccounts, errorAccounts, selectedAccount, selectAccount } = useAccountSelection('selectedDepositAccount');
  const { convertAmount, getCurrencyOptions } = useCurrencyConversion();
  const { errors, validateForm, clearFieldError } = useFormValidation(depositValidationSchema);

  // State
  const [formData, setFormData] = useState<FormData>({
    accountNumber: selectedAccount?.accountNumber || '',
    accountHolderName: selectedAccount?.accountHolderName || '',
    amount: '',
    currency: selectedAccount?.isDiaspora ? 'USD' : 'ETB',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validatedAccount, setValidatedAccount] = useState<ValidatedAccount | null>(null);
  const [amountInWords, setAmountInWords] = useState('');
  const [accountValidated, setAccountValidated] = useState(false); // Track if account has been validated
  const [updateId, setUpdateId] = useState<string | null>(null); // Track if this is an update

  // Handle update state
  useEffect(() => {
    const state = location.state as any;
    if (state?.updateId && state?.formData) {
      setUpdateId(state.updateId);
      
      // Set form data from update state
      setFormData({
        accountNumber: state.formData.accountNumber || '',
        accountHolderName: state.formData.accountHolderName || '',
        amount: state.formData.amount ? state.formData.amount.toString() : '',
        currency: 'ETB', // Default to ETB, will be updated based on account type
      });
      
      // Mark account as validated since we're loading existing data
      setAccountValidated(true);
      setValidatedAccount({
        accountNumber: state.formData.accountNumber || '',
        accountHolderName: state.formData.accountHolderName || '',
        isDiaspora: false, // We don't have this info, will be updated when account is re-validated
        accountType: undefined
      });
      
      // Clear the location state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Update amount in words when amount changes
  const updateAmountInWords = (amount: string) => {
    if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
      const words = convertAmountToWords(Number(amount));
      setAmountInWords(words);
    } else {
      setAmountInWords('');
    }
  };

  // Handlers
  const handleAccountValidation = (account: ValidatedAccount | null) => {
    setValidatedAccount(account);
    setAccountValidated(!!account); // Set validation status
    
    // If we have a validated account, update form data
    if (account) {
      setFormData(prev => ({
        ...prev,
        accountHolderName: account.accountHolderName,
      }));
    } else {
      // If validation failed, clear the account holder name
      setFormData(prev => ({
        ...prev,
        accountHolderName: '',
      }));
    }
  };

  const handleAccountChange = (accountNumber: string, accountHolderName?: string) => {
    const account = accounts.find(acc => acc.accountNumber === accountNumber);
    if (account) {
      selectAccount(accountNumber);
      setFormData(prev => ({
        ...prev,
        accountNumber,
        accountHolderName: accountHolderName || account.accountHolderName,
        currency: account.isDiaspora ? 'USD' : 'ETB',
      }));
      // For pre-selected accounts, we consider them validated
      setValidatedAccount({
        accountNumber,
        accountHolderName: accountHolderName || account.accountHolderName,
        isDiaspora: account.isDiaspora,
        accountType: account.accountType,
      });
      setAccountValidated(true);
      clearFieldError('accountNumber');
      clearFieldError('accountHolderName');
    } else {
      // If account number is cleared or manually entered
      setFormData(prev => ({
        ...prev,
        accountNumber,
        accountHolderName: accountHolderName || '',
      }));
      // For manual entry, we need explicit validation
      // Only reset validation if we're clearing the account
      if (!accountNumber && !accountHolderName) {
        setValidatedAccount(null);
        setAccountValidated(false);
      }
      // If we have an account holder name, consider the account validated
      else if (accountHolderName) {
        setValidatedAccount({
          accountNumber,
          accountHolderName: accountHolderName,
          isDiaspora: false, // We don't know this from manual entry
          accountType: undefined, // We don't know this from manual entry
        });
        setAccountValidated(true);
      }
    }
  };

  const handleAmountChange = (amount: string) => {
    setFormData(prev => ({ ...prev, amount }));
    updateAmountInWords(amount);
    if (amount) clearFieldError('amount');
  };

  const handleCurrencyChange = (currency: string) => {
    setFormData(prev => ({ ...prev, currency }));
  };

  // Add signature state
  const [signature, setSignature] = useState<string>('');
  const [signatureError, setSignatureError] = useState<string>('');

  // Add signature handlers
  const handleSignatureComplete = (signatureData: string) => {
    setSignature(signatureData);
    setSignatureError('');
  };

  const handleSignatureClear = () => {
    setSignature('');
  };

  // Update validation to check signature
  const handleNext = () => {
    // For step 1, we need to ensure account is validated
    if (step === 1) {
      // Check if we have a validated account
      if (!accountValidated) {
        showError('Please validate the account before continuing');
        return;
      }
      
      // Only validate amount if account is validated (amount field is visible)
      if (accountValidated) {
        // Create a partial form data object with only the fields that should be validated at this point
        const validationData = {
          accountNumber: formData.accountNumber,
          accountHolderName: formData.accountHolderName,
          amount: formData.amount, // Only validate amount if account is validated
          currency: formData.currency,
        };
        
        if (validateForm(validationData)) {
          next();
        }
      } else {
        // If account is validated but no amount is needed yet, just move to next step
        next();
      }
    } 
    // For step 2 (review step), move to signature step
    else if (step === 2) {
      next();
    }
    // For step 3 (signature step), validate signature and submit
    else {
      if (!signature) {
        setSignatureError('Signature is required to complete the transaction');
        return;
      }
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    // Check if phone and branch are available

    
    if (!branch?.id) {
      showError('Branch information is missing. Please select a branch and try again.');
      return;
    }

    // Ensure account is validated before submission
    if (!accountValidated) {
      showError('Please validate the account before submitting');
      return;
    }

    // Ensure amount is provided when account is validated
    if (accountValidated && !formData.amount) {
      showError('Please enter an amount');
      return;
    }

    if (!validateForm(formData)) return;

    setIsSubmitting(true);
    try {
      const amountInETB = convertAmount(formData.amount, formData.currency);
      
      // Check if this is an update or new deposit
      if (updateId) {
        // Handle update
        const depositData = {
          branchId: branch.id,
          accountHolderName: formData.accountHolderName,
          accountNumber: formData.accountNumber,
          amount: Number(amountInETB),
          telephoneNumber: phone || undefined,
          transactionType: `Cash Deposit (${formData.currency})`,
          status: 'Pending',
        };

        const response = await depositService.updateDeposit(updateId, depositData);
        
        await createWorkflow({
          voucherId: response.data?.id || updateId,
          voucherType: 'deposit',
          transactionType: 'deposit',
          amount: Number(amountInETB),
          currency: 'ETB',
          customerSegment: 'normal',
          reason: 'Customer deposit update request',
          voucherData: depositData,
        });

        showSuccess('Deposit updated successfully!');
        
        // Reset form data after successful update
        setFormData({
          accountNumber: '',
          accountHolderName: '',
          amount: '',
          currency: 'ETB',
        });
        setValidatedAccount(null);
        setAccountValidated(false);
        setAmountInWords('');
        setUpdateId(null);
        setSignature(''); // Reset signature
        
        navigate('/form/cash-deposit/cashdepositconfirmation', {
          state: {
            serverData: response,
            branchName: branch.name,
            ui: { ...formData, telephoneNumber: phone },
            tokenNumber: response.data?.tokenNumber,
            queueNumber: response.data?.queueNumber,
          }
        });
      } else {
        // Handle new deposit
        const depositData = {
          branchId: branch.id,
          accountHolderName: formData.accountHolderName,
          accountNumber: formData.accountNumber,
          amount: Number(amountInETB),
          telephoneNumber: phone || undefined,
          transactionType: `Cash Deposit (${formData.currency})`,
          status: 'Pending',
          signature: signature, // Add signature to deposit data
        };

        const response = await depositService.submitDeposit(depositData);
        
        await createWorkflow({
          voucherId: response.data?.id || '',
          voucherType: 'deposit',
          transactionType: 'deposit',
          amount: Number(amountInETB),
          currency: 'ETB',
          customerSegment: 'normal',
          reason: 'Customer deposit request',
          voucherData: depositData,
        });

        showSuccess('Deposit submitted successfully!');
        
        // Reset form data after successful submission
        setFormData({
          accountNumber: '',
          accountHolderName: '',
          amount: '',
          currency: 'ETB',
        });
        setValidatedAccount(null);
        setAccountValidated(false);
        setAmountInWords('');
        setSignature(''); // Reset signature
        
        navigate('/form/cash-deposit/cashdepositconfirmation', {
          state: {
            serverData: response,
            branchName: branch.name,
            ui: { ...formData, telephoneNumber: phone },
            tokenNumber: response.data?.tokenNumber,
            queueNumber: response.data?.queueNumber,
          }
        });
      }
    } catch (error: any) {
      showError(error?.message || `Submission failed. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Steps
  const renderStep1 = () => (
    <div className="space-y-6">
      <AccountSelector
        accounts={[]} // Pass empty array to disable dropdown
        selectedAccount={formData.accountNumber}
        onAccountChange={handleAccountChange}
        onAccountValidation={handleAccountValidation}
        error={errors.accountNumber}
        allowManualEntry={true}
      />
      
      {/* Show account holder name field when we have a validated account */}
      {accountValidated && validatedAccount && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Holder Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={validatedAccount.accountHolderName}
            readOnly
            className="w-full p-3 rounded-lg border border-fuchsia-300 bg-gradient-to-r from-amber-50 to-fuchsia-50"
          />
          {errors.accountHolderName && (
            <p className="mt-1 text-sm text-red-600">{errors.accountHolderName}</p>
          )}
        </div>
      )}

      {/* Show amount field only after account is validated */}
      {accountValidated && validatedAccount && (
        <AmountInput
          value={formData.amount}
          onChange={handleAmountChange}
          currency={formData.currency}
          onCurrencyChange={validatedAccount?.isDiaspora ? handleCurrencyChange : undefined}
          currencies={getCurrencyOptions()}
          error={errors.amount}
          showConversion={validatedAccount?.isDiaspora && formData.currency !== 'ETB'}
          convertedAmount={convertAmount(formData.amount, formData.currency)}
        />
      )}

      {/* Amount in Words Display - only show when we have a validated amount */}
      {accountValidated && amountInWords && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-sm font-medium text-amber-800 mb-1">Amount in Words:</div>
          <div className="text-amber-900 font-semibold">{amountInWords}</div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
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
          <span className="font-medium text-fuchsia-800">Amount:</span>
          <span className="text-lg font-bold text-fuchsia-700">
            {Number(formData.amount).toLocaleString()} {formData.currency}
            {validatedAccount?.isDiaspora && formData.currency !== 'ETB' && (
              <div className="text-sm font-normal">
                ({convertAmount(formData.amount, formData.currency)} ETB)
              </div>
            )}
          </span>
        </div>
        {amountInWords && (
          <div className="flex justify-between items-start py-2">
            <span className="font-medium text-fuchsia-800">Amount in Words:</span>
            <span className="text-sm font-semibold text-fuchsia-900 text-right">{amountInWords}</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <SignatureStep 
        onSignatureComplete={handleSignatureComplete}
        onSignatureClear={handleSignatureClear}
        error={signatureError}
      />
    </div>
  );

  return (
    <FormLayout
      title="Cash Deposit"
      phone={phone}
      branchName={branch?.name}
      loading={loadingAccounts}
      error={errorAccounts}
    >
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <StepNavigation
          currentStep={step}
          totalSteps={3} // Changed from 2 to 3 steps
          onNext={isLast ? handleSubmit : handleNext}
          onBack={prev}
          nextLabel={isLast ? 'Submit Deposit' : 'Continue'}
          nextDisabled={isLast && isSubmitting}
          nextLoading={isLast && isSubmitting}
          hideBack={isFirst}
        />
      </form>
    </FormLayout>
  );
}
