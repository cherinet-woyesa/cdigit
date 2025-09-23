import React, { useState } from 'react';
import type { SPOFormData, CustomerAccount } from '../types';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CheckCircle2 } from 'lucide-react';
import type { SubmitHandler } from 'react-hook-form';

interface SPOFormProps {
  onSubmit: SubmitHandler<SPOFormData>;
  isLoading: boolean;
  customerAccounts: CustomerAccount[];
  signature: string;
  onSignatureCapture: () => void;
}

export const spoSchema = yup.object().shape({
  accountNumber: yup.string().required('Account number is required'),
  chequeNumber: yup
    .string()
    .required('Cheque number is required')
    .matches(/^[0-9]+$/, 'Cheque number must be numeric'),
  amount: yup
    .string()
    .required('Amount is required')
    .matches(/^[0-9]+(\.[0-9]{1,2})?$/, 'Amount must be a valid number'),
  chequeDate: yup
    .string()
    .required('Cheque date is required'),
  reason: yup.string().required('Reason is required'),
  termsAccepted: yup.boolean().required().oneOf([true], 'You must accept the terms and conditions'),
});

export const SPOForm: React.FC<SPOFormProps> = ({
  onSubmit,
  isLoading,
  customerAccounts,
  signature,
  onSignatureCapture,
}) => {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
  } = useForm<SPOFormData>({
    resolver: yupResolver(spoSchema),
  });

  const [step, setStep] = useState(1);
  const accountNumber = watch('accountNumber');
  const selectedAccount = customerAccounts.find(acc => acc.accountNumber === accountNumber);

  // Step 1 validation (without signature/terms)
  const validateStep1 = async () => {
    // Only validate fields for step 1
    const valid = await trigger(['accountNumber', 'chequeNumber', 'amount', 'chequeDate', 'reason']);
    return valid;
  };

  // Step 2 validation (signature/terms)
  const validateStep2 = async () => {
    const valid = await trigger(['termsAccepted']);
    return valid && !!signature;
  };

  const handleNext = async () => {
    if (await validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => setStep(1);

  const handleFinalSubmit = async (data: SPOFormData) => {
    if (await validateStep2()) {
      onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFinalSubmit)} className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center">
          <div className={`h-8 w-8 flex items-center justify-center rounded-full border-2 ${step === 1 ? 'border-fuchsia-700 text-fuchsia-700' : 'border-fuchsia-300 text-fuchsia-300'} font-bold`}>1</div>
          <span className={`mx-2 w-8 border-t-2 ${step === 2 ? 'border-fuchsia-700' : 'border-fuchsia-300'}`}></span>
          <div className={`h-8 w-8 flex items-center justify-center rounded-full border-2 ${step === 2 ? 'border-fuchsia-700 text-fuchsia-700' : 'border-fuchsia-300 text-fuchsia-300'} font-bold`}>2</div>
        </div>
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Selection */}
          <div className="col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Account Information</h3>
            <div className="bg-fuchsia-50 p-4 rounded-lg">
              <Controller
                name="accountNumber"
                control={control}
                render={({ field }) => (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Account
                    </label>
                    <select
                      {...field}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500"
                      disabled={isLoading}
                    >
                      <option value="">Select an account</option>
                      {customerAccounts.map((account) => (
                        <option key={account.accountNumber} value={account.accountNumber}>
                          {account.accountNumber} - {account.accountType} ({account.currency} {account.balance?.toLocaleString()})
                        </option>
                      ))}
                    </select>
                    {errors.accountNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.accountNumber.message}
                      </p>
                    )}
                  </div>
                )}
              />

              {selectedAccount && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Account Holder</p>
                    <p className="font-medium">N/A</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Available Balance</p>
                    <p className="font-medium">
                      {selectedAccount.currency} {selectedAccount.balance?.toLocaleString() || '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Branch</p>
                    <p className="font-medium">N/A</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cheque Details */}
          <div className="col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Cheque Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Controller
                name="chequeNumber"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cheque Number
                    </label>
                    <input
                      type="text"
                      {...field}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500"
                      placeholder="Enter cheque number"
                    />
                    {errors.chequeNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.chequeNumber.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount ({selectedAccount?.currency || 'ETB'})
                    </label>
                    <input
                      type="number"
                      {...field}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.amount.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="chequeDate"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cheque Date
                    </label>
                    <input
                      type="date"
                      {...field}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500"
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {errors.chequeDate && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.chequeDate.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Reason */}
          <div className="col-span-2">
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Stop Payment
                  </label>
                  <textarea
                    {...field}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500"
                    placeholder="Please specify the reason for stopping payment on this cheque"
                  />
                  {errors.reason && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.reason.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 gap-6">
          {/* Digital Signature */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Digital Signature
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {signature ? (
                <div className="text-green-600">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2" />
                  <p>Signature captured</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onSignatureCapture}
                  className="w-full py-8 bg-gray-50 hover:bg-gray-100 rounded-md border-2 border-dashed border-gray-300 text-gray-500"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-sm">Click to sign</span>
                    <span className="text-xs text-gray-400 mt-1">
                      Your signature is required to process this request
                    </span>
                  </div>
                </button>
              )}
            </div>
            {/* No signatureData error in form state; handled by disabling submit button */}
          </div>

          {/* Terms and Conditions */}
          <div className="col-span-1">
            <Controller
              name="termsAccepted"
              control={control}
              render={({ field }) => (
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      type="checkbox"
                      className="h-4 w-4 text-fuchsia-600 focus:ring-fuchsia-500 border-gray-300 rounded"
                      checked={field.value}
                      onChange={e => field.onChange(e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="font-medium text-gray-700">
                      I acknowledge and accept the{' '}
                      <a href="#" className="text-fuchsia-700 hover:text-fuchsia-500">
                        Terms and Conditions
                      </a>{' '}
                      of the Stop Payment Order service. I understand that a fee may apply.
                    </label>
                    {errors.termsAccepted && (
                      <p className="mt-1 text-red-600">
                        {errors.termsAccepted.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-between space-x-3 pt-4 border-t border-gray-200">
        {step === 2 ? (
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500"
            disabled={isLoading}
          >
            Back
          </button>
        ) : (
          <div></div>
        )}
        {step === 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-fuchsia-700 hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 disabled:opacity-50"
            disabled={isLoading}
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-fuchsia-700 hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 disabled:opacity-50"
            disabled={isLoading || !signature}
          >
            {isLoading ? (
              <>
                <span className="animate-spin -ml-1 mr-2 h-4 w-4">⏳</span>
                Submitting...
              </>
            ) : (
              'Submit Stop Payment Order'
            )}
          </button>
        )}
      </div>
    </form>
  );
};
