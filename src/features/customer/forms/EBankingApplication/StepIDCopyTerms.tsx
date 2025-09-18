import React from 'react';

export type IDCopyTermsProps = {
  idCopyAttached: boolean;
  termsAccepted: boolean;
  errors: {
    termsAccepted?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showTerms: boolean;
  onShowTerms: (show: boolean) => void;
};

const StepIDCopyTerms: React.FC<IDCopyTermsProps> = ({ idCopyAttached, termsAccepted, errors, onChange, showTerms, onShowTerms }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h2 className="text-lg font-semibold text-fuchsia-700 mb-4">ID Copy & Terms</h2>
    <div className="flex items-start mb-4">
      <div className="flex items-center h-5">
        <input
          id="idCopyAttached"
          name="idCopyAttached"
          type="checkbox"
          checked={idCopyAttached}
          onChange={onChange}
          className="h-4 w-4 text-fuchsia-700 focus:ring-fuchsia-700 border-gray-300 rounded"
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor="idCopyAttached" className="font-medium text-gray-700">
          I have attached a copy of my ID
        </label>
        <p className="text-gray-500">
          If checked, you can skip the address information section
        </p>
      </div>
    </div>
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          id="termsAccepted"
          name="termsAccepted"
          type="checkbox"
          checked={termsAccepted}
          onChange={onChange}
          className="h-4 w-4 text-fuchsia-700 focus:ring-fuchsia-700 border-gray-300 rounded"
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor="termsAccepted" className="font-medium text-gray-700">
          I agree to the <button type="button" className="text-fuchsia-700 hover:text-fuchsia-800 underline" onClick={() => onShowTerms(true)}>Terms and Conditions</button> *
        </label>
        {errors.termsAccepted && (
          <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>
        )}
      </div>
    </div>
    {showTerms && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative">
          <h3 className="text-lg font-bold mb-2 text-fuchsia-700">Terms and Conditions</h3>
          <div className="text-sm text-gray-700 mb-4 max-h-64 overflow-y-auto">
            <p>By applying for E-Banking services, you agree to abide by the bank's policies and procedures. You are responsible for keeping your credentials secure. The bank is not liable for unauthorized access due to negligence. For full details, please contact your branch or visit our website.</p>
            <ul className="list-disc pl-5 mt-2">
              <li>Do not share your PIN or password with anyone.</li>
              <li>Report suspicious activity immediately.</li>
              <li>Service availability is subject to bank approval.</li>
              <li>Fees and charges may apply.</li>
            </ul>
          </div>
          <button type="button" className="absolute top-2 right-2 text-gray-500 hover:text-fuchsia-700" onClick={() => onShowTerms(false)}>&times;</button>
          <button type="button" className="mt-4 px-4 py-2 bg-fuchsia-700 text-white rounded hover:bg-fuchsia-800" onClick={() => onShowTerms(false)}>Close</button>
        </div>
      </div>
    )}
  </div>
);

export default StepIDCopyTerms;
