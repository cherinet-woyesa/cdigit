
// features/customer/components/stoppayment/SignatureStep.tsx
import React from 'react';
import SignaturePad from '../SignaturePad';

export default function SignatureStep({ signaturePadRef, onEnd, onClear, isSignatureEmpty, error }) {
    return (
        <div>
            <SignaturePad 
                ref={signaturePadRef} 
                onEnd={onEnd} 
                onClear={onClear} 
                isSignatureEmpty={isSignatureEmpty} 
                error={error} 
            />
        </div>
    );
}
