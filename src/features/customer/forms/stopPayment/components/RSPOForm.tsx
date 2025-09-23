import React from 'react';
import type { RSPOFormData } from '../types';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CheckCircle2, Search, Loader2, AlertCircle } from 'lucide-react';
import type { SubmitHandler } from 'react-hook-form';
import type { StopPaymentOrder } from '../../../../../services/stopPaymentService';

interface RSPOFormProps {
  onSubmit: SubmitHandler<RSPOFormData>;
  isLoading: boolean;
  searchResults: StopPaymentOrder[];
  selectedSpo: StopPaymentOrder | null;
  onSelectSpo: (spo: StopPaymentOrder) => void;
  onSearch: (searchTerm: string) => void;
  signature: string;
  onSignatureCapture: () => void;
}

export const rspoSchema: yup.ObjectSchema<RSPOFormData> = yup.object({
  searchTerm: yup.string().required('Please enter a search term'),
  selectedSpoId: yup.string().required('Please select a stop payment order to revoke'),
  termsAccepted: yup.boolean().oneOf([true], 'You must accept the terms and conditions').required('You must accept the terms and conditions'),
});

export const RSPOForm: React.FC<RSPOFormProps> = ({
  onSubmit,
  isLoading,
  searchResults,
  selectedSpo,
  onSelectSpo,
  onSearch,
  signature,
  onSignatureCapture,
}) => {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RSPOFormData>({
    resolver: yupResolver(rspoSchema),
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('searchTerm', value);
    onSearch(value);
  };

  const handleSpoSelect = (spo: StopPaymentOrder) => {
    onSelectSpo(spo);
    setValue('selectedSpoId', spo.id);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Search for Existing SPO */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Search for Stop Payment Order
          </h3>
          <div className="flex space-x-2">
            <Controller
              name="searchTerm"
              control={control}
              render={({ field }) => (
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...field}
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Search by Account Number or Cheque Number"
                      onChange={handleSearchChange}
                    />
                  </div>
                  {errors.searchTerm && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.searchTerm.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Search Results */}
          {isLoading ? (
            <div className="mt-4 flex justify-center">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-500">
                {searchResults.length} active stop payment order(s) found
              </p>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Select
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Cheque #
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Amount
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Date Created
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {searchResults.map((spo) => (
                      <tr
                        key={spo.id}
                        className={`cursor-pointer ${
                          selectedSpo?.id === spo.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleSpoSelect(spo)}
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <input
                            type="radio"
                            name="selectedSpo"
                            checked={selectedSpo?.id === spo.id}
                            onChange={() => handleSpoSelect(spo)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {spo.chequeNumber}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ETB {spo.amount?.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(spo.dateCreated).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          <div className="line-clamp-1">{spo.reason}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {errors.selectedSpoId && !selectedSpo && (
                <p className="mt-1 text-sm text-red-600">
                  Please select a stop payment order to revoke
                </p>
              )}
            </div>
          ) : control._formValues.searchTerm ? (
            <div className="mt-4 text-center py-8 bg-gray-50 rounded-lg">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No stop payment orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No active stop payment orders match your search criteria.
              </p>
            </div>
          ) : null}
        </div>

        {/* Selected SPO Details */}
        {selectedSpo && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Selected Stop Payment Order
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Account Number</p>
                <p className="font-medium">{selectedSpo.accountNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cheque Number</p>
                <p className="font-medium">{selectedSpo.chequeNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">ETB {selectedSpo.amount?.toLocaleString()}</p>
              </div>
              <div className="md:col-span-3">
                <p className="text-sm text-gray-500">Reason for Stop Payment</p>
                <p className="font-medium">{selectedSpo.reason}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date Created</p>
                <p className="font-medium">
                  {new Date(selectedSpo.dateCreated).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{selectedSpo.status}</p>
              </div>
            </div>

            {/* Signature for RSPO */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digital Signature (Required for Revocation)
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
                    className="w-full py-8 bg-white hover:bg-gray-50 rounded-md border-2 border-dashed border-gray-300 text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-sm">Click to sign</span>
                      <span className="text-xs text-gray-400 mt-1">
                        Your signature is required to revoke this stop payment order
                      </span>
                    </div>
                  </button>
                )}
              </div>
              {/* No signatureData error, handled by disabling submit button */}
            </div>

            {/* Terms and Conditions for RSPO */}
            <div className="mt-6">
              <Controller
                name="termsAccepted"
                control={control}
                render={({ field }) => (
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                          id="rspo-terms"
                          type="checkbox"
                          className="h-4 w-4 text-fuchsia-600 focus:ring-fuchsia-500 border-gray-300 rounded"
                          checked={!!field.value}
                          onChange={e => field.onChange(e.target.checked)}
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          disabled={field.disabled}
                        />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="rspo-terms" className="font-medium text-gray-700">
                        I acknowledge that revoking this stop payment order will make the
                        cheque payable again. I understand that I am responsible for any
                        transactions made with this cheque after revocation.
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
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          Cancel
        </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-fuchsia-700 hover:bg-fuchsia-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 disabled:opacity-50"
            disabled={isLoading || !selectedSpo || !signature}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              'Revoke Stop Payment Order'
            )}
          </button>
      </div>
    </form>
  );
};
