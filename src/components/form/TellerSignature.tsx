/**
 * Teller Signature Component
 * For capturing and binding teller signatures to vouchers
 */

import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { PenTool, Eraser, CheckCircle, AlertCircle } from 'lucide-react';
import signatureCryptoService, { type VoucherData, type SignatureData } from '@services/signatureCryptoService';
import { useAuth } from '@context/AuthContext';

interface TellerSignatureProps {
  /** Voucher data to bind signature to */
  voucherData: VoucherData;
  /** Callback when signature is successfully bound */
  onSignatureBound?: (boundSignature: any) => void;
  /** Show/hide component */
  isOpen?: boolean;
  /** Label for the signature section */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Disable signature capture */
  disabled?: boolean;
  /** Optional existing signature (for review) */
  existingSignature?: string;
  /** Callback for signature change */
  onSignatureChange?: (signatureDataUrl: string | null) => void;
}

const TellerSignature: React.FC<TellerSignatureProps> = ({
  voucherData,
  onSignatureBound,
  isOpen = true,
  label = 'Teller Signature',
  error,
  disabled = false,
  existingSignature,
  onSignatureChange,
}) => {
  const signaturePadRef = useRef<SignatureCanvas | null>(null);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);
  const [isBinding, setIsBinding] = useState(false);
  const [bindingSuccess, setBindingSuccess] = useState(false);
  const [bindingError, setBindingError] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    // Load existing signature if provided
    if (existingSignature && signaturePadRef.current) {
      signaturePadRef.current.fromDataURL(existingSignature);
      setIsSignatureEmpty(false);
    }
  }, [existingSignature]);

  const handleSignatureEnd = () => {
    if (signaturePadRef.current) {
      const isEmpty = signaturePadRef.current.isEmpty();
      setIsSignatureEmpty(isEmpty);
      
      if (!isEmpty && onSignatureChange) {
        const dataUrl = signaturePadRef.current.toDataURL();
        onSignatureChange(dataUrl);
      }
    }
  };

  const handleClearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsSignatureEmpty(true);
      setBindingSuccess(false);
      setBindingError('');
      if (onSignatureChange) {
        onSignatureChange(null);
      }
    }
  };

  const handleBindSignature = async () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      setBindingError('Please provide a signature first');
      return;
    }

    if (!user) {
      setBindingError('User not authenticated');
      return;
    }

    setIsBinding(true);
    setBindingError('');
    setBindingSuccess(false);

    try {
      // Get signature data
      const signatureDataUrl = signaturePadRef.current.toDataURL();

      // Create signature data object
      const signatureData: SignatureData = {
        signatureDataUrl,
        userId: user.id,
        userRole: user.role,
        timestamp: new Date(),
      };

      // Bind signature to voucher
      const boundSignature = await signatureCryptoService.bindSignatureToVoucher(
        signatureData,
        voucherData,
        'teller'
      );

      setBindingSuccess(true);

      // Callback with bound signature
      if (onSignatureBound) {
        onSignatureBound(boundSignature);
      }

      console.log('Signature successfully bound:', {
        signatureHash: boundSignature.binding.signatureHash.substring(0, 16) + '...',
        voucherHash: boundSignature.binding.voucherHash.substring(0, 16) + '...',
        bindingHash: boundSignature.binding.bindingHash.substring(0, 16) + '...',
      });
    } catch (error) {
      console.error('Failed to bind signature:', error);
      setBindingError(
        error instanceof Error ? error.message : 'Failed to bind signature to voucher'
      );
    } finally {
      setIsBinding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center text-xs font-semibold text-gray-700">
          <PenTool className="h-3 w-3 mr-1 text-fuchsia-600" />
          {label}
          <span className="text-red-500 ml-1">*</span>
        </label>
        {bindingSuccess && (
          <div className="flex items-center text-green-600 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            <span>Bound</span>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2">
        <p className="text-xs text-blue-700">
          Sign using your mouse or stylus to authorize this transaction.
        </p>
      </div>

      {/* Signature Canvas */}
      <div className={`bg-white border-2 ${error ? 'border-red-300' : 'border-gray-300'} rounded-lg p-2`}>
        <div className="bg-gray-50 rounded-lg p-1 mb-2">
          <SignatureCanvas
            ref={signaturePadRef}
            onEnd={handleSignatureEnd}
            canvasProps={{
              className: 'w-full h-24 bg-white border border-gray-200 rounded-md cursor-crosshair',
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClearSignature}
            disabled={disabled || isSignatureEmpty}
            className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 text-xs"
          >
            <Eraser className="h-3 w-3" />
            Clear
          </button>
          <button
            type="button"
            onClick={handleBindSignature}
            disabled={disabled || isSignatureEmpty || isBinding || bindingSuccess}
            className="flex-1 px-3 py-1.5 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 text-xs"
          >
            {isBinding ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                Binding...
              </>
            ) : bindingSuccess ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Bound
              </>
            ) : (
              <>
                <PenTool className="h-3 w-3" />
                Bind
              </>
            )}
          </button>
        </div>

        {/* Signature Status */}
        <div className="mt-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            {isSignatureEmpty ? (
              <span className="text-gray-400">No signature</span>
            ) : (
              <span className="text-gray-700 font-medium flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Captured
              </span>
            )}
          </div>
          {bindingSuccess && (
            <span className="text-xs text-green-600 font-medium">
              ✓ Secured
            </span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {(error || bindingError) && (
        <div className="mt-2 flex items-start gap-1 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg p-2">
          <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
          <span>{error || bindingError}</span>
        </div>
      )}

      {/* User Info */}
      {user && (
        <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
          <span>Teller: {user.firstName} {user.lastName}</span>
        </div>
      )}
    </div>
  );
};

export default TellerSignature;
