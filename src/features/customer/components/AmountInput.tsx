// components/AmountInput.tsx
import { useState } from 'react';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currency: string;
  onCurrencyChange?: (currency: string) => void;
  currencies?: Array<{ code: string; name: string }>;
  label?: string;
  required?: boolean;
  error?: string;
  showConversion?: boolean;
  convertedAmount?: string;
}

export function AmountInput({
  value,
  onChange,
  currency,
  onCurrencyChange,
  currencies = [],
  label = "Amount",
  required = true,
  error,
  showConversion = false,
  convertedAmount
}: AmountInputProps) {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow only numbers and decimal point
    const sanitizedValue = inputValue.replace(/[^\d.]/g, '');
    const parts = sanitizedValue.split('.');
    
    // Prevent multiple decimal points
    if (parts.length > 2) return;
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) return;
    
    onChange(sanitizedValue);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-fuchsia-700 font-medium">{currency}</span>
          </div>
          <input
            type="text"
            value={value}
            onChange={handleAmountChange}
            placeholder="0.00"
            className="w-full p-3 pl-16 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
          />
        </div>
        
        {onCurrencyChange && currencies.length > 0 && (
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value)}
            className="w-24 p-3 rounded-lg border border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-700 focus:border-fuchsia-700 bg-gradient-to-r from-amber-50 to-fuchsia-50 transition-colors duration-200"
          >
            {currencies.map(curr => (
              <option key={curr.code} value={curr.code}>
                {curr.code}
              </option>
            ))}
          </select>
        )}
      </div>
      
      {showConversion && convertedAmount && (
        <div className="mt-2 text-sm text-fuchsia-700">
          Equivalent ETB Amount: {convertedAmount} ETB
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}