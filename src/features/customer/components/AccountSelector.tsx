// components/AccountSelector.tsx
import { useState } from 'react';
import { Search, Loader2, CheckCircle, XCircle } from 'lucide-react';
import accountService from '../../../services/accountsService';

interface Account {
  accountNumber: string;
  accountHolderName: string;
  isDiaspora?: boolean;
  accountType?: string;
  phoneNumber?: string;
}

interface AccountSelectorProps {
  accounts?: Account[];
  selectedAccount: string;
  onAccountChange: (accountNumber: string, accountHolderName?: string) => void;
  onAccountValidation?: (account: Account | null) => void;
  onPhoneNumberFetched?: (phoneNumber: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  allowManualEntry?: boolean;
}

export function AccountSelector({
  accounts = [],
  selectedAccount,
  onAccountChange,
  onAccountValidation,
  onPhoneNumberFetched,
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

  const fetchPhoneNumber = async (accountNumber: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn('No authentication token found, skipping phone number fetch');
        return null;
      }
      
      const response = await accountService.getPhoneByAccountNumber(accountNumber, token);
      if (response.success && response.data) {
        onPhoneNumberFetched?.(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch phone number:', error);
      return null;
    }
  };

  const handleSearchAccount = async () => {
    if (!manualAccount.trim()) return;

    setIsSearching(true);
    setValidationResult(null);
    setSearchedAccount(null);

    try {
      const response = await fetch(`http://localhost:5268/api/Accounts/AccountNumExist/${manualAccount.trim()}`);
      const result = await response.json();

      setValidationResult(result);

      if (result.success && result.data) {
        const accountData = result.data;
        const validatedAccount: Account = {
          accountNumber: accountData.accountNumber,
          accountHolderName: accountData.accountHolderName,
          isDiaspora: accountData.isDiaspora,
          accountType: accountData.typeOfAccount || accountData.TypeOfAccount,
          phoneNumber: accountData.phoneNumber // Use phone number from the main account response
        };
        setSearchedAccount(validatedAccount);
        onAccountValidation?.(validatedAccount);
        onAccountChange(manualAccount, accountData.accountHolderName);
        
        // If phone number is already in the account data, use it
        if (accountData.phoneNumber) {
          onPhoneNumberFetched?.(accountData.phoneNumber);
        } else {
          // Only try to fetch phone number if it's not in the main response
          console.log('Phone number not in main response, trying dedicated endpoint...');
          await fetchPhoneNumber(accountData.accountNumber);
        }
      } else {
        onAccountValidation?.(null);
        onAccountChange(manualAccount, '');
      }
    } catch (error: any) {
      setValidationResult({
        success: false,
        message: error.message || 'Failed to validate account'
      });
      onAccountValidation?.(null);
      onAccountChange(manualAccount, '');
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualAccountChange = (value: string) => {
    setManualAccount(value);
    if (validationResult) {
      setValidationResult(null);
      setSearchedAccount(null);
    }
    if (selectedAccount) {
      onAccountChange('', '');
    }
  };

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
                  {searchedAccount.phoneNumber && (
                    <div className="text-green-600 font-medium">Phone: {searchedAccount.phoneNumber}</div>
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

  if (accounts.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No accounts available
      </div>
    );
  }

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