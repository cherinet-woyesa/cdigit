import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import { useSignature } from '@features/customer/hooks/useSignature';
import signatureCryptoService from '@services/signatureCryptoService';

interface SecureSignatureStepProps {
  onSignatureBound: (boundSignature: any) => void;
  onSignatureClear: () => void;
  initialSignature?: string;
  voucherData: any;
  error?: string;
}

export function SecureSignatureStep({ 
  onSignatureBound, 
  onSignatureClear, 
  initialSignature,
  voucherData,
  error 
}: SecureSignatureStepProps) {
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);
  const [isBinding, setIsBinding] = useState(false);
  const [bindingSuccess, setBindingSuccess] = useState(false);
  const [bindingError, setBindingError] = useState('');
  const { handleSignatureComplete, handleSignatureClear } = useSignature();

  useEffect(() => {
    // Load existing signature if provided
    if (initialSignature && signaturePadRef.current) {
      signaturePadRef.current.fromDataURL(initialSignature);
      setIsSignatureEmpty(false);
    }
  }, [initialSignature]);

  const handleSignatureEnd = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      setIsSignatureEmpty(false);
      const signatureData = signaturePadRef.current.toDataURL();
      handleSignatureComplete(signatureData);
    }
  };

  const handleClearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsSignatureEmpty(true);
      setBindingSuccess(false);
      setBindingError('');
      handleSignatureClear();
      onSignatureClear();
    }
  };

  const handleBindSignature = async () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      setBindingError('Please provide a signature first');
      return;
    }

    setIsBinding(true);
    setBindingError('');

    try {
      // Get signature data
      const signatureDataUrl = signaturePadRef.current.toDataURL();
      
      // Create signature data object
      const signatureData = {
        signatureDataUrl,
        userId: 'customer', // In a real implementation, this would come from auth context
        userRole: 'customer',
        timestamp: new Date(),
      };

      // Bind signature to voucher
      const boundSignature = await signatureCryptoService.bindSignatureToVoucher(
        signatureData,
        voucherData,
        'customer'
      );

      setBindingSuccess(true);
      onSignatureBound(boundSignature);
    } catch (error) {
      console.error('Failed to bind signature:', error);
      setBindingError(
        error instanceof Error ? error.message : 'Failed to bind signature to voucher'
      );
    } finally {
      setIsBinding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 border border-fuchsia-200">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-fuchsia-700" />
          <h2 className="text-lg font-bold text-fuchsia-800">Secure Digital Signature</h2>
        </div>
        <p className="text-sm text-fuchsia-700 mb-4">
          Please provide your signature. This signature will be cryptographically bound to your transaction for security.
        </p>
        
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-700">
              Sign using your finger or stylus to authorize this transaction. Your signature will be securely bound to this transaction.
            </p>
          </div>

          <div className="bg-gray-100 rounded-lg p-2 mb-4">
            <SignatureCanvas
              ref={signaturePadRef}
              onEnd={handleSignatureEnd}
              canvasProps={{
                className: "w-full h-48 bg-white border border-gray-300 rounded-md cursor-crosshair"
              }}
              penColor="black"
              backgroundColor="white"
              clearOnResize={false}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleClearSignature}
              disabled={isBinding}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <Eraser className="h-4 w-4" />
              Clear Signature
            </button>
            
            <div className="flex items-center gap-3">
              {bindingSuccess && (
                <div className="flex items-center text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  <span>Bound</span>
                </div>
              )}
              <div className="text-sm text-gray-500">
                {!isSignatureEmpty ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Signature provided
                  </span>
                ) : (
                  <span className="text-gray-400">
                    No signature provided
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {bindingError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{bindingError}</span>
          </div>
        )}
        
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}