import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, CheckCircle2 } from 'lucide-react';

interface SignatureStepProps {
  onSignatureComplete: (signatureData: string) => void;
  onSignatureClear: () => void;
  initialSignature?: string;
  error?: string;
}

export function SignatureStep({ 
  onSignatureComplete, 
  onSignatureClear, 
  initialSignature,
  error 
}: SignatureStepProps) {
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);

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
      onSignatureComplete(signatureData);
    }
  };

  const handleSignatureClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsSignatureEmpty(true);
      onSignatureClear();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-50 to-fuchsia-50 rounded-lg p-4 border border-fuchsia-200">
        <h2 className="text-lg font-bold text-fuchsia-800 mb-2">Digital Signature</h2>
        <p className="text-sm text-fuchsia-700 mb-4">
          Please provide your signature using your finger or stylus. This signature will be used to authorize your transaction.
        </p>
        
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4">
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
              onClick={handleSignatureClear}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Eraser className="h-4 w-4" />
              Clear Signature
            </button>
            
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
        
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}