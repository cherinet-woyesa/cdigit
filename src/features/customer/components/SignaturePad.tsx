
// features/customer/components/SignaturePad.tsx
import React, { forwardRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, CheckCircle2 } from 'lucide-react';

interface SignaturePadProps {
    onEnd: () => void;
    onClear: () => void;
    isSignatureEmpty: boolean;
    error?: string;
}

export const SignaturePad = forwardRef<SignatureCanvas, SignaturePadProps>(({ onEnd, onClear, isSignatureEmpty, error }, ref) => {
    return (
        <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                Digital Signature
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-700">
                    Please provide your signature using your finger or stylus. This signature will be used to authorize your transaction.
                </p>
            </div>
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="bg-gray-100 rounded-lg p-2 mb-4">
                    <SignatureCanvas
                        ref={ref}
                        onEnd={onEnd}
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
                        onClick={onClear}
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
                {error && (
                    <span className="text-red-500 text-xs mt-2">{error}</span>
                )}
            </div>
        </div>
    );
});
export default SignaturePad;
