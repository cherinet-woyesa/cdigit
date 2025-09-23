import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Printer, ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import type { StopPaymentOrder } from '../../../../services/stopPaymentService';

const StopPaymentConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  
  // Type assertion for the request data
  const request = state?.request as StopPaymentOrder | undefined;
  const isRevoke = state?.isRevoke || false;
  
  // Redirect if no request data is found
  useEffect(() => {
    if (!request) {
      navigate('/form/stop-payment');
    }
  }, [request, navigate]);
  
  // Handle print
  const handlePrint = () => {
    window.print();
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (!request) {
    return null;
  }
  
  return (
    <div className="container mx-auto p-4 max-w-3xl print-confirmation">
      <div className="bg-white p-6 rounded-lg shadow-lg print:shadow-none">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isRevoke 
              ? 'Stop Payment Order Revoked Successfully' 
              : 'Stop Payment Order Submitted Successfully'}
          </h1>
          <p className="text-gray-600">
            {isRevoke
              ? `Cheque number ${request.chequeNumber} is now payable again.`
              : `Cheque number ${request.chequeNumber} has been blocked until further notice.`}
          </p>
        </div>
        
        {/* Request Summary */}
        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b">
            {isRevoke ? 'Revocation Details' : 'Request Details'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Reference Number</p>
              <p className="font-medium">{request.formRefId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-medium">{formatDate(request.dateCreated)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">
                {isRevoke ? 'Date Revoked' : 'Date Payment Stopped'}
              </p>
              <p className="font-medium">
                {formatDate(isRevoke ? request.dateProcessed! : request.dateCreated)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Branch</p>
              <p className="font-medium">{request.branchName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Number</p>
              <p className="font-mono">••••{request.accountNumber.slice(-4)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Customer Name</p>
              <p className="font-medium">{request.customerName}</p>
            </div>
            {!isRevoke && (
              <>
                <div>
                  <p className="text-sm text-gray-500">Cheque Number</p>
                  <p className="font-mono">{request.chequeNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">ETB {request.amount?.toLocaleString()}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Reason</p>
                  <p className="font-medium">{request.reason}</p>
                </div>
              </>
            )}
            
            {isRevoke && request.relatedSpoId && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Original SPO Reference</p>
                <p className="font-mono">{request.relatedSpoId}</p>
              </div>
            )}
            
            <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
              <p className="text-sm text-gray-500">Verified By</p>
              <p className="font-medium">{request.verifiedBy || 'System'}</p>
              
              <p className="text-sm text-gray-500 mt-2">Approved By</p>
              <p className="font-medium">{request.approvedBy || 'System'}</p>
            </div>
          </div>
          
          {!isRevoke && (
            <div className="bg-yellow-50 p-4 rounded-md border-l-4 border-yellow-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <span className="font-medium">Important:</span> This stop payment order will remain in 
                    effect until the cheque expires or is revoked. Please retain this reference number 
                    for future correspondence.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {isRevoke && (
            <div className="bg-green-50 p-4 rounded-md border-l-4 border-green-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    <span className="font-medium">Note:</span> The stop payment order has been successfully 
                    revoked. The cheque is now payable again. Please retain this reference number for 
                    your records.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Next Steps */}
        <div className="bg-blue-50 p-4 rounded-lg mb-8">
          <h3 className="font-medium text-blue-800 mb-2">What happens next?</h3>
          <p className="text-blue-700 text-sm">
            {isRevoke 
              ? 'The stop payment order has been revoked, and the cheque is now payable again. The payee may present the cheque for payment.'
              : 'Your stop payment request has been processed. The cheque will be returned if presented for payment. Please allow up to 24 hours for the stop payment to take full effect across all channels.'}
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
              onClick={() => navigate('/form/stop-payment')}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              New {isRevoke ? 'Revocation' : 'Stop Payment'}
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

export default StopPaymentConfirmation;
