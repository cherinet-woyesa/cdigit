import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Printer, ArrowLeft } from 'lucide-react';
import { type CbeBirrLinkRequest } from '../../../../services/cbeBirrService';

const CbeBirrLinkConfirmation: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation();
  
  // Type assertion for the request data
  const request = state?.request as CbeBirrLinkRequest | undefined;
  
  // Redirect if no request data is found
  useEffect(() => {
    if (!request) {
      navigate('/form/cbe-birr-link');
    }
  }, [request, navigate]);
  
  // Handle print
  const handlePrint = () => {
    window.print();
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get action label
  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'link':
        return 'Account Link';
      case 'unlink':
        return 'Account Unlink';
      case 'change_phone':
        return 'Phone Number Change';
      case 'modify_end_date':
        return 'End Date Modification';
      default:
        return 'Request';
    }
  };
  
  if (!request) {
    return null;
  }
  
  return (
    <div className="container mx-auto p-4 max-w-4xl print-confirmation">
      <div className="bg-white p-6 rounded-lg shadow-lg print:shadow-none">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Request Submitted Successfully
          </h1>
          <p className="text-gray-600">
            Your CBE-Birr {getActionLabel(request.actionType).toLowerCase()} request has been received.
          </p>
        </div>
        
        {/* Request Summary */}
        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b">
            Request Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Reference Number</p>
              <p className="font-medium">{request.formRefId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-medium">{formatDate(request.date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Branch Name</p>
              <p className="font-medium">{request.branchName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Request Type</p>
              <p className="font-medium">{getActionLabel(request.actionType)}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">Customer Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{request.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer ID</p>
                  <p className="font-medium">{request.customerId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ID Type</p>
                  <p className="font-medium">
                    {ID_TYPES.find(t => t.value === request.idType)?.label || request.idType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ID Number</p>
                  <p className="font-medium">{request.idNumber}</p>
                </div>
              </div>
            </div>
          </div>
          
          {request.accounts.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">
                {request.actionType === 'unlink' ? 'Accounts to Unlink' : 'Accounts to Link'}
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="list-disc pl-5 space-y-1">
                  {request.accounts.map(account => (
                    <li key={account} className="font-medium">
                      {account}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {request.actionType === 'change_phone' && request.newPhoneNumber && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Phone Number Change</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Current Phone</p>
                    <p className="font-medium">{request.currentPhoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">New Phone</p>
                    <p className="font-medium">{request.newPhoneNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {request.actionType === 'modify_end_date' && request.newEndDate && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">New End Date</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">
                  {new Date(request.newEndDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Next Steps */}
        <div className="bg-blue-50 p-4 rounded-lg mb-8">
          <h3 className="font-medium text-blue-800 mb-2">What happens next?</h3>
          <p className="text-blue-700 text-sm">
            Your request has been submitted for processing. 
            Please present your ID at windows number 12 to complete the verification process.
            You will receive a confirmation message once your request has been processed.
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </button>
            
            <button
              onClick={() => navigate('/form/cbe-birr-link')}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              New Request
            </button>
          </div>
        </div>
      </div>
      
      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-confirmation,
          .print-confirmation * {
            visibility: visible;
          }
          .print-confirmation {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

// ID types for display
const ID_TYPES = [
  { value: 'NID', label: 'National ID' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
  { value: 'RESIDENCE_PERMIT', label: 'Residence Permit' },
];

export default CbeBirrLinkConfirmation;
