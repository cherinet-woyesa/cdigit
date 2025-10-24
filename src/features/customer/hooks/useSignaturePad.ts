
// features/customer/hooks/useSignaturePad.ts
import { useRef, useState, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';

export function useSignaturePad() {
    const signaturePadRef = useRef<SignatureCanvas>(null);
    const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);

    const handleSignatureEnd = useCallback(() => {
        if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
            setIsSignatureEmpty(false);
        }
    }, []);

    const handleSignatureClear = useCallback(() => {
        if (signaturePadRef.current) {
            signaturePadRef.current.clear();
            setIsSignatureEmpty(true);
        }
    }, []);

    const getSignatureData = useCallback(() => {
        if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
            return signaturePadRef.current.toDataURL();
        }
        return null;
    }, []);

    return {
        signaturePadRef,
        isSignatureEmpty,
        handleSignatureEnd,
        handleSignatureClear,
        getSignatureData,
    };
}
