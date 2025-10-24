// components/AccountSelector.tsx
import { useState, useEffect } from 'react';
import { depositService } from '../../../services/depositService';
import { Search, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface Account {
  accountNumber: string;
  accountHolderName: string;
  isDiaspora?: boolean;
  accountType?: string;
}

interface AccountSelectorProps {
  accounts?: Account[]; // Make accounts optional
  selectedAccount: string;
  onAccountChange: (accountNumber: string, accountHolderName?: string) => void;
  onAccountValidation?: (account: Account | null) => void;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  allowManualEntry?: boolean;
}

export function AccountSelector({
  accounts = [], // Default to empty array
  selectedAccount,
  onAccountChange,
  onAccountValidation,
  label = "Account Number",
  required = true,
  error,
  disabled = false,
  allowManualEntry = true
}: AccountSelectorProps) {
  const [manualAccount, setManualAccount] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [searchedAccount, setSearchedAccount] = useState<Account | null>(null);

  const handleSearchAccount = async () => {
    if (!manualAccount.trim()) return;

    setIsSearching(true);
    setValidationResult(null);
    setSearchedAccount(null);

    try {
      const result = await depositService.validateAccount(manualAccount);
      setValidationResult(result);

      // Check if validation was successful
      // The apiClient extracts the data property, so we check if result has accountHolderName directly
      if (result && (result as any).success === true) {
        // If it's an ApiResponse structure with data property
        const accountData = (result as any).data || result;
        
        if (accountData.accountHolderName) {
          const validatedAccount: Account = {
            accountNumber: accountData.accountNumber,
            accountHolderName: accountData.accountHolderName,
            isDiaspora: accountData.isDiaspora,
            accountType: accountData.typeOfAccount || accountData.TypeOfAccount
          };
          setSearchedAccount(validatedAccount);
          onAccountValidation?.(validatedAccount);
          
          // Auto-fill the account in parent form with holder name
          onAccountChange(manualAccount, accountData.accountHolderName);
        } else {
          onAccountValidation?.(null);
          onAccountChange(manualAccount, ''); // Clear holder name if validation fails
        }
      } else if (result && (result as any).accountHolderName) {
        // Direct account data (no success property)
        const accountData = result as any;
        const validatedAccount: Account = {
          accountNumber: accountData.accountNumber,
          accountHolderName: accountData.accountHolderName,
          isDiaspora: accountData.isDiaspora,
          accountType: accountData.typeOfAccount || accountData.TypeOfAccount
        };
        setSearchedAccount(validatedAccount);
        onAccountValidation?.(validatedAccount);
        
        // Auto-fill the account in parent form with holder name
        onAccountChange(manualAccount, accountData.accountHolderName);
      } else {
        onAccountValidation?.(null);
        onAccountChange(manualAccount, ''); // Clear holder name if validation fails
      }
    } catch (error: any) {
      setValidationResult({
        success: false,
        message: error.message || 'Failed to validate account'
      });
      onAccountValidation?.(null);
      onAccountChange(manualAccount, ''); // Clear holder name on error
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualAccountChange = (value: string) => {
    setManualAccount(value);
    // Clear validation results when user starts typing again
    if (validationResult) {
      setValidationResult(null);
      setSearchedAccount(null);
    }
    // Also clear any selected account and holder name
    if (selectedAccount) {
      onAccountChange('', '');
    }
  };

  const handleUseDifferentAccount = () => {
    setManualAccount('');
    setValidationResult(null);
    setSearchedAccount(null);
    onAccountChange('', '');
    onAccountValidation?.(null);
  };

  // Always show manual entry when allowManualEntry is true, regardless of accounts
  if (allowManualEntry) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={manualAccount}
              onChange={(e) => handleManualAccountChange(e.target.value)}
              disabled={disabled || isSearching}
              placeholder="Enter account number"
              className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-white transition-colors duration-200"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchAccount();
                }
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleSearchAccount}
            disabled={!manualAccount.trim() || isSearching || disabled}
            className="px-4 py-3 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search
          </button>
        </div>

        {/* Validation Result - Show account holder details here instead of separate field */}
        {validationResult && validationResult.message && (
          <div className={`mt-3 p-3 rounded-lg border ${
            validationResult.success === true ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
          }`}>
            <div className="flex items-center gap-2">
              {validationResult.success === true ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                validationResult.success === true ? 'text-green-800' : 'text-red-800'
              }`}>
                {validationResult.message}
              </span>
            </div>
            
            {validationResult.success === true && searchedAccount && (
              <div className="mt-2 p-2 bg-white rounded border border-green-200">
                <div className="text-sm text-gray-700">
                  <div className="font-semibold">Account Holder: {searchedAccount.accountHolderName}</div>
                  {searchedAccount.accountType && (
                    <div className="text-gray-600">Type: {searchedAccount.accountType}</div>
                  )}
                  {searchedAccount.isDiaspora && (
                    <div className="text-blue-600 font-medium">Diaspora Account</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  // If no manual entry and no accounts, show empty state
  if (accounts.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No accounts available
      </div>
    );
  }

  // If we have accounts but manual entry is disabled, show dropdown
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <select
        value={selectedAccount}
        onChange={(e) => {
          const account = accounts.find(acc => acc.accountNumber === e.target.value);
          onAccountChange(e.target.value, account?.accountHolderName);
        }}
        disabled={disabled}
        className="w-full p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
      >
        <option value="">Select an account</option>
        {accounts.map(account => (
          <option key={account.accountNumber} value={account.accountNumber}>
            {account.accountNumber} - {account.accountHolderName} 
            {account.isDiaspora ? ' (Diaspora)' : ''}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
