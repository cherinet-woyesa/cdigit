/**
 * PIN Input Component
 * Secure PIN entry with masked input
 */

import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';

interface PINInputProps {
  length?: number;
  value: string;
  onChange: (pin: string) => void;
  onComplete?: (pin: string) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
  autoFocus?: boolean;
  className?: string;
}

const PINInput: React.FC<PINInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
  disabled = false,
  label = 'Enter PIN',
  autoFocus = false,
  className = '',
}) => {
  const [showPIN, setShowPIN] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    // Auto-submit when PIN is complete
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  const handleChange = (index: number, digit: string) => {
    if (disabled) return;

    // Only allow digits
    const newDigit = digit.replace(/\D/g, '').slice(0, 1);
    
    const newPIN = value.split('');
    newPIN[index] = newDigit;
    const updatedPIN = newPIN.join('').slice(0, length);
    
    onChange(updatedPIN);

    // Auto-focus next input
    if (newDigit && index < length - 1) {
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 10);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move to previous input if current is empty
        setTimeout(() => inputRefs.current[index - 1]?.focus(), 10);
      } else {
        // Clear current digit
        const newPIN = value.split('');
        newPIN[index] = '';
        onChange(newPIN.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    
    if (pastedData) {
      onChange(pastedData);
      const focusIndex = Math.min(pastedData.length, length - 1);
      setTimeout(() => inputRefs.current[focusIndex]?.focus(), 10);
    }
  };

  const digits = value.padEnd(length, '').split('');

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Lock className="h-4 w-4 mr-1 text-fuchsia-600" />
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowPIN(!showPIN)}
          className="text-sm text-fuchsia-600 hover:text-fuchsia-700 flex items-center gap-1"
          disabled={disabled}
        >
          {showPIN ? (
            <>
              <EyeOff className="h-4 w-4" />
              <span>Hide</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              <span>Show</span>
            </>
          )}
        </button>
      </div>

      {/* PIN Input Grid */}
      <div 
        className={`grid gap-2 ${length === 4 ? 'grid-cols-4' : length === 5 ? 'grid-cols-5' : 'grid-cols-6'}`}
        onPaste={handlePaste}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type={showPIN ? 'tel' : 'password'}
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            className={`
              w-full h-12 text-center text-lg font-bold
              border-2 rounded-lg
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-fuchsia-200
              ${error 
                ? 'border-red-500 bg-red-50 text-red-900' 
                : digit 
                  ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-900' 
                  : 'border-gray-300 bg-white text-gray-900'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
              ${focused && !error ? 'border-fuchsia-500' : ''}
            `}
            aria-label={`PIN digit ${index + 1}`}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-start gap-1 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Security Note */}
      <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
        <Lock className="h-3 w-3" />
        <span>Your PIN is encrypted and never stored in plain text</span>
      </div>
    </div>
  );
};

export default PINInput;
