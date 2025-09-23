import React from "react";
import Field from "../../../../components/Field";

export interface StepSignatureProps {
  formData: any;
  errors: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const StepSignature: React.FC<StepSignatureProps> = ({ formData, errors, onChange }) => {
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
      </div>
    </div>
  );
};

export default StepSignature;
