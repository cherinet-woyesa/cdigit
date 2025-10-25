import { useState, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import signatureCryptoService, { type SignatureData, type VoucherData } from '../../../services/signatureCryptoService';

export function useSignature() {
  const { user } = useAuth();
  const [signatureData, setSignatureData] = useState<string>('');
  const [isSignatureValid, setIsSignatureValid] = useState<boolean>(false);
  const [signatureError, setSignatureError] = useState<string>('');

  const handleSignatureComplete = useCallback((signature: string) => {
    setSignatureData(signature);
    setIsSignatureValid(true);
    setSignatureError('');
  }, []);

  const handleSignatureClear = useCallback(() => {
    setSignatureData('');
    setIsSignatureValid(false);
    setSignatureError('');
  }, []);

  const bindSignatureToVoucher = useCallback(async (
    voucherData: VoucherData
  ) => {
    if (!signatureData) {
      setSignatureError('Signature is required');
      return null;
    }

    if (!user) {
      setSignatureError('User not authenticated');
      return null;
    }

    try {
      const signatureDataObj: SignatureData = {
        signatureDataUrl: signatureData,
        userId: user.id,
        userRole: user.role,
        timestamp: new Date(),
      };

      const boundSignature = await signatureCryptoService.bindSignatureToVoucher(
        signatureDataObj,
        voucherData,
        'customer'
      );

      return boundSignature;
    } catch (error) {
      console.error('Failed to bind signature:', error);
      setSignatureError(
        error instanceof Error ? error.message : 'Failed to bind signature to voucher'
      );
      return null;
    }
  }, [signatureData, user]);

  return {
    signatureData,
    isSignatureValid,
    signatureError,
    handleSignatureComplete,
    handleSignatureClear,
    bindSignatureToVoucher,
  };
}