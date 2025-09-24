import React from "react";
import Field from "../../../../components/Field";

export interface StepSignatureProps {
  formData: any;
  errors: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onRequestOtp: () => void;
  onVerifyOtp: () => void;
  otpVerified: boolean;
  otpLoading: boolean;
  otpMessage: string;
  otpError: string;
}

const StepSignature: React.FC<StepSignatureProps> = ({ formData, errors, onChange, onRequestOtp, onVerifyOtp, otpVerified, otpLoading, otpMessage, otpError }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h2 className="text-lg font-semibold text-fuchsia-700 mb-4">Digital Signature</h2>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <p className="text-sm text-gray-500 mb-4">
          Please sign in the box below using your mouse or touch screen
        </p>
        <div className="bg-white border border-gray-300 rounded h-40 mb-4 flex items-center justify-center">
          {/* Signature pad goes here */}
        </div>
        <Field label="Digital Signature *" error={errors.digitalSignature}>
          <input
            type="text"
            name="digitalSignature"
            value={formData.digitalSignature}
            onChange={onChange}
            className="w-full px-3 py-2 border rounded"
          />
        </Field>
        <div className="mt-4 text-left">
          <Field label="OTP Code *" error={errors.otpCode}>
            <input
              type="text"
              name="otpCode"
              value={formData.otpCode}
              onChange={onChange}
              className="w-full px-3 py-2 border rounded"
            />
          </Field>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onRequestOtp}
              disabled={otpLoading}
              className="px-3 py-2 bg-fuchsia-700 text-white rounded disabled:opacity-50"
            >
              {otpLoading ? 'Sending...' : 'Request OTP'}
            </button>
            <button
              type="button"
              onClick={onVerifyOtp}
              disabled={otpLoading || !formData.otpCode}
              className="px-3 py-2 bg-gray-200 text-fuchsia-800 rounded disabled:opacity-50"
            >
              {otpLoading ? 'Verifying...' : (otpVerified ? 'Verified' : 'Verify OTP')}
            </button>
          </div>
          {(otpMessage || otpError) && (
            <div className="mt-2 text-sm">
              {otpMessage && <p className="text-green-600">{otpMessage}</p>}
              {otpError && <p className="text-red-600">{otpError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepSignature;
