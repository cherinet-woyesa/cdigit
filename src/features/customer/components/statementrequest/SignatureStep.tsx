// features/customer/components/statementrequest/SignatureStep.tsx
import React from 'react';
import { SignatureStep as BaseSignatureStep } from '@features/customer/components/SignatureStep';

interface SignatureStepProps {
  signaturePadRef: React.RefObject<any>;
  onEnd: () => void;
  onClear: () => void;
  isSignatureEmpty: boolean;
  error?: string;
}

export default function SignatureStep({ 
  signaturePadRef, 
  onEnd, 
  onClear, 
  isSignatureEmpty, 
  error 
}: SignatureStepProps) {
  return (
    <BaseSignatureStep 
      onSignatureComplete={(signatureData) => {
        // Handle signature completion
      }}
      onSignatureClear={onClear}
      error={error}
    />
  );
}