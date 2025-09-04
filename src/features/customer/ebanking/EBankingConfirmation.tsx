import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, PrinterIcon, PencilIcon } from '@heroicons/react/24/outline';

type FormData = {
  formReferenceId: string;
  branchName: string;
  accountNumber: string;
  customerName: string;
  mobileNumber: string;
  ebankingChannels: string[];
  submittedAt: string;
};

const E_BANKING_OPTIONS = [
  { id: 'mobile_banking', label: 'Mobile Banking' },
  { id: 'internet_banking', label: 'Internet Banking' },
  { id: 'ussd', label: 'USSD Banking' },
  { id: 'card_banking', label: 'Card Banking' },
];

export default function EBankingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { formData, windowNumber } = location.state as { 
    formData: FormData;
    windowNumber: string;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    navigate(-1); // Go back to the form
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
          <CheckCircleIcon className="h-10 w-10 text-green-600" aria-hidden="true" />
        </div>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Application Submitted Successfully</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your E-Banking application has been received and is being processed.
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Application Details
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Reference: {formData.formReferenceId}
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Reference ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{formData.formReferenceId}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Submitted On</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(formData.submittedAt)}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Branch</dt>
              <dd className="mt-1 text-sm text-gray-900">{formData.branchName}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Account Number</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formData.accountNumber ? `•••• ${formData.accountNumber.slice(-4)}` : 'N/A'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Customer Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{formData.customerName}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Mobile Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{formData.mobileNumber}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Requested Services</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <ul className="list-disc pl-5 space-y-1">
                  {formData.ebankingChannels.map(channel => (
                    <li key={channel}>
                      {E_BANKING_OPTIONS.find(opt => opt.id === channel)?.label || channel}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Your E-Banking request has been submitted. Please visit your selected or nearest branch if additional verification is required.
            </p>
            {windowNumber && (
              <p className="mt-2 text-sm text-blue-700">
                Please proceed to window <span className="font-bold">{windowNumber}</span> for further assistance.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
        <button
          type="button"
          onClick={handleEdit}
          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cbe-primary"
        >
          <PencilIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
          Edit Application
        </button>
        <div className="space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cbe-primary"
          >
            Back to Dashboard
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cbe-primary hover:bg-cbe-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cbe-primary"
          >
            <PrinterIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Print Confirmation
          </button>
        </div>
      </div>
    </div>
  );
}
