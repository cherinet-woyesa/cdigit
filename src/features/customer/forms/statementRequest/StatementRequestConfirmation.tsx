import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Printer, ArrowLeft, Mail, FileText } from 'lucide-react';
import { type StatementRequestData } from '../../../../services/statementService';

const StatementRequestConfirmation: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation();
  
  // Type assertion for the request data
  const request = state?.request as StatementRequestData | undefined;
  
  // Redirect if no request data is found
  useEffect(() => {
    if (!request) {
      navigate('/form/statement-request');
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
  
  // Format frequency
  const formatFrequency = (freq: string) => {
    switch (freq) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'quarterly':
        return 'Quarterly';
      default:
        return freq;
    }
  };
  
  // Mask account number (show only last 4 digits)
  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return '••••' + accountNumber.slice(-4);
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
            Statement Request Submitted Successfully
          </h1>
          <p className="text-gray-600">
            Your statement request has been received and is being processed.
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
              <p className="text-sm text-gray-500">Branch</p>
              <p className="font-medium">{request.branchName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Customer Name</p>
              <p className="font-medium">{request.customerName}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">Selected Accounts</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <ul className="space-y-2">
                {request.accountNumbers.map((accountNumber, index) => (
                  <li key={index} className="flex items-center">
                    <FileText className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="font-mono">{maskAccountNumber(accountNumber)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Statement Frequency</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p>{formatFrequency(request.statementFrequency)}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Email Address(es)</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="space-y-1">
                  {request.emailAddresses.map((email, index) => (
                    <li key={index} className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{email}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Next Steps */}
        <div className="bg-blue-50 p-4 rounded-lg mb-8">
          <h3 className="font-medium text-blue-800 mb-2">What happens next?</h3>
          <p className="text-blue-700 text-sm">
            Your statement request has been submitted successfully. Your {formatFrequency(request.statementFrequency).toLowerCase()} 
            statements will be delivered to the registered email address(es) as per your selected frequency. 
            Please allow up to 24 hours for the changes to take effect.
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
              onClick={() => navigate('/form/statement-request')}
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

export default StatementRequestConfirmation;
